// Shared PEA, CTO, and assurance-vie portfolio tab module.

function PortfolioModule({ type, apiKey, onTotalChange, reportMode = "advisor", lang = "fr" }) {
  const cfg = PORTFOLIO_CONFIGS[type];
  const DEMO_LINES_VAR = type === "pea" ? DEMO_LINES : type === "cto" ? CTO_DEMO_LINES : AV_DEMO_LINES;
  const QUICK_PROMPTS_VAR = type === "pea" ? QUICK_PROMPTS : type === "cto" ? CTO_QUICK_PROMPTS : AV_QUICK_PROMPTS;
  const SYSTEM_PROMPT_VAR = type === "pea" ? SYSTEM_PROMPT : type === "cto" ? CTO_SYSTEM_PROMPT : AV_SYSTEM_PROMPT;
  const REALLOC_PROMPT_VAR = type === "pea" ? REALLOC_PROMPT : type === "cto" ? CTO_REALLOC_PROMPT : AV_REALLOC_PROMPT;

  const [messages, setMessages] = useState(() => {
    try {
      const s = localStorage.getItem(`${cfg.prefix}_messages`);
      if (s) return JSON.parse(s);
    } catch {}
    return [{
      role: "assistant",
      content: cfg.initialMessage,
      ts: new Date().toLocaleString('fr-FR')
    }];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const s = localStorage.getItem(`${cfg.prefix}_lines`);
      const p = s ? JSON.parse(s) : null;
      return (p && p.length > 0) ? "dashboard" : "dashboard";
    } catch {}
    return "dashboard";
  });

  const [lines, setLines] = useState(() => {
    try {
      const s = localStorage.getItem(`${cfg.prefix}_lines`);
      // s === null → première visite → montrer le démo
      // s === "[]" → utilisateur a vidé son portefeuille → retourner []
      if (s !== null) {
        const p = JSON.parse(s);
        return Array.isArray(p) ? p : [];
      }
    } catch {}
    return DEMO_LINES_VAR;
  });

  const [newLine, setNewLine] = useState({ ticker: "", nom: "", categorie: "", qte: "", pru: "", prixActuel: "", cible: 0, geography: "", sector: "", currency: "EUR", riskLevel: "Medium", volatility: "", rating: "", style: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTx, setExpandedTx] = useState(null);
  const [newTx, setNewTx] = useState({ date: new Date().toISOString().slice(0,10), qte: "", prix: "", type: "achat" });
  const [reallocLoading, setReallocLoading] = useState(false);
  const [reallocResult, setReallocResult] = useState(null);
  const [priceStatus, setPriceStatus] = useState({});
  const [marketFetching, setMarketFetching] = useState(false);
  const [perfHistory, setPerfHistory] = useState(() => {
    try {
      const s = localStorage.getItem(`${cfg.prefix}_perfHistory`);
      return s ? JSON.parse(s) : [];
    } catch {}
    return [];
  });
  const [benchmarks, setBenchmarks] = useState(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [testRunning, setTestRunning] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const messagesEndRef = useRef(null);

  // ── Storage sync ──
  useEffect(() => {
    localStorage.setItem(`${cfg.prefix}_lines`, JSON.stringify(lines));
  }, [lines, cfg.prefix]);

  useEffect(() => {
    localStorage.setItem(`${cfg.prefix}_messages`, JSON.stringify(messages));
  }, [messages, cfg.prefix]);

  useEffect(() => {
    localStorage.setItem(`${cfg.prefix}_perfHistory`, JSON.stringify(perfHistory));
  }, [perfHistory, cfg.prefix]);

  // ── Scroll to latest message ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Fetch benchmarks ──
  useEffect(() => {
    if (perfHistory.length < 2) return;
    fetchBenchmarks(perfHistory[0].date).then(bm => {
      if (Object.keys(bm).length > 0) setBenchmarks(bm);
    }).catch(() => {});
  }, [perfHistory.length]);

  // ── Call onTotalChange when totalActuel changes ──
  const onTotalChangeRef = useRef(onTotalChange);
  onTotalChangeRef.current = onTotalChange;

  // ── Computed values ──
  const calcWeightedPRU = (txs) => {
    const buys = txs.filter(t => t.type === "achat");
    const totalQte = buys.reduce((s, t) => s + (parseFloat(t.qte) || 0), 0);
    if (totalQte === 0) return 0;
    const totalCost = buys.reduce((s, t) => s + (parseFloat(t.qte) || 0) * (parseFloat(t.prix) || 0), 0);
    return totalCost / totalQte;
  };

  const calcNetQte = (txs) => {
    let qte = 0;
    for (const t of txs) {
      const q = parseFloat(t.qte) || 0;
      qte += t.type === "achat" ? q : -q;
    }
    return qte;
  };

  // Si une ligne vient d'une allocation mais que le prix live n'est pas encore chargé,
  // on valorise quand même la ligne avec le montant alloué.
  // Cela évite d'avoir des KPI à 0 et des PRU vides avant l'actualisation des prix.
  const lineVal = (l) => getLineCurrentValue(l);
  const linePRU = (l) => getLinePRUTotal(l);
  const totalActuel = calcPortfolioTotalFromLines(lines);
  const totalPRU = calcPortfolioPRUFromLines(lines);
  const totalPnL = totalActuel - totalPRU;
  const totalPnLPct = totalPRU > 0 ? (totalPnL / totalPRU) * 100 : 0;

  const lineRows = lines.map((l, idx) => ({
    ...l,
    val: lineVal(l),
    pru_total: linePRU(l),
    pnl: lineVal(l) - linePRU(l),
    pnl_pct: linePRU(l) > 0 ? ((lineVal(l) - linePRU(l)) / linePRU(l)) * 100 : 0,
    intelligence: getLineIntelligence(l, type),
  }));
  const portfolioAdvisorOpportunities = buildPortfolioAdvisorOpportunities(type, lineRows, totalActuel, lang);

  const hasPendingQte = lines.some(l => l._pendingQte);
  const hasPruEstimated = lines.some(l => l._pruEstimated);
  const portfolioStartDate = lines[0]?.transactions?.[0]?.date || new Date().toISOString().slice(0,10);
  const globalAnnualReturn = perfHistory.length > 0
    ? ((totalActuel - (perfHistory[0]?.totalVal || totalPRU)) / (perfHistory[0]?.totalVal || totalPRU || 1)) * 100 * (365 / (perfHistory.length || 1))
    : 0;

  // ── Callbacks for portfolio operations ──
  const updateLine = (id, updates) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLine = (id) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const addLine = () => {
    if (!newLine.ticker || !newLine.nom) {
      alert("Ticker et Nom sont requis");
      return;
    }
    const id = Math.max(...lines.map(l => l.id || 0), 0) + 1;
    const qte = parseFloat(newLine.qte) || 0;
    const pru = parseFloat(newLine.pru) || 0;
    const prixActuel = parseFloat(newLine.prixActuel) || pru;
    const newId = {
      id,
      ticker: newLine.ticker.toUpperCase(),
      nom: newLine.nom,
      categorie: newLine.categorie || "Autre",
      qte: qte > 0 ? qte : 0,
      pru: pru > 0 ? pru : 0,
      prixActuel: prixActuel > 0 ? prixActuel : 0,
      cible: parseFloat(newLine.cible) || 0,
      geography: newLine.geography || "",
      sector: newLine.sector || "",
      currency: newLine.currency || "EUR",
      riskLevel: newLine.riskLevel || "Medium",
      volatility: newLine.volatility || "",
      rating: newLine.rating || "",
      style: newLine.style || "",
      transactions: qte > 0 && pru > 0 ? [{
        id: 1,
        date: new Date().toISOString().slice(0,10),
        type: "achat",
        qte,
        prix: pru,
        note: ""
      }] : [],
      _pendingQte: parseFloat(newLine._montant) > 0 && qte === 0,
      _montant: parseFloat(newLine._montant) || 0
    };
    setLines([...lines, newId]);
    setNewLine({ ticker: "", nom: "", categorie: "", qte: "", pru: "", prixActuel: "", cible: 0, geography: "", sector: "", currency: "EUR", riskLevel: "Medium", volatility: "", rating: "", style: "" });
    setShowAddForm(false);
  };

  const addTransaction = (lineId) => {
    if (!newTx.qte || !newTx.prix) {
      alert("Quantité et Prix requis");
      return;
    }
    setLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const transactions = (l.transactions || []);
      const maxId = Math.max(...transactions.map(t => t.id || 0), 0);
      const newTransaction = {
        id: maxId + 1,
        date: newTx.date,
        type: newTx.type,
        qte: parseFloat(newTx.qte),
        prix: parseFloat(newTx.prix),
        note: ""
      };
      const newTxs = [...transactions, newTransaction];
      const newPru = calcWeightedPRU(newTxs);
      const newQte = calcNetQte(newTxs);
      return { ...l, transactions: newTxs, pru: newPru > 0 ? newPru : l.pru, qte: newQte >= 0 ? newQte : 0, _pruEstimated: false };
    }));
    setNewTx({ date: new Date().toISOString().slice(0,10), qte: "", prix: "", type: "achat" });
  };

  const removeTransaction = (lineId, txId) => {
    setLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const transactions = (l.transactions||[]).filter(t => t.id !== txId);
      if (transactions.length === 0) return { ...l, transactions };
      const newPru = calcWeightedPRU(transactions);
      const newQte = calcNetQte(transactions);
      return { ...l, transactions, pru: newPru > 0 ? newPru : l.pru, qte: newQte >= 0 ? newQte : 0 };
    }));
  };

  // ── Stream Claude messages ──
  const streamClaude = async (userMsg, systemMsg) => {
    setLoading(true);
    const allMessages = [...messages, { role: "user", content: userMsg, ts: new Date().toLocaleString('fr-FR') }];
    setMessages(allMessages);

    try {
      const marketData = await fetchLiveMarketContext().catch(() => "Données de marché indisponibles");
      const systemPromptFinal = systemMsg.replace("{{LIVE_MARKET_DATA}}", marketData);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 4096,
          system: systemPromptFinal,
          messages: allMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg = data.content?.[0]?.text || "Pas de réponse";

      // Parse allocation JSON if present
      const jsonMatch = assistantMsg.match(/<ALLOCATION_JSON>([\s\S]*?)<\/ALLOCATION_JSON>/);
      let processedMsg = assistantMsg;
      if (jsonMatch) {
        try {
          const alloc = JSON.parse(jsonMatch[1]);
          setLines(prev => {
            const updated = [...prev];
            const newIds = new Set(alloc.map(a => a.ticker));
            updated.forEach(l => {
              const allocItem = alloc.find(a => a.ticker === l.ticker);
              if (allocItem) l.cible = allocItem.cible;
            });
            const existing = new Set(updated.map(l => l.ticker));
            for (const item of alloc) {
              if (!existing.has(item.ticker)) {
                const id = Math.max(...updated.map(l => l.id || 0), 0) + 1;
                updated.push({
                  id,
                  ticker: item.ticker,
                  nom: item.nom,
                  categorie: item.categorie,
                  qte: 0,
                  pru: 0,
                  prixActuel: 0,
                  cible: item.cible,
                  transactions: [],
                  _pendingQte: false
                });
              }
            }
            return updated;
          });
          processedMsg = assistantMsg.replace(/<ALLOCATION_JSON>.*?<\/ALLOCATION_JSON>/s, "");
        } catch {}
      }

      setMessages([...allMessages, { role: "assistant", content: processedMsg, ts: new Date().toLocaleString('fr-FR') }]);
      setInput("");
    } catch (err) {
      setMessages([...allMessages, { role: "assistant", content: `Erreur: ${err.message}`, ts: new Date().toLocaleString('fr-FR') }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (overrideText) => {
    const userMsg = (overrideText !== undefined ? overrideText : input).trim();
    if (!userMsg) return;
    if (!apiKey) {
      alert("Veuillez configurer votre clé API");
      return;
    }
    if (overrideText === undefined) setInput("");

    const portfolioContext = lineRows.length > 0
      ? `Portefeuille actuel ${cfg.label}:\n${lineRows.map(l => `- ${l.ticker} ${l.nom}: ${parseFloat(l.qte||0)}u @ ${parseFloat(l.pru||0).toFixed(2)}€ PRU → ${parseFloat(l.prixActuel||0).toFixed(2)}€ (cible: ${l.cible||0}%)`).join("\n")}\nTotal: ${totalActuel.toFixed(2)}€ | P&L: ${totalPnL.toFixed(2)}€ (${totalPnLPct.toFixed(1)}%)`
      : `Portefeuille ${cfg.label} vide`;

    const augmentedMsg = `${userMsg}\n\n[${portfolioContext}]`;
    streamClaude(augmentedMsg, SYSTEM_PROMPT_VAR);
  };

  const runRealloc = async () => {
    if (!apiKey) { alert("Veuillez configurer votre clé API"); return; }
    setReallocLoading(true);
    setReallocResult(null);

    const portfolioContext = lineRows.map(l =>
      `- ${l.ticker} ${l.nom}: ${parseFloat(l.qte||0)}u @ ${parseFloat(l.pru||0).toFixed(2)}€ PRU → ${parseFloat(l.prixActuel||0).toFixed(2)}€ (cible: ${l.cible||0}%, P&L: ${l.pnl.toFixed(2)}€)`
    ).join("\n");

    const msg = `Rééquilibre mensuel du portefeuille ${cfg.label}:\n${portfolioContext}\n\nTotal: ${totalActuel.toFixed(2)}€ | Perf globale: ${totalPnLPct.toFixed(1)}%`;

    try {
      const marketData = await fetchLiveMarketContext().catch(() => "Données indisponibles");
      const systemFinal = REALLOC_PROMPT_VAR.replace("{{LIVE_MARKET_DATA}}", marketData);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-opus-4-5-20251101", max_tokens: 2000, system: systemFinal, messages: [{ role: "user", content: msg }] })
      });
      const data = await res.json();
      setReallocResult(data.content?.[0]?.text || "Erreur lors de l'analyse.");
    } catch(e) {
      setReallocResult("Erreur : " + e.message);
    }
    setReallocLoading(false);
  };

  const refreshAllPrices = async () => {
    const tickers = lines.filter(l => l.ticker !== "CASH");
    if (tickers.length === 0) return;
    const loadingState = {};
    tickers.forEach(l => { loadingState[l.ticker] = { loading: true }; });
    setPriceStatus(loadingState);
    for (const l of tickers) {
      try {
        const result = await fetchPricesForTicker(l.ticker);
        if (result) {
          setPriceStatus(prev => ({ ...prev, [l.ticker]: { price: result.price, sources: result.sources, errors: result.errors, count: result.count, loading: false } }));
          setLines(prev => prev.map(line => {
            if (line.ticker !== l.ticker) return line;
            if (line._pendingQte && line._montant > 0) {
              const newQte = Math.round(line._montant / result.price * 10000) / 10000;
              const updatedTx = (line.transactions || []).map((t, idx) =>
                idx === 0 ? { ...t, qte: newQte, prix: result.price, note: "PRU estimé (cliquez PRU pour corriger)" } : t
              );
              return { ...line, prixActuel: result.price, qte: newQte, pru: result.price, _pendingQte: false, _pruEstimated: true, transactions: updatedTx };
            }
            return { ...line, prixActuel: result.price };
          }));
        }
      } catch (e) {
        setPriceStatus(prev => ({ ...prev, [l.ticker]: { error: e.message, loading: false } }));
      }
    }
  };

  const runSourceTests = async () => {
    setTestRunning(true);
    setTestResults({});
    const tickers = ["CW8", "EWLD", "PAEEM"];
    const results = {};
    for (const ticker of tickers) {
      try {
        const r1 = await fetchPriceYahoo(ticker).catch(e => ({ error: e.message }));
        const r2 = await fetchPriceEuronext(ticker).catch(e => ({ error: e.message }));
        const r3 = await fetchPriceBoursorama(ticker).catch(e => ({ error: e.message }));
        results[ticker] = {
          yahoo: r1.error ? "❌ " + r1.error : "✅ " + r1.price.toFixed(2),
          euronext: r2.error ? "❌ " + r2.error : "✅ " + r2.price.toFixed(2),
          boursorama: r3.error ? "❌ " + r3.error : "✅ " + r3.price.toFixed(2),
        };
      } catch (e) {
        results[ticker] = { error: e.message };
      }
    }
    setTestResults(results);
    setTestRunning(false);
  };

  const importAllocation = (allocationData) => {
    setLines(prev => {
      const updated = [...prev];
      for (const item of allocationData) {
        const existing = updated.find(l => l.ticker === item.ticker);
        if (existing) {
          existing.cible = item.cible || existing.cible;
        } else {
          const id = Math.max(...updated.map(l => l.id || 0), 0) + 1;
          updated.push({
            id,
            ticker: item.ticker,
            nom: item.nom,
            categorie: item.categorie,
            qte: 0,
            pru: 0,
            prixActuel: 0,
            cible: item.cible,
            transactions: [],
          });
        }
      }
      return updated;
    });
  };

  // ── Update total when totalActuel changes ──
  useEffect(() => {
    if (onTotalChangeRef.current) {
      onTotalChangeRef.current(totalActuel);
    }
  }, [totalActuel]);

  // ── Main render ──
  return (
    <div style={{ padding: 24, background: "transparent", color: "var(--sia-cool-black)", fontFamily: "inherit" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--sia-glass-border)", paddingBottom: 8 }}>
        {["dashboard", "chat", "realloc", "add"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 15px",
              background: activeTab === tab ? "var(--sia-brand-navy)" : "var(--sia-glass-strong)",
              border: activeTab === tab ? "1px solid var(--sia-brand-navy)" : "1px solid var(--sia-glass-border)",
              color: activeTab === tab ? "#fff" : "var(--sia-gray-600)",
              borderRadius: "var(--sia-radius-lg)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit"
            }}
          >
            {tab === "dashboard" && "Dashboard"}
            {tab === "chat" && "Chat"}
            {tab === "realloc" && "Rééquilibrage"}
            {tab === "add" && "Ajouter"}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div>

          {/* ── Onboarding : portefeuille vide ── */}
          {lineRows.length === 0 && (
            <div style={{ background: "linear-gradient(135deg, rgba(0,225,220,0.08), rgba(74,158,107,0.06))", border: "1px solid rgba(0,225,220,0.3)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#00E1DC", marginBottom: 8 }}>🚀 Démarrez votre {cfg.label}</div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.6 }}>
                Entrez le montant disponible pour investir. Il sera ajouté comme ligne <strong style={{ color: "#00E1DC" }}>CASH</strong> et l'agent construira une allocation sur mesure en fonction de votre profil.
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="number" min="0" placeholder="100 000"
                    value={cashInput}
                    onChange={e => setCashInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && cashInput) document.getElementById(`btn-start-${cfg.prefix}`).click(); }}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,225,220,0.4)", borderRadius: 8, padding: "10px 50px 10px 14px", color: "#e8d5b0", fontSize: 16, fontFamily: "inherit", width: 180, outline: "none" }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#00E1DC", fontSize: 14, pointerEvents: "none" }}>€</span>
                </div>
                <button id={`btn-start-${cfg.prefix}`}
                  onClick={() => {
                    const amt = parseFloat(cashInput);
                    if (!amt || amt <= 0) { alert("Entrez un montant valide."); return; }
                    const cashLine = { id: Date.now(), ticker: "CASH", nom: "Liquidités disponibles", categorie: "Cash", qte: 1, pru: amt, prixActuel: amt, cible: 100, transactions: [] };
                    setLines([cashLine]);
                    setCashInput("");
                    setActiveTab("chat");
                    setInput(`J'ai ${amt.toLocaleString('fr-FR')}€ disponibles à investir sur mon ${cfg.label}. Propose-moi une allocation complète et diversifiée avec les ETF éligibles${cfg.label === "PEA" ? " au PEA (Euronext Paris)" : cfg.label === "CTO" ? " sur un CTO (actions monde + ETF)" : " en Assurance Vie (fonds euros + UC)"}. Pour chaque ligne : ticker, nom, catégorie, % cible et montant à investir.`);
                  }}
                  style={{ background: "linear-gradient(135deg, #00E1DC, #007A78)", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", color: "#1a1208", fontSize: 13, fontWeight: "bold", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  💰 Ajouter et lancer l'allocation
                </button>
                <span style={{ color: "#555", fontSize: 12 }}>— ou ajoutez vos lignes manuellement via <strong style={{ color: "#888" }}>+ Ajouter</strong></span>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 20 }}>
            <div style={{ background: "rgba(106,142,201,0.1)", border: "1px solid rgba(106,142,201,0.3)", borderRadius: 8, padding: 15 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>Valeur Totale</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#6a8ec9" }}>{totalActuel.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
            </div>
            <div style={{ background: "rgba(0,225,220,0.1)", border: "1px solid rgba(0,225,220,0.3)", borderRadius: 8, padding: 15 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>PRU Total</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#00E1DC" }}>{totalPRU.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
            </div>
            <div style={{ background: totalPnL >= 0 ? "rgba(74,158,107,0.1)" : "rgba(201,110,110,0.1)", border: `1px solid ${totalPnL >= 0 ? "rgba(74,158,107,0.3)" : "rgba(201,110,110,0.3)"}`, borderRadius: 8, padding: 15 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>P&L Brut</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: totalPnL >= 0 ? "#4a9e6b" : "#c96e6e" }}>{totalPnL.toFixed(2)} € ({totalPnLPct.toFixed(1)}%)</div>
            </div>
            <div style={{ background: "rgba(168,196,232,0.1)", border: "1px solid rgba(168,196,232,0.3)", borderRadius: 8, padding: 15 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>Lignes</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#a8c4e8" }}>{lineRows.length}</div>
            </div>
            <div style={{ background: "rgba(232,168,196,0.1)", border: "1px solid rgba(232,168,196,0.3)", borderRadius: 8, padding: 15 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>Rendement annuel</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#e8a8c4" }}>{globalAnnualReturn.toFixed(1)}%</div>
            </div>
          </div>

          {/* Fiscal Badge */}
          <div style={{ marginBottom: 16, padding: "8px 14px", background: "rgba(0,225,220,0.05)", border: `1px solid ${cfg.fiscalColor}33`, borderRadius: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ color: cfg.fiscalColor }}>⚖️ Fiscalité {cfg.label} :</span>
            <span style={{ color: "#888" }}>{cfg.fiscalLabel}</span>
          </div>

          {reportMode === "advisor" && (
            <AdvisorOpportunityPanel opportunities={portfolioAdvisorOpportunities} lang={lang} />
          )}

          {/* Holdings Table */}
          <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333", textAlign: "left" }}>
                  <th style={{ padding: "10px 5px", color: "#888" }}>Ticker</th>
                  <th style={{ padding: "10px 5px", color: "#888" }}>Nom</th>
                  <th style={{ padding: "10px 5px", color: "#888" }}>Qté</th>
                  <th style={{ padding: "10px 5px", color: "#888" }}>PRU</th>
	                  <th style={{ padding: "10px 5px", color: "#888" }}>Cours</th>
	                  <th style={{ padding: "10px 5px", color: "#888" }}>Valeur</th>
	                  <th style={{ padding: "10px 5px", color: "#888" }}>P&L</th>
	                  <th style={{ padding: "10px 5px", color: "#888" }}>Exposition</th>
	                  <th style={{ padding: "10px 5px", color: "#888" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lineRows.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #222", background: expandedTx === l.id ? "rgba(106,142,201,0.1)" : "transparent" }}>
                    <td style={{ padding: "10px 5px", fontWeight: "bold" }}>{l.ticker}</td>
                    <td style={{ padding: "10px 5px", color: "#ccc" }}>{l.nom}</td>
                    <td style={{ padding: "10px 5px" }}>
                      {l._pendingQte
                        ? <span title={`${l._montant?.toLocaleString('fr-FR')}€ réservés — cliquez "Actualiser prix" pour calculer les parts`} style={{ color: "#00E1DC", fontSize: 11, fontStyle: "italic" }}>⏳ Montant réservé</span>
                        : (parseFloat(l.qte || 0)).toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 5px", color: "#00E1DC" }}>{l._pendingQte ? <span style={{ color: "#00E1DC" }}>{(l._montant || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</span> : `${(parseFloat(l.pru || 0)).toFixed(2)} €`}</td>
                    <td style={{ padding: "10px 5px", color: "#6a8ec9" }}>{l._pendingQte ? <span style={{ color: "#888", fontSize: 11 }}>prix live à charger</span> : `${(parseFloat(l.prixActuel || 0)).toFixed(2)} €`}</td>
	                    <td style={{ padding: "10px 5px", fontWeight: "bold" }}>{l._pendingQte ? <span style={{ color: "#00E1DC" }}>{(l._montant || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</span> : `${(parseFloat(l.val || 0)).toFixed(2)} €`}</td>
	                    <td style={{ padding: "10px 5px", color: l.pnl >= 0 ? "#4a9e6b" : "#c96e6e" }}>{(parseFloat(l.pnl || 0)).toFixed(2)} € ({(parseFloat(l.pnl_pct || 0)).toFixed(1)}%)</td>
	                    <td style={{ padding: "10px 5px", color: "#888", fontSize: 11 }}>
	                      <div style={{ color:"#F5F7FA" }}>{l.intelligence.geography} · {l.intelligence.currency}</div>
	                      <div>{l.intelligence.sector} · {l.intelligence.risk}</div>
	                    </td>
	                    <td style={{ padding: "10px 5px" }}>
                      <button onClick={() => setExpandedTx(expandedTx === l.id ? null : l.id)} style={{ background: "none", border: "none", color: "#6a8ec9", cursor: "pointer", fontSize: 12 }}>
                        {expandedTx === l.id ? "▼" : "▶"} Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded Transaction View */}
          {expandedTx && (
            <div style={{ background: "rgba(106,142,201,0.05)", border: "1px solid rgba(106,142,201,0.3)", borderRadius: 8, padding: 15, marginBottom: 20 }}>
              {(() => {
                const line = lineRows.find(l => l.id === expandedTx);
                if (!line) return null;
                return (
                  <div>
                    <h4 style={{ marginBottom: 10 }}>{line.ticker} - {line.nom}</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 15 }}>
	                      <div><div style={{ fontSize: 11, color: "#888" }}>Catégorie</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{line.categorie}</div></div>
	                      <div><div style={{ fontSize: 11, color: "#888" }}>Cible</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{line.cible}%</div></div>
	                      <div><div style={{ fontSize: 11, color: "#888" }}>Montant Total</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{line.val.toFixed(2)} €</div></div>
	                      <div><div style={{ fontSize: 11, color: "#888" }}>PRU Total</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{line.pru_total.toFixed(2)} €</div></div>
	                      <div><div style={{ fontSize: 11, color: "#888" }}>Géographie</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{line.intelligence.geography}</div></div>
	                      <div><div style={{ fontSize: 11, color: "#888" }}>Secteur</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{line.intelligence.sector}</div></div>
	                      <div><div style={{ fontSize: 11, color: "#888" }}>Devise</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{line.intelligence.currency}</div></div>
	                      <div><div style={{ fontSize: 11, color: "#888" }}>Risque / Style</div><div style={{ fontSize: 13, fontWeight: "bold" }}>{line.intelligence.risk} · {line.intelligence.style}</div></div>
                    </div>

                    <div style={{ marginBottom: 15 }}>
                      <h5 style={{ marginBottom: 10, fontSize: 12 }}>Transactions</h5>
                      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 10, maxHeight: 200, overflowY: "auto" }}>
                        {(line.transactions || []).length === 0 ? (
                          <div style={{ color: "#666", fontSize: 12 }}>Aucune transaction</div>
                        ) : (
                          (line.transactions || []).map(tx => (
                            <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #333", fontSize: 12 }}>
                              <div>
                                <span style={{ color: tx.type === "achat" ? "#4a9e6b" : "#c96e6e" }}>{tx.type === "achat" ? "+" : "-"}{tx.qte.toFixed(2)}u @ {tx.prix.toFixed(2)}€</span>
                                <span style={{ color: "#666", marginLeft: 10 }}>{tx.date}</span>
                                {tx.note && <span style={{ color: "#999", marginLeft: 10, fontSize: 11 }}>({tx.note})</span>}
                              </div>
                              <button onClick={() => removeTransaction(line.id, tx.id)} style={{ background: "rgba(201,110,110,0.2)", border: "1px solid rgba(201,110,110,0.4)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: "#c96e6e", fontSize: 11 }}>
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Transaction Form */}
                      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
                        <input type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} style={{ padding: "6px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
                        <select value={newTx.type} onChange={e => setNewTx({ ...newTx, type: e.target.value })} style={{ padding: "6px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }}>
                          <option value="achat">Achat</option>
                          <option value="vente">Vente</option>
                        </select>
                        <input type="number" placeholder="Qté" value={newTx.qte} onChange={e => setNewTx({ ...newTx, qte: e.target.value })} style={{ padding: "6px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
                        <input type="number" placeholder="Prix" value={newTx.prix} onChange={e => setNewTx({ ...newTx, prix: e.target.value })} style={{ padding: "6px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
                        <button onClick={() => addTransaction(line.id)} style={{ background: "rgba(106,142,201,0.2)", border: "1px solid rgba(106,142,201,0.4)", borderRadius: 4, padding: "6px", cursor: "pointer", color: "#6a8ec9", fontSize: 12, fontFamily: "inherit" }}>
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Bannière : convertir cash → allocation */}
          {(() => {
            const cashLine = lines.find(l => l.categorie === "Cash" || l.ticker === "CASH");
            const investLines = lines.filter(l => l.id !== (cashLine?.id) && parseFloat(l.cible || 0) > 0 && parseFloat(l.qte || 0) === 0);
            if (!cashLine || investLines.length === 0) return null;
            const cashMontant = parseFloat(cashLine.pru || 0) * parseFloat(cashLine.qte || 1);
            return (
              <div style={{ background: "linear-gradient(135deg, rgba(74,158,107,0.1), rgba(106,142,201,0.08))", border: "1px solid rgba(74,158,107,0.4)", borderRadius: 10, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: "bold", color: "#4a9e6b", fontSize: 14, marginBottom: 4 }}>
                    💡 {cashMontant.toLocaleString('fr-FR')}€ de cash à investir · {investLines.length} ligne{investLines.length > 1 ? "s" : ""} en attente
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    Répartit automatiquement le cash selon les % cibles proposés par l'agent
                  </div>
                </div>
                <button onClick={() => {
                  const totalCible = investLines.reduce((s, l) => s + parseFloat(l.cible || 0), 0);
                  if (totalCible === 0) { alert("Les % cibles sont tous à 0."); return; }
                  const recap = investLines.map(l => {
                    const pct = parseFloat(l.cible) / totalCible;
                    const montant = cashMontant * pct;
                    const prix = parseFloat(l.prixActuel) || 0;
                    if (prix > 0) {
                      // Prix connu : calcul direct de la quantité réelle
                      const qte = Math.round((montant / prix) * 10000) / 10000;
                      return { ...l, qte, pru: prix, prixActuel: prix };
                    } else {
                      // Prix inconnu : on stocke le montant cible, qte sera calculée automatiquement
                      // quand l'utilisateur cliquera "Actualiser prix"
                      return { ...l, qte: 0, pru: 0, prixActuel: 0, _pendingQte: true, _montant: montant };
                    }
                  });
                  const lignesSansCash = lines.filter(l => l.id !== cashLine.id && !investLines.find(il => il.id === l.id));
                  const msg = investLines.map(l => {
                    const pct = parseFloat(l.cible) / totalCible;
                    return `• ${l.ticker} : ${Math.round(cashMontant * pct).toLocaleString('fr-FR')}€ (${l.cible}%)`;
                  }).join("\n");
                  if (!window.confirm(`Convertir ${cashMontant.toLocaleString('fr-FR')}€ en :\n${msg}\n\nLe cash sera supprimé. Confirmer ?`)) return;
                  setLines([...lignesSansCash, ...recap]);
                }}
                  style={{ background: "linear-gradient(135deg, #4a9e6b, #2d6b47)", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: "bold", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  💸 Convertir le cash en allocation
                </button>
              </div>
            );
          })()}

          {/* Bannière : prix en attente → quantités non calculées */}
          {hasPendingQte && (
            <div style={{ background: "rgba(0,225,220,0.08)", border: "1px solid rgba(0,225,220,0.35)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <span style={{ color: "#00E1DC", fontWeight: "bold", fontSize: 13 }}>⏳ Quantités en attente</span>
                <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>
                  Les montants sont réservés — cliquez "Actualiser prix" pour calculer le nombre de parts réel
                </span>
              </div>
              <button onClick={refreshAllPrices}
                style={{ background: "linear-gradient(135deg, #00E1DC, #007A78)", border: "none", borderRadius: 7, padding: "8px 16px", cursor: "pointer", color: "#1a1208", fontSize: 12, fontWeight: "bold", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                🔄 Actualiser prix maintenant
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={refreshAllPrices} style={{ background: "rgba(106,142,201,0.2)", border: "1px solid rgba(106,142,201,0.4)", borderRadius: 6, padding: "8px 12px", cursor: "pointer", color: "#6a8ec9", fontSize: 12, fontFamily: "inherit" }}>
              🔄 Actualiser prix
            </button>
            <button onClick={() => setPerfHistory([...perfHistory, { date: new Date().toISOString().slice(0,10), totalVal: totalActuel }])} style={{ background: "rgba(0,225,220,0.2)", border: "1px solid rgba(0,225,220,0.4)", borderRadius: 6, padding: "8px 12px", cursor: "pointer", color: "#00E1DC", fontSize: 12, fontFamily: "inherit" }}>
              📈 Snapshot
            </button>
            <button onClick={() => setShowTestPanel(!showTestPanel)} style={{ background: "rgba(168,196,232,0.2)", border: "1px solid rgba(168,196,232,0.4)", borderRadius: 6, padding: "8px 12px", cursor: "pointer", color: "#a8c4e8", fontSize: 12, fontFamily: "inherit" }}>
              🔧 Test Web Search
            </button>
            <button onClick={() => { if (window.confirm(`Vider toutes les lignes du ${cfg.label} ? Vos données seront supprimées.`)) { setLines([]); localStorage.setItem(`${cfg.prefix}_lines`, "[]"); setActiveTab("chat"); setInput(`Je veux créer une allocation complète pour mon ${cfg.label}. Propose-moi une allocation diversifiée avec les montants à investir selon les ETF disponibles sur ${cfg.label === "PEA" ? "le PEA (ETF éligibles Euronext Paris)" : cfg.label === "CTO" ? "un CTO (actions monde + ETF)" : "une Assurance Vie (fonds euros + UC)"}. Précise pour chaque ligne : ticker, nom, catégorie, % cible, et si possible un montant de départ.`); } }} style={{ background: "rgba(224,85,85,0.15)", border: "1px solid rgba(224,85,85,0.4)", borderRadius: 6, padding: "8px 12px", cursor: "pointer", color: "#e05555", fontSize: 12, fontFamily: "inherit" }}>
              🗑️ Vider + Nouvelle allocation
            </button>
          </div>

          {/* Test Panel Modal */}
          {showTestPanel && (
            <div style={{ background: "rgba(0,0,0,0.7)", borderRadius: 8, padding: 15, marginBottom: 20, border: "1px solid #333" }}>
              <h4 style={{ marginBottom: 15 }}>Test de la web search prix</h4>
              {testResults && (
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 10, marginBottom: 15, maxHeight: 300, overflowY: "auto", fontSize: 12 }}>
                  {Object.entries(testResults).map(([ticker, res]) => (
                    <div key={ticker} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #333" }}>
                      <div style={{ fontWeight: "bold", marginBottom: 5 }}>{ticker}</div>
                      {res.error ? (
                        <div style={{ color: "#c96e6e" }}>❌ {res.error}</div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                          <div>{res.yahoo}</div>
                          <div>{res.euronext}</div>
                          <div>{res.boursorama}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: "rgba(106,142,201,0.1)", border: "1px solid rgba(106,142,201,0.3)", borderRadius: 6, padding: 10, marginBottom: 15, fontSize: 12 }}>
                {(() => {
                  if (!testResults) return "Cliquez 'Relancer' pour tester les sources";
                  // Compter les sources individuelles (yahoo/euronext/boursorama) qui fonctionnent
                  const allVals = Object.values(testResults).flatMap(r => [r.yahoo, r.euronext, r.boursorama].filter(Boolean));
                  const ok = allVals.filter(v => typeof v === "string" && v.startsWith("✅")).length;
                  const total = allVals.length;
                  if (ok === 0) return "⛔ Aucune résultat web disponible — les prix live ne peuvent pas être récupérés. Vérifiez votre connexion ou entrez les prix manuellement.";
                  if (ok === total) return `✅ Toutes les sources fonctionnent (${ok}/${total}) — les prix indicatifs seront extraits de la web search.`;
                  return `⚠️ ${ok}/${total} résultats web disponibles — les prix indicatifs seront basés sur ${ok === 1 ? "la seule résultat web disponible" : "les sources OK"}.`;
                })()}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => { setTestResults(null); runSourceTests(); }} disabled={testRunning}
                  style={{ background: testRunning ? "rgba(106,142,201,0.15)" : "rgba(106,142,201,0.2)", border: "1px solid rgba(106,142,201,0.4)", borderRadius: 8, padding: "8px 18px", cursor: testRunning ? "not-allowed" : "pointer", color: testRunning ? "#555" : "#6a8ec9", fontSize: 13, fontFamily: "inherit" }}>
                  {testRunning ? "⏳ Test en cours…" : "↻ Relancer"}
                </button>
                <button onClick={() => setShowTestPanel(false)}
                  style={{ background: "rgba(0,225,220,0.12)", border: "1px solid rgba(0,225,220,0.3)", borderRadius: 8, padding: "8px 18px", cursor: "pointer", color: "#00E1DC", fontSize: 13, fontFamily: "inherit" }}>
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", height: "500px" }}>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 15, background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: 10 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: 10, padding: 8, background: msg.role === "user" ? "rgba(106,142,201,0.15)" : "rgba(74,158,107,0.1)", borderRadius: 6, fontSize: 12 }}>
                <div style={{ color: msg.role === "user" ? "#6a8ec9" : "#4a9e6b", fontWeight: "bold", marginBottom: 4 }}>{msg.role === "user" ? "Vous" : "Agent"}</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                <div style={{ color: "#666", fontSize: 10, marginTop: 4 }}>{msg.ts}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ marginBottom: 10 }}>
            {QUICK_PROMPTS_VAR.slice(0, 4).map((prompt, idx) => (
              <button key={idx} onClick={() => sendMessage(prompt.text)} style={{ marginRight: 8, marginBottom: 8, background: "var(--sia-glass-strong)", border: "1px solid var(--sia-glass-border)", borderRadius: "var(--sia-radius-lg)", padding: "6px 10px", cursor: "pointer", color: "var(--sia-teal-800)", fontSize: 11, fontFamily: "inherit" }}>
                {prompt.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={cfg.placeholderChat}
              style={{ flex: 1, padding: 10, background: "#1a1a1f", border: "1px solid #333", borderRadius: 6, color: "#fff", resize: "vertical", fontFamily: "inherit", minHeight: 60 }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ background: loading ? "rgba(106,142,201,0.1)" : "rgba(106,142,201,0.2)", border: "1px solid rgba(106,142,201,0.4)", borderRadius: 6, padding: "10px 20px", cursor: loading ? "not-allowed" : "pointer", color: loading ? "#555" : "#6a8ec9", fontSize: 12, fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {loading ? "⏳" : "▶"}
            </button>
          </div>
        </div>
      )}

      {/* Realloc Tab */}
      {activeTab === "realloc" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <button onClick={runRealloc} disabled={reallocLoading} style={{ background: reallocLoading ? "rgba(0,225,220,0.1)" : "rgba(0,225,220,0.2)", border: "1px solid rgba(0,225,220,0.4)", borderRadius: 6, padding: "10px 20px", cursor: reallocLoading ? "not-allowed" : "pointer", color: reallocLoading ? "#555" : "#00E1DC", fontSize: 13, fontFamily: "inherit" }}>
              {reallocLoading ? "⏳ Analyse en cours…" : "🔄 Lancer rééquilibrage"}
            </button>
          </div>
          {reallocResult && (
            <div style={{ background: "rgba(0,225,220,0.05)", border: "1px solid rgba(0,225,220,0.3)", borderRadius: 8, padding: 15 }}>
              <h4 style={{ marginBottom: 15 }}>Résultats du rééquilibrage</h4>
              <div style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#ccc" }}>{reallocResult}</div>
            </div>
          )}
        </div>
      )}

      {/* Add Tab */}
      {activeTab === "add" && (
        <div>
          {showAddForm ? (
            <div style={{ background: "rgba(106,142,201,0.1)", border: "1px solid rgba(106,142,201,0.3)", borderRadius: 8, padding: 15, marginBottom: 20 }}>
              <h4 style={{ marginBottom: 15 }}>Ajouter une ligne</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                <input type="text" placeholder="Ticker (ex: CW8)" value={newLine.ticker} onChange={e => setNewLine({ ...newLine, ticker: e.target.value.toUpperCase() })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
                <input type="text" placeholder="Nom" value={newLine.nom} onChange={e => setNewLine({ ...newLine, nom: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
                <input type="text" placeholder="Catégorie" value={newLine.categorie} onChange={e => setNewLine({ ...newLine, categorie: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
	                <input type="number" placeholder="Quantité" value={newLine.qte} onChange={e => setNewLine({ ...newLine, qte: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
	                <input type="number" placeholder="PRU" value={newLine.pru} onChange={e => setNewLine({ ...newLine, pru: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
	                <input type="number" placeholder="Prix Actuel" value={newLine.prixActuel} onChange={e => setNewLine({ ...newLine, prixActuel: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
	                <input type="text" placeholder="Géographie (ex: US, Europe)" value={newLine.geography} onChange={e => setNewLine({ ...newLine, geography: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
	                <input type="text" placeholder="Secteur (ex: Technology)" value={newLine.sector} onChange={e => setNewLine({ ...newLine, sector: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
	                <select value={newLine.currency} onChange={e => setNewLine({ ...newLine, currency: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }}>
	                  {["EUR","USD","GBP","CHF","JPY","Autre"].map(c => <option key={c} value={c}>{c}</option>)}
	                </select>
	                <select value={newLine.riskLevel} onChange={e => setNewLine({ ...newLine, riskLevel: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }}>
	                  {["Low","Medium","High"].map(r => <option key={r} value={r}>{r} risk</option>)}
	                </select>
	                <input type="text" placeholder="Style (growth/value/dividend)" value={newLine.style} onChange={e => setNewLine({ ...newLine, style: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
	                <input type="text" placeholder="Rating (optionnel)" value={newLine.rating} onChange={e => setNewLine({ ...newLine, rating: e.target.value })} style={{ padding: "8px", background: "#1a1a1f", border: "1px solid #333", borderRadius: 4, color: "#fff", fontSize: 12 }} />
	              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                <button onClick={addLine} style={{ background: "rgba(74,158,107,0.2)", border: "1px solid rgba(74,158,107,0.4)", borderRadius: 6, padding: "8px 15px", cursor: "pointer", color: "#4a9e6b", fontSize: 12, fontFamily: "inherit" }}>
                  ✓ Ajouter
                </button>
                <button onClick={() => setShowAddForm(false)} style={{ background: "rgba(201,110,110,0.2)", border: "1px solid rgba(201,110,110,0.4)", borderRadius: 6, padding: "8px 15px", cursor: "pointer", color: "#c96e6e", fontSize: 12, fontFamily: "inherit" }}>
                  ✕ Annuler
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddForm(true)} style={{ background: "rgba(106,142,201,0.2)", border: "1px solid rgba(106,142,201,0.4)", borderRadius: 6, padding: "10px 20px", cursor: "pointer", color: "#6a8ec9", fontSize: 13, fontFamily: "inherit" }}>
              + Ajouter une ligne
            </button>
          )}
        </div>
      )}
    </div>
  );
}
