"""procedimentos.origem_conhecimento: tag manual/poc/rfi on each knowledge entry

Revision ID: 0022
Revises: 0021
Create Date: 2026-11-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0022"
down_revision: Union[str, None] = "0021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ORIGEM_ENUM = sa.Enum("manual", "poc", "rfi", name="origem_conhecimento")


def upgrade() -> None:
    # First migration in the repo adding a brand-new enum type to an *existing* table (every
    # earlier enum column was created together with its table) -- the enum type has to exist
    # before add_column can reference it on Postgres.
    ORIGEM_ENUM.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "procedimentos",
        sa.Column("origem_conhecimento", ORIGEM_ENUM, nullable=False, server_default="manual"),
    )


def downgrade() -> None:
    op.drop_column("procedimentos", "origem_conhecimento")
    ORIGEM_ENUM.drop(op.get_bind(), checkfirst=True)
