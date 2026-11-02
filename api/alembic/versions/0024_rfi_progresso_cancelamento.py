"""rfis.progresso/cancelamento_solicitado and rfi_itens.etapa (detalhe do processamento + interrupção)

Revision ID: 0024
Revises: 0023
Create Date: 2026-11-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0024"
down_revision: Union[str, None] = "0023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("rfis", sa.Column("progresso", postgresql.JSONB(), nullable=True))
    op.add_column(
        "rfis", sa.Column("cancelamento_solicitado", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.add_column("rfi_itens", sa.Column("etapa", sa.String(30), nullable=True))


def downgrade() -> None:
    op.drop_column("rfi_itens", "etapa")
    op.drop_column("rfis", "cancelamento_solicitado")
    op.drop_column("rfis", "progresso")
