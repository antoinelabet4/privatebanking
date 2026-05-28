// Portfolio, real-estate, and formatting calculations shared by tabs.

function calcWeightedPRU(transactions) {
  const achats = (transactions||[]).filter(t => t.type !== "vente");
  const totalCost = achats.reduce((s,t) => s + t.qte * t.prix, 0);
  const totalQte  = achats.reduce((s,t) => s + t.qte, 0);
  return totalQte > 0 ? totalCost / totalQte : 0;
}
function calcNetQte(transactions) {
  return (transactions||[]).reduce((s,t) => s + (t.type === "vente" ? -t.qte : t.qte), 0);
}
// CAGR : (prix_actuel/pru)^(1/années) − 1
function calcAnnualReturn(pru, currentPrice, firstDate) {
  if (!firstDate || !pru || pru <= 0 || !currentPrice || currentPrice <= 0) return null;
  const years = (Date.now() - new Date(firstDate).getTime()) / (365.25*24*3600*1000);
  if (years < 0.08) return null; // < ~1 mois, non significatif
  const r = (currentPrice - pru) / pru;
  return Math.pow(1 + r, 1/years) - 1;
}


// ── Helpers portefeuille robustes : utilisés par PEA / CTO / Assurance Vie / Dashboard global ──
// Important : une ligne convertie depuis du cash peut être « en attente » tant que le prix live
// n'a pas été chargé. Dans ce cas, la valeur et le PRU total doivent rester égaux au montant réservé,
// sinon les KPI tombent à zéro et le dashboard global devient faux.
function getReservedAmount(line) {
  return parseFloat(line?._montant || 0) || 0;
}
function getLineQuantity(line) {
  return parseFloat(line?.qte || 0) || 0;
}
function getLinePrice(line) {
  return parseFloat(line?.prixActuel || line?.pru || 0) || 0;
}
function getLinePRUUnit(line) {
  return parseFloat(line?.pru || 0) || 0;
}
function getLineCurrentValue(line) {
  if (line?._pendingQte) return getReservedAmount(line);
  return getLineQuantity(line) * getLinePrice(line);
}
function getLinePRUTotal(line) {
  if (line?._pendingQte) return getReservedAmount(line);
  return getLineQuantity(line) * getLinePRUUnit(line);
}
function calcPortfolioTotalFromLines(lines) {
  return (Array.isArray(lines) ? lines : []).reduce((s, line) => s + getLineCurrentValue(line), 0);
}
function calcPortfolioPRUFromLines(lines) {
  return (Array.isArray(lines) ? lines : []).reduce((s, line) => s + getLinePRUTotal(line), 0);
}
function getLineLatentGain(line) {
  return Math.max(0, getLineCurrentValue(line) - getLinePRUTotal(line));
}

// ── Utilitaires Immobilier ──
function calcFraisNotaire(prix) {
  return Math.round((parseFloat(prix) || 0) * 0.077);
}
function calcMensualite(capital, tauxAnnuel, dureeAns) {
  const C = parseFloat(capital) || 0;
  const t = (parseFloat(tauxAnnuel) || 0) / 100 / 12;
  const n = (parseFloat(dureeAns) || 0) * 12;
  if (!C || !n) return 0;
  if (!t) return Math.round(C / n);
  return Math.round(C * t * Math.pow(1 + t, n) / (Math.pow(1 + t, n) - 1));
}
function calcCapitalRestant(capital, tauxAnnuel, dureeAns, dateDebutPret) {
  const C = parseFloat(capital) || 0;
  if (!C || !dateDebutPret) return C;
  const dStr = dateDebutPret.length === 7 ? dateDebutPret + "-01" : dateDebutPret;
  const moisEcoules = Math.max(0, Math.floor((Date.now() - new Date(dStr).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const n = (parseFloat(dureeAns) || 20) * 12;
  if (moisEcoules >= n) return 0;
  const t = (parseFloat(tauxAnnuel) || 0) / 100 / 12;
  if (!t) return Math.round(C * (1 - moisEcoules / n));
  const m = C * t * Math.pow(1 + t, n) / (Math.pow(1 + t, n) - 1);
  return Math.max(0, Math.round(C * Math.pow(1 + t, moisEcoules) - m * (Math.pow(1 + t, moisEcoules) - 1) / t));
}
function getBienFrais(bien) {
  const achat = parseFloat(bien?.prixAchat) || 0;
  return bien?.fraisNotaireAuto ? calcFraisNotaire(achat) : (parseFloat(bien?.fraisNotaireManuel) || 0);
}
function getBienValeur(bien) {
  const valeurActuelle = parseFloat(bien?.valeurActuelle) || 0;
  if (valeurActuelle > 0) return valeurActuelle;
  const achat = parseFloat(bien?.prixAchat) || 0;
  const travaux = parseFloat(bien?.travaux) || 0;
  return achat + getBienFrais(bien) + travaux;
}
function getBienDetteRestante(bien) {
  return bien?.montantEmprunt ? calcCapitalRestant(bien.montantEmprunt, bien.tauxEmprunt, bien.dureeEmprunt, bien.dateDebutPret) : 0;
}

// ── Défenses reporting : évite undefined, NaN et lectures localStorage cassées ──
function safeNum(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}
function safePct(part, total) {
  const t = safeNum(total);
  return t > 0 ? (safeNum(part) / t) * 100 : 0;
}
function fmtMoney(n, digits = 0) {
  return safeNum(n).toLocaleString("fr-FR", { maximumFractionDigits: digits }) + " €";
}
