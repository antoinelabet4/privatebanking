// Advisor, aggregation, exposure, and private-market reporting helpers.

function getLineIntelligence(line, wrapper = "") {
  const cat = String(line?.categorie || "").toLowerCase();
  const ticker = String(line?.ticker || "").toUpperCase();
  const nom = String(line?.nom || "");
  const geography =
    line?.geography || line?.geo ||
    (cat.includes("usa") || cat.includes("nasdaq") || ticker.includes("US") ? "US" :
     cat.includes("europe") || wrapper === "pea" ? "Europe" :
     cat.includes("emerg") ? "Emerging Markets" :
     cat.includes("world") || nom.toLowerCase().includes("world") ? "Global" : "Non renseigné");
  const sector =
    line?.sector ||
    (cat.includes("tech") || ticker === "PANX" ? "Technology" :
     cat.includes("divid") ? "Dividend equities" :
     cat.includes("cash") || ticker === "CASH" ? "Cash" :
     cat.includes("fonds euros") ? "Insurance cash" :
     cat.includes("oblig") ? "Fixed income" :
     cat.includes("immobilier") || cat.includes("scpi") ? "Real estate" : "Diversified");
  const currency =
    line?.currency || line?.devise ||
    (cat.includes("usa") || ticker.includes("USD") ? "USD" : "EUR");
  const risk =
    line?.riskLevel || line?.risk ||
    (sector === "Cash" || sector === "Insurance cash" ? "Low" :
     cat.includes("emerg") || cat.includes("venture") ? "High" : "Medium");
  return {
    geography,
    sector,
    currency,
    risk,
    volatility: line?.volatility || (risk === "High" ? "High" : risk === "Low" ? "Low" : "Medium"),
    exposure: line?.exposure || sector,
    rating: line?.rating || "N/R",
    style: line?.style || (cat.includes("divid") ? "Dividend" : cat.includes("growth") || sector === "Technology" ? "Growth" : "Core")
  };
}
function addAgg(map, key, value, color) {
  const k = key || "Non renseigné";
  if (!map[k]) map[k] = { id: k, label: k, value: 0, color: color || "#888" };
  map[k].value += safeNum(value);
}
function toSeries(map) {
  return Object.values(map).filter(x => x.value > 0).sort((a,b) => b.value - a.value);
}
function calcPrivateMetrics(items) {
  const rows = Array.isArray(items) ? items : [];
  const commitment = rows.reduce((s,i)=>s+safeNum(i.commitment),0);
  const called = rows.reduce((s,i)=>s+safeNum(i.calledCapital),0);
  const distributions = rows.reduce((s,i)=>s+safeNum(i.distributions),0);
  const nav = rows.reduce((s,i)=>s+safeNum(i.nav),0);
  const value = nav + distributions;
  const moic = called > 0 ? value / called : 0;
  const irrWeighted = called > 0 ? rows.reduce((s,i)=>s+safeNum(i.irr)*safeNum(i.calledCapital),0) / called : 0;
  return { commitment, called, distributions, nav, value: nav, totalValue: value, moic, irr: irrWeighted };
}
function getPrivateTypeColor(type) {
  return {
    "Private equity": "#9a8ec9", "Private debt": "#7a9ec9", "Club deal": "#e8a055",
    "Real estate deal": "#a0c4ff", "SCPI": "#4a9e6b", "Venture capital": "#e8a8c4"
  }[type] || "#00E1DC";
