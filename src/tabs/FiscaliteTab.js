// Fiscalite tab simulation and UI module.

function FiscaliteModule({ immoBiens, peaTotal, ctoTotal, avTotal, reportMode = "advisor", lang = "fr" }) {
  const [config, setConfig] = React.useState(() => {
    try { const s = localStorage.getItem("mpb_fiscal_cfg"); if (s) return JSON.parse(s); } catch {}
    return { tmi: 30, situation: "celibataire", enfants: 0, optionBareme: false };
  });
  const setConf = (k, v) => setConfig(c => { const n = { ...c, [k]: v }; localStorage.setItem("mpb_fiscal_cfg", JSON.stringify(n)); return n; });

  const revenus  = React.useMemo(() => { try { return JSON.parse(localStorage.getItem("mpb_revenus") || "[]"); } catch { return []; } }, []);
  const peaLines = React.useMemo(() => { try { return JSON.parse(localStorage.getItem("pea_lines")   || "[]"); } catch { return []; } }, []);
  const ctoLines = React.useMemo(() => { try { return JSON.parse(localStorage.getItem("cto_lines")   || "[]"); } catch { return []; } }, []);
  const avLines  = React.useMemo(() => { try { return JSON.parse(localStorage.getItem("av_lines")    || "[]"); } catch { return []; } }, []);

  const ann = (l) => { const m = { mensuel:12, trimestriel:4, annuel:1, ponctuel:0 }[l.frequence] || 0; return (parseFloat(l.montant)||0)*m; };
  const t = config.tmi / 100;
  const abattAV = (config.situation === "marie" || config.situation === "pacs") ? 9200 : 4600;
  const enfants = config.enfants || 0;
  const partsBase = (config.situation === "marie" || config.situation === "pacs") ? 2 : 1;
  const partsSup = enfants === 0 ? 0 : enfants === 1 ? 0.5 : enfants === 2 ? 1 : 1 + (enfants - 2);
  const totalParts = partsBase + partsSup;

  // ── Revenus d'activité ──
  const revAct = revenus.filter(r => r.categorie === "salaire").reduce((s,r) => s+ann(r), 0);
  const abPro  = Math.min(14171, Math.max(495, revAct * 0.10));
  const taxAct = Math.max(0, revAct - abPro) * t;

  // ── Retraites ──
  const revRet  = revenus.filter(r => r.categorie === "retraite").reduce((s,r) => s+ann(r), 0);
  const taxRet  = Math.max(0, revRet - Math.min(4321, Math.max(422, revRet*0.10))) * t;

  // ── Dividendes CTO ──
  const divCTO = revenus.filter(r => r.sousType === "Dividendes CTO").reduce((s,r) => s+ann(r), 0);
  const taxDivPFU    = divCTO * 0.30;
  const taxDivBareme = divCTO * 0.60 * t + divCTO * 0.172;
  const taxDivCTO    = (config.optionBareme && taxDivBareme < taxDivPFU) ? taxDivBareme : taxDivPFU;

  // ── Dividendes PEA ──
  const divPEA = revenus.filter(r => r.sousType === "Dividendes PEA").reduce((s,r) => s+ann(r), 0);
  const taxDivPEA = divPEA * 0.172; // PS uniquement après 5 ans

  // ── Loyers nus (micro-foncier 30%) ──
  const loyNus  = revenus.filter(r => r.sousType === "Loyers nus (foncier)").reduce((s,r) => s+ann(r), 0);
  const taxLoyer = loyNus * 0.70 * (t + 0.172);

  // ── LMNP (micro-BIC 50%) ──
  const loyLMNP  = revenus.filter(r => r.sousType === "Loyers meublés (LMNP)").reduce((s,r) => s+ann(r), 0);
  const taxLMNP  = loyLMNP * 0.50 * (t + 0.172);

  // ── Intérêts imposables (hors livrets réglementés) ──
  const exo = ["Livret A","LEP","LDDS"];
  const intImp  = revenus.filter(r => r.categorie === "interets" && !exo.includes(r.sousType)).reduce((s,r) => s+ann(r), 0);
  const taxInt  = intImp * 0.30;

  // ── Plus-values latentes PEA (indicatif) ──
  const pvPEA   = peaLines.reduce((s,l) => s + getLineLatentGain(l), 0);
  const taxPVPEA = pvPEA * 0.172;

  // ── Plus-values latentes CTO (indicatif) ──
  const pvCTO   = ctoLines.reduce((s,l) => s + getLineLatentGain(l), 0);
  const taxPVCTO = pvCTO * 0.30;

  // ── Gains latents AV (indicatif) ──
  const pvAV    = avLines.reduce((s,l) => s + getLineLatentGain(l), 0);
  const taxPVAV = Math.max(0, pvAV - abattAV) * (0.075 + 0.172);

  // ── IFI ──
  const immoVal  = immoBiens.reduce((s,b) => s + getBienValeur(b), 0);
  const immoDet  = immoBiens.reduce((s,b) => s + getBienDetteRestante(b), 0);
  const immoBase = Math.max(0, immoVal - immoDet);
  let ifi = 0;
  if (immoBase > 1300000) {
    if      (immoBase <= 2570000)  ifi = 2500  + (immoBase-1300000)*0.007;
    else if (immoBase <= 5000000)  ifi = 11390 + (immoBase-2570000)*0.010;
    else if (immoBase <= 10000000) ifi = 35690 + (immoBase-5000000)*0.0125;
    else                           ifi = 98190 + (immoBase-10000000)*0.015;
    ifi += (Math.min(immoBase,1300000) - 800000) * 0.005;
  }

  // ── Totaux ──
  const totalRevenus = revenus.reduce((s,r) => s+ann(r), 0);
  const taxCourante  = taxAct + taxRet + taxDivCTO + taxDivPEA + taxLoyer + taxLMNP + taxInt + ifi;
  const taxLatente   = taxPVPEA + taxPVCTO + taxPVAV;
  const tauxPression = totalRevenus > 0 ? (taxCourante / totalRevenus) * 100 : 0;
  const fiscalAdvisorOpportunities = buildFiscalAdvisorOpportunities({ immoBiens, peaTotal, ctoTotal, avTotal }, lang);

  const fmt = (n) => Math.round(n).toLocaleString("fr-FR");
  const pct = (n) => n.toFixed(1) + "%";

  const ROW = ({ label, base, taux, tax, color, note, bold }) => tax <= 0 ? null : (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width:3, alignSelf:"stretch", borderRadius:2, background: color, flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, color: bold ? "#F5F7FA" : "#ccc", fontWeight: bold ? "bold" : "normal" }}>{label}</div>
        {note && <div style={{ fontSize:10, color:"#555", marginTop:1 }}>{note}</div>}
      </div>
      {base > 0 && <div style={{ fontSize:11, color:"#666", minWidth:100, textAlign:"right" }}>{fmt(base)} € de base</div>}
      <div style={{ fontSize:11, color:"#888", minWidth:70, textAlign:"right" }}>{taux}</div>
      <div style={{ fontSize:13, color: color, fontWeight:"bold", minWidth:90, textAlign:"right" }}>{fmt(tax)} €</div>
    </div>
  );

  return (
    <div style={{ padding:"20px 24px", maxWidth:920, margin:"0 auto" }}>

      {/* ── Config ── */}
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(0,225,220,0.2)", borderRadius:10, padding:"16px 20px", marginBottom:20, display:"flex", gap:24, flexWrap:"wrap", alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:10, color:"#888", marginBottom:5, letterSpacing:"0.06em" }}>TRANCHE MARGINALE D'IMPOSITION</div>
          <div style={{ display:"flex", gap:6 }}>
            {[0,11,30,41,45].map(v => (
              <button key={v} onClick={() => setConf("tmi", v)}
                style={{ padding:"5px 12px", borderRadius:6, border: config.tmi===v ? "1px solid #00E1DC" : "1px solid rgba(255,255,255,0.1)", background: config.tmi===v ? "rgba(0,225,220,0.15)" : "none", color: config.tmi===v ? "#00E1DC" : "#666", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                {v}%
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize:10, color:"#888", marginBottom:5, letterSpacing:"0.06em" }}>SITUATION</div>
          <div style={{ display:"flex", gap:6 }}>
            {[["celibataire","Célibataire"],["marie","Marié·e / Pacsé·e"]].map(([v,l]) => (
              <button key={v} onClick={() => setConf("situation", v)}
                style={{ padding:"5px 12px", borderRadius:6, border: config.situation===v ? "1px solid #00E1DC" : "1px solid rgba(255,255,255,0.1)", background: config.situation===v ? "rgba(0,225,220,0.15)" : "none", color: config.situation===v ? "#00E1DC" : "#666", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize:10, color:"#888", marginBottom:5, letterSpacing:"0.06em" }}>ENFANTS À CHARGE</div>
          <div style={{ display:"flex", gap:6 }}>
            {[0,1,2,3,4,5].map(v => (
              <button key={v} onClick={() => setConf("enfants", v)}
                style={{ padding:"5px 10px", borderRadius:6, border: config.enfants===v ? "1px solid #00E1DC" : "1px solid rgba(255,255,255,0.1)", background: config.enfants===v ? "rgba(0,225,220,0.15)" : "none", color: config.enfants===v ? "#00E1DC" : "#666", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                {v === 5 ? "5+" : v}
              </button>
            ))}
          </div>
          <div style={{ fontSize:10, color:"#555", marginTop:5 }}>Quotient familial : <strong style={{ color:"#888" }}>{totalParts} parts</strong></div>
        </div>
        <div>
          <div style={{ fontSize:10, color:"#888", marginBottom:5, letterSpacing:"0.06em" }}>OPTION BARÈME (CTO)</div>
          <button onClick={() => setConf("optionBareme", !config.optionBareme)}
            style={{ padding:"5px 12px", borderRadius:6, border: config.optionBareme ? "1px solid #4a9e6b" : "1px solid rgba(255,255,255,0.1)", background: config.optionBareme ? "rgba(74,158,107,0.15)" : "none", color: config.optionBareme ? "#4a9e6b" : "#666", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            {config.optionBareme ? "✓ Activée" : "Désactivée"}
          </button>
        </div>
        <div style={{ marginLeft:"auto", textAlign:"right" }}>
          <div style={{ fontSize:9, color:"#555", letterSpacing:"0.06em" }}>PRESSION FISCALE ESTIMÉE</div>
          <div style={{ fontSize:22, fontWeight:"bold", color: tauxPression > 35 ? "#e05555" : tauxPression > 20 ? "#00E1DC" : "#4a9e6b" }}>{pct(tauxPression)}</div>
          <div style={{ fontSize:10, color:"#555" }}>sur revenus déclarés</div>
        </div>
      </div>

      {reportMode === "advisor" && (
        <AdvisorOpportunityPanel opportunities={fiscalAdvisorOpportunities} lang={lang} />
      )}

      {/* ── Stats résumé ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"IMPÔTS ANNUELS COURANTS",  value: fmt(taxCourante)+" €",  color:"#e05555" },
          { label:"FISCALITÉ LATENTE",         value: fmt(taxLatente)+" €",   color:"#00E1DC", sub:"si tout réalisé aujourd'hui" },
          { label:"IFI ESTIMÉ",                value: fmt(ifi)+" €",          color: ifi>0 ? "#e8a055" : "#444", sub: ifi>0 ? "patrimoine immo > 1,3 M€" : "Non applicable" },
          { label:"TOTAL + LATENT",            value: fmt(taxCourante+taxLatente)+" €", color:"#9a8ec9" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(0,225,220,0.1)", borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:9, color:"#666", letterSpacing:"0.08em", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:17, fontWeight:"bold", color:s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize:9, color:"#555", marginTop:3 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Fiscalité courante ── */}
      {taxCourante > 0 && (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, marginBottom:16, overflow:"hidden" }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:11, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em" }}>📋 FISCALITÉ COURANTE — REVENUS DÉCLARÉS</div>
            <div style={{ fontSize:13, color:"#e05555", fontWeight:"bold" }}>{fmt(taxCourante)} € / an</div>
          </div>
          <ROW label="Revenus d'activité (salaires, freelance…)" base={Math.max(0,revAct-abPro)} taux={"TMI "+config.tmi+"%"} tax={taxAct} color="#4a9e6b" note={"Abattement forfaitaire 10% appliqué · Base imposable "+fmt(Math.max(0,revAct-abPro))+" €"} />
          <ROW label="Retraites & pensions" base={Math.max(0,revRet-Math.min(4321,Math.max(422,revRet*0.10)))} taux={"TMI "+config.tmi+"%"} tax={taxRet} color="#8b9e4a" note="Abattement 10% (422€ min · 4 321€ max)" />
          <ROW label="Dividendes CTO" base={divCTO} taux={config.optionBareme && taxDivBareme < taxDivPFU ? "Barème (abatt. 40%)" : "PFU 30%"} tax={taxDivCTO} color="#a8c4e8" note={config.optionBareme ? "Option barème : "+fmt(divCTO)+" × 60% × TMI + 17,2% PS" : "Flat tax 12,8% IR + 17,2% PS"} />
          <ROW label="Dividendes PEA (après 5 ans)" base={divPEA} taux="PS 17,2%" tax={taxDivPEA} color="#4a9e6b" note="Exonération IR après 5 ans — prélèvements sociaux uniquement" />
          <ROW label="Loyers nus — micro-foncier" base={loyNus*0.70} taux={"TMI "+config.tmi+"% + 17,2% PS"} tax={taxLoyer} color="#a0c4ff" note="Abattement forfaitaire 30% (micro-foncier)" />
          <ROW label="Loyers meublés — micro-BIC (LMNP)" base={loyLMNP*0.50} taux={"TMI "+config.tmi+"% + 17,2% PS"} tax={taxLMNP} color="#a0c4ff" note="Abattement forfaitaire 50% (micro-BIC)" />
          <ROW label="Intérêts imposables (hors livrets réglementés)" base={intImp} taux="PFU 30%" tax={taxInt} color="#7a9ec9" note="Livret A, LEP, LDDS exonérés — reste soumis au PFU" />
          {ifi > 0 && <ROW label="IFI — Impôt sur la Fortune Immobilière" base={immoBase} taux="Barème IFI" tax={ifi} color="#e8a055" note={"Patrimoine immobilier imposable : "+fmt(immoBase)+" € (déduction dettes estimée)"} bold />}
        </div>
      )}

      {/* ── Fiscalité latente ── */}
      {taxLatente > 0 && (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, marginBottom:16, overflow:"hidden" }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:11, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em" }}>📊 FISCALITÉ LATENTE — SI CESSION TOTALE AUJOURD'HUI</div>
            <div style={{ fontSize:13, color:"#00E1DC", fontWeight:"bold" }}>{fmt(taxLatente)} €</div>
          </div>
          <ROW label="Plus-values PEA (latentes)" base={pvPEA} taux="PS 17,2% seulement" tax={taxPVPEA} color="#4a9e6b" note={"Plus-value non réalisée : "+fmt(pvPEA)+" € · Exonération IR après 5 ans PEA"} />
          <ROW label="Plus-values CTO (latentes)" base={pvCTO} taux="PFU 30%" tax={taxPVCTO} color="#a8c4e8" note={"Plus-value non réalisée : "+fmt(pvCTO)+" €"} />
          <ROW label="Gains AV (latents)" base={Math.max(0,pvAV-abattAV)} taux="7,5% IR + 17,2% PS" tax={taxPVAV} color="#7a9ec9" note={"Gain brut "+fmt(pvAV)+" € · Abattement annuel "+fmt(abattAV)+" € · Base imposable "+fmt(Math.max(0,pvAV-abattAV))+" €"} />
        </div>
      )}

      {/* ── Empty state ── */}
      {taxCourante === 0 && taxLatente === 0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#555" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🧾</div>
          <div style={{ fontSize:14, color:"#777", marginBottom:6 }}>Aucune donnée à calculer</div>
          <div style={{ fontSize:12, color:"#444" }}>Renseignez vos revenus dans l'onglet Revenus et vos portefeuilles dans PEA / CTO / AV pour voir votre simulation fiscale</div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(255,255,255,0.015)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:8, fontSize:10, color:"#444", lineHeight:1.6 }}>
        ⚠️ <strong style={{ color:"#555" }}>Simulation indicative uniquement.</strong> Ces calculs sont des estimations basées sur les règles fiscales françaises générales (micro-foncier, micro-BIC, PFU, barème 2025). Ils ne tiennent pas compte de votre situation personnelle complète, des niches fiscales, des déficits reportables, de la CSG déductible, du mécanisme du quotient familial, ni des éventuels dispositifs de défiscalisation. Consultez un expert-comptable ou un conseiller fiscal pour votre situation réelle.
      </div>

    </div>
  );
}
