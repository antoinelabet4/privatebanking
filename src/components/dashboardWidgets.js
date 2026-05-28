// Dashboard charts, lists, and advisor opportunity panels.

function DonutChart({ data, size, hole }) {
  const total = data.reduce(function(s,d){ return s+d.value; }, 0);
  if (total === 0) return null;
  const r = (size - hole) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let cum = 0;
  return React.createElement("svg", { width: size, height: size, style: { transform:"rotate(-90deg)", flexShrink:0 } },
    data.map(function(d) {
      const pct = d.value / total;
      const dash = pct * circ;
      const offset = -(cum * circ);
      cum += pct;
      return React.createElement("circle", { key: d.id, cx: cx, cy: cy, r: r,
        fill: "none", stroke: d.color, strokeWidth: hole,
        strokeDasharray: dash + " " + (circ - dash),
        strokeDashoffset: offset });
    })
  );
}

function MiniLineChart({ snapshots, width, height }) {
  const cleanSnapshots = (Array.isArray(snapshots) ? snapshots : [])
    .map(function(s){ return { date: s.date || "", total: safeNum(s.total ?? s.value) }; })
    .filter(function(s){ return s.total > 0; });
  if (cleanSnapshots.length < 2) return (
    <div style={{ width:width, height:height, display:"flex", alignItems:"center", justifyContent:"center", color:"#444", fontSize:11 }}>
      Historique en construction — revenez demain
    </div>
  );
  const vals = cleanSnapshots.map(function(s){ return s.total; });
  const dates = cleanSnapshots.map(function(s){ return s.date; });
  const minV = Math.min.apply(null, vals);
  const maxV = Math.max.apply(null, vals);
  const pad = 28;
  const W = width - pad * 2;
  const H = height - pad * 2;
  const xOf = function(i){ return pad + (i / (vals.length - 1)) * W; };
  const yOf = function(v){ return maxV === minV ? pad + H/2 : pad + (1 - (v - minV) / (maxV - minV)) * H; };
  const pts = vals.map(function(v,i){ return xOf(i) + "," + yOf(v); }).join(" ");
  const areaD = "M " + xOf(0) + "," + yOf(vals[0]) + " " +
    vals.map(function(v,i){ return "L " + xOf(i) + " " + yOf(v); }).join(" ") +
    " L " + xOf(vals.length-1) + " " + (pad+H) + " L " + xOf(0) + " " + (pad+H) + " Z";
  const fmt = function(n){ return Math.round(n/1000) + "k"; };
  const tickCount = Math.min(5, cleanSnapshots.length);
  const step = Math.max(1, Math.floor((cleanSnapshots.length-1) / Math.max(1, tickCount-1)));
  const ticks = Array.from({length: tickCount}, function(_,i){ return i * step; });
  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E1DC" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00E1DC" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <polyline points={pts} fill="none" stroke="#00E1DC" strokeWidth="2" strokeLinejoin="round" />
      {ticks.map(function(i){
        return (
          <g key={i}>
            <text x={xOf(i)} y={height-6} textAnchor="middle" fill="#555" fontSize="9">{dates[i] ? dates[i].slice(5) : ""}</text>
            <text x={pad-4} y={yOf(vals[i])+4} textAnchor="end" fill="#555" fontSize="9">{fmt(vals[i])}</text>
            <line x1={xOf(i)} y1={pad} x2={xOf(i)} y2={pad+H} stroke="rgba(255,255,255,0.04)" />
          </g>
        );
      })}
      <text x={xOf(vals.length-1)} y={yOf(vals[vals.length-1])-8} textAnchor="end" fill="#00E1DC" fontSize="10" fontWeight="bold">
        {Math.round(vals[vals.length-1]).toLocaleString("fr-FR")} €
      </text>
    </svg>
  );
}

function BarList({ data, total, max = 8, lang = "fr" }) {
  const rows = (data || []).filter(d => safeNum(d.value) > 0).slice(0, max);
  if (!rows.length) return <div style={{ color:"#555", fontSize:11, padding:"12px 0" }}>{tr(lang, "insufficientData")}</div>;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
      {rows.map(d => {
        const pct = safePct(d.value, total);
        return (
          <div key={d.id || d.label}>
            <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) auto", gap:8, alignItems:"baseline", fontSize:10, color:"#888", marginBottom:4 }}>
              <span title={d.label} style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.label}</span>
              <span title={pct.toFixed(1)+"% · "+fmtMoney(d.value)} style={{ color:d.color || "#00E1DC", whiteSpace:"nowrap", textAlign:"right", fontVariantNumeric:"tabular-nums" }}>{pct.toFixed(1)}% · {fmtMoney(d.value)}</span>
            </div>
            <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width: Math.min(100, pct)+"%", height:"100%", background:d.color || "#00E1DC", borderRadius:3, transition:"width 0.35s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildPerformanceStory(allLines, exposure, privateMetrics, totalPatrimoine, lang = "fr") {
  const rows = (allLines || []).map(l => ({
    ...l,
    value: getLineCurrentValue(l),
    pnl: getLineCurrentValue(l) - getLinePRUTotal(l),
    pnlPct: safePct(getLineCurrentValue(l) - getLinePRUTotal(l), getLinePRUTotal(l))
  })).filter(l => l.value > 0 || Math.abs(l.pnl) > 0);
  const top = [...rows].sort((a,b)=>b.pnl-a.pnl).slice(0,5);
  const worst = [...rows].sort((a,b)=>a.pnl-b.pnl).slice(0,5);
  const geoLead = (exposure.geography || [])[0];
  const sectorLead = (exposure.sector || [])[0];
  const currencyLead = (exposure.currency || [])[0];
  const notes = [];
  if (geoLead) notes.push(lang === "en" ? `Your portfolio is mainly exposed to ${geoLead.label} (${safePct(geoLead.value,totalPatrimoine).toFixed(0)}%).` : `Votre portefeuille est principalement exposé à ${geoLead.label} (${safePct(geoLead.value,totalPatrimoine).toFixed(0)}%).`);
  if (sectorLead) notes.push(lang === "en" ? `The dominant sector driver is ${sectorLead.label}; monitor it to avoid excessive concentration.` : `Le moteur sectoriel dominant est ${sectorLead.label}, à surveiller pour éviter une concentration excessive.`);
  if (currencyLead && currencyLead.label !== "EUR") notes.push(lang === "en" ? `${currencyLead.label} currency exposure is a source of volatility to document in client reporting.` : `La devise ${currencyLead.label} représente une source de volatilité à documenter dans le reporting client.`);
  if (privateMetrics.value > 0) notes.push(lang === "en" ? `Private assets contribute ${fmtMoney(privateMetrics.value)} of NAV, with an aggregate MOIC of ${privateMetrics.moic.toFixed(2)}x.` : `Les actifs privés apportent ${fmtMoney(privateMetrics.value)} de NAV, avec un MOIC agrégé de ${privateMetrics.moic.toFixed(2)}x.`);
  if (!rows.length) notes.push(lang === "en" ? "Market data is still limited: fill in prices, cost bases and exposures to generate a more complete narrative." : "Les données de marché sont encore limitées : renseignez les prix, PRU et expositions pour générer une narration plus complète.");
  return { top, worst, notes };
}

function buildAdvisorOpportunities(risks, exposure, modules, totalPatrimoine, lang = "fr") {
  const rows = [];
  const geoLead = (exposure.geography || [])[0];
  const sectorLead = (exposure.sector || [])[0];
  const usd = (exposure.currency || []).find(x => x.label === "USD");
  const eur = (exposure.currency || []).find(x => x.label === "EUR");
  const add = (titleFr, titleEn, actionFr, actionEn, color) => rows.push({
    title: lang === "en" ? titleEn : titleFr,
    action: lang === "en" ? actionEn : actionFr,
    color
  });
  if (geoLead && safePct(geoLead.value, totalPatrimoine) > 60) {
    const label = geoLead.label;
    add(
      "Rééquilibrage géographique",
      "Geographic rebalancing",
      `Exposition forte à ${label}. Explorer une solution complémentaire hors ${label}, par exemple fonds US, ETF Monde ou mandat global diversifié.`,
      `High exposure to ${label}. Explore a complementary non-${label} solution, for example a US fund, global ETF or diversified mandate.`,
      "#00E1DC"
    );
  }
  if (sectorLead && safePct(sectorLead.value, totalPatrimoine) > 45) {
    add(
      "Diversification sectorielle",
      "Sector diversification",
      `Le secteur ${sectorLead.label} concentre ${safePct(sectorLead.value,totalPatrimoine).toFixed(0)}% du patrimoine. Proposer une poche satellites sur santé, infrastructure, obligations ou multi-actifs.`,
      `${sectorLead.label} represents ${safePct(sectorLead.value,totalPatrimoine).toFixed(0)}% of total wealth. Consider satellite exposure to healthcare, infrastructure, bonds or multi-asset solutions.`,
      "#7a9ec9"
    );
  }
  if (usd && safePct(usd.value,totalPatrimoine) > 35) {
    add(
      "Gestion du risque devise",
      "Currency-risk management",
      "Exposition USD importante. Discuter d'une part couverte en devise ou d'un scénario de dépenses futures en EUR/USD.",
      "Material USD exposure. Discuss currency-hedged share classes or a future-spending EUR/USD scenario.",
      "#4a9e6b"
    );
  }
  if (eur && safePct(eur.value,totalPatrimoine) > 75) {
    add(
      "Ouverture internationale",
      "International broadening",
      "Forte exposition EUR. Opportunité de présenter une solution actions US/monde ou un fonds obligataire international selon le profil de risque.",
      "High EUR exposure. Opportunity to present US/global equity exposure or an international bond fund depending on risk profile.",
      "#4a9e6b"
    );
  }
  if ((risks || []).some(r => /liquidit/i.test(r.title))) {
    add(
      "Poche de liquidité conseillée",
      "Liquidity sleeve",
      "Faible liquidité détectée. Proposer une poche monétaire, fonds euros ou compte à terme pour sécuriser les besoins à court terme.",
      "Low liquidity detected. Consider a money-market sleeve, euro fund or term deposit to secure short-term needs.",
      "#e8a055"
    );
  }
  if (!rows.length) {
    add(
      "Revue annuelle structurée",
      "Structured annual review",
      "Allocation globalement équilibrée. Préparer une revue client autour de la fiscalité, de la transmission et des objectifs de liquidité.",
      "Overall allocation looks balanced. Prepare a client review around tax, estate planning and liquidity objectives.",
      "#00E1DC"
    );
  }
  return rows.slice(0, 4);
}

function AdvisorOpportunityPanel({ opportunities, lang = "fr", title, compact = false }) {
  const rows = (opportunities || []).filter(Boolean).slice(0, compact ? 3 : 5);
  if (!rows.length) return null;
  return (
    <div style={{ background:"rgba(0,225,220,0.045)", border:"1px solid rgba(0,225,220,0.18)", borderRadius:12, padding: compact ? "12px 14px" : "15px 18px", marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
        <div style={{ fontSize:10, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.08em" }}>{title || (lang === "en" ? "ADVISOR OPPORTUNITIES" : "OPPORTUNITÉS CONSEILLER")}</div>
        <InfoTip text={lang === "en" ? "Advisor mode highlights allocation weaknesses and translates them into possible advisory or commercial actions. These are prompts for discussion, not automatic investment advice." : "Le mode conseiller détecte les faiblesses d'allocation et les transforme en pistes de conseil ou d'opportunités commerciales. Ce sont des pistes de discussion, pas un conseil d'investissement automatique."} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))", gap:10 }}>
        {rows.map((o, idx) => (
          <div key={(o.title || "opp") + idx} style={{ background:"rgba(0,0,0,0.24)", border:"1px solid rgba(255,255,255,0.07)", borderLeft:"3px solid " + (o.color || "#00E1DC"), borderRadius:8, padding:"10px 12px" }}>
            <div style={{ color:o.color || "#00E1DC", fontSize:11, fontWeight:"bold", marginBottom:5 }}>{o.module ? o.module + " · " : ""}{o.title}</div>
            <div style={{ color:"#aaa", fontSize:11, lineHeight:1.45 }}>{o.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildPortfolioAdvisorOpportunities(type, lineRows, total, lang = "fr") {
  const rows = [];
  const module = type === "pea" ? "PEA" : type === "cto" ? "CTO" : "Assurance Vie";
  const add = (titleFr, titleEn, actionFr, actionEn, color) => rows.push({ module, title: lang === "en" ? titleEn : titleFr, action: lang === "en" ? actionEn : actionFr, color });
  const lines = (lineRows || []).filter(l => safeNum(l.val) > 0);
  if (!lines.length) {
    if (type === "pea") add("PEA non investi", "Uninvested PEA", "Utiliser le PEA comme cœur actions européennes/ETF Monde éligible pour améliorer l'efficacité fiscale long terme.", "Use the PEA as a tax-efficient core for eligible European/global equity ETFs.", "#4a9e6b");
    else if (type === "cto") add("CTO à structurer", "CTO to structure", "Créer une poche internationale complémentaire, notamment US, obligations internationales ou thématiques non éligibles au PEA.", "Build an international sleeve, especially US exposure, global bonds or themes not eligible for the PEA.", "#a8c4e8");
    else add("Assurance-vie à exploiter", "Insurance wrapper opportunity", "Étudier fonds euros, unités de compte diversifiées et clause bénéficiaire pour combiner liquidité, fiscalité et transmission.", "Consider euro funds, diversified units and beneficiary clauses to combine liquidity, tax and estate planning.", "#7a9ec9");
    return rows;
  }
  const agg = (keyFn) => {
    const map = {};
    lines.forEach(l => {
      const intel = l.intelligence || getLineIntelligence(l, type);
      const key = keyFn(l, intel) || "Non classé";
      addAgg(map, key, safeNum(l.val), "#00E1DC");
    });
    return toSeries(map);
  };
  const geos = agg((l, intel) => intel.geography);
  const sectors = agg((l, intel) => intel.sector);
  const currencies = agg((l, intel) => intel.currency);
  const cash = lines.filter(l => /cash|liquid/i.test(String(l.ticker) + " " + String(l.categorie))).reduce((s,l)=>s+safeNum(l.val),0);
  const geoLead = geos[0], sectorLead = sectors[0], usd = currencies.find(c => c.label === "USD"), eur = currencies.find(c => c.label === "EUR");
  if (geoLead && safePct(geoLead.value,total) > 60) add("Concentration géographique", "Geographic concentration", `${safePct(geoLead.value,total).toFixed(0)}% du ${module} est exposé à ${geoLead.label}. Proposer une diversification complémentaire hors ${geoLead.label}, par exemple ETF Monde, fonds US ou mandat global.`, `${safePct(geoLead.value,total).toFixed(0)}% of ${module} is exposed to ${geoLead.label}. Propose complementary diversification outside ${geoLead.label}, such as a global ETF, US fund or global mandate.`, "#00E1DC");
  if (sectorLead && safePct(sectorLead.value,total) > 45) {
    const auto = /auto|automobile|car/i.test(sectorLead.label);
    add("Concentration sectorielle", "Sector concentration", auto ? `Exposition forte à l'automobile. Diversifier vers santé, technologie qualité, infrastructures ou ETF larges pour réduire le risque cyclique.` : `${sectorLead.label} représente ${safePct(sectorLead.value,total).toFixed(0)}% du ${module}. Diversifier vers santé, infrastructure, obligations ou multi-actifs selon profil.`, auto ? "High automotive exposure. Diversify into healthcare, quality technology, infrastructure or broad ETFs to reduce cyclical risk." : `${sectorLead.label} represents ${safePct(sectorLead.value,total).toFixed(0)}% of ${module}. Diversify into healthcare, infrastructure, bonds or multi-asset depending on risk profile.`, "#7a9ec9");
  }
  if (eur && safePct(eur.value,total) > 80 && type !== "pea") add("Biais euro élevé", "High euro bias", "Introduire progressivement une poche USD ou Monde couverte/non couverte selon les besoins futurs du client.", "Gradually introduce a USD or global sleeve, hedged or unhedged depending on future client needs.", "#4a9e6b");
  if (usd && safePct(usd.value,total) > 45) add("Risque devise USD", "USD currency risk", "Documenter l'exposition dollar et proposer des parts couvertes ou une allocation EUR défensive si les dépenses futures sont en euros.", "Document dollar exposure and propose hedged share classes or defensive EUR exposure if future spending is in euros.", "#4a9e6b");
  if (safePct(cash,total) > 20) add("Liquidités à déployer", "Cash to deploy", "La poche cash est élevée. Construire un plan d'investissement progressif ou une poche monétaire rémunérée.", "Cash is elevated. Build a phased investment plan or remunerated money-market sleeve.", "#e8a055");
  if (lines.length < 3 && total > 10000) add("Nombre de lignes limité", "Limited number of holdings", "Ajouter des supports diversifiés pour réduire le risque spécifique d'une ligne unique.", "Add diversified instruments to reduce single-position risk.", "#e8a055");
  if (!rows.length) add("Revue d'allocation", "Allocation review", "Allocation lisible. Préparer une revue autour des objectifs, de la fiscalité et du niveau de risque accepté.", "Readable allocation. Prepare a review around objectives, tax treatment and accepted risk level.", "#00E1DC");
  return rows.slice(0,4);
}

function buildImmoAdvisorOpportunities(biens, totalCapNet, lang = "fr") {
  const rows = [];
  const add = (titleFr, titleEn, actionFr, actionEn, color) => rows.push({ module: "Immobilier", title: lang === "en" ? titleEn : titleFr, action: lang === "en" ? actionEn : actionFr, color });
  const list = Array.isArray(biens) ? biens : [];
  if (!list.length) {
    add("Pas d'immobilier direct", "No direct real estate", "Selon le profil, proposer SCPI, OPCI ou dette immobilière pour diversifier sans gestion opérationnelle directe.", "Depending on the profile, propose SCPI, OPCI or real-estate debt to diversify without direct operational management.", "#a0c4ff");
    return rows;
  }
  const personal = list.filter(b => (b.typeDetention || "personnel") === "personnel").reduce((s,b)=>s+Math.max(0,getBienValeur(b)-getBienDetteRestante(b)),0);
  const locatif = list.filter(b => b.usage === "locatif").reduce((s,b)=>s+Math.max(0,getBienValeur(b)-getBienDetteRestante(b)),0);
  const dette = list.reduce((s,b)=>s+getBienDetteRestante(b),0);
  const valeur = list.reduce((s,b)=>s+getBienValeur(b),0);
  if (safePct(personal,totalCapNet) > 60) add("Détention personnelle dominante", "Personal ownership concentration", "Étudier une SCI, un démembrement ou une stratégie de transmission si le parc immobilier pèse fortement en nom propre.", "Consider an SCI, ownership split or estate-planning strategy if real estate is mostly held personally.", "#a0c4ff");
  if (locatif <= 0) add("Peu d'actifs locatifs", "Limited rental exposure", "Le patrimoine immobilier semble surtout personnel. Étudier locatif, SCPI ou nue-propriété pour créer du rendement et diversifier.", "Real estate seems mostly personal. Consider rental property, SCPI or bare ownership to generate yield and diversify.", "#e8a055");
  if (valeur > 0 && safePct(dette,valeur) > 70) add("Levier immobilier élevé", "High real-estate leverage", "Vérifier sensibilité aux taux, échéancier de dette et besoin de liquidité de sécurité.", "Check interest-rate sensitivity, debt schedule and safety liquidity needs.", "#e05555");
  if (!rows.length) add("Optimisation patrimoniale", "Wealth structuring", "Parc immobilier structuré. Revoir fiscalité, assurance emprunteur, loyers et transmission.", "Structured real-estate portfolio. Review tax, loan insurance, rents and estate planning.", "#00E1DC");
  return rows.slice(0,4);
}

function buildPrivateAdvisorOpportunities(items, metrics, lang = "fr") {
  const rows = [];
  const add = (titleFr, titleEn, actionFr, actionEn, color) => rows.push({ module: lang === "en" ? "Private Markets" : "Private Markets", title: lang === "en" ? titleEn : titleFr, action: lang === "en" ? actionEn : actionFr, color });
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    add("Aucune poche privée", "No private allocation", "Présenter le private equity, private debt, club deals ou SCPI comme outil de diversification long terme, avec rappel d'illiquidité.", "Present private equity, private debt, club deals or SCPI as long-term diversification tools, with explicit illiquidity disclosure.", "#9a8ec9");
    return rows;
  }
  if (safeNum(metrics.distributions) <= 0 && safeNum(metrics.called) > 0) add("Distributions à suivre", "Distribution tracking", "Mettre en place un calendrier d'appels/distributions et vérifier la trajectoire J-curve.", "Set up a capital-call/distribution schedule and monitor the J-curve trajectory.", "#e8a055");
  if (safeNum(metrics.moic) > 0 && safeNum(metrics.moic) < 1) add("Multiple sous 1x", "Multiple below 1x", "Documenter les lignes en moins-value et préparer une revue de valorisation ou de liquidité secondaire.", "Document positions below cost and prepare a valuation or secondary-liquidity review.", "#e05555");
  if (!rows.length) add("Reporting non coté", "Private-assets reporting", "Compléter millésime, TRI, MOIC et prochains flux pour rendre le reporting client-grade.", "Complete vintage, IRR, MOIC and future cashflows to make reporting client-grade.", "#00E1DC");
  return rows.slice(0,4);
}

function buildIncomeAdvisorOpportunities(lignes, patrimoine, lang = "fr") {
  const rows = [];
  const add = (titleFr, titleEn, actionFr, actionEn, color) => rows.push({ module: lang === "en" ? "Income" : "Revenus", title: lang === "en" ? titleEn : titleFr, action: lang === "en" ? actionEn : actionFr, color });
  const ann = l => safeNum(l.montant) * ({ mensuel:12, trimestriel:4, annuel:1, ponctuel:0 }[l.frequence] ?? 1);
  const total = (lignes || []).reduce((s,l)=>s+ann(l),0);
  if (!lignes || !lignes.length) add("Revenus non documentés", "Income not documented", "Renseigner salaires, loyers, dividendes et intérêts pour produire une projection de cash-flow client.", "Enter salary, rents, dividends and interest to produce a client cash-flow projection.", "#e8a055");
  else if (safePct(total, patrimoine) < 2) add("Faible rendement de revenus", "Low income yield", "Étudier une poche génératrice de revenus : fonds euros, obligations court terme, SCPI ou dividendes de qualité.", "Consider income-generating exposure: euro funds, short-duration bonds, SCPI or quality dividends.", "#4a9e6b");
  else add("Revenus à sécuriser", "Secure recurring income", "Formaliser la récurrence des revenus et distinguer revenus garantis, variables et fiscalisés.", "Formalize income recurrence and separate guaranteed, variable and taxable income.", "#00E1DC");
  return rows.slice(0,3);
}

function buildFiscalAdvisorOpportunities({ immoBiens = [], peaTotal = 0, ctoTotal = 0, avTotal = 0 }, lang = "fr") {
  const rows = [];
  const add = (titleFr, titleEn, actionFr, actionEn, color) => rows.push({ module: lang === "en" ? "Tax" : "Fiscalité", title: lang === "en" ? titleEn : titleFr, action: lang === "en" ? actionEn : actionFr, color });
  const immoPersonal = (immoBiens || []).some(b => (b.typeDetention || "personnel") === "personnel");
  if (avTotal <= 0) add("Assurance-vie absente", "No insurance wrapper", "Étudier une assurance-vie pour transmission, clause bénéficiaire et allocation fonds euros/unités de compte.", "Consider life insurance for estate planning, beneficiary clauses and euro-fund/unit-linked allocation.", "#7a9ec9");
  if (ctoTotal > peaTotal && peaTotal < 150000) add("PEA à optimiser", "PEA optimization", "Si l'horizon le permet, arbitrer une partie de l'exposition actions éligible vers PEA pour améliorer la fiscalité future.", "If the horizon allows, move eligible equity exposure toward the PEA to improve future tax efficiency.", "#4a9e6b");
  if (immoPersonal) add("Structuration immobilière", "Real-estate structuring", "Analyser SCI, démembrement, LMNP ou IFI selon objectifs de transmission et revenus locatifs.", "Analyze SCI, ownership split, furnished-rental status or wealth tax depending on estate and rental-income goals.", "#a0c4ff");
  if (!rows.length) add("Revue fiscale annuelle", "Annual tax review", "Mettre à jour TMI, abattements, plus-values latentes et choix PFU/barème avant les arbitrages.", "Update marginal tax rate, allowances, latent gains and PFU/progressive-scale choice before trades.", "#00E1DC");
  return rows.slice(0,4);
}
