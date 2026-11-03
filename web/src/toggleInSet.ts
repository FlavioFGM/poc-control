// The "toggle membership in a Set<string>, immutably" idiom, copy-pasted in 4 places
// (Procedimentos.tsx x2, ProcedimentoUpload.tsx, PocDetail.tsx) before being pulled out here.
export function toggleInSet<T>(atual: Set<T>, valor: T): Set<T> {
  const novo = new Set(atual);
  if (novo.has(valor)) novo.delete(valor);
  else novo.add(valor);
  return novo;
}
