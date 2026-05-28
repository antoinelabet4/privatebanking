// Revenus tab constants and UI module.

// ──────────────────────────────────────────────────
// REVENUS MODULE
// ──────────────────────────────────────────────────

const REVENU_CATS = [
  { id: "salaire",    label: "💼 Revenus d'activité",       color: "#4a9e6b" },
  { id: "dividendes", label: "📈 Dividendes & Plus-values",  color: "#00E1DC" },
  { id: "immobilier", label: "🏠 Revenus immobiliers",       color: "#a0c4ff" },
  { id: "interets",   label: "🏦 Intérêts & Livrets",        color: "#7a9ec9" },
  { id: "retraite",   label: "🎯 Retraite & Pensions",       color: "#8b9e4a" },
  { id: "autres",     label: "✨ Autres revenus",             color: "#9e6b4a" },
];

const REVENU_SOUS_TYPES = {
  salaire:    ["Salaire net", "Salaire brut", "Prime / Bonus", "Freelance / BNC", "Intéressement / Participation", "RSU / Stock-options"],
  dividendes: ["Dividendes PEA", "Dividendes CTO", "Plus-value PEA", "Plus-value CTO", "ETF distribution"],
  immobilier: ["Loyers nus (foncier)", "Loyers meublés (LMNP)", "Revenus SCPI", "Plus-value immobilière", "Revenus parking / cave"],
  interets:   ["Livret A", "LEP", "LDDS", "Compte à terme", "Fonds euros AV", "Obligations / Coupons"],
  retraite:   ["Retraite de base (SS)", "Retraite complémentaire", "Pension d'invalidité", "Allocations chômage", "Pension alimentaire"],
  autres:     ["Héritage / Donation", "Cession d'entreprise", "Rachat AV", "Droits d'auteur / Royalties", "Revenu exceptionnel"],
};

const REVENU_FREQS = [
  { id: "mensuel",     label: "Mensuel",     mult: 12 },
  { id: "trimestriel", label: "Trimestriel", mult: 4  },
  { id: "annuel",      label: "Annuel",      mult: 1  },
  { id: "ponctuel",    label: "Ponctuel",    mult: 0  },
];

const BLANK_REVENU = { id: 0, label: "", categorie: "salaire", sousType: "Salaire net", montant: "", frequence: "mensuel", isNet: true, notes: "" };

function RevenusModule({ patrimoine, onTotalChange, immoBiens, reportMode = "advisor", lang = "fr" }) {
  const [lignes, setLignes] = useState(() => {
    try { const s = localStorage.getItem("mpb_revenus"); if (s) return JSON.parse(s); } catch {}
    return [];
  });
  const [form, setForm] = useState(null);
  const onTotalRef = useRef(onTotalChange);
  onTotalRef.current = onTotalChange;

  // ── Suggestions auto depuis autres modules ──
  const [dismissedSugs, setDismissedSugs] = useState(() => {
    try { const s = localStorage.getItem("mpb_revenus_dismissed"); if (s) return JSON.parse(s); } catch {}
    return [];
  });

  const suggestions = React.useMemo(() => {
    const sugs = [];
	    const peaLines = readJson("pea_lines", []);
	    const ctoLines = readJson("cto_lines", []);
	    const avLines  = readJson("av_lines", []);

    const val = (l) => getLineCurrentValue(l);

    // PEA — lignes catégorie Dividendes uniquement
    const peaDiv = peaLines.filter(l => l.categorie === "Dividendes");
    if (peaDiv.length > 0) {
      const total = peaDiv.reduce((s, l) => s + val(l), 0);
      sugs.push({ key: "pea_div", label: "Dividendes PEA", categorie: "dividendes", sousType: "Dividendes PEA",
        montant: String(Math.round(total * 0.03 / 12)), frequence: "mensuel", isNet: false,
        badge: "PEA", badgeColor: "#4a9e6b",
        notes: "Estimé 3% rendement · " + Math.round(total).toLocaleString("fr-FR") + " € investi" });
    }

    // CTO — actions individuelles (dividendes estimés)
    const ctoStocks = ctoLines.filter(l => ["Action Europe","Action USA","Dividendes"].includes(l.categorie));
    if (ctoStocks.length > 0) {
      const total = ctoStocks.reduce((s, l) => s + val(l), 0);
      sugs.push({ key: "cto_div", label: "Dividendes CTO", categorie: "dividendes", sousType: "Dividendes CTO",
        montant: String(Math.round(total * 0.02 / 12)), frequence: "mensuel", isNet: false,
        badge: "CTO", badgeColor: "#a8c4e8",
        notes: "Estimé 2% yield · " + Math.round(total).toLocaleString("fr-FR") + " € actions" });
    }

    // AV — fonds euros (intérêts)
    const avEuros = avLines.filter(l => l.categorie === "Fonds Euros");
    if (avEuros.length > 0) {
      const total = avEuros.reduce((s, l) => s + val(l), 0);
      sugs.push({ key: "av_euros", label: "Intérêts Fonds Euros AV", categorie: "interets", sousType: "Fonds euros AV",
        montant: String(Math.round(total * 0.025)), frequence: "annuel", isNet: false,
        badge: "AV", badgeColor: "#7a9ec9",
        notes: "Estimé 2,5% · " + Math.round(total).toLocaleString("fr-FR") + " € fonds euros" });
    }

    // AV — UC Actions (dividendes distribués, estimé faible)
    const avUC = avLines.filter(l => l.categorie === "UC Actions");
    if (avUC.length > 0) {
      const total = avUC.reduce((s, l) => s + val(l), 0);
      sugs.push({ key: "av_uc", label: "Revenus UC Actions AV", categorie: "dividendes", sousType: "ETF distribution",
        montant: String(Math.round(total * 0.015)), frequence: "annuel", isNet: false,
        badge: "AV", badgeColor: "#7a9ec9",
        notes: "Estimé 1,5% · " + Math.round(total).toLocaleString("fr-FR") + " € UC actions" });
    }

    // Immo — loyers par bien
    const biens = immoBiens || [];
    biens.filter(b => parseFloat(b.loyerMensuelHC) > 0).forEach(b => {
      const loyer = parseFloat(b.loyerMensuelHC) || 0;
      const charges = parseFloat(b.chargesLoc) || 0;
      const isLMNP = b.regimeFiscal === "lmnp" || b.regimeFiscal === "bic";
      const adresse = [b.adresse, b.ville].filter(Boolean).join(", ") || "Bien immobilier";
      sugs.push({ key: "immo_" + b.id, label: "Loyers · " + adresse, categorie: "immobilier",
        sousType: isLMNP ? "Loyers meublés (LMNP)" : "Loyers nus (foncier)",
        montant: String(Math.round(loyer + charges)), frequence: "mensuel", isNet: false,
        badge: "Immo", badgeColor: "#a0c4ff",
        notes: b.ville || "" });
    });

    // Livrets — si pas encore de revenus intérêts renseignés, suggérer
    const hasInterets = lignes.some(l => l.categorie === "interets" && l.sousType !== "Fonds euros AV");
    if (!hasInterets) {
      sugs.push({ key: "livret_a", label: "Livret A", categorie: "interets", sousType: "Livret A",
        montant: "", frequence: "annuel", isNet: true,
        badge: "Banque", badgeColor: "#8b9e4a",
        notes: "Plafond 22 950 € · taux 2,4%" });
    }

    // Filter out already dismissed and already added
    return sugs.filter(s =>
      !dismissedSugs.includes(s.key) &&
      !lignes.some(l => l.sousType === s.sousType && l.label.includes(s.label.split(" · ")[0]))
    );
  }, [immoBiens, lignes, dismissedSugs]);

  function acceptSuggestion(sug) {
    const { key, badge, badgeColor, ...ligne } = sug;
    setLignes(prev => [...prev, { ...ligne, id: Date.now() }]);
  }

  function dismissSuggestion(key) {
    const next = [...dismissedSugs, key];
    setDismissedSugs(next);
    localStorage.setItem("mpb_revenus_dismissed", JSON.stringify(next));
  }

  useEffect(() => { localStorage.setItem("mpb_revenus", JSON.stringify(lignes)); }, [lignes]);

  const getAnnuel = (l) => {
    const mult = REVENU_FREQS.find(f => f.id === l.frequence)?.mult || 0;
    return (parseFloat(l.montant) || 0) * mult;
  };

  const totalAnnuel    = lignes.reduce((s, l) => s + getAnnuel(l), 0);
  const totalMensuel   = totalAnnuel / 12;
  const revenusPassifs = lignes.filter(l => l.categorie !== "salaire").reduce((s, l) => s + getAnnuel(l), 0);
  const tauxRendement  = patrimoine > 0 ? (revenusPassifs / patrimoine) * 100 : 0;
  const incomeAdvisorOpportunities = buildIncomeAdvisorOpportunities(lignes, patrimoine, lang);

  useEffect(() => { onTotalRef.current(totalAnnuel); }, [totalAnnuel]);

  function save(ligne) {
    if (ligne.id) { setLignes(prev => prev.map(l => l.id === ligne.id ? ligne : l)); }
    else          { setLignes(prev => [...prev, { ...ligne, id: Date.now() }]); }
    setForm(null);
  }

  const allGrouped = REVENU_CATS.map(cat => ({
    ...cat,
    total: lignes.filter(l => l.categorie === cat.id).reduce((s, l) => s + getAnnuel(l), 0),
  })).filter(g => g.total > 0);

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 6, padding: "6px 10px", color: "#F5F7FA", fontSize: 12, fontFamily: "inherit" };
  const selectStyle = { width: "100%", background: "#1a1a2e", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 6, padding: "6px 10px", color: "#F5F7FA", fontSize: 12, fontFamily: "inherit" };
  const labelStyle  = { fontSize: 10, color: "#888", marginBottom: 4 };

  return (
    <div style={{ padding: "20px 24px", maxWidth: 880, margin: "0 auto" }}>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "REVENU ANNUEL NET",    value: Math.round(totalAnnuel).toLocaleString("fr-FR") + " €",  color: "#00E1DC" },
          { label: "REVENU MENSUEL NET",   value: Math.round(totalMensuel).toLocaleString("fr-FR") + " €", color: "#4a9e6b" },
          { label: "REVENUS PASSIFS / AN", value: Math.round(revenusPassifs).toLocaleString("fr-FR") + " €", color: "#7a9ec9" },
          { label: "TAUX DE RENDEMENT",    value: tauxRendement.toFixed(2) + " %",                          color: "#a0c4ff" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,225,220,0.12)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: "#666", letterSpacing: "0.08em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {reportMode === "advisor" && (
        <AdvisorOpportunityPanel opportunities={incomeAdvisorOpportunities} lang={lang} />
      )}

      {/* ── Breakdown bar ── */}
      {totalAnnuel > 0 && allGrouped.length > 0 && (
        <div style={{ marginBottom: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.06em", marginBottom: 10 }}>RÉPARTITION DES REVENUS</div>
          <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", marginBottom: 10 }}>
            {allGrouped.map(g => (
              <div key={g.id} style={{ width: ((g.total / totalAnnuel) * 100) + "%", background: g.color, transition: "width 0.4s" }}
                title={g.label + ": " + Math.round(g.total).toLocaleString("fr-FR") + " €/an"} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {allGrouped.map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#888" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color }} />
                {g.label.split(" ").slice(1).join(" ")} — {((g.total / totalAnnuel) * 100).toFixed(1)}%
                <span style={{ color: "#555" }}>({Math.round(g.total).toLocaleString("fr-FR")} €)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Suggestions ── */}
      {suggestions.length > 0 && (
        <div style={{ background: "rgba(0,225,220,0.05)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: "#00E1DC", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span>✨</span>
            <span>SUGGESTIONS AUTOMATIQUES</span>
            <span style={{ color: "#555", fontWeight: "normal" }}>— pré-remplies depuis vos autres onglets</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {suggestions.map(sug => (
              <div key={sug.key} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: sug.badgeColor + "22", color: sug.badgeColor, fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: "bold", letterSpacing: "0.05em", flexShrink: 0 }}>{sug.badge}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#F5F7FA" }}>{sug.label}</div>
                  <div style={{ fontSize: 10, color: "#666" }}>{sug.sousType}{sug.notes ? " · " + sug.notes : ""}</div>
                </div>
                {sug.montant && (
                  <div style={{ fontSize: 12, color: "#aaa", minWidth: 100, textAlign: "right" }}>
                    {parseFloat(sug.montant).toLocaleString("fr-FR")} € / {sug.frequence === "mensuel" ? "mois" : sug.frequence === "annuel" ? "an" : sug.frequence}
                  </div>
                )}
                <button onClick={() => acceptSuggestion(sug)}
                  style={{ background: "rgba(74,158,107,0.15)", border: "1px solid rgba(74,158,107,0.4)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", color: "#4a9e6b", fontSize: 11, fontFamily: "inherit", flexShrink: 0 }}>
                  ✓ Ajouter
                </button>
                <button onClick={() => dismissSuggestion(sug.key)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#444", fontSize: 14, padding: "2px 4px", lineHeight: 1 }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#00E1DC", fontWeight: "bold", letterSpacing: "0.06em" }}>MES SOURCES DE REVENUS</div>
        <button onClick={() => setForm({ ...BLANK_REVENU })}
          style={{ background: "rgba(0,225,220,0.12)", border: "1px solid rgba(0,225,220,0.3)", borderRadius: 8, padding: "7px 14px", cursor: "pointer", color: "#00E1DC", fontSize: 12, fontFamily: "inherit" }}>
          + Ajouter un revenu
        </button>
      </div>

      {/* ── Form ── */}
      {form && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={labelStyle}>LIBELLÉ</div>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Ex: Salaire principal" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>CATÉGORIE</div>
              <select value={form.categorie}
                onChange={e => setForm(f => ({ ...f, categorie: e.target.value, sousType: REVENU_SOUS_TYPES[e.target.value][0] }))}
                style={selectStyle}>
                {REVENU_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>TYPE PRÉCIS</div>
              <select value={form.sousType} onChange={e => setForm(f => ({ ...f, sousType: e.target.value }))} style={selectStyle}>
                {(REVENU_SOUS_TYPES[form.categorie] || []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>MONTANT (€)</div>
              <input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>FRÉQUENCE</div>
              <select value={form.frequence} onChange={e => setForm(f => ({ ...f, frequence: e.target.value }))} style={selectStyle}>
                {REVENU_FREQS.map(fr => <option key={fr.id} value={fr.id}>{fr.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 2 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#aaa" }}>
                <input type="checkbox" checked={form.isNet} onChange={e => setForm(f => ({ ...f, isNet: e.target.checked }))}
                  style={{ accentColor: "#00E1DC" }} />
                Montant net (après impôts)
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>NOTES (optionnel)</div>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Ex: CDI, après PAS, revalorisé en mars…" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => save(form)} disabled={!form.label || !form.montant}
              style={{ background: (form.label && form.montant) ? "rgba(0,225,220,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(0,225,220,0.3)", borderRadius: 7, padding: "7px 16px", cursor: (form.label && form.montant) ? "pointer" : "default", color: (form.label && form.montant) ? "#00E1DC" : "#555", fontSize: 12, fontFamily: "inherit" }}>
              {form.id ? "✓ Modifier" : "✓ Ajouter"}
            </button>
            <button onClick={() => setForm(null)}
              style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 14px", cursor: "pointer", color: "#666", fontSize: 12, fontFamily: "inherit" }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {lignes.length === 0 && !form && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
          <div style={{ fontSize: 14, marginBottom: 6, color: "#777" }}>Aucune source de revenu renseignée</div>
          <div style={{ fontSize: 12, color: "#444" }}>Ajoutez vos revenus pour visualiser votre taux d'épargne et le rendement de votre capital</div>
        </div>
      )}

      {/* ── Grouped list ── */}
      {REVENU_CATS.map(cat => {
        const catLignes = lignes.filter(l => l.categorie === cat.id);
        if (catLignes.length === 0) return null;
        const catTotal = catLignes.reduce((s, l) => s + getAnnuel(l), 0);
        return (
          <div key={cat.id} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
              <div style={{ fontSize: 11, color: cat.color, fontWeight: "bold", letterSpacing: "0.05em" }}>{cat.label}</div>
              <div style={{ fontSize: 12, color: cat.color }}>{Math.round(catTotal).toLocaleString("fr-FR")} €/an</div>
            </div>
            {catLignes.map(l => {
              const annuel  = getAnnuel(l);
              const mensuel = annuel / 12;
              const freqLabel = REVENU_FREQS.find(f => f.id === l.frequence)?.label?.toLowerCase() || "";
              return (
                <div key={l.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 3, height: 34, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#F5F7FA", marginBottom: 2 }}>{l.label}</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{l.sousType} · {l.isNet ? "Net" : "Brut"}{l.notes ? " · " + l.notes : ""}</div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 150 }}>
                    <div style={{ fontSize: 13, color: "#F5F7FA" }}>{parseFloat(l.montant).toLocaleString("fr-FR")} € / {freqLabel}</div>
                    {l.frequence !== "annuel" && l.frequence !== "ponctuel" && (
                      <div style={{ fontSize: 10, color: "#666" }}>{Math.round(mensuel).toLocaleString("fr-FR")} €/mois · {Math.round(annuel).toLocaleString("fr-FR")} €/an</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setForm({ ...l })}
                      style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "4px 8px", cursor: "pointer", color: "#888", fontSize: 11, fontFamily: "inherit" }}>✏️</button>
                    <button onClick={() => setLignes(prev => prev.filter(x => x.id !== l.id))}
                      style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "4px 8px", cursor: "pointer", color: "#e05555", fontSize: 11, fontFamily: "inherit" }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
