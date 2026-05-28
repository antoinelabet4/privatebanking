// Market-data and web-search helpers used by portfolio modules.

// ── Web search sourcing layer (remplace le recroisement Yahoo · Euronext · ECB) ──
// Objectif : utiliser une recherche web classique, lisible et auditable, puis fournir
// les extraits à l'agent. Les prix extraits automatiquement restent indicatifs :
// l'agent doit citer les sources et signaler les valeurs non disponibles.
const WEB_SEARCH_ENDPOINTS = [
  (q) => `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
  (q) => `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`)}`,
];

function normalizeTickerForSearch(ticker) {
  if (!ticker) return "";
  const t = String(ticker).replace(".PA", "").toUpperCase().trim();
  const known = {
    "^FCHI": "CAC 40 indice bourse aujourd'hui",
    "^STOXX50E": "Euro Stoxx 50 indice bourse aujourd'hui",
    "EURUSD=X": "EUR USD taux de change aujourd'hui",
    "CW8": "Amundi MSCI World UCITS ETF PEA CW8 cours",
    "EWLD": "Lyxor MSCI World PEA EWLD cours",
    "PAEEM": "Amundi PEA MSCI Emerging Markets PAEEM cours",
    "PANX": "Amundi PEA Nasdaq 100 PANX cours",
  };
  return known[t] || `${t} cours bourse aujourd'hui prix action ETF`;
}

function cleanSnippet(txt) {
  return String(txt || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWebSearchResults(query, limit = 6) {
  let lastErr = null;
  for (const buildUrl of WEB_SEARCH_ENDPOINTS) {
    try {
      const r = await fetch(buildUrl(query), { headers: { "Accept": "application/json,text/plain,*/*" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const rows = [];
      if (data.AbstractText) rows.push({ title: data.Heading || query, snippet: data.AbstractText, url: data.AbstractURL || "DuckDuckGo" });
      if (Array.isArray(data.Results)) {
        data.Results.forEach(x => rows.push({ title: x.Text || x.FirstURL || query, snippet: x.Text || "", url: x.FirstURL || "DuckDuckGo" }));
      }
      if (Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.forEach(x => {
          if (x.Text) rows.push({ title: x.Text.slice(0, 90), snippet: x.Text, url: x.FirstURL || "DuckDuckGo" });
          if (Array.isArray(x.Topics)) x.Topics.forEach(y => rows.push({ title: y.Text?.slice(0, 90) || query, snippet: y.Text || "", url: y.FirstURL || "DuckDuckGo" }));
        });
      }
      const unique = [];
      const seen = new Set();
      for (const row of rows) {
        const key = cleanSnippet(row.snippet || row.title).slice(0, 120);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        unique.push({ ...row, title: cleanSnippet(row.title), snippet: cleanSnippet(row.snippet) });
        if (unique.length >= limit) break;
      }
      if (unique.length > 0) return unique;
      lastErr = new Error("Aucun résultat exploitable");
    } catch(e) { lastErr = e; }
  }
  throw lastErr || new Error("Web search indisponible");
}

function extractIndicativePriceFromText(text, ticker) {
  const cleaned = cleanSnippet(text).replace(/\u202f/g, " ");
  const candidates = [];
  const patterns = [
    /(?:cours|prix|dernier|last|close|clôture|valeur)\D{0,35}([0-9]{1,4}(?:[\s.,][0-9]{3})*(?:[,.][0-9]{1,4})?)\s?(?:€|EUR|euros|USD|\$|points?)/gi,
    /([0-9]{1,4}(?:[\s.,][0-9]{3})*(?:[,.][0-9]{1,4})?)\s?(?:€|EUR|euros|USD|\$|points?)/gi
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(cleaned)) !== null) {
      const raw = m[1].replace(/\s/g, "").replace(",", ".");
      let val = parseFloat(raw);
      if (!Number.isFinite(val) || val <= 0) continue;
      if (!(ticker && (ticker.startsWith("^") || ticker.includes("=X"))) && val > 5000) val = val / 100;
      if (val > 0.1 && val < 50000) candidates.push(val);
    }
  }
  if (!candidates.length) return null;
  return medianOf(candidates.slice(0, 7));
}

function medianOf(prices) {
  const s = [...prices].filter(v => Number.isFinite(v)).sort((a,b)=>a-b);
  if (!s.length) return null;
  const m = Math.floor(s.length/2);
  return s.length%2 ? s[m] : (s[m-1]+s[m])/2;
}

async function fetchWebPrice(ticker, labelOverride = "") {
  if (ticker === "CASH") return null;
  const query = `${labelOverride || normalizeTickerForSearch(ticker)} source financière récente`;
  const results = await fetchWebSearchResults(query, 8);
  const joined = results.map(r => `${r.title}. ${r.snippet}`).join("\n");
  const price = extractIndicativePriceFromText(joined, ticker);
  if (!price) throw new Error(`Web search: prix indicatif introuvable pour ${ticker}. Résultats disponibles mais sans prix structuré.`);
  return {
    price,
    currency: ticker && ticker.includes("USD") ? "USD" : "EUR",
    source: "Web search",
    snippets: results.map(r => `${r.title}${r.url ? ` — ${r.url}` : ""}`).slice(0, 4)
  };
}

// Compatibilité avec les anciens boutons de test : ces fonctions passent toutes par la web search.
async function fetchPriceYahoo(ticker) { return fetchWebPrice(ticker, `${normalizeTickerForSearch(ticker)} Yahoo Finance`); }
async function fetchPriceEuronext(ticker) { return fetchWebPrice(ticker, `${normalizeTickerForSearch(ticker)} Euronext`); }
async function fetchPriceBoursorama(ticker) { return fetchWebPrice(ticker, `${normalizeTickerForSearch(ticker)} Boursorama`); }

async function fetchPricesForTicker(ticker) {
  if (ticker === "CASH") return null;
  const result = await fetchWebPrice(ticker);
  return {
    price: result.price,
    sources: result.snippets || ["Web search"],
    errors: [],
    count: 1
  };
}

// Avec une web search classique, on évite de reconstruire un historique chiffré fragile.
// Le graphique reste alimenté par les snapshots utilisateur.
async function fetchBenchmarks(startDate) {
  return {};
}

async function fetchLiveMarketContext() {
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  const watchList = [
    { label: "CW8 (MSCI World PEA)",    ticker: "CW8" },
    { label: "EWLD (MSCI World Lyxor)",  ticker: "EWLD" },
    { label: "PAEEM (Émergents PEA)",    ticker: "PAEEM" },
    { label: "PANX (Nasdaq PEA)",        ticker: "PANX" },
    { label: "CAC 40",                   ticker: "^FCHI" },
    { label: "Euro Stoxx 50",            ticker: "^STOXX50E" },
    { label: "EUR/USD",                  ticker: "EURUSD=X" },
  ];

  const rows = await Promise.all(watchList.map(async ({ label, ticker }) => {
    try {
      const res = await fetchWebPrice(ticker, normalizeTickerForSearch(ticker));
      const snippets = (res.snippets || []).slice(0, 2).join(" | ");
      return `  • ${label} : ${res.price.toFixed(2)} ${res.currency || "EUR"} [Web search: ${snippets || "résultat non détaillé"}]`;
    } catch(e) {
      return `  • ${label} : N/D [${e.message}]`;
    }
  }));

  let macro = "N/D";
  try {
    const macroResults = await fetchWebSearchResults("BCE taux directeurs inflation zone euro marchés aujourd'hui", 4);
    macro = macroResults.map(r => `  • ${r.title}: ${r.snippet}`).join("\n");
  } catch(e) {
    macro = `  • Web search macro indisponible: ${e.message}`;
  }

  return `Contexte sourcé par web search classique (Paris, ${now}) :\n${rows.join('\n')}\n\nContexte macro récent :\n${macro}\n\nNote : les valeurs chiffrées sont extraites d'extraits web non structurés. Si une donnée est N/D ou ambiguë, l'agent doit le dire explicitement et éviter d'inventer.`;
}
