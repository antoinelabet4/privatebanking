// Application shell, header actions, navigation, and tab composition.

function PEAAgent() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("pea_apikey") || "");
  const [activeModule, setActiveModule] = useState(() => localStorage.getItem("mpb_module") || "pea");
  const [lang, setLang] = useState(() => localStorage.getItem("mpb_lang") || "fr");
  const [reportMode, setReportMode] = useState(() => localStorage.getItem("mpb_report_mode") || "advisor");
  const [confirmReset, setConfirmReset] = useState(false);
  // Calcule le total d'un portefeuille depuis localStorage sans monter le composant.
  // Compatible PEA / CTO / Assurance Vie, y compris les lignes « en attente » issues d'une allocation.
  const calcTotalFromStorage = (key) => {
    try {
      const lines = JSON.parse(localStorage.getItem(key) || "[]");
      return calcPortfolioTotalFromLines(lines);
    } catch { return 0; }
  };
  const [peaTotal, setPeaTotal] = useState(() => calcTotalFromStorage("pea_lines"));
  const [ctoTotal, setCtoTotal] = useState(() => calcTotalFromStorage("cto_lines"));
  const [avTotal, setAvTotal] = useState(() => calcTotalFromStorage("av_lines"));
  const [privateTotal, setPrivateTotal] = useState(() => calcPrivateMetrics(readJson("private_markets", [])).value);
  const [revenusAnnuels, setRevenusAnnuels] = useState(() => {
    try {
      const lignes = JSON.parse(localStorage.getItem("mpb_revenus") || "[]");
      const MULT = { mensuel: 12, trimestriel: 4, annuel: 1, ponctuel: 0 };
      return lignes.reduce((s, l) => s + parseFloat(l.montant||0) * (MULT[l.frequence] ?? 1), 0);
    } catch { return 0; }
  });

  // Immobilier state (remonté pour totalisation dans le header)
  const [immoBiens, setImmoBiens] = useState(() => {
    try { const s = localStorage.getItem("mpb_biens"); if (s !== null) { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } } catch {}
    return [];
  });
  useEffect(() => { localStorage.setItem("mpb_biens", JSON.stringify(immoBiens)); }, [immoBiens]);

  // Calcul patrimoine immobilier net
  const immoValeur = immoBiens.reduce((s, b) => s + getBienValeur(b), 0);
  const immoDettes = immoBiens.reduce((s, b) => s + getBienDetteRestante(b), 0);
  const immoCapNet = immoValeur - immoDettes;
  const totalPatrimoine = peaTotal + ctoTotal + avTotal + immoCapNet + privateTotal;

  function saveApiKey(key) {
    localStorage.setItem("pea_apikey", key);
    setApiKey(key);
  }

  if (!apiKey) return <ApiKeySetup onSave={saveApiKey} />;

  return (
	    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a0f 0%,#0d1117 40%,#0a0f0a 100%)", fontFamily: SIA_FONT_STACK, color: "#F5F7FA" }}>
      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .cursor{display:inline-block;width:2px;height:1em;background:#00E1DC;margin-left:2px;vertical-align:middle;animation:blink 0.8s infinite}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .msg-in{animation:fadeIn 0.3s ease}
        textarea,input,select{outline:none}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#00E1DC44;border-radius:2px}
        table{border-collapse:collapse;width:100%}
        th{font-size:10px;letter-spacing:0.1em;color:#888;text-transform:uppercase;padding:8px 10px;text-align:right;border-bottom:1px solid rgba(0,225,220,0.15);white-space:nowrap}
        th:first-child,th:nth-child(2){text-align:left}
        td{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right;font-size:13px;vertical-align:middle}
        td:first-child,td:nth-child(2){text-align:left}
	        tr:hover td{background:rgba(0,225,220,0.04)}
	        button:focus{outline:none}
	        @media print{
	          @page{size:A4 landscape;margin:10mm}
	          body{background:#0a0a0f!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
	          button,textarea,input,select{display:none!important}
	          .client-report{break-inside:avoid;page-break-inside:avoid}
	        }
	      `}</style>

      {/* ── HEADER ── */}
	      <div style={{ borderBottom: "1px solid rgba(0,225,220,0.2)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
	        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 360 }}>
	          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2px 0" }}><SiaLogo size="header" /></div>
	          <div>
	            <div style={{ fontWeight: "bold", fontSize: 16, letterSpacing: "0.05em", color: "#00E1DC" }}>SIA PRIVATE BANKING AGENT</div>
	            <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em" }}>{tr(lang, "headerSubtitle")}</div>
	          </div>
	        </div>
	        <div style={{ flex: 1, display:"flex", justifyContent:"center", minWidth: 260 }}>
	          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:12, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(0,225,220,0.16)", boxShadow:"0 0 24px rgba(0,225,220,0.04)" }}>
	            <div style={{ display:"flex", gap:5, alignItems:"center" }} title={lang === "en" ? "Change language" : "Changer de langue"}>
	              {[["fr","🇫🇷"],["en","🇬🇧"]].map(([code,flag]) => (
	                <button key={code} onClick={() => { setLang(code); localStorage.setItem("mpb_lang", code); }}
	                  style={{ width:30, height:30, borderRadius:8, border: lang === code ? "1px solid rgba(0,225,220,0.6)" : "1px solid rgba(255,255,255,0.08)", background: lang === code ? "rgba(0,225,220,0.14)" : "rgba(255,255,255,0.03)", cursor:"pointer", fontSize:16, lineHeight:"28px" }}>
	                  {flag}
	                </button>
	              ))}
	            </div>
	            <div style={{ width:1, height:28, background:"rgba(255,255,255,0.08)" }} />
	            {["advisor","client"].map(m => (
	              <button key={m} onClick={() => { setReportMode(m); localStorage.setItem("mpb_report_mode", m); }}
	                title={m === "advisor" ? tr(lang, "advisorModeHelp") : tr(lang, "clientModeHelp")}
	                style={{ background: reportMode === m ? "rgba(0,225,220,0.16)" : "rgba(255,255,255,0.03)", border: reportMode === m ? "1px solid rgba(0,225,220,0.45)" : "1px solid rgba(255,255,255,0.08)", borderRadius:8, color: reportMode === m ? "#00E1DC" : "#777", padding:"7px 11px", fontSize:11, cursor:"pointer", fontFamily:"inherit", minWidth:94, lineHeight:1.15 }}>
	                {m === "advisor" ? tr(lang, "advisorMode") : tr(lang, "clientMode")}
	              </button>
	            ))}
	            <InfoTip text={reportMode === "advisor" ? tr(lang, "advisorModeHelp") : tr(lang, "clientModeHelp")} />
	          </div>
	        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {totalPatrimoine > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em", marginBottom: 2 }}>PATRIMOINE TOTAL</div>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#00E1DC" }}>{Math.round(totalPatrimoine).toLocaleString('fr-FR')} €</div>
              <div style={{ fontSize: 11, color: "#666", display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 2 }}>
                {peaTotal > 0 && <span style={{ color: "#4a9e6b" }}>📈 PEA {Math.round(peaTotal).toLocaleString('fr-FR')} €</span>}
                {ctoTotal > 0 && <span style={{ color: "#a8c4e8" }}>💼 CTO {Math.round(ctoTotal).toLocaleString('fr-FR')} €</span>}
                {avTotal > 0 && <span style={{ color: "#7a9ec9" }}>🛡️ AV {Math.round(avTotal).toLocaleString('fr-FR')} €</span>}
                {immoCapNet > 0 && <span style={{ color: "#a0c4ff" }}>🏠 {Math.round(immoCapNet).toLocaleString('fr-FR')} €</span>}
	                {privateTotal > 0 && <span style={{ color: "#9a8ec9" }}>◆ {tr(lang, "privateLabel")} {Math.round(privateTotal).toLocaleString('fr-FR')} €</span>}
                {revenusAnnuels > 0 && <span style={{ color: "#4a9e6b" }}>💰 {Math.round(revenusAnnuels).toLocaleString('fr-FR')} €/an</span>}
              </div>
            </div>
          )}
          {confirmReset ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#00E1DC" }}>Tout réinitialiser ?</span>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }}
                style={{ background: "#e05555", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#fff", fontSize: 12, fontFamily: "inherit" }}>
                Oui
              </button>
              <button onClick={() => setConfirmReset(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#aaa", fontSize: 12, fontFamily: "inherit" }}>
                Non
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} title="Réinitialiser toutes les données"
              style={{ background: "rgba(0,225,220,0.1)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#888", fontSize: 14, fontFamily: "inherit" }}>
              🗑️
            </button>
          )}
          {/* Export données */}
          <button title="Exporter toutes mes données (sauvegarde JSON)"
            onClick={() => {
              const KEYS = ["pea_lines","pea_messages","pea_perfHistory","cto_lines","cto_messages","cto_perfHistory","av_lines","av_messages","av_perfHistory","mpb_biens","mpb_revenus","mpb_revenus_dismissed","mpb_snapshots","private_markets","mpb_report_mode","mpb_lang"];
              const data = { _version: "1.0", _date: new Date().toISOString() };
              KEYS.forEach(k => { const v = localStorage.getItem(k); if (v) { try { data[k] = JSON.parse(v); } catch {} } });
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url;
              a.download = `my-private-bank-${new Date().toISOString().slice(0,10)}.json`;
              a.click(); URL.revokeObjectURL(url);
            }}
            style={{ background: "rgba(74,158,107,0.15)", border: "1px solid rgba(74,158,107,0.35)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#4a9e6b", fontSize: 14, fontFamily: "inherit" }}>
            💾
          </button>
          {/* Import données */}
          <button title="Importer une sauvegarde JSON"
            onClick={() => {
              const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
              input.onchange = (e) => {
                const file = e.target.files[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const data = JSON.parse(ev.target.result);
                    const { _version, _date, ...keys } = data;
                    if (!window.confirm(`Importer la sauvegarde du ${_date ? new Date(_date).toLocaleDateString('fr-FR') : "?"} ? Vos données actuelles seront remplacées.`)) return;
                    Object.entries(keys).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
                    window.location.reload();
                  } catch(err) { alert("Fichier invalide : " + err.message); }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            style={{ background: "rgba(106,142,201,0.15)", border: "1px solid rgba(106,142,201,0.35)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#6a8ec9", fontSize: 14, fontFamily: "inherit" }}>
            📂
          </button>
          <button
            onClick={() => { if (window.confirm("Réinitialiser la clé API ?")) { localStorage.removeItem("pea_apikey"); setApiKey(""); } }}
            title="Changer de clé API"
            style={{ background: "rgba(0,225,220,0.1)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#888", fontSize: 14, fontFamily: "inherit" }}>
            🔑
          </button>
        </div>
      </div>

      {/* ── MODULE NAVIGATION ── */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(0,225,220,0.25)", padding: "0 20px", background: "rgba(0,0,0,0.35)", gap: 2 }}>
        {[
          { id: "dashboard", label: "📊 " + tr(lang, "dashboard"),      soon: false },
          { id: "pea",       label: "📈 PEA",            soon: false },
          { id: "immo", label: "🏠 Immobilier",       soon: false },
          { id: "av",   label: "🛡️ Assurance Vie",    soon: false },
	          { id: "cto",  label: "💼 CTO",              soon: false },
	          { id: "private", label: "◆ " + tr(lang, "privateMarkets"),  soon: false },
	          { id: "revenus", label: "💰 Revenus",           soon: false },
          { id: "fiscal",  label: "🧾 Fiscalité",         soon: false },
        ].map(m => (
          <button key={m.id} onClick={() => { if (!m.soon) { setActiveModule(m.id); localStorage.setItem("mpb_module", m.id); } }}
            style={{ background: "none", border: "none", cursor: m.soon ? "default" : "pointer", padding: "9px 16px", fontSize: 12, color: activeModule === m.id ? "#00E1DC" : m.soon ? "#3a3a4a" : "#666", borderBottom: activeModule === m.id ? "2px solid #00E1DC" : "2px solid transparent", fontFamily: "inherit", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 5, transition: "color 0.2s" }}>
            {m.label}
            {m.soon && <span style={{ fontSize: 8, color: "#444", background: "rgba(255,255,255,0.04)", padding: "1px 4px", borderRadius: 3, letterSpacing: "0.05em" }}>bientôt</span>}
          </button>
        ))}
      </div>

      {/* ── MODULES ── */}
	      {activeModule === "dashboard" && <DashboardModule peaTotal={peaTotal} ctoTotal={ctoTotal} avTotal={avTotal} immoCapNet={immoCapNet} privateTotal={privateTotal} totalPatrimoine={totalPatrimoine} revenusAnnuels={revenusAnnuels} immoBiens={immoBiens} apiKey={apiKey} lang={lang} reportMode={reportMode} />}
      {activeModule === "pea"  && <PeaTab apiKey={apiKey} onTotalChange={setPeaTotal} reportMode={reportMode} lang={lang} />}
      {activeModule === "cto"  && <CtoTab apiKey={apiKey} onTotalChange={setCtoTotal} reportMode={reportMode} lang={lang} />}
	      {activeModule === "av"   && <AssuranceVieTab apiKey={apiKey} onTotalChange={setAvTotal} reportMode={reportMode} lang={lang} />}
	      {activeModule === "immo"    && <ImmoModule biens={immoBiens} setBiens={setImmoBiens} reportMode={reportMode} lang={lang} />}
	      {activeModule === "private" && <PrivateMarketsModule onTotalChange={setPrivateTotal} lang={lang} reportMode={reportMode} />}
	      {activeModule === "revenus" && <RevenusModule patrimoine={totalPatrimoine} onTotalChange={setRevenusAnnuels} immoBiens={immoBiens} reportMode={reportMode} lang={lang} />}
      {activeModule === "fiscal"  && <FiscaliteModule immoBiens={immoBiens} peaTotal={peaTotal} ctoTotal={ctoTotal} avTotal={avTotal} reportMode={reportMode} lang={lang} />}
    </div>
  );
}
