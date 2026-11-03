import { useMemo, useState } from "react";
import { PocListItem } from "@/api";
import { useLanguage } from "@/i18n";
import { CODIGOS_CATEGORIA, rotuloCategoria } from "@/categorias";

export interface PocFiltrosState {
  cliente: string;
  produto: string;
  responsavel: string;
}

const VAZIO: PocFiltrosState = { cliente: "", produto: "", responsavel: "" };

// Filtro 100% no front sobre a lista já carregada -- mesmo padrão já usado em Rfis.tsx, a escala
// de hoje não justifica um endpoint de filtro no backend (ver DEPLOYMENT.md/CLAUDE.md).
export function usePocFiltros(itens: PocListItem[] | null) {
  const [filtros, setFiltros] = useState<PocFiltrosState>(VAZIO);

  const filtrados = useMemo(() => {
    if (!itens) return itens;
    return itens.filter((p) => {
      if (filtros.cliente && !p.cliente.toLowerCase().includes(filtros.cliente.toLowerCase())) return false;
      if (filtros.produto && !p.produtos.includes(filtros.produto)) return false;
      if (filtros.responsavel && (p.responsavel_email ?? "") !== filtros.responsavel) return false;
      return true;
    });
  }, [itens, filtros]);

  const responsaveis = useMemo(() => {
    const vistos = new Set<string>();
    (itens ?? []).forEach((p) => {
      if (p.responsavel_email) vistos.add(p.responsavel_email);
    });
    return Array.from(vistos).sort();
  }, [itens]);

  return { filtros, setFiltros, filtrados, responsaveis };
}

export function PocFiltros({
  filtros,
  setFiltros,
  responsaveis,
}: {
  filtros: PocFiltrosState;
  setFiltros: (f: PocFiltrosState) => void;
  responsaveis: string[];
}) {
  const { t, lang } = useLanguage();

  return (
    <div className="poc-filtros">
      <input
        type="text"
        placeholder={t("home.filtroCliente")}
        value={filtros.cliente}
        onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
      />
      <select value={filtros.produto} onChange={(e) => setFiltros({ ...filtros, produto: e.target.value })}>
        <option value="">{t("home.filtroProduto")}</option>
        {CODIGOS_CATEGORIA.map((c) => (
          <option key={c} value={c}>
            {rotuloCategoria(c, lang)}
          </option>
        ))}
      </select>
      <select value={filtros.responsavel} onChange={(e) => setFiltros({ ...filtros, responsavel: e.target.value })}>
        <option value="">{t("home.filtroResponsavel")}</option>
        {responsaveis.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
