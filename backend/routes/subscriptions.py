"""Subscription and entitlement API routes."""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from database import get_db
from models.models import Subscription, PaymentTransaction, User
from models.schemas import ErrorResponse, SuccessResponse
from routes.auth import get_current_user
from services.entitlement_engine import (
    can_access,
    get_current_usage,
    get_entitlements_for_user,
    get_or_create_subscription,
    get_user_plan_id,
)
from services.plan_config import (
    ALL_PLANS,
    PLANS,
    get_all_plans,
    get_plan,
    get_plan_level,
)

router = APIRouter(prefix="/api/subscription", tags=["Subscription"])


@router.get("")
def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = get_or_create_subscription(db, current_user.id)
    plan = get_plan(sub.plan_id) or get_plan("free")
    return {
        "id": sub.id,
        "plan_id": sub.plan_id,
        "plan_name": plan["name"],
        "price_inr": plan["price_inr"],
        "status": sub.status,
        "provider": sub.provider,
        "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "cancel_at_period_end": sub.cancel_at_period_end,
        "created_at": sub.created_at.isoformat() if sub.created_at else None,
        "updated_at": sub.updated_at.isoformat() if sub.updated_at else None,
    }


@router.get("/plans")
def list_plans():
    return get_all_plans()


@router.get("/entitlements")
def get_entitlements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_entitlements_for_user(db, current_user.id)


@router.get("/usage/{usage_type}")
def get_usage(
    usage_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan_id = get_user_plan_id(db, current_user.id)
    plan = get_plan(plan_id)
    limit = plan["usage_limits"].get(usage_type, 0) if plan else 0
    current = get_current_usage(db, current_user.id, usage_type)
    return {
        "usage_type": usage_type,
        "current_usage": current,
        "daily_limit": limit,
        "remaining": max(0, limit - current),
        "plan_id": plan_id,
    }


@router.post("/checkout")
def create_checkout(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan_id = body.get("plan_id")
    if not plan_id or plan_id not in ALL_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    if plan_id == "free":
        raise HTTPException(status_code=400, detail="Already on free plan")

    plan = get_plan(plan_id)
    sub = get_or_create_subscription(db, current_user.id)

    import os
    razorpay_key = os.environ.get("RAZORPAY_KEY_ID", "")

    if razorpay_key:
        import razorpay
        client = razorpay.Client(auth=(razorpay_key, os.environ.get("RAZORPAY_KEY_SECRET", "")))
        order = client.order.create({
            "amount": plan["price_inr"] * 100,
            "currency": "INR",
            "receipt": f"sub_{current_user.id}_{plan_id}",
        })
        return {
            "provider": "razorpay",
            "order_id": order["id"],
            "amount": plan["price_inr"] * 100,
            "currency": "INR",
            "key_id": razorpay_key,
        }
    else:
        import secrets
        dev_order_id = f"dev_order_{secrets.token_hex(8)}"
        tx = PaymentTransaction(
            user_id=current_user.id,
            subscription_id=sub.id,
            plan_id=plan_id,
            amount_inr=plan["price_inr"],
            status="pending",
            provider="dev",
            provider_order_id=dev_order_id,
        )
        db.add(tx)
        db.commit()
        return {
            "provider": "dev",
            "order_id": dev_order_id,
            "amount": plan["price_inr"] * 100,
            "currency": "INR",
            "message": "Development mode - no real payment",
        }


@router.post("/verify")
def verify_payment(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = body.get("provider", "dev")
    order_id = body.get("order_id")
    plan_id = body.get("plan_id")

    if not order_id or not plan_id:
        raise HTTPException(status_code=400, detail="Missing order_id or plan_id")
    if plan_id not in ALL_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    plan = get_plan(plan_id)

    if provider == "dev":
        tx = (
            db.query(PaymentTransaction)
            .filter(
                PaymentTransaction.user_id == current_user.id,
                PaymentTransaction.provider_order_id == order_id,
                PaymentTransaction.status == "pending",
            )
            .first()
        )
        if not tx:
            raise HTTPException(status_code=400, detail="Invalid order")

        from datetime import timedelta
        now = datetime.now(UTC)
        sub = get_or_create_subscription(db, current_user.id)
        sub.plan_id = plan_id
        sub.status = "active"
        sub.provider = "dev"
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=30)
        sub.cancel_at_period_end = False
        sub.updated_at = now

        tx.status = "completed"
        db.commit()
        return {
            "success": True,
            "message": "Payment verified (development mode)",
            "subscription": {
                "plan_id": plan_id,
                "status": "active",
                "current_period_end": sub.current_period_end.isoformat(),
            },
        }

    elif provider == "razorpay":
        razorpay_id = body.get("razorpay_payment_id")
        razorpay_sig = body.get("razorpay_signature")
        if not razorpay_id or not razorpay_sig:
            raise HTTPException(status_code=400, detail="Missing razorpay details")

        import os
        import hmac
        import hashlib

        secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
        if secret:
            expected = hmac.new(
                secret.encode(),
                f"{order_id}|{razorpay_id}".encode(),
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected, razorpay_sig):
                logger.warning("Invalid payment signature for order=%s", order_id)
                raise HTTPException(status_code=400, detail="Invalid payment signature")
        else:
            logger.warning(
                "RAZORPAY_WEBHOOK_SECRET not configured — payment signature verification skipped."
            )

        from datetime import timedelta
        now = datetime.now(UTC)
        sub = get_or_create_subscription(db, current_user.id)
        sub.plan_id = plan_id
        sub.status = "active"
        sub.provider = "razorpay"
        sub.provider_subscription_id = razorpay_id
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=30)
        sub.cancel_at_period_end = False
        sub.updated_at = now

        tx = (
            db.query(PaymentTransaction)
            .filter(
                PaymentTransaction.user_id == current_user.id,
                PaymentTransaction.provider_order_id == order_id,
            )
            .first()
        )
        if tx:
            tx.status = "completed"
            tx.provider_payment_id = razorpay_id
            tx.provider_signature = razorpay_sig

        db.commit()
        return {
            "success": True,
            "message": "Payment verified",
            "subscription": {
                "plan_id": plan_id,
                "status": "active",
                "current_period_end": sub.current_period_end.isoformat(),
            },
        }

    raise HTTPException(status_code=400, detail="Unknown provider")


@router.post("/cancel")
def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = get_or_create_subscription(db, current_user.id)
    if sub.plan_id == "free":
        raise HTTPException(status_code=400, detail="Cannot cancel free plan")
    sub.cancel_at_period_end = True
    sub.updated_at = datetime.now(UTC)
    db.commit()
    return {
        "success": True,
        "message": "Subscription will cancel at end of billing period",
        "cancel_at_period_end": True,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
    }


@router.post("/reactivate")
def reactivate_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = get_or_create_subscription(db, current_user.id)
    if not sub.cancel_at_period_end:
        raise HTTPException(status_code=400, detail="Subscription is not pending cancellation")
    sub.cancel_at_period_end = False
    sub.updated_at = datetime.now(UTC)
    db.commit()
    return {
        "success": True,
        "message": "Subscription reactivated",
        "cancel_at_period_end": False,
    }


@router.get("/history")
def billing_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transactions = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.user_id == current_user.id)
        .order_by(PaymentTransaction.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": tx.id,
            "plan_id": tx.plan_id,
            "amount_inr": tx.amount_inr,
            "currency": tx.currency,
            "status": tx.status,
            "provider": tx.provider,
            "created_at": tx.created_at.isoformat() if tx.created_at else None,
        }
        for tx in transactions
    ]


@router.get("/check/{feature}")
def check_feature(
    feature: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = can_access(db, current_user.id, feature)
    return {"feature": feature, "allowed": allowed, "plan_id": get_user_plan_id(db, current_user.id)}
