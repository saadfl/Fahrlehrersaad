// Hält die aktuell geladene Fahrschule als einfaches, geteiltes Objekt.
// Bewusst kein React Context: Da pro Seitenaufruf genau eine Fahrschule
// aktiv ist (bestimmt durch den URL-Pfad /:slug), reicht ein einzelnes
// mutierbares Objekt, auf das TenantApp.js (schreibt) und alle Screens
// in TenantScreens.js (lesen) zugreifen. Das vermeidet, jede einzelne
// Komponente per Prop mit der fahrschule_id durchzureichen.
export const tenantState = {
  current: null, // { id, name, slug, farbe_primary, ueber_uns_text, ... } aus der fahrschulen-Tabelle
};

// Bequemer Zugriff auf die ID der aktuellen Fahrschule
export function fahrschuleId() {
  return tenantState.current?.id || null;
}
