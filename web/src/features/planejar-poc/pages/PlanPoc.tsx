import { useEffect, useRef } from "react";
import { useLanguage } from "@/i18n";

const THEME_EVENT = "poc-control:theme-changed";

// The planner is a single self-contained file maintained in the sibling top-level
// `poc-planner/` project (its own history, its own tests, no build step). poc-control
// never forks or ports its logic: the web image copies `poc-planner/index.html` verbatim
// at build time (see `web/Dockerfile`) and nginx serves it at `/planner/` (see
// `nginx.conf`). This page just embeds that same-origin page in an iframe, which is what
// lets the planner's optional connector work (`GET /api/planner/capabilities` — see
// `api/app/planner/`) and keeps the session cookie usable for it.
//
// Always lands on the planner's own dashboard (Novo Projeto / Importar Projeto / Importar
// documento do cliente / Biblioteca de procedimentos) -- there used to be a `?start=new|import`
// param to skip straight past it, but that just duplicated Home's own entry points one layer
// deeper and buried the dashboard's other options (Importar Projeto, the procedure library)
// behind a jump nobody asked for. Removed from both sides (see
// poc-planner/index.html's history for applyUrlStart).
//
// Language: the planner reads a one-time `?lang=` query param (its own i18n takes over
// after that), so the iframe `src` is rebuilt whenever the shell's language changes.
// Theme: the planner only reads `suse_poc_planner_theme` from localStorage on load, so
// toggling the shell's theme (Layout.tsx) reloads the iframe to re-apply it — see
// THEME_EVENT there. The planner persists all of its state to localStorage continuously,
// so reloading it loses nothing in progress.
export function PlanPoc() {
  const { lang } = useLanguage();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const reloadForTheme = () => iframeRef.current?.contentWindow?.location.reload();
    window.addEventListener(THEME_EVENT, reloadForTheme);
    return () => window.removeEventListener(THEME_EVENT, reloadForTheme);
  }, []);

  return (
    // height: 100% here matters: the parent <main class="page-flush"> sets an explicit
    // height (calc(100vh - 56px)), but this div has none of its own, so without it the
    // iframe's height: 100% resolves against nothing and collapses to the browser's
    // default ~150px intrinsic iframe height instead of filling the page.
    <div id="planner-root" style={{ height: "100%" }}>
      <iframe
        ref={iframeRef}
        title="SUSE PoC Planner"
        src={`/planner/?lang=${lang}`}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
