"""Payment webhook endpoint for Razorpay and dev-mode simulation."""

import hashlib
import hmac
import json
import logging
import os
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models.models import PaymentTransaction, Subscription

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    event = body.get("event", "")
    payload = body.get("payload", {})

    sub_id = payload.get("subscription", {}).get("entity", {}).get("id") or ""
    payment_id = payload.get("payment", {}).get("entity", {}).get("id") or ""

    signature = request.headers.get("x-razorpay-signature", "")
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

    if not secret:
        logger.warning(
            "RAZORPAY_WEBHOOK_SECRET not configured — webhook signature verification skipped. "
            "This is insecure for production."
        )

    if secret and signature:
        raw_body = await request.body()
        expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            logger.warning("Invalid webhook signature for event=%s", event)
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    elif secret and not signature:
        logger.warning("Webhook signature missing for event=%s", event)

    logger.info("Webhook received: event=%s sub_id=%s payment_id=%s", event, sub_id, payment_id)

    if event in ("subscription.authenticated", "subscription.activated"):
        _handle_subscription_active(db, payload)
    elif event in ("subscription.charged", "payment.captured"):
        _handle_payment_success(db, payload)
    elif event == "subscription.cancelled":
        _handle_subscription_canceled(db, payload)
    elif event == "subscription.expired":
        _handle_subscription_expired(db, payload)
    elif event == "payment.failed":
        _handle_payment_failed(db, payload)

    return {"status": "ok"}


def _handle_subscription_active(db: Session, payload: dict):
    entity = payload.get("subscription", {}).get("entity", {})
    provider_sub_id = entity.get("id", "")
    if not provider_sub_id:
        return
    sub = db.query(Subscription).filter(
        Subscription.provider_subscription_id == provider_sub_id
    ).first()
    if sub:
        sub.status = "active"
        sub.updated_at = datetime.now(UTC)
        db.commit()


def _handle_payment_success(db: Session, payload: dict):
    entity = payload.get("payment", {}).get("entity", {})
    payment_id = entity.get("id", "")
    if not payment_id:
        return
    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.provider_payment_id == payment_id
    ).first()
    if tx:
        tx.status = "completed"
        db.commit()


def _handle_subscription_canceled(db: Session, payload: dict):
    entity = payload.get("subscription", {}).get("entity", {})
    provider_sub_id = entity.get("id", "")
    if not provider_sub_id:
        return
    sub = db.query(Subscription).filter(
        Subscription.provider_subscription_id == provider_sub_id
    ).first()
    if sub:
        sub.status = "canceled"
        sub.cancel_at_period_end = True
        sub.updated_at = datetime.now(UTC)
        db.commit()


def _handle_subscription_expired(db: Session, payload: dict):
    entity = payload.get("subscription", {}).get("entity", {})
    provider_sub_id = entity.get("id", "")
    if not provider_sub_id:
        return
    sub = db.query(Subscription).filter(
        Subscription.provider_subscription_id == provider_sub_id
    ).first()
    if sub:
        sub.status = "expired"
        sub.updated_at = datetime.now(UTC)
        db.commit()


def _handle_payment_failed(db: Session, payload: dict):
    entity = payload.get("payment", {}).get("entity", {})
    payment_id = entity.get("id", "")
    if not payment_id:
        return
    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.provider_payment_id == payment_id
    ).first()
    if tx:
        tx.status = "failed"
        db.commit()
