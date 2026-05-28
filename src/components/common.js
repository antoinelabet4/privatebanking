// Reusable UI pieces used across portfolio chat, charts, logo, and API setup.

const SIA_LOGO_DATA_URI = "data:image/png;base64,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";
const SIA_FONT_STACK = '"SORA SIA", "Sora", "Inter", "Segoe UI", Arial, sans-serif';

function SiaLogo({ size = "header" }) {
  const isHeader = size === "header";
  return (
    <div
      role="img"
      aria-label="SIA"
      style={ {
        width: isHeader ? 180 : 240,
        height: isHeader ? 70 : 92,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        borderRadius: 0,
        padding: 0,
        boxShadow: "none",
        overflow: "visible"
      } }
    >
      <img
        src={SIA_LOGO_DATA_URI}
        alt="SIA"
        style={ {
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          background: "transparent"
        } }
      />
    </div>
  );
}

const SYSTEM_PROMPT = `Tu es un conseiller financier d'élite combinant les expertises de Goldman Sachs, Morgan Stanley, Bridgewater, BlackRock, JPMorgan, Citadel, Harvard Endowment, Bain & Company, Renaissance Technologies et McKinsey Global Institute.
L'utilisateur gère un PEA (Plan d'Épargne en Actions) français. Le capital, l'objectif de rendement, la tolérance au risque et l'horizon d'investissement sont propres à chaque utilisateur — adapte toujours tes recommandations à son profil réel. Si ces informations n'ont pas encore été fournies, demande-les avant de proposer une allocation.
CONTRAINTES PEA IMPORTANTES:
- Seules les actions européennes et ETF éligibles PEA sont autorisés
- Pas d'actions américaines directes (sauf via ETF éligibles PEA)
- Fiscalité avantageuse après 5 ans (flat tax 17,2% au lieu de 30%)
- Horizon d'investissement long terme recommandé
Tu as accès à 10 modules d'analyse:
1. STOCK SCREENER (Goldman Sachs)
2. DCF VALUATION (Morgan Stanley)
3. RISK ASSESSMENT (Bridgewater)
4. EARNINGS ANALYSIS (JPMorgan)
5. PORTFOLIO BUILDER (BlackRock)
6. TECHNICAL ANALYSIS (Citadel)
7. DIVIDEND STRATEGY (Harvard Endowment)
8. COMPETITIVE ANALYSIS (Bain & Company)
9. PATTERN DETECTION (Renaissance Technologies)
10. MACRO REPORT (McKinsey)
Pour chaque question, utilise le ou les modules les plus pertinents et adapte la réponse au contexte PEA français.
Donne des tickers réels éligibles PEA. Fournis toujours un résumé "À faire ce mois-ci".
RÈGLE IMPORTANTE — ALLOCATION:
Lorsque tu proposes une allocation de portefeuille (liste de lignes à acheter), tu DOIS terminer ton message par un bloc JSON strictement dans ce format (sans markdown, sans backticks, juste le tag) :
<ALLOCATION_JSON>
[
  {"ticker":"CW8","nom":"Amundi MSCI World PEA","categorie":"ETF World","montant":30000,"cible":30},
  {"ticker":"HLT","nom":"Lyxor Stoxx Europe 600","categorie":"ETF Europe","montant":15000,"cible":15},
  {"ticker":"PANX","nom":"Amundi PEA Nasdaq-100","categorie":"ETF USA","montant":10000,"cible":10},
  {"ticker":"PAEEM","nom":"Amundi PEA Émergents","categorie":"ETF Emergents","montant":8000,"cible":8},
  {"ticker":"TTE","nom":"TotalEnergies","categorie":"Action Europe","montant":7000,"cible":7},
  {"ticker":"CASH","nom":"Liquidités","categorie":"Cash","montant":5000,"cible":5}
]
</ALLOCATION_JSON>
Catégories OBLIGATOIRES — respecte strictement ces définitions :
- "ETF World"     : ETF à diversification mondiale (MSCI World, MSCI ACWI…) → ex: CW8, EWLD, LCWD
- "ETF Europe"    : ETF zone géographique Europe (Stoxx 600, Euro Stoxx 50, Europe Smalls…) → ex: PCEU, HLT, ESE, MSEU
- "ETF USA"       : ETF US/Nasdaq-100/S&P 500 via swap éligible PEA → ex: PANX, PUST, RS2K
- "ETF Emergents" : ETF marchés émergents → ex: PAEEM, PIND, AASI, PEKQ
- "Action Europe" : ACTIONS INDIVIDUELLES européennes éligibles PEA (pas des ETF) → ex: TTE, MC, AIR, ASML
- "Dividendes"    : ETF ou actions axés rendement dividende → ex: TDIV, EWLD, BNPP
- "Cash"          : Liquidités uniquement
RÈGLE STRICTE : Ne JAMAIS mettre un ETF Europe ou ETF USA dans "ETF World". Ne JAMAIS mettre une action individuelle dans une catégorie ETF.
Le champ "montant" est le montant en euros à investir sur 100 000€ total.
N'inclus ce bloc JSON QUE quand tu proposes une allocation complète de portefeuille.

DONNÉES DE MARCHÉ ET CONTEXTE SOURCÉS PAR WEB SEARCH CLASSIQUE — mises à jour à chaque message :
{{LIVE_MARKET_DATA}}

RÈGLE ABSOLUE : Toutes tes recommandations, analyses et allocations DOIVENT être basées sur ces données temps réel. Ne jamais extrapoler depuis des données passées ou supposées. Si une donnée est marquée "N/D", indique-le explicitement plutôt que d'inventer une valeur.`;

const REALLOC_PROMPT = `Tu es un conseiller PEA expert. L'utilisateur te fournit son portefeuille actuel ligne par ligne avec les valeurs actualisées.
Analyse la performance de chaque ligne, identifie les déséquilibres par rapport à l'allocation cible, et propose un plan de rééquilibrage mensuel précis.
Pour chaque ligne indique: conserver / renforcer / alléger / vendre. Justifie brièvement chaque décision.
Fournis un tableau récapitulatif des mouvements à effectuer avec les montants en euros.
Réponds en français, de façon structurée et actionnable.`;

const QUICK_PROMPTS = [
  { icon: "📊", label: "Allocation optimale", text: "Donne-moi l'allocation optimale pour mon PEA de 100k€ visant 10-12%/an avec un risque modéré. Utilise le module BlackRock Portfolio Builder. Propose une liste complète de lignes avec les montants à investir." },
  { icon: "🔍", label: "Stock Screener", text: "Lance le stock screener Goldman Sachs pour identifier les 10 meilleures actions éligibles PEA actuellement. Profil: tolérance risque modéré, horizon 5 ans+, secteurs tech, santé, industrie européenne." },
  { icon: "⚠️", label: "Analyse des risques", text: "Évalue les risques macro actuels sur mon PEA européen façon Bridgewater. Quelles sont les 3 principales menaces et les stratégies de couverture adaptées?" },
  { icon: "📈", label: "Analyse technique", text: "Donne-moi l'analyse technique Citadel sur les ETF PEA principaux (CW8, EWLD, PAEEM). Signaux d'entrée/sortie et niveaux clés pour ce mois." },
  { icon: "💰", label: "Dividendes", text: "Construis une poche dividendes façon Harvard Endowment pour 20k€ de mon PEA. Objectif: 3-4% de rendement stable avec croissance." },
  { icon: "🌍", label: "Rapport macro", text: "Rapport macroéconomique McKinsey: comment les conditions actuelles (taux BCE, inflation Europe, croissance PIB) affectent mon allocation PEA?" },
  { icon: "🔄", label: "Rééquilibrage", text: "C'est la revue mensuelle de mon PEA. Analyse les signaux actuels et dis-moi si je dois rééquilibrer. Utilise les modules macro + technique + risque." },
  { icon: "🎯", label: "Action du mois", text: "Identifie la meilleure opportunité action éligible PEA ce mois via le screener Goldman Sachs + analyse DCF Morgan Stanley. Budget: 5-10k€." },
];

const CAT_COLORS = {
  "ETF World":     "#00E1DC",   // MSCI World, global diversifié (CW8, EWLD…)
  "ETF Europe":    "#5a9e8b",   // Stoxx 600, Euro Stoxx 50, Europe Smalls… (PCEU, HLT…)
  "ETF USA":       "#8e6ac9",   // Nasdaq-100, S&P 500 via swap PEA (PANX, PUST…)
  "ETF Emergents": "#6a8ec9",   // Marchés émergents (PAEEM, PIND, AASI…)
  "Action Europe": "#4a9e6b",   // Actions individuelles européennes éligibles PEA
  "Action USA":    "#9b7fd4",   // Actions américaines (AAPL, MSFT…)
  "Dividendes":    "#9e4a6b",   // ETF ou actions à dividendes
  "Fonds Euros":   "#4a9e8b",   // Fonds en euros (capital garanti)
  "UC Actions":    "#00E1DC",   // Unités de compte actions
  "UC Obligations":"#6a8ec9",   // Unités de compte obligataires
  "UC Immobilier": "#9e6b4a",   // SCPI, OPCI en UC
  "UC Diversifié": "#8b9e4a",   // UC diversifiées / flexibles
  "Cash":          "#888"
};

function parseAllocation(content) {
  const match = content.match(/<ALLOCATION_JSON>([\s\S]*?)<\/ALLOCATION_JSON>/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

function stripJson(content) {
  return content.replace(/<ALLOCATION_JSON>[\s\S]*?<\/ALLOCATION_JSON>/, "").trim();
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "16px 20px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#00E1DC", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function Message({ msg, onImport }) {
  const isUser = msg.role === "user";
  const allocation = !isUser ? parseAllocation(msg.content) : null;
  const displayText = allocation ? stripJson(msg.content) : msg.content;
  const [imported, setImported] = useState(msg.imported || false);
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", gap: 12, marginBottom: 20, alignItems: "flex-start" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: isUser ? "linear-gradient(135deg,#00E1DC,#007A78)" : "linear-gradient(135deg,#1a1a2e,#16213e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "bold", color: "#fff", border: isUser ? "none" : "1px solid #00E1DC33" }}>
        {isUser ? "A" : "SIA"}
      </div>
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: isUser ? "linear-gradient(135deg,#1e3a2f,#162b22)" : "rgba(15,15,25,0.9)", border: isUser ? "1px solid #2d5a3d" : "1px solid rgba(0,225,220,0.2)", borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px", padding: "14px 18px" }}>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: isUser ? "#B8FFF8" : "#F5F7FA", whiteSpace: "pre-wrap", fontFamily: SIA_FONT_STACK }}>
            {displayText}{msg.streaming && <span className="cursor" />}
          </div>
          {msg.ts && <div style={{ fontSize: 10, color: "#555", marginTop: 6, textAlign: isUser ? "right" : "left" }}>{msg.ts}</div>}
        </div>
        {allocation && (
          <div style={{ background: "rgba(0,225,220,0.06)", border: "1px solid rgba(0,225,220,0.3)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#00E1DC", letterSpacing: "0.1em", fontWeight: "bold", marginBottom: 10 }}>
              📋 ALLOCATION PROPOSÉE — {allocation.length} lignes · {allocation.reduce((s, l) => s + l.montant, 0).toLocaleString('fr-FR')} €
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {allocation.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <span>
                    <span style={{ color: "#00E1DC", fontFamily: "monospace", fontWeight: "bold", marginRight: 8 }}>{l.ticker}</span>
                    <span style={{ color: "#999" }}>{l.nom}</span>
                  </span>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: (CAT_COLORS[l.categorie] || "#888") + "22", color: CAT_COLORS[l.categorie] || "#888" }}>{l.categorie}</span>
                    <span style={{ color: "#F5F7FA", fontFamily: "monospace" }}>{l.montant.toLocaleString('fr-FR')} €</span>
                    <span style={{ color: "#888", fontFamily: "monospace" }}>{l.cible}%</span>
                  </span>
                </div>
              ))}
            </div>
            {imported ? (
              <div style={{ textAlign: "center", fontSize: 12, color: "#4a9e6b", padding: "8px", background: "rgba(74,158,107,0.1)", borderRadius: 8 }}>
                ✓ Importé dans le portefeuille
              </div>
            ) : (
              <button onClick={() => { onImport(allocation); setImported(true); }}
                style={{ width: "100%", background: "linear-gradient(135deg,#00E1DC,#007A78)", border: "none", borderRadius: 8, padding: "10px", cursor: "pointer", color: "#000", fontWeight: "bold", fontSize: 13, fontFamily: "inherit", letterSpacing: "0.05em" }}>
                ✦ Valider et importer dans le portefeuille
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EditableCell({ value, onSave, suffix = "" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef();
  useEffect(() => { if (editing) ref.current && ref.current.focus(); }, [editing]);
  if (editing) {
    return (
      <input ref={ref} type="number" value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onSave(parseFloat(val) || 0); setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") { onSave(parseFloat(val) || 0); setEditing(false); } }}
        style={{ width: 80, background: "rgba(0,225,220,0.15)", border: "1px solid #00E1DC", borderRadius: 4, color: "#00E1DC", padding: "2px 6px", fontSize: 13, fontFamily: "monospace", textAlign: "right", outline: "none" }} />
    );
  }
  return (
    <span onClick={() => { setVal(value); setEditing(true); }} title="Cliquer pour modifier"
      style={{ cursor: "pointer", borderBottom: "1px dashed rgba(0,225,220,0.4)", paddingBottom: 1, fontFamily: "monospace", fontSize: 13 }}>
      {typeof value === "number" ? value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}{suffix}
    </span>
  );
}

// ── Camembert SVG ──
function PieChart({ lines, total }) {
  if (!lines || lines.length === 0 || total <= 0) return null;

  // Agréger par catégorie
  const bycat = {};
  lines.forEach(l => {
    const cat = l.categorie || "Autre";
    bycat[cat] = (bycat[cat] || 0) + getLineCurrentValue(l);
  });
  const slices = Object.entries(bycat).map(([cat, val]) => ({
    cat, val, pct: (val / total) * 100, color: CAT_COLORS[cat] || "#aaa"
  })).sort((a, b) => b.val - a.val);

  // Calcul des arcs SVG
  const cx = 90, cy = 90, r = 75;
  let cumul = 0;
  const paths = slices.map(s => {
    const start = cumul;
    cumul += s.pct / 100;
    const a1 = (start * 2 * Math.PI) - Math.PI / 2;
    const a2 = (cumul * 2 * Math.PI) - Math.PI / 2;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = s.pct > 50 ? 1 : 0;
    return { ...s, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });

  return (
    <div style={{ background: "rgba(15,15,25,0.8)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 32 }}>
      <div>
        <div style={{ fontSize: 11, color: "#00E1DC", letterSpacing: "0.1em", fontWeight: "bold", marginBottom: 14 }}>RÉPARTITION PAR CATÉGORIE</div>
        <svg width={180} height={180} viewBox="0 0 180 180">
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} opacity={0.85} stroke="#0d1117" strokeWidth={1.5}>
              <title>{p.cat} — {p.pct.toFixed(1)}%</title>
            </path>
          ))}
          <circle cx={cx} cy={cy} r={38} fill="#0d1117" />
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#00E1DC" fontSize={13} fontWeight="bold">{slices.length}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#888" fontSize={9}>lignes</text>
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {slices.map((s, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0, display: "inline-block" }} />
                <span style={{ color: "#ccc" }}>{s.cat}</span>
              </span>
              <span style={{ fontFamily: "monospace", color: s.color, fontWeight: "bold" }}>{s.pct.toFixed(1)}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
              <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: 2, opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Courbe de performance SVG ──
// ── Courbe de performance + benchmarks (normalisés en %) ──
function PerfChart({ history, benchmarks }) {
  if (!history || history.length < 2) return (
    <div style={{ background: "rgba(15,15,25,0.8)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 16, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#00E1DC", letterSpacing: "0.1em", fontWeight: "bold", marginBottom: 10 }}>HISTORIQUE DE PERFORMANCE</div>
      <div style={{ fontSize: 12, color: "#555", paddingBottom: 8 }}>Les données s'accumuleront au fil des jours. Revenez demain pour voir votre première courbe.</div>
    </div>
  );

  const W = 700, H = 160, pad = { t: 20, b: 30, l: 52, r: 20 };

  // Normaliser le portefeuille en %
  const first = history[0].val;
  const portPct = history.map(p => ((p.val - first) / first) * 100);

  // Séries benchmark normalisées
  const series = [{ label: "Mon PEA", pcts: portPct, color: "#00E1DC", width: 2.5 }];
  const bmColors = { "MSCI World (CW8)": "#6a8ec9", "CAC 40": "#9e6b4a" };
  if (benchmarks) {
    Object.entries(benchmarks).forEach(([name, pts]) => {
      if (pts && pts.length >= 2) {
        const f0 = pts[0];
        series.push({ label: name, pcts: pts.map(v => ((v - f0) / f0) * 100), color: bmColors[name] || "#888", width: 1.5 });
      }
    });
  }

  // Plage Y globale
  const allPcts = series.flatMap(s => s.pcts);
  const minP = Math.min(...allPcts, 0), maxP = Math.max(...allPcts, 0);
  const rangeP = maxP - minP || 1;
  const toY = v => pad.t + (1 - (v - minP) / rangeP) * (H - pad.t - pad.b);
  const zeroY = toY(0);

  const toXN = (i, total) => pad.l + (i / Math.max(total - 1, 1)) * (W - pad.l - pad.r);

  // Labels Y
  const yTicks = [minP, 0, maxP].filter((v, i, a) => a.indexOf(v) === i);
  const xLabels = [0, Math.floor(history.length / 2), history.length - 1].map(i => ({
    x: toXN(i, history.length), label: history[i].date.slice(5)
  }));

  const portLast = portPct[portPct.length - 1];
  const portColor = portLast >= 0 ? "#4a9e6b" : "#e05555";

  return (
    <div style={{ background: "rgba(15,15,25,0.8)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#00E1DC", letterSpacing: "0.1em", fontWeight: "bold" }}>PERFORMANCE vs BENCHMARKS</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {series.map((s, i) => {
            const last = s.pcts[s.pcts.length - 1];
            return (
              <span key={i} style={{ fontSize: 11, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 14, height: 2, background: s.color, display: "inline-block", borderRadius: 1 }} />
                <span style={{ color: "#888" }}>{s.label}</span>
                <span style={{ color: last >= 0 ? "#4a9e6b" : "#e05555", fontWeight: "bold" }}>{last >= 0 ? "+" : ""}{last.toFixed(2)}%</span>
              </span>
            );
          })}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={portColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={portColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid Y */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} y1={toY(v)} x2={W - pad.r} y2={toY(v)}
              stroke={v === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"} strokeWidth={v === 0 ? 1 : 1} strokeDasharray={v === 0 ? "none" : "3,4"} />
            <text x={pad.l - 4} y={toY(v) + 4} textAnchor="end" fill={v === 0 ? "#666" : "#444"} fontSize={8}>{v >= 0 ? "+" : ""}{v.toFixed(1)}%</text>
          </g>
        ))}
        {/* Aire portefeuille */}
        <polygon
          points={`${toXN(0, history.length)},${zeroY} ` + portPct.map((v, i) => `${toXN(i, history.length)},${toY(v)}`).join(" ") + ` ${toXN(history.length - 1, history.length)},${zeroY}`}
          fill="url(#portGrad)" />
        {/* Lignes benchmarks puis portefeuille (en dernier pour être au-dessus) */}
        {series.slice(1).map((s, si) => (
          <polyline key={si}
            points={s.pcts.map((v, i) => `${toXN(i, s.pcts.length)},${toY(v)}`).join(" ")}
            fill="none" stroke={s.color} strokeWidth={s.width} strokeLinejoin="round" strokeDasharray="5,3" opacity={0.7} />
        ))}
        <polyline
          points={portPct.map((v, i) => `${toXN(i, portPct.length)},${toY(v)}`).join(" ")}
          fill="none" stroke="#00E1DC" strokeWidth={2.5} strokeLinejoin="round" />
        {/* Labels X */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - 4} textAnchor="middle" fill="#444" fontSize={8}>{l.label}</text>
        ))}
        {/* Point final portefeuille */}
        <circle cx={toXN(portPct.length - 1, portPct.length)} cy={toY(portLast)} r={4} fill={portColor} />
      </svg>
    </div>
  );
}

function ApiKeySetup({ onSave }) {
