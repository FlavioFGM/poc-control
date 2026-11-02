"""item embedding for RFI history evidence

Revision ID: 0020
Revises: 0019
Create Date: 2026-11-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = "0020"
down_revision: Union[str, None] = "0019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EMBEDDING_DIM = 1536


def upgrade() -> None:
    # Nullable, unlike procedimento_chunks.embedding: only items that become a validated success
    # (item_executado_sem_problemas) ever get one -- see
    # app/classificacao/service.py::atualizar_embedding_historico. This is what the RFI Analyser's
    # history-based evidence search (_buscar_candidatos_historico) runs against; it is a separate,
    # non-anonymous corpus from resultados_catalogo (ADR 1), which has no text to search at all.
    op.add_column("itens", sa.Column("embedding", Vector(EMBEDDING_DIM), nullable=True))
    op.add_column(
        "rfi_itens",
        sa.Column("confirmado_por_historico", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("rfi_itens", "confirmado_por_historico")
    op.drop_column("itens", "embedding")
