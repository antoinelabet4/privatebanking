// Private Markets tab constants and UI module.

const PRIVATE_TYPES = ["Private equity", "Private debt", "Club deal", "Real estate deal", "SCPI", "Venture capital"];
const BLANK_PRIVATE = { id: 0, name: "", type: "Private equity", commitment: "", calledCapital: "", distributions: "", nav: "", irr: "", vintage: new Date().getFullYear(), status: "Invested", currency: "EUR", geography: "Europe", sector: "Diversified", nextCashflowDate: "", nextCashflowAmount: "" };

function PrivateMarketsModule({ onTotalChange, lang = "fr", reportMode = "advisor" }) {
  const [items, setItems] = useState(() => {
    const p = readJson("private_markets", []);
    return Array.isArray(p) ? p : [];
  });
  const [form, setForm] = useState(null);
  const metrics = calcPrivateMetrics(items);
  const privateAdvisorOpportunities = buildPrivateAdvisorOpportunities(items, metrics, lang);
  useEffect(() => { writeJson("private_markets", items); }, [items]);
  useEffect(() => { if (onTotalChange) onTotalChange(metrics.value); }, [metrics.value]);
  const inputStyle = { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(0,225,220,0.2)", borderRadius:6, padding:"7px 10px", color:"#F5F7FA", fontSize:12, fontFamily:"inherit" };
  const labelStyle = { fontSize:10, color:"#888", marginBottom:4 };
  const save = () => {
    if (!form?.name) { alert("Nom requis"); return; }
    const clean = { ...form, id: form.id || Date.now() };
    setItems(prev => form.id ? prev.map(i => i.id === form.id ? clean : i) : [...prev, clean]);
    setForm(null);
  };
  const timeline = items.filter(i => i.nextCashflowDate || safeNum(i.nextCashflowAmount) > 0).sort((a,b)=>String(a.nextCashflowDate).localeCompare(String(b.nextCashflowDate)));
  return (
    <div style={{ padding:"20px 24px", maxWidth:1060, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
	          <div style={{ color:"#00E1DC", fontSize:13, fontWeight:"bold", letterSpacing:"0.08em" }}>{tr(lang, "privateMarkets").toUpperCase()}<InfoTip text={lang === "en" ? "Tracks commitments, called capital, distributions, NAV, IRR and MOIC for illiquid investments." : "Suit les engagements, appels de fonds, distributions, NAV, TRI et MOIC des investissements non cotés."} /></div>
	          <div style={{ color:"#666", fontSize:11, marginTop:4 }}>{lang === "en" ? "Transparency on commitments, calls, distributions, NAV and multiples" : "Transparence engagements, appels, distributions, NAV et multiples"}</div>
        </div>
	        <button onClick={() => setForm({ ...BLANK_PRIVATE })} style={{ background:"rgba(0,225,220,0.13)", border:"1px solid rgba(0,225,220,0.35)", borderRadius:8, color:"#00E1DC", padding:"8px 14px", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>{lang === "en" ? "+ Add investment" : "+ Ajouter un investissement"}</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:18 }}>
        {[
	          [lang === "en" ? "Commitments" : "Engagements", metrics.commitment, "#00E1DC"],
	          [lang === "en" ? "Called capital" : "Capital appelé", metrics.called, "#7a9ec9"],
	          [lang === "en" ? "Distributions" : "Distributions", metrics.distributions, "#4a9e6b"],
          ["NAV", metrics.value, "#a0c4ff"],
          ["MOIC", metrics.moic > 0 ? metrics.moic.toFixed(2)+"x" : "—", "#e8a055"],
        ].map(k => (
          <div key={k[0]} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(0,225,220,0.12)", borderRadius:10, padding:"13px 15px" }}>
            <div style={{ fontSize:9, color:"#666", letterSpacing:"0.08em", marginBottom:6 }}>{k[0]}</div>
            <div style={{ fontSize:17, fontWeight:"bold", color:k[2] }}>{typeof k[1] === "number" ? fmtMoney(k[1]) : k[1]}</div>
          </div>
        ))}
      </div>
      {reportMode === "advisor" && (
        <AdvisorOpportunityPanel opportunities={privateAdvisorOpportunities} lang={lang} />
      )}
      {form && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(0,225,220,0.2)", borderRadius:10, padding:16, marginBottom:18 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10 }}>
	            <div><div style={labelStyle}>{lang === "en" ? "Name" : "Nom"}</div><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inputStyle} /></div>
            <div><div style={labelStyle}>Type</div><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inputStyle}>{PRIVATE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
	            <div><div style={labelStyle}>{lang === "en" ? "Commitment" : "Engagement"}</div><input type="number" value={form.commitment} onChange={e=>setForm({...form,commitment:e.target.value})} style={inputStyle} /></div>
	            <div><div style={labelStyle}>{lang === "en" ? "Called capital" : "Capital appelé"}</div><input type="number" value={form.calledCapital} onChange={e=>setForm({...form,calledCapital:e.target.value})} style={inputStyle} /></div>
            <div><div style={labelStyle}>Distributions</div><input type="number" value={form.distributions} onChange={e=>setForm({...form,distributions:e.target.value})} style={inputStyle} /></div>
            <div><div style={labelStyle}>NAV</div><input type="number" value={form.nav} onChange={e=>setForm({...form,nav:e.target.value})} style={inputStyle} /></div>
            <div><div style={labelStyle}>IRR %</div><input type="number" value={form.irr} onChange={e=>setForm({...form,irr:e.target.value})} style={inputStyle} /></div>
            <div><div style={labelStyle}>Vintage</div><input type="number" value={form.vintage} onChange={e=>setForm({...form,vintage:e.target.value})} style={inputStyle} /></div>
	            <div><div style={labelStyle}>{lang === "en" ? "Status" : "Statut"}</div><input value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inputStyle} /></div>
	            <div><div style={labelStyle}>{lang === "en" ? "Geography" : "Géographie"}</div><input value={form.geography} onChange={e=>setForm({...form,geography:e.target.value})} style={inputStyle} /></div>
	            <div><div style={labelStyle}>{lang === "en" ? "Sector" : "Secteur"}</div><input value={form.sector} onChange={e=>setForm({...form,sector:e.target.value})} style={inputStyle} /></div>
	            <div><div style={labelStyle}>{lang === "en" ? "Next cashflow date" : "Prochain flux date"}</div><input type="date" value={form.nextCashflowDate} onChange={e=>setForm({...form,nextCashflowDate:e.target.value})} style={inputStyle} /></div>
	            <div><div style={labelStyle}>{lang === "en" ? "Next cashflow amount" : "Prochain flux montant"}</div><input type="number" value={form.nextCashflowAmount} onChange={e=>setForm({...form,nextCashflowAmount:e.target.value})} style={inputStyle} /></div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
	            <button onClick={save} style={{ background:"rgba(74,158,107,0.18)", border:"1px solid rgba(74,158,107,0.4)", borderRadius:7, color:"#4a9e6b", padding:"7px 14px", cursor:"pointer", fontFamily:"inherit" }}>✓ {lang === "en" ? "Save" : "Enregistrer"}</button>
	            <button onClick={()=>setForm(null)} style={{ background:"none", border:"1px solid rgba(255,255,255,0.12)", borderRadius:7, color:"#777", padding:"7px 14px", cursor:"pointer", fontFamily:"inherit" }}>{lang === "en" ? "Cancel" : "Annuler"}</button>
          </div>
        </div>
      )}
      <div style={{ overflowX:"auto", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, marginBottom:16 }}>
        <table>
	          <thead><tr><th>{lang === "en" ? "Investment" : "Investissement"}</th><th>Type</th><th>{lang === "en" ? "Commitment" : "Engagement"}</th><th>{lang === "en" ? "Called" : "Appelé"}</th><th>{lang === "en" ? "Distrib." : "Distrib."}</th><th>NAV</th><th>IRR</th><th>MOIC</th><th>Vintage</th><th>{lang === "en" ? "Status" : "Statut"}</th><th></th></tr></thead>
          <tbody>
	            {items.length === 0 ? <tr><td colSpan="11" style={{ textAlign:"center", color:"#555", padding:30 }}>{lang === "en" ? "No private asset entered" : "Aucun actif privé renseigné"}</td></tr> : items.map(i => {
              const called = safeNum(i.calledCapital);
              const moic = called > 0 ? (safeNum(i.nav)+safeNum(i.distributions))/called : 0;
              return (
                <tr key={i.id}>
                  <td><strong>{i.name}</strong><div style={{ color:"#666", fontSize:10 }}>{i.geography} · {i.sector} · {i.currency || "EUR"}</div></td>
                  <td><span style={{ color:getPrivateTypeColor(i.type) }}>{i.type}</span></td>
                  <td>{fmtMoney(i.commitment)}</td><td>{fmtMoney(i.calledCapital)}</td><td>{fmtMoney(i.distributions)}</td><td>{fmtMoney(i.nav)}</td>
                  <td style={{ color:safeNum(i.irr) >= 0 ? "#4a9e6b" : "#e05555" }}>{safeNum(i.irr).toFixed(1)}%</td>
                  <td>{moic > 0 ? moic.toFixed(2)+"x" : "—"}</td><td>{i.vintage || "—"}</td><td>{i.status || "—"}</td>
                  <td><button onClick={()=>setForm({...i})} style={{ background:"none", border:"1px solid rgba(255,255,255,0.08)", borderRadius:5, color:"#888", cursor:"pointer" }}>✏️</button><button onClick={()=>setItems(prev=>prev.filter(x=>x.id!==i.id))} style={{ marginLeft:5, background:"none", border:"1px solid rgba(255,255,255,0.08)", borderRadius:5, color:"#e05555", cursor:"pointer" }}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"16px 20px" }}>
	          <div style={{ fontSize:10, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:12 }}>{lang === "en" ? "FUTURE CASHFLOW TIMELINE" : "CALENDRIER DES FLUX FUTURS"}</div>
	          {timeline.length === 0 ? <div style={{ color:"#555", fontSize:11 }}>{lang === "en" ? "No future cashflow entered." : "Aucun flux futur renseigné."}</div> : timeline.map(i => <div key={i.id+"cf"} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:12 }}><span>{i.nextCashflowDate || (lang === "en" ? "To date" : "À dater")} · {i.name}</span><strong style={{ color:safeNum(i.nextCashflowAmount) >= 0 ? "#4a9e6b" : "#e05555" }}>{fmtMoney(i.nextCashflowAmount)}</strong></div>)}
        </div>
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"16px 20px" }}>
	          <div style={{ fontSize:10, color:"#00E1DC", fontWeight:"bold", letterSpacing:"0.06em", marginBottom:12 }}>{lang === "en" ? "DISTRIBUTION TRACKING" : "SUIVI DES DISTRIBUTIONS"}</div>
	          <BarList data={items.map(i => ({ id:i.id, label:i.name, value:safeNum(i.distributions), color:getPrivateTypeColor(i.type) }))} total={Math.max(1, metrics.distributions)} lang={lang} />
        </div>
      </div>
    </div>
  );
}
