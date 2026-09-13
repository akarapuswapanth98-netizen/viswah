"""Add role column to users table

Revision ID: c4a7e2f1b3d5
Revises: b513f5a56795
Create Date: 2026-09-13
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4a7e2f1b3d5"
down_revision = "b513f5a56795"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("role", sa.String(20), server_default="user", nullable=False))
    op.execute("UPDATE users SET role = 'user' WHERE role IS NULL")


def downgrade() -> None:
    op.drop_column("users", "role")
