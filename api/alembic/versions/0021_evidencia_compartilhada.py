"""shared PoC/RFI history evidence: RfiItem.embedding + Classificacao.confirmado_por_historico

Revision ID: 0021
Revises: 0020
Create Date: 2026-11-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = "0021"
down_revision: Union[str, None] = "0020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EMBEDDING_DIM = 1536


def upgrade() -> None:
    # Mirrors itens.embedding (migration 0020): nullable, only set once an RFI item lands on
    # `atende`. Makes the history evidence pool bidirectional -- a confirmed RFI answer becomes
    # searchable evidence for future PoC/RFI items too, not just the reverse. See
    # app/classificacao/service.py::_buscar_candidatos_historico and
    # app/classificacao/service.py::atualizar_embedding_historico_rfi.
    op.add_column("rfi_itens", sa.Column("embedding", Vector(EMBEDDING_DIM), nullable=True))
    # Mirrors rfi_itens.confirmado_por_historico (migration 0020): PoC's own classificar_item
    # waterfall now has a history step too, same as RFI already had.
    op.add_column(
        "classificacoes",
        sa.Column("confirmado_por_historico", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("classificacoes", "confirmado_por_historico")
    op.drop_column("rfi_itens", "embedding")
