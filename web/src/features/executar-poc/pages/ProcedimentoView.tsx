import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ProcedimentoDetail } from "@/api";
import { DangerZone } from "@/components/DangerZone";
import { useLanguage } from "@/i18n";
import { OrigemChip, ProcedimentoConteudo } from "../components/ProcedimentoConteudo";

export function ProcedimentoView() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [procedimento, setProcedimento] = useState<ProcedimentoDetail | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .obterProcedimento(id)
      .then(setProcedimento)
      .catch(() => setErro(t("procedimentoView.erroCarregar")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (erro) return <p className="alert alert-error">{erro}</p>;
  if (!procedimento) return <p className="muted">{t("common.carregando")}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{procedimento.titulo}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <OrigemChip origem={procedimento.origem_conhecimento} />
          <span className={`badge badge-${procedimento.status}`}>{procedimento.status}</span>
        </div>
      </div>

      <ProcedimentoConteudo procedimento={procedimento} />

      <DangerZone
        tipo="procedimentos"
        id={procedimento.id}
        responsavelId={procedimento.responsavel_id}
        responsavelEmail={procedimento.responsavel_email}
        onResponsavelAtualizado={(responsavelId, responsavelEmail) =>
          setProcedimento({ ...procedimento, responsavel_id: responsavelId, responsavel_email: responsavelEmail })
        }
        onExcluido={() => navigate("/procedimentos")}
      />
    </div>
  );
}
