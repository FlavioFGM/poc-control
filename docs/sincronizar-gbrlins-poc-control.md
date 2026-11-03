# Sincronizar com `gbrlins/poc-control` (o repositório original)

`poc-control/` neste monorepo começou como o repositório independente
`https://github.com/gbrlins/poc-control`, de Gabriel. O histórico completo dele foi trazido para cá
em 2026-11-01 (commit de merge `387760b`, "merge: bring in poc-control history under poc-control/"),
reescrevendo cada commit para viver sob `poc-control/` e mesclando com `--allow-unrelated-histories`.
Este documento existe para o dia em que `gbrlins/poc-control` receber commits novos, direto por lá
(fora deste monorepo) — ele dá o caminho repetível para trazer esses commits aqui sem perder autoria,
data nem histórico por arquivo.

## Status na data deste documento (2026-11-02)

**Nada para sincronizar ainda.** `gbrlins/poc-control`#main está parado no commit `2b8db5f`
("Corrige exclusoes.tipo..."), que é exatamente o commit que foi importado por último aqui (ele
vira `62dd6cbe2838b148f59104b2b92ce71451302607` depois da reescrita de caminho — ver a verificação
abaixo). Enquanto `gbrlins/poc-control` não andar, não há o que trazer.

## Como o import original foi feito (e por que o merge futuro funciona de graça)

A técnica é mover TODO o histórico de `gbrlins/poc-control` para dentro de um prefixo
`poc-control/`, reescrevendo cada commit (mesma árvore, só com os caminhos prefixados; autor, data e
mensagem originais preservados). O comando abaixo faz isso com `git filter-branch` (nativo do git,
sem precisar instalar `git-filter-repo`):

```bash
git clone --no-local https://github.com/gbrlins/poc-control.git gbrlins-rewrite
cd gbrlins-rewrite
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --index-filter '
git ls-files -s | sed "s|\t|\tpoc-control/|" |
GIT_INDEX_FILE="$GIT_INDEX_FILE.new" git update-index --index-info &&
mv "$GIT_INDEX_FILE.new" "$GIT_INDEX_FILE"
' --tag-name-filter cat -- --all
```

**Verificado nesta data**: rodar exatamente este comando contra `gbrlins/poc-control` reproduz, para
cada commit já importado, o **mesmo hash** que já está no histórico deste monorepo — a ponta
reescrita bate byte a byte com `62dd6cbe2838b148f59104b2b92ce71451302607`. Isso significa que um
novo merge não vai precisar de `--allow-unrelated-histories` de novo: o git vai enxergar um
ancestral comum de verdade (os commits antigos, reescritos de novo, têm hash idêntico ao que já
está aqui) e só vai trazer a diferença real (os commits novos que `gbrlins/poc-control` ganhou desde
`2b8db5f`).

**Isto só continua funcionando enquanto `gbrlins/poc-control`#main não for reescrito** (rebase,
force-push, squash). Se isso acontecer, os hashes antigos deixam de bater e a saída é o plano B no
fim deste documento (um por um, via `format-patch`/`apply --directory`).

## Passo a passo para trazer commits novos

1. **Confirme que há algo novo**: compare o HEAD atual de `gbrlins/poc-control`#main com `2b8db5f`
   (o último já importado). Se forem iguais, não há nada a fazer.

2. **Reescreva o histórico completo de novo** (não só os commits novos — o comando acima sempre
   processa tudo; é rápido, ~15-20s para o tamanho atual do repositório):

   ```bash
   git clone --no-local https://github.com/gbrlins/poc-control.git /tmp/gbrlins-rewrite
   cd /tmp/gbrlins-rewrite
   FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --index-filter '
   git ls-files -s | sed "s|\t|\tpoc-control/|" |
   GIT_INDEX_FILE="$GIT_INDEX_FILE.new" git update-index --index-info &&
   mv "$GIT_INDEX_FILE.new" "$GIT_INDEX_FILE"
   ' --tag-name-filter cat -- --all
   ```

3. **Confira que a reescrita ainda conecta com o nosso histórico**: o commit que já está
   importado precisa ter o mesmo hash dos dois lados.

   ```bash
   git log -1 --format=%H 62dd6cbe2838b148f59104b2b92ce71451302607   # no monorepo
   git -C /tmp/gbrlins-rewrite log --format=%H --all | grep 62dd6cbe2838b148f59104b2b92ce71451302607
   ```

   Se não bater, pare e use o plano B (abaixo) — não force o merge.

4. **Traga a ponta reescrita para o monorepo e mescle**:

   ```bash
   git fetch /tmp/gbrlins-rewrite main:gbrlins-sync
   git merge gbrlins-sync   # sem --allow-unrelated-histories: agora há ancestral comum de verdade
   ```

   Espere conflitos reais nos arquivos que os dois lados mudaram independentemente desde
   `2b8db5f` (bem provável em `api/app/rfi/*`, `api/app/models.py`, `web/src/i18n.tsx` — este
   monorepo seguiu adicionando RFI com múltiplos documentos, promoção a procedimento, etc. depois
   do ponto de corte). Resolva como um merge normal, rode a suíte de testes do container (ver
   `poc-control/CLAUDE.md`) antes de dar push.

5. Apague a branch temporária (`git branch -d gbrlins-sync`) e o clone em `/tmp/gbrlins-rewrite`
   depois de confirmar que o merge subiu bem.

## Plano B: se os hashes não baterem mais

Se `gbrlins/poc-control`#main foi reescrito (rebase/force-push/squash) e a reescrita não reproduz
mais `62dd6cbe...`, não dá pra confiar num ancestral comum. Nesse caso, traga só os commits
realmente novos, um a um, preservando autor/data/mensagem sem reescrever o histórico inteiro:

```bash
git remote add gbrlins-tmp https://github.com/gbrlins/poc-control.git
git fetch gbrlins-tmp main
# para cada commit novo, do mais antigo pro mais novo:
git format-patch -1 <sha> --stdout | git apply --directory=poc-control -
git add poc-control/
git commit -c <sha>   # reaproveita mensagem, autor e data do commit original
git remote remove gbrlins-tmp
```

Isso perde a conexão de ancestralidade "de graça" do plano principal, mas preserva autoria e data
por commit — só o hash muda.
