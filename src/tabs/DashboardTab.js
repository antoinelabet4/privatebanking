// Consolidated dashboard and client report view.

function DashboardModule({ peaTotal, ctoTotal, avTotal, immoCapNet, privateTotal, totalPatrimoine, revenusAnnuels, immoBiens, apiKey, lang = "fr", reportMode = "advisor" }) {
  const [analysis, setAnalysis] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [snapshots, setSnapshots] = React.useState(function() {
    try { return JSON.parse(localStorage.getItem("mpb_snapshots") || "[]"); } catch { return []; }
  });

  React.useEffect(function() {
    if (totalPatrimoine <= 0) return;
    var today = new Date().toISOString().split("T")[0];
    var existing = snapshots.find(function(s){ return s.date === today; });
    if (!existing) {
      var newSnap = { date: today, pea: peaTotal, cto: ctoTotal, av: avTotal, immo: immoCapNet, private: privateTotal, total: totalPatrimoine };
      var updated = snapshots.slice(-364).concat([newSnap]);
      localStorage.setItem("mpb_snapshots", JSON.stringify(updated));
      setSnapshots(updated);
    }
  }, [totalPatrimoine]);

  var peaLines = React.useMemo(function(){ try { return JSON.parse(localStorage.getItem("pea_lines")||"[]"); } catch { return []; } }, []);
  var ctoLines = React.useMemo(function(){ try { return JSON.parse(localStorage.getItem("cto_lines")||"[]"); } catch { return []; } }, []);
  var avLines  = React.useMemo(function(){ try { return JSON.parse(localStorage.getItem("av_lines") ||"[]"); } catch { return []; } }, []);
  var revenus  = React.useMemo(function(){ try { return JSON.parse(localStorage.getItem("mpb_revenus")||"[]"); } catch { return []; } }, []);
  var privateItems = React.useMemo(function(){ return readJson("private_markets", []); }, []);
  var privateMetrics = calcPrivateMetrics(privateItems);
  var allLines = peaLines.map(l => ({...l, wrapper:"PEA"})).concat(ctoLines.map(l => ({...l, wrapper:"CTO"}))).concat(avLines.map(l => ({...l, wrapper:"AV"})));

  var modules = [
    { id:"pea",  label:"PEA",         value: peaTotal,   color:"#4a9e6b" },
    { id:"cto",  label:"CTO",         value: ctoTotal,   color:"#a8c4e8" },
    { id:"av",   label:"AV",          value: avTotal,    color:"#7a9ec9" },
    { id:"immo", label:"Immobilier",  value: immoCapNet, color:"#a0c4ff" },
	    { id:"private", label:tr(lang, "privateLabel"), value: privateTotal, color:"#9a8ec9" },
  ].filter(function(m){ return m.value > 0; });

  var catMap = {};
  allLines.forEach(function(l) {
    var v = getLineCurrentValue(l);
    if (!catMap[l.categorie]) catMap[l.categorie] = { value:0, color: CAT_COLORS[l.categorie] || "#888" };
    catMap[l.categorie].value += v;
  });
  if (immoCapNet > 0) catMap["Immobilier"] = { value: immoCapNet, color: "#a0c4ff" };
  if (privateTotal > 0) catMap["Private Markets"] = { value: privateTotal, color: "#9a8ec9" };
  var cats = Object.keys(catMap).map(function(k){ return { id:k, label:k, value:catMap[k].value, color:catMap[k].color }; }).filter(function(c){ return c.value > 0; }).sort(function(a,b){ return b.value-a.value; });
  var assetClassMap = {};
  allLines.forEach(function(l) {
    var v = getLineCurrentValue(l), cat = String(l.categorie || "");
	    var label = cat === "Cash" || l.ticker === "CASH" ? tr(lang, "cash") : (l.wrapper === "AV" ? tr(lang, "insuranceWrappers") : tr(lang, "listedEquities"));
	    addAgg(assetClassMap, label, v, label === tr(lang, "cash") ? "#8b9e4a" : label === tr(lang, "insuranceWrappers") ? "#7a9ec9" : "#4a9e6b");
	  });
	  addAgg(assetClassMap, tr(lang, "realEstate"), immoCapNet, "#a0c4ff");
	  addAgg(assetClassMap, tr(lang, "privateAssets"), privateTotal, "#9a8ec9");
  var assetClasses = toSeries(assetClassMap);
  var incomeGeneratingAssets = allLines.filter(function(l){ return /dividend|dividendes|fonds euros|coupon|oblig/i.test(String(l.categorie)+" "+String(l.nom)); }).reduce(function(s,l){ return s + getLineCurrentValue(l); }, 0) + immoBiens.filter(function(b){ return safeNum(b.loyerMensuelHC) > 0; }).reduce(function(s,b){ return s + Math.max(0, getBienValeur(b) - getBienDetteRestante(b)); }, 0) + privateItems.filter(function(i){ return safeNum(i.distributions) > 0; }).reduce(function(s,i){ return s + safeNum(i.nav); }, 0);
  var exposureMaps = { geography:{}, sector:{}, currency:{} };
  allLines.forEach(function(l) {
    var v = getLineCurrentValue(l);
    var intel = getLineIntelligence(l, l.wrapper === "PEA" ? "pea" : l.wrapper === "CTO" ? "cto" : "av");
    addAgg(exposureMaps.geography, intel.geography, v, "#00E1DC");
    addAgg(exposureMaps.sector, intel.sector, v, "#7a9ec9");
    addAgg(exposureMaps.currency, intel.currency, v, "#4a9e6b");
  });
  if (immoCapNet > 0) { addAgg(exposureMaps.geography, "France", immoCapNet, "#a0c4ff"); addAgg(exposureMaps.sector, "Real estate", immoCapNet, "#a0c4ff"); addAgg(exposureMaps.currency, "EUR", immoCapNet, "#4a9e6b"); }
  privateItems.forEach(function(i) {
    var v = safeNum(i.nav);
    addAgg(exposureMaps.geography, i.geography || "Private", v, "#9a8ec9");
    addAgg(exposureMaps.sector, i.sector || i.type || "Private assets", v, "#9a8ec9");
    addAgg(exposureMaps.currency, i.currency || "EUR", v, "#9a8ec9");
  });
	  var exposure = { geography: toSeries(exposureMaps.geography), sector: toSeries(exposureMaps.sector), currency: toSeries(exposureMaps.currency) };
	  var story = buildPerformanceStory(allLines, exposure, privateMetrics, totalPatrimoine, lang);

  var liquidPct    = totalPatrimoine > 0 ? ((peaTotal+ctoTotal+avTotal)/totalPatrimoine)*100 : 0;
  var immoPct      = totalPatrimoine > 0 ? (immoCapNet/totalPatrimoine)*100 : 0;
  var immoDettes   = immoBiens.reduce(function(s,b){ return s + getBienDetteRestante(b); }, 0);
  var immoValBrut  = immoBiens.reduce(function(s,b){ return s + getBienValeur(b); }, 0);
  var leverRatio   = immoValBrut > 0 ? (immoDettes/immoValBrut)*100 : 0;
  var yieldRate    = totalPatrimoine > 0 ? (revenusAnnuels/totalPatrimoine)*100 : 0;
  var peaPct       = totalPatrimoine > 0 ? (peaTotal/totalPatrimoine)*100 : 0;

  var risks = [];
  var strengths = [];
  if (immoPct > 65) risks.push({ icon:"🏠", title:"Surexposition immobilière", desc:""+immoPct.toFixed(0)+"% du patrimoine en immo réduit la liquidité. Objectif conseillé < 60%." });
  if (liquidPct < 25) risks.push({ icon:"💧", title:"Faible liquidité", desc:"Seulement "+liquidPct.toFixed(0)+"% d'actifs mobilisables rapidement (PEA+CTO+AV)." });
  if (leverRatio > 75) risks.push({ icon:"⚠️", title:"Effet de levier élevé", desc:""+leverRatio.toFixed(0)+"% de dette sur la valeur immobilière brute. Risque en cas de hausse des taux." });
  if (peaLines.length === 1 || ctoLines.length === 1) risks.push({ icon:"🎯", title:"Concentration de portefeuille", desc:"Peu de lignes dans le portefeuille. Diversification insuffisante." });
  var etfPct = totalPatrimoine > 0 ? (peaLines.concat(ctoLines).filter(function(l){ return l.categorie && l.categorie.startsWith("ETF"); }).reduce(function(s,l){ return s+getLineCurrentValue(l); }, 0) / totalPatrimoine) * 100 : 0;
  if (etfPct < 20 && totalPatrimoine > 50000) risks.push({ icon:"📉", title:"Sous-exposition ETF", desc:""+etfPct.toFixed(0)+"% en ETF indiciels. Les ETF réduisent les frais et le risque idiosyncratique." });
  if ((exposure.currency.find(x => x.label === "USD")?.value || 0) / Math.max(totalPatrimoine, 1) > 0.45) risks.push({ icon:"$", title:"Concentration USD élevée", desc:"Plus de 45% du patrimoine est exposé au dollar. Vérifiez l'adéquation avec les dépenses futures." });
  if ((exposure.sector[0]?.value || 0) / Math.max(totalPatrimoine, 1) > 0.45) risks.push({ icon:"◆", title:"Concentration sectorielle", desc:""+exposure.sector[0].label+" pèse "+safePct(exposure.sector[0].value,totalPatrimoine).toFixed(0)+"% du patrimoine consolidé." });

  if (peaTotal > 0)    strengths.push({ icon:"🛡️", title:"Enveloppe PEA optimisée", desc:"Exonération IR après 5 ans. Idéal pour les ETF monde à long terme." });
  if (avTotal > 0)     strengths.push({ icon:"🏆", title:"AV : avantage successoral", desc:"Abattement 152 500€/bénéficiaire sur les primes versées avant 70 ans." });
  if (liquidPct > 50)  strengths.push({ icon:"💧", title:"Bonne liquidité", desc:""+liquidPct.toFixed(0)+"% d'actifs liquides. Capacité à saisir des opportunités ou faire face aux imprévus." });
  if (leverRatio > 10 && leverRatio < 60) strengths.push({ icon:"🏗️", title:"Effet de levier immobilier sain", desc:""+leverRatio.toFixed(0)+"% de dette — levier positif si le taux d'emprunt < rendement locatif." });
	  if (yieldRate > 2)   strengths.push({ icon:"💰", title:"Patrimoine rentable", desc:"Taux de rendement global de "+yieldRate.toFixed(2)+"% — les revenus couvrent une partie de vos dépenses." });
	  var advisorOpportunities = buildAdvisorOpportunities(risks, exposure, modules, totalPatrimoine, lang)
	    .concat(buildPortfolioAdvisorOpportunities("pea", peaLines.map(l => ({ ...l, val:getLineCurrentValue(l), intelligence:getLineIntelligence(l, "pea") })), peaTotal, lang))
	    .concat(buildPortfolioAdvisorOpportunities("cto", ctoLines.map(l => ({ ...l, val:getLineCurrentValue(l), intelligence:getLineIntelligence(l, "cto") })), ctoTotal, lang))
	    .concat(buildPortfolioAdvisorOpportunities("av", avLines.map(l => ({ ...l, val:getLineCurrentValue(l), intelligence:getLineIntelligence(l, "av") })), avTotal, lang))
	    .concat(buildImmoAdvisorOpportunities(immoBiens, immoCapNet, lang))
	    .concat(buildPrivateAdvisorOpportunities(privateItems, privateMetrics, lang))
	    .concat(buildIncomeAdvisorOpportunities(revenus, totalPatrimoine, lang))
	    .concat(buildFiscalAdvisorOpportunities({ immoBiens, peaTotal, ctoTotal, avTotal }, lang))
	    .slice(0, 8);

  var fmt = function(n){ return Math.round(n).toLocaleString("fr-FR"); };

  async function generateAnalysis() {
    setAnalyzing(true);
    setAnalysis("");
    var allLines = peaLines.concat(ctoLines).concat(avLines);
    var topHoldings = allLines.sort(function(a,b){ return getLineCurrentValue(b) - getLineCurrentValue(a); }).slice(0,8).map(function(l){ return l.nom + " (" + l.categorie + ") " + fmt(getLineCurrentValue(l)) + "€"; }).join(", ");
    var revAnn = function(l){ var m={mensuel:12,trimestriel:4,annuel:1,ponctuel:0}[l.frequence]||0; return (parseFloat(l.montant)||0)*m; };
    var summary = "PATRIMOINE: " + fmt(totalPatrimoine) + "€ total" +
      "\n- PEA " + fmt(peaTotal) + "€ (" + (totalPatrimoine>0?((peaTotal/totalPatrimoine)*100).toFixed(1):0) + "%)" +
      "\n- CTO " + fmt(ctoTotal) + "€ (" + (totalPatrimoine>0?((ctoTotal/totalPatrimoine)*100).toFixed(1):0) + "%)" +
      "\n- AV " + fmt(avTotal) + "€ (" + (totalPatrimoine>0?((avTotal/totalPatrimoine)*100).toFixed(1):0) + "%)" +
      "\n- Immobilier net " + fmt(immoCapNet) + "€ (" + immoPct.toFixed(1) + "%)" +
      "\nREVENUS: " + fmt(revenusAnnuels) + "€/an | Rendement: " + yieldRate.toFixed(2) + "%" +
      "\nLIQUIDITÉ: " + liquidPct.toFixed(1) + "% | LEVIER IMMO: " + leverRatio.toFixed(1) + "%" +
      "\nTOP LIGNES: " + (topHoldings || "aucune ligne renseignée") +
      "\nIMMO: " + immoBiens.length + " bien(s)" + (immoValBrut > 0 ? ", valeur brute " + fmt(immoValBrut) + "€, dette " + fmt(immoDettes) + "€" : "");
    try {
      var res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "x-api-key":apiKey, "anthropic-version":"2023-06-01", "content-type":"application/json", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model:"claude-opus-4-5-20251101", max_tokens:1800,
          system:"Tu es un conseiller en gestion de patrimoine d'élite (Goldman Sachs, Bridgewater). Analyse le patrimoine présenté de façon très concrète et personnalisée. Structure ta réponse : 1) Résumé en 2 phrases 2) ✅ 3 points forts 3) ⚠️ 3 points de vigilance 4) 🎯 5 actions prioritaires avec montants et délais. Sois direct, chiffré, actionnable.",
          messages:[{ role:"user", content:"Analyse mon patrimoine :\n" + summary }]
        })
      });
      var data = await res.json();
      setAnalysis(data.content && data.content[0] ? data.content[0].text : "Erreur lors de l'analyse.");
    } catch(e) { setAnalysis("Erreur : " + e.message); }
    setAnalyzing(false);
  }

  if (totalPatrimoine <= 0) return (
    <div style={{ textAlign:"center", padding:"80px 20px", color:"#555" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>📊</div>
      <div style={{ fontSize:14, color:"#777", marginBottom:8 }}>Aucune donnée à afficher</div>
      <div style={{ fontSize:12, color:"#444" }}>Renseignez vos portefeuilles et votre immobilier pour voir le dashboard</div>
    </div>
  );

		  return (
		    <div style={{ padding:"20px 24px", maxWidth:1120, margin:"0 auto" }}>
		      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:18 }}>
		        <div>
		          <div style={{ fontSize:13, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.08em" }}>{tr(lang, "consolidatedWealth")}<InfoTip text={tr(lang, "consolidatedWealthHelp")} /></div>
		          <div style={{ fontSize:11, color:"#666", marginTop:4 }}>{tr(lang, "consolidatedWealthSub")}</div>
		          <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
		            <span style={{ fontSize:10, color:"#4a9e6b" }} title={tr(lang, "positiveColorHelp")}>● {lang === "en" ? "Positive / strength" : "Positif / point fort"}</span>
		            <span style={{ fontSize:10, color:"#e05555" }} title={tr(lang, "negativeColorHelp")}>● {lang === "en" ? "Negative / watch point" : "Négatif / vigilance"}</span>
		          </div>
		        </div>
		        <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
		          <button onClick={() => window.print()} style={{ background:"linear-gradient(135deg,#00E1DC,#007A78)", border:"none", borderRadius:8, color:"#07110f", padding:"8px 14px", fontSize:12, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit" }}>{tr(lang, "generateReport")}</button>
		        </div>
		      </div>

	      {/* ── KPIs ── */}
	      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
	        {[
		          { label:tr(lang, "totalNetWorth"),  value: fmt(totalPatrimoine)+" €",   color:"#00E1DC", sub:modules.map(function(m){ return m.label+" "+safePct(m.value,totalPatrimoine).toFixed(0)+"%"; }).join(" · ") },
		          { label:tr(lang, "annualIncome"),   value: fmt(revenusAnnuels)+" €/an",  color:"#4a9e6b", sub: yieldRate > 0 ? (lang === "en" ? "Yield " : "Rendement ")+yieldRate.toFixed(2)+"%" : (lang === "en" ? "Fill the Income tab" : "Onglet Revenus à remplir") },
		          { label:tr(lang, "incomeAssets"),     value: fmt(incomeGeneratingAssets)+" €", color:"#e8a055", sub:safePct(incomeGeneratingAssets,totalPatrimoine).toFixed(1)+"% "+(lang === "en" ? "of identified wealth" : "du patrimoine identifié") },
		          { label:tr(lang, "privateAssets"),   value: privateTotal > 0 ? fmt(privateTotal)+" €" : "—", color:"#9a8ec9", sub: privateTotal > 0 ? "MOIC "+privateMetrics.moic.toFixed(2)+"x · IRR "+privateMetrics.irr.toFixed(1)+"%" : (lang === "en" ? "No private asset" : "Aucun actif privé") },
		        ].map(function(s) { return (
		          <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(0,225,220,0.12)", borderRadius:10, padding:"14px 16px" }}>
		            <div style={{ fontSize:9, color:"#666", letterSpacing:"0.08em", marginBottom:5 }}>{s.label}</div>
		            <div style={{ fontSize:17, fontWeight:"bold", color:s.color, marginBottom:3 }}>{s.value}</div>
		            <div style={{ fontSize:9, color:"#555" }}>{s.sub}</div>
		          </div>
		        ); })}
		      </div>
		      <div style={{ display:"grid", gridTemplateColumns:"1.05fr 1fr", gap:14, marginBottom:16 }}>
	        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(0,225,220,0.14)", borderRadius:10, padding:"16px 20px" }}>
		          <div style={{ fontSize:10, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:14 }}>{tr(lang, "globalAllocation")}<InfoTip text={tr(lang, "globalAllocationHelp")} /></div>
	          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
	            <div style={{ position:"relative", flexShrink:0 }}>
	              <DonutChart data={assetClasses} size={140} hole={34} />
	              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
		                <div style={{ fontSize:9, color:"#666" }}>{tr(lang, "net")}</div>
	                <div style={{ fontSize:12, fontWeight:"bold", color:"#00E1DC" }}>{fmt(totalPatrimoine/1000)}k</div>
	              </div>
	            </div>
		            <div style={{ flex:1 }}><BarList data={assetClasses} total={totalPatrimoine} lang={lang} /></div>
	          </div>
	        </div>
		        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(0,225,220,0.14)", borderRadius:10, padding:"16px 20px", minWidth:0 }}>
		          <div style={{ fontSize:10, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:14 }}>{tr(lang, "consolidatedExposure")}<InfoTip text={tr(lang, "consolidatedExposureHelp")} /></div>
		          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))", gap:16 }}>
		            <div style={{ minWidth:0 }}><div style={{ fontSize:9, color:"#666", marginBottom:8 }}>{tr(lang, "geography")}</div><BarList data={exposure.geography} total={totalPatrimoine} max={5} lang={lang} /></div>
		            <div style={{ minWidth:0 }}><div style={{ fontSize:9, color:"#666", marginBottom:8 }}>{tr(lang, "sector")}</div><BarList data={exposure.sector} total={totalPatrimoine} max={5} lang={lang} /></div>
		            <div style={{ minWidth:0 }}><div style={{ fontSize:9, color:"#666", marginBottom:8 }}>{tr(lang, "currency")}</div><BarList data={exposure.currency} total={totalPatrimoine} max={5} lang={lang} /></div>
		          </div>
	        </div>
	      </div>

      {/* ── Composition + Évolution ── */}
	      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>

        {/* Donut composition */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"16px 20px" }}>
	          <div style={{ fontSize:10, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:14 }}>{tr(lang, "capitalComposition")}</div>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <DonutChart data={modules} size={130} hole={32} />
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
	                <div style={{ fontSize:9, color:"#666" }}>{tr(lang, "total")}</div>
                <div style={{ fontSize:11, fontWeight:"bold", color:"#00E1DC" }}>{fmt(totalPatrimoine/1000)}k</div>
              </div>
            </div>
            <div style={{ flex:1 }}>
              {modules.map(function(m) { return (
                <div key={m.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:m.color, flexShrink:0 }} />
                  <div style={{ flex:1, fontSize:11, color:"#aaa" }}>{m.label}</div>
                  <div style={{ fontSize:11, color:"#F5F7FA", fontWeight:"bold" }}>{((m.value/totalPatrimoine)*100).toFixed(1)}%</div>
                  <div style={{ fontSize:10, color:"#666", minWidth:70, textAlign:"right" }}>{fmt(m.value)} €</div>
                </div>
              ); })}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"16px 20px" }}>
	          <div style={{ fontSize:10, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:14 }}>{tr(lang, "assetClassBreakdown")}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {cats.slice(0,8).map(function(c) { return (
              <div key={c.id}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#888", marginBottom:3 }}>
                  <span>{c.label}</span>
                  <span style={{ color:c.color }}>{((c.value/totalPatrimoine)*100).toFixed(1)}% · {fmt(c.value)} €</span>
                </div>
                <div style={{ height:4, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ width:((c.value/totalPatrimoine)*100)+"%", height:"100%", background:c.color, borderRadius:2, transition:"width 0.4s" }} />
                </div>
              </div>
            ); })}
          </div>
        </div>
      </div>

      {/* ── Évolution ── */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
        <div style={{ fontSize:10, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:14, display:"flex", justifyContent:"space-between" }}>
		          <span>{tr(lang, "netWorthTimeline")}</span>
          <span style={{ color:"#555", fontWeight:"normal" }}>{snapshots.length} point{snapshots.length > 1 ? "s" : ""} d'historique</span>
        </div>
	        <MiniLineChart snapshots={snapshots} width={900} height={140} />
	      </div>
	      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(0,225,220,0.18)", borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
		        <div style={{ fontSize:12, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:6 }}>{tr(lang, "performanceStory")}<InfoTip text={tr(lang, "performanceStoryHelp")} /></div>
		        <div style={{ fontSize:11, color:"#666", marginBottom:14 }}>{tr(lang, "performanceStorySub")}</div>
	        <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr", gap:14 }}>
	          <div>
	            {story.notes.map((n,i)=><div key={i} style={{ background:"rgba(0,225,220,0.05)", border:"1px solid rgba(0,225,220,0.12)", borderRadius:8, padding:"10px 12px", marginBottom:8, fontSize:12, color:"#ccc", lineHeight:1.55 }}>{n}</div>)}
	            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
	              {[
		                [tr(lang, "diversification"), cats.length >= 5 ? (lang === "en" ? "Robust" : "Robuste") : cats.length >= 3 ? (lang === "en" ? "Watch" : "À surveiller") : (lang === "en" ? "Concentrated" : "Concentrée"), cats.length >= 5 ? "#4a9e6b" : "#e8a055"],
		                [tr(lang, "marketDrivers"), exposure.sector[0]?.label || "N/D", "#7a9ec9"],
		                [tr(lang, "allocationChanges"), snapshots.length > 1 ? (lang === "en" ? "History available" : "Historique disponible") : (lang === "en" ? "History being built" : "Historique en construction"), "#00E1DC"],
		                [tr(lang, "fallbackData"), allLines.length ? tr(lang, "localPricesFallback") : tr(lang, "noListedLine"), "#888"],
	              ].map(c => <div key={c[0]} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"10px 12px" }}><div style={{ fontSize:9, color:"#666", letterSpacing:"0.06em" }}>{c[0]}</div><div style={{ color:c[2], fontSize:13, fontWeight:"bold", marginTop:4 }}>{c[1]}</div></div>)}
	            </div>
	          </div>
	          <div>
		            <div style={{ fontSize:10, color:"#4a9e6b", fontWeight:"bold", marginBottom:8 }}>{tr(lang, "topContributors")}<InfoTip text={tr(lang, "positiveColorHelp")} /></div>
	            {story.top.length ? story.top.map(l => <div key={l.wrapper+l.id+"top"} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}><span>{l.ticker || l.nom}<span style={{ color:"#555" }}> · {l.wrapper}</span></span><strong style={{ color:"#4a9e6b" }}>{fmtMoney(l.pnl)}</strong></div>) : <div style={{ color:"#555", fontSize:11 }}>Aucun contributeur calculable</div>}
	          </div>
	          <div>
		            <div style={{ fontSize:10, color:"#e05555", fontWeight:"bold", marginBottom:8 }}>{tr(lang, "worstContributors")}<InfoTip text={tr(lang, "negativeColorHelp")} /></div>
	            {story.worst.length ? story.worst.map(l => <div key={l.wrapper+l.id+"worst"} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}><span>{l.ticker || l.nom}<span style={{ color:"#555" }}> · {l.wrapper}</span></span><strong style={{ color:l.pnl >= 0 ? "#4a9e6b" : "#e05555" }}>{fmtMoney(l.pnl)}</strong></div>) : <div style={{ color:"#555", fontSize:11 }}>Aucun contributeur négatif calculable</div>}
	          </div>
		        </div>
		      </div>

		      {reportMode === "advisor" && (
		        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(0,225,220,0.16)", borderRadius:10, padding:"16px 20px", marginBottom:16 }}>
		          <div style={{ fontSize:12, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:6 }}>{tr(lang, "businessOpportunities")}<InfoTip text={tr(lang, "businessOpportunitiesHelp")} /></div>
		          <div style={{ fontSize:11, color:"#666", marginBottom:12 }}>{lang === "en" ? "Advisor-only view: transforms allocation weaknesses into client discussion angles." : "Vue réservée au conseiller : transforme les faiblesses d'allocation en angles de discussion client."}</div>
		          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:10 }}>
		            {advisorOpportunities.map((o,i) => (
		              <div key={i} style={{ background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px" }}>
		                <div style={{ fontSize:10, color:o.color, fontWeight:"bold", letterSpacing:"0.05em", marginBottom:7 }}>{o.title}</div>
		                <div style={{ fontSize:11, color:"#aaa", lineHeight:1.55 }}>{o.action}</div>
		              </div>
		            ))}
		          </div>
		        </div>
		      )}

	      {/* ── Risques & Atouts ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"16px 20px" }}>
          <div style={{ fontSize:10, color:"#e05555", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:12 }}>⚠️ POINTS DE VIGILANCE</div>
          {risks.length === 0 ? (
            <div style={{ fontSize:11, color:"#555", fontStyle:"italic" }}>Aucun risque majeur détecté — bonne allocation globale</div>
          ) : risks.map(function(r,i) { return (
            <div key={i} style={{ display:"flex", gap:10, marginBottom:10, padding:"8px 10px", background:"rgba(224,85,85,0.05)", border:"1px solid rgba(224,85,85,0.1)", borderRadius:7 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize:11, color:"#F5F7FA", fontWeight:"bold", marginBottom:2 }}>{r.title}</div>
                <div style={{ fontSize:10, color:"#888" }}>{r.desc}</div>
              </div>
            </div>
          ); })}
        </div>
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"16px 20px" }}>
          <div style={{ fontSize:10, color:"#4a9e6b", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:12 }}>✅ POINTS FORTS</div>
          {strengths.length === 0 ? (
            <div style={{ fontSize:11, color:"#555", fontStyle:"italic" }}>Complétez vos onglets pour voir l'analyse</div>
          ) : strengths.map(function(s,i) { return (
            <div key={i} style={{ display:"flex", gap:10, marginBottom:10, padding:"8px 10px", background:"rgba(74,158,107,0.05)", border:"1px solid rgba(74,158,107,0.1)", borderRadius:7 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:11, color:"#F5F7FA", fontWeight:"bold", marginBottom:2 }}>{s.title}</div>
                <div style={{ fontSize:10, color:"#888" }}>{s.desc}</div>
              </div>
            </div>
          ); })}
        </div>
	      </div>
	      <div className="client-report" style={{ background:"linear-gradient(135deg,rgba(0,225,220,0.06),rgba(255,255,255,0.02))", border:"1px solid rgba(0,225,220,0.2)", borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
	        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
	          <div>
		            <div style={{ fontSize:12, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em" }}>{tr(lang, "clientReadyReport")}</div>
		            <div style={{ fontSize:10, color:"#666", marginTop:3 }}>{tr(lang, "clientReadySub")}</div>
	          </div>
		          <div style={{ fontSize:10, color:"#777" }}>{reportMode === "client" ? tr(lang, "clientPresentation") : tr(lang, "advisorPresentation")}</div>
	        </div>
	        <div style={{ display:"grid", gridTemplateColumns: reportMode === "client" ? "1fr 1fr" : "repeat(4,1fr)", gap:10 }}>
	          {[
		            { t:tr(lang, "executiveSummary"), v: lang === "en" ? `Consolidated net worth of ${fmtMoney(totalPatrimoine)} across ${modules.length} main pockets.` : `Patrimoine net consolidé de ${fmtMoney(totalPatrimoine)} réparti sur ${modules.length} poches principales.`, c:"#00E1DC" },
		            { t:tr(lang, "assetAllocation"), v:assetClasses.slice(0,3).map(a=>`${a.label} ${safePct(a.value,totalPatrimoine).toFixed(0)}%`).join(" · ") || (lang === "en" ? "Allocation to be completed." : "Allocation à compléter."), c:"#7a9ec9" },
		            { t:tr(lang, "riskOverview"), v:risks[0]?.desc || (lang === "en" ? "No major risk detected with current data." : "Aucun risque majeur détecté avec les données actuelles."), c:risks.length ? "#e8a055" : "#4a9e6b" },
		            { t:tr(lang, "recommendedActions"), v:risks.length ? (lang === "en" ? "Reduce concentrations, document currencies and complete missing exposures." : "Réduire les concentrations, documenter les devises et compléter les expositions manquantes.") : (lang === "en" ? "Keep monitoring discipline and enrich the monthly history." : "Maintenir la discipline de suivi et enrichir l'historique mensuel."), c:"#4a9e6b" },
	          ].map(x => <div key={x.t} style={{ background:"rgba(0,0,0,0.22)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px" }}><div style={{ fontSize:9, color:x.c, letterSpacing:"0.06em", fontWeight:"bold", marginBottom:7 }}>{x.t}</div><div style={{ fontSize:11, color:"#bbb", lineHeight:1.55 }}>{x.v}</div></div>)}
	        </div>
	        {reportMode === "advisor" && (
	          <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
	            <div style={{ background:"rgba(0,0,0,0.18)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"12px 14px" }}>
		              <div style={{ fontSize:9, color:"#00E1DC", letterSpacing:"0.06em", fontWeight:"bold", marginBottom:7 }}>{tr(lang, "marketCommentary")}</div>
		              <div style={{ fontSize:11, color:"#aaa", lineHeight:1.55 }}>{lang === "en" ? "Web search remains available in PEA/CTO/Insurance modules. If market data is unavailable, reporting uses local prices and explicitly flags the lack of real-time data." : "La recherche web reste disponible dans les modules PEA/CTO/AV. Si une donnée de marché est indisponible, le reporting s'appuie sur les prix locaux et signale l'absence de donnée temps réel."}</div>
	            </div>
	            <div style={{ background:"rgba(0,0,0,0.18)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"12px 14px" }}>
		              <div style={{ fontSize:9, color:"#00E1DC", letterSpacing:"0.06em", fontWeight:"bold", marginBottom:7 }}>{tr(lang, "diversificationAnalysis")}</div>
		              <div style={{ fontSize:11, color:"#aaa", lineHeight:1.55 }}>{lang === "en" ? `${cats.length} asset classes tracked, ${exposure.geography.length} geographies and ${exposure.currency.length} consolidated currencies.` : `${cats.length} classes d'actifs suivies, ${exposure.geography.length} zones géographiques et ${exposure.currency.length} devises consolidées.`}</div>
	            </div>
	          </div>
	        )}
	      </div>

		      {/* ── Analyse IA ── */}
		      {reportMode === "advisor" && (
		        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(0,225,220,0.2)", borderRadius:10, padding:"20px", marginBottom:16 }}>
		          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: analysis ? 16 : 0 }}>
		            <div>
		              <div style={{ fontSize:12, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em" }}>🤖 ANALYSE PATRIMONIALE IA</div>
		              <div style={{ fontSize:10, color:"#555", marginTop:3 }}>Analyse approfondie par un conseiller IA d'élite (Goldman Sachs · Bridgewater · BlackRock)</div>
		            </div>
		            <button onClick={generateAnalysis} disabled={analyzing}
		              style={{ background: analyzing ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,rgba(0,225,220,0.2),rgba(0,225,220,0.1))", border:"1px solid rgba(0,225,220,0.4)", borderRadius:9, padding:"10px 20px", cursor: analyzing ? "default" : "pointer", color: analyzing ? "#555" : "#00E1DC", fontSize:12, fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, transition:"all 0.2s" }}>
		              {analyzing ? (
		                <>
		                  <span style={{ display:"inline-block", width:10, height:10, border:"2px solid rgba(0,225,220,0.3)", borderTopColor:"#00E1DC", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
		                  Analyse en cours…
		                </>
		              ) : "✨ Analyser mon patrimoine"}
		            </button>
		          </div>
		          {analysis && (
		            <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:16 }}>
		              <div style={{ fontSize:12, color:"#ddd", lineHeight:1.8, whiteSpace:"pre-wrap" }}>{analysis}</div>
		            </div>
		          )}
		        </div>
		      )}

    </div>
  );
}


// ──────────────────────────────────────────────────
// REVENUS MODULE
// ──────────────────────────────────────────────────
