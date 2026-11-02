import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useLanguage } from "@/i18n";

type Modo = "arquivo" | "texto";

export function RfiUpload() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState("");
  const [orgao, setOrgao] = useState("");
  const [modo, setModo] = useState<Modo>("arquivo");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (modo === "arquivo" && arquivos.length === 0) {
      setErro(t("rfiUpload.erroSelecione"));
      return;
    }
    if (modo === "texto" && !texto.trim()) {
      setErro(t("rfiUpload.erroCole"));
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const form = new FormData();
      form.append("titulo", titulo);
      form.append("orgao", orgao);
      if (modo === "arquivo") arquivos.forEach((a) => form.append("arquivos", a));
      if (modo === "texto") form.append("texto", texto);
      const criado = await api.criarRfi(form);
      navigate(`/rfis/${criado.id}`);
    } catch {
      setErro(t("rfiUpload.erroCriar"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t("rfiUpload.titulo")}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label htmlFor="titulo">{t("rfiUpload.labelTitulo")}</label>
            <input
              id="titulo"
              className="input"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={t("rfiUpload.tituloPlaceholder")}
            />
          </div>
          <div className="field">
            <label htmlFor="orgao">{t("rfiUpload.labelOrgao")}</label>
            <input id="orgao" className="input" value={orgao} onChange={(e) => setOrgao(e.target.value)} />
          </div>
          <p className="field-hint">{t("rfiUpload.hintOpcional")}</p>

          <div className="field">
            <label>{t("rfiUpload.documento")}</label>
            <div className="field-toggle">
              <button
                type="button"
                className={modo === "arquivo" ? "field-toggle-btn active" : "field-toggle-btn"}
                onClick={() => setModo("arquivo")}
              >
                {t("rfiUpload.arquivo")}
              </button>
              <button
                type="button"
                className={modo === "texto" ? "field-toggle-btn active" : "field-toggle-btn"}
                onClick={() => setModo("texto")}
              >
                {t("rfiUpload.colarTexto")}
              </button>
            </div>

            {modo === "arquivo" ? (
              <>
                <input
                  id="arquivo"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.xlsx,.csv,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,text/markdown"
                  onChange={(e) => {
                    // Acumula entre seleções (o input nativo substituiria a lista); ignora repetidos.
                    const novos = Array.from(e.target.files ?? []);
                    setArquivos((prev) => [
                      ...prev,
                      ...novos.filter((n) => !prev.some((p) => p.name === n.name && p.size === n.size)),
                    ]);
                    e.target.value = "";
                  }}
                />
                {arquivos.length > 0 && (
                  <ul style={{ margin: "8px 0", paddingLeft: 0, listStyle: "none" }}>
                    {arquivos.map((a, i) => (
                      <li key={`${a.name}-${i}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ flex: 1 }}>{a.name}</span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setArquivos((prev) => prev.filter((_, j) => j !== i))}
                        >
                          {t("rfiUpload.remover")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="field-hint">{t("rfiUpload.hintArquivo")}</p>
              </>
            ) : (
              <>
                <textarea
                  id="texto"
                  className="input"
                  rows={10}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={t("rfiUpload.textoPlaceholder")}
                />
                <p className="field-hint">{t("rfiUpload.hintTexto")}</p>
              </>
            )}
          </div>

          {erro && <p className="alert alert-error">{erro}</p>}
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? t("rfiUpload.enviando") : t("rfiUpload.criarRfi")}
          </button>
        </form>
      </div>
    </div>
  );
}
