# `index.html` aqui é uma cópia vendorizada, não o projeto completo

Este `poc-planner/` tem só o `index.html` — uma cópia, feita num momento específico, do projeto
irmão `poc-planner/` que vive no monorepo `FlavioFGM/suse-poc-toolkit` (histórico próprio, testes
próprios, documentação própria: ADRs, design-unification.md, etc.). Ela existe aqui só para a build
do `web/Dockerfile` funcionar neste repositório sozinho, sem precisar de uma pasta irmã fora do
Git.

**Isto vai ficar desatualizado.** Qualquer mudança feita no `poc-planner/index.html` do monorepo
depois desta sincronização não chega aqui automaticamente. Antes de depender de uma correção ou
funcionalidade recente do planejador, confira a versão de lá.

Ver `../docs/sincronizar-gbrlins-poc-control.md` (vindo junto nesta mesma sincronização) para o
contexto de como este repositório se relaciona com o monorepo.
