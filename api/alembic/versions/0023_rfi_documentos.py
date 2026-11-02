"""rfi_documentos: several documents per RFI; rfi_itens.documento_id; rfis.processamento_iniciado_em

Revision ID: 0023
Revises: 0022
Create Date: 2026-11-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0023"
down_revision: Union[str, None] = "0022"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rfi_documentos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rfi_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rfis.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nome_arquivo", sa.String(255), nullable=False),
        sa.Column("caminho_arquivo", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_rfi_documentos_rfi_id", "rfi_documentos", ["rfi_id"])
    op.add_column(
        "rfi_itens",
        sa.Column(
            "documento_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rfi_documentos.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.add_column("rfis", sa.Column("processamento_iniciado_em", sa.DateTime(timezone=True), nullable=True))

    # Backfill: cada RFI existente vira um RFI com um documento, e seus itens apontam pra ele.
    op.execute(
        """
        INSERT INTO rfi_documentos (id, rfi_id, nome_arquivo, caminho_arquivo, created_at)
        SELECT gen_random_uuid(), id, nome_arquivo, caminho_arquivo, created_at
        FROM rfis WHERE caminho_arquivo <> ''
        """
    )
    op.execute(
        "UPDATE rfi_itens SET documento_id = d.id FROM rfi_documentos d WHERE d.rfi_id = rfi_itens.rfi_id"
    )


def downgrade() -> None:
    op.drop_column("rfis", "processamento_iniciado_em")
    op.drop_column("rfi_itens", "documento_id")
    op.drop_index("ix_rfi_documentos_rfi_id", table_name="rfi_documentos")
    op.drop_table("rfi_documentos")
