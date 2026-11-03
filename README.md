# POC Control

> **Sync note (2026-11-02):** this is the original repo `FlavioFGM/suse-poc-toolkit`'s
> `poc-control/` was forked from. Development continued there since; this Pull Request brings the
> current state back here. `poc-planner/` in this PR is a vendored, point-in-time copy of a single
> file (`index.html`), not the full sibling project with its own history/tests/docs that the
> monorepo has — see `poc-planner/README-VENDORED.md`. `docker-compose.yml`, `web/Dockerfile` and
> `scripts/update.sh` were adjusted to build/run this repo standalone (no `../poc-planner/` sibling
> folder outside the monorepo). See `docs/sincronizar-gbrlins-poc-control.md` for the mechanism
> used and how to repeat it for a future sync.

Tool for running customer proofs-of-concept end to end: plan the scope, extract a test plan,
cross-reference it against a base of already-validated procedures, track execution with session
notes and client-ready summaries, and do an automatic first triage of a tender/RFI document
against the SUSE portfolio before any of that even starts.

Owner: Gabriel (Solutions Architect, SUSE). The interface shell (hub, navbar, planner) is
available in **Portuguese, English and Spanish** via a single global language switch.
AI-generated content and the Executar PoC/RFI domain forms' underlying data stay in Brazilian
Portuguese (pt-BR) by design — see "Scope of the language switch" below.

## What it does

Four areas, one build/deploy, reached from a single hub:

### Home (the hub)

`/` is a hub, not a feature screen: a hero, one action tile per area below (Planejar PoC,
Analisar RFI, Procedimentos), and a compact "most recent" list per area with its own search —
each linking to that area's full filterable screen (`/pocs`, `/rfis`, `/procedimentos`). A
"Rascunhos locais" card also reads the planner's own browser-local project list directly (see
"Planejar PoC" below), so a project started there but never linked to a server execution is still
reachable from the hub, tagged separately from the server-tracked PoCs above it. There's no
sidebar — navigation is this hub plus a persistent "Início" (home) button in the topbar.

### Executar PoC (run a PoC)

- Upload a PDF, paste free text, or import the JSON exported by the planner (see below) — Gemini
  reads it natively and returns a structured list of test items (code, title, description,
  acceptance criteria, category).
- Review and edit the extracted list before running classification.
- **Traffic-light classification per item**: vector search against a base of validated
  procedures → Gemini confirms the match actually resolves the item → if there's no match, a
  web search (Gemini + Google Search grounding) looks for feasibility evidence. Green = a
  validated procedure covers it, yellow = feasibility evidence (or no evidence at all, as
  "yellow — low confidence"), red = explicit evidence it's unsupported. The flag is a
  suggestion; you can always override the color and the linked procedure.
- **Sessions**: date, participants, agenda; status/notes/attachments per item, full status
  history.
- **Day roteiro**: tick the items you'll work on in today's session and generate a print-ready,
  ordered script with the linked procedures' steps already in execution order, preceded by this
  PoC's technical parameters (network, selected products) when they came from the planner's
  JSON export.
- **Session summaries**: paste a session recap and Gemini organizes it into resolved points /
  open issues / next steps, then drafts a client-ready e-mail summary (copy button, no sending).
- **Client presentation / final report**: AI-written executive summary, a technical environment
  section (from the planner's parameters, when available), results by phase, and a session
  timeline — exported as a printable HTML page.
- Per-user Gemini API key (so usage bills to the engineer's own account) and per-user Gemini
  model override.

### Analisar RFI (tender/RFI triage)

A separate, standalone triage against the SUSE portfolio — independent of any PoC, usually done
before one even starts.

- Create an RFI from **one or more documents** (PDF, Word `.docx`, spreadsheet XLSX/CSV) and/or
  pasted text, picked and reviewed in a staging list before a single explicit action sends the
  whole batch. More documents can be added to, or removed from, an existing RFI later —
  extraction/evaluation only touches the new ones, and removing a document removes only the
  items it produced (including ones you'd overridden by hand, with a warning first).
- Extraction scans the whole document for line items inside a fixed set of SUSE portfolio areas
  (virtualization, Kubernetes/containers, storage, security, observability, Linux OS, edge, AI),
  preserving the tender's own numbering.
- As soon as extraction finishes, evaluation runs automatically (no extra click): for each item,
  first an internal validated procedure is checked, then a shared history of previously-confirmed
  PoC/RFI evidence, and only if neither confirms it does a web search with Google Search
  grounding run. Verdict is one of four states — *atende* / *atende parcial* / *não atende* /
  *sem evidência* — "no evidence" exists specifically so the tool never claims compliance (or
  non-compliance) without something backing it up.
- The whole run shows live phase/progress ("lendo documento 2/3", "avaliando item 5/12") with a
  cronômetro and a button to interrupt it mid-way; items not yet reached when interrupted are
  marked so they're never stuck looking "in progress" forever.
- A confirmed answer (atende / atende parcial, not from history) can be promoted straight into
  the Procedimentos knowledge base, tagged with its RFI origin.
- Any verdict can be overridden by hand, and any item can be individually reevaluated.
- Export as printable HTML and XLSX.

### Procedimentos (knowledge base)

One base, one screen, three possible origins — tagged so provenance is always visible:

- **Manual**: HTML runbooks uploaded directly, indexed per section (`h2`/`h3`) with embeddings so
  a match points at the right step, not a whole document.
- **PoC**: an attachment on a PoC item, promoted once it's confirmed as the thing that actually
  solved it ("Ciclo de aprendizado" — do this and future PoCs with an equivalent item come back
  green).
- **RFI**: an RFI item's confirmed answer, promoted the same way.
- Rows expand inline to show the procedure's sections without leaving the list; a fixed taxonomy
  of 8 categories (virtualization, Kubernetes, storage, security, observability, OS, edge, AI) —
  distinct from free-text tags — narrows the vector search used by both PoC classification and
  RFI evaluation to the relevant subset before ranking by similarity.

### Planejar PoC (plan a PoC)

A 10-step guided wizard (project → products → infrastructure → network → credentials → ports →
architecture → tests → install → summary) covering sizing, network/IP planning, EIB image-builder
JSON generation, an architecture diagram, a port-readiness checklist, and a printable client
report/operator sheet. It's a separate project (`poc-planner/`, own repo history, own tests, own
ADRs) embedded verbatim via an `<iframe>` at `/planejar` — this app never forks or re-implements
its logic. State lives in the browser's `localStorage` only, by design (see the planner's own ADRs
for why); an optional same-origin "connector" lets it ask this app's backend to do a handful of
specific things when embedded here — import a client document into a pre-filled plan (with a
review screen before anything is applied), check web/history feasibility for a test, browse (and
one-click import) this app's own Procedimentos, and link the plan to a real execution here
(`POST /api/pocs/importar-planejador`, **never** sends credentials). None of that is required: the
planner works exactly the same, just without those extra buttons, when not served from here.

## Scope of the language switch

One global PT/EN/ES switch, set once, applies everywhere in the UI shell, the Executar PoC/RFI/
Procedimentos screens, and the planner wizard. It does **not** translate: content generated by
Gemini (summaries, classification/RFI rationale, executive summaries — always written in
Portuguese, since the audience is Brazilian customers), or data typed by the user (item titles/
descriptions, notes, procedure text, RFI answers). That data stays exactly as entered, in
Portuguese, regardless of the UI language.

## Ownership and permanent deletion

PoCs, RFIs and Procedimentos each have an owner (`responsavel_id` — whoever created it, by
default). Only the owner can permanently delete their own record, with the record's exact title
typed as confirmation first; not even an admin can delete someone else's. A record without an
owner (pre-dating this feature) can be claimed by any engineer, or reassigned by an admin. Every
deletion is logged to an audit trail (type, who, when, title, counts — never client content), and
deleting a Procedimento never breaks what cited it: the citing PoC/RFI item just loses the link,
it doesn't disappear.

## Architecture

| Service | Technology |
|---|---|
| `db` | PostgreSQL + pgvector, persistent volume |
| `api` | Python + FastAPI, SQLAlchemy + Alembic, `google-genai` SDK, background tasks for PDF/document processing |
| `web` | React + TypeScript (Vite), served by nginx, which also proxies `/api` |

Frontend is split by feature so the areas can evolve independently:

- `web/src/features/executar-poc/` — PoCs and Procedimentos pages.
- `web/src/features/rfi/` — the RFI triage pages.
- `web/src/features/planejar-poc/` — a thin route wrapper (`pages/PlanPoc.tsx`) that embeds the
  planner. No planner logic lives here (see "Planejar PoC" above).
- `web/src/pages/` (Layout, Home, Login, MinhaConta, Usuarios) and `web/src/i18n.tsx` are the
  shell shared by every area.
- `api/` covers Executar PoC (`api/app/pocs/`, `api/app/classificacao/`, `api/app/procedimentos/`)
  and RFI (`api/app/rfi/`), plus the stateless connector endpoints the planner's iframe calls
  (`api/app/planner/`) and the shared ownership/deletion logic (`api/app/exclusao.py`).

**Note on the planner's internals**: the wizard itself — sizing tables, port requirements, EIB
JSON builder, architecture diagram, wizard state — is not part of this codebase. It lives in the
sibling `poc-planner/` project (its own repo history, its own tests). `web/Dockerfile` copies
`poc-planner/index.html` verbatim into the image at build time, nginx serves it at `/planner/`
(same origin as `/api`, so its session cookie and optional connector work), and `PlanPoc.tsx`
embeds that same URL in an `<iframe>` on the `/planejar` route. See
`poc-planner/docs/design-unification.md` for the history of that decision.

- Embeddings: Gemini's embedding model, fixed dimension (`EMBEDDING_DIM` in `api/app/gemini.py`)
  to match the pgvector column — not user-configurable, since changing it would break the
  existing vector index.
- Search: cosine similarity in pgvector, top-k per item, then a Gemini confirmation pass (a match
  has to make sense, not just look similar) — shared by Executar PoC's classification and RFI's
  evaluation.
- Login: single admin user today (seeded from `.env`), httpOnly session cookie, argon2 password
  hash. The data model already carries `user_id`/ownership everywhere so multi-user doesn't need
  a painful migration later.

## Running it

- First run: `scripts/init-env.sh` creates `.env` (random DB password and session secret,
  interactive or env-var-driven admin credentials, argon2 hash generated via the api image) —
  never overwrites an existing `.env`.
- `docker compose up -d --build`. The `web` image's build context is the repo root (`..` in this
  monorepo), not this folder, because it embeds `poc-planner/index.html` verbatim — see
  `web/Dockerfile`.
- Migrations run via Alembic automatically on container start (`docker-entrypoint.sh`); it also
  refuses to start with a clear message instead of an opaque traceback if required `.env`
  variables are missing or still placeholders.
- `scripts/update.sh` pulls the latest commit, rebuilds only what changed, and recreates
  containers (`db` is left alone — its data lives in the `pgdata` volume, not the container).

See `DOCKER.md` for running from the published Docker Hub images without cloning/building
anything, and `docs/sincronizar-gbrlins-poc-control.md` for this repo's relationship to its
original standalone predecessor.
