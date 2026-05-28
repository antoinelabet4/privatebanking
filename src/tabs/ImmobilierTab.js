// Immobilier tab data constants, valuation helpers, and UI module.

const BLANK_BIEN = {
  id: null, adresse: "", ville: "", codePostal: "", typeBien: "appartement",
  surface: "", anneeAchat: new Date().getFullYear(),
  prixAchat: "", fraisNotaireAuto: true, fraisNotaireManuel: "", travaux: "",
  typeDetention: "personnel", sciNom: "", sciActionnaires: [{ nom: "", pct: 100 }],
  usage: "rp",
  loyerMensuelHC: "", chargesLoc: "", regimeFiscal: "micro_foncier",
  taxeFonciere: "", chargesCopro: "",
  valeurActuelle: "",
  montantEmprunt: "", tauxEmprunt: "", dureeEmprunt: "", dateDebutPret: "", assuranceEmprunt: "",
};

const USAGE_LABELS    = { rp: "Rés. principale", locatif: "Locatif", rs: "Rés. secondaire" };
const TYPE_BIEN_LABELS = { appartement: "Appartement", maison: "Maison", immeuble: "Immeuble", local: "Local/Bureau", terrain: "Terrain" };
const REGIME_LABELS   = { micro_foncier: "Micro-foncier", reel: "Régime réel", lmnp_micro: "LMNP Micro-BIC", lmnp_reel: "LMNP Réel" };
const USAGE_COLORS    = { rp: "#4a9e6b", locatif: "#00E1DC", rs: "#6a8ec9" };

// ── Table de référence DVF 2023-2024 (médiane €/m²) ── source: données DVF DGFiP
// Format: code_postal → { a: appart, m: maison } — null = peu de transactions
const DVF_REF = {
  // Paris
  "75001":{"a":14500,"m":null},"75002":{"a":13000,"m":null},"75003":{"a":13500,"m":null},
  "75004":{"a":14000,"m":null},"75005":{"a":13500,"m":null},"75006":{"a":14000,"m":null},
  "75007":{"a":14500,"m":null},"75008":{"a":13000,"m":null},"75009":{"a":11000,"m":null},
  "75010":{"a":10500,"m":null},"75011":{"a":10000,"m":null},"75012":{"a":9500,"m":null},
  "75013":{"a":9500,"m":null},"75014":{"a":10000,"m":null},"75015":{"a":10000,"m":null},
  "75016":{"a":12000,"m":null},"75017":{"a":10500,"m":null},"75018":{"a":9000,"m":null},
  "75019":{"a":8500,"m":null},"75020":{"a":8500,"m":null},
  // Hauts-de-Seine (92)
  "92100":{"a":9000,"m":12000},"92200":{"a":11000,"m":14000},"92110":{"a":8500,"m":10500},
  "92120":{"a":6500,"m":8000},"92130":{"a":8000,"m":10000},"92140":{"a":6000,"m":7500},
  "92150":{"a":8500,"m":11000},"92160":{"a":6000,"m":7500},"92170":{"a":6500,"m":8000},
  "92190":{"a":5500,"m":6500},"92210":{"a":10000,"m":13000},"92220":{"a":7500,"m":9500},
  "92230":{"a":7000,"m":8500},"92240":{"a":5000,"m":6000},"92250":{"a":5500,"m":6500},
  "92260":{"a":5000,"m":6000},"92270":{"a":5500,"m":6500},"92290":{"a":5500,"m":6500},
  "92300":{"a":7000,"m":8500},"92310":{"a":4500,"m":5500},"92320":{"a":5000,"m":6000},
  "92330":{"a":5000,"m":6000},"92340":{"a":5000,"m":6000},"92350":{"a":5000,"m":6000},
  "92360":{"a":4500,"m":5500},"92370":{"a":5500,"m":6500},"92380":{"a":5000,"m":6000},
  "92390":{"a":5000,"m":6000},"92400":{"a":8000,"m":10500},"92410":{"a":5000,"m":6000},
  "92420":{"a":7000,"m":9000},"92430":{"a":5000,"m":6000},"92500":{"a":7000,"m":9000},
  "92600":{"a":6500,"m":8000},"92700":{"a":8000,"m":10500},"92800":{"a":5500,"m":6500},
  // Seine-Saint-Denis (93)
  "93000":{"a":3500,"m":3500},"93100":{"a":4000,"m":4500},"93110":{"a":3000,"m":3500},
  "93120":{"a":3500,"m":4000},"93130":{"a":2800,"m":3200},"93140":{"a":2800,"m":3200},
  "93150":{"a":3000,"m":3500},"93160":{"a":3000,"m":3500},"93170":{"a":2800,"m":3200},
  "93200":{"a":3000,"m":3500},"93210":{"a":2800,"m":3200},"93220":{"a":2800,"m":3200},
  "93230":{"a":3000,"m":3500},"93240":{"a":2500,"m":3000},"93250":{"a":2500,"m":3000},
  "93260":{"a":2500,"m":3000},"93270":{"a":2800,"m":3200},"93290":{"a":2500,"m":3000},
  "93300":{"a":3000,"m":3500},"93310":{"a":2500,"m":3000},"93320":{"a":2500,"m":3000},
  "93330":{"a":3000,"m":3500},"93340":{"a":2800,"m":3200},"93350":{"a":2800,"m":3200},
  "93360":{"a":2500,"m":3000},"93370":{"a":2800,"m":3200},"93380":{"a":2500,"m":3000},
  "93400":{"a":3500,"m":4000},"93420":{"a":2500,"m":3000},"93430":{"a":2500,"m":3000},
  "93500":{"a":3500,"m":4000},"93600":{"a":3000,"m":3500},"93700":{"a":3000,"m":3500},
  "93800":{"a":2800,"m":3200},
  // Val-de-Marne (94)
  "94000":{"a":5000,"m":6000},"94100":{"a":5000,"m":6000},"94110":{"a":5000,"m":6000},
  "94120":{"a":4500,"m":5500},"94130":{"a":5000,"m":6000},"94140":{"a":4000,"m":5000},
  "94150":{"a":5000,"m":6000},"94160":{"a":4500,"m":5500},"94170":{"a":4000,"m":5000},
  "94190":{"a":4500,"m":5500},"94200":{"a":5500,"m":7000},"94210":{"a":4000,"m":5000},
  "94220":{"a":4500,"m":5500},"94230":{"a":4500,"m":5500},"94240":{"a":4000,"m":5000},
  "94250":{"a":4000,"m":5000},"94260":{"a":4000,"m":5000},"94270":{"a":4000,"m":5000},
  "94290":{"a":4500,"m":5500},"94300":{"a":5500,"m":7000},"94320":{"a":4500,"m":5500},
  "94340":{"a":4500,"m":5500},"94350":{"a":5000,"m":6000},"94360":{"a":4500,"m":5500},
  "94370":{"a":4000,"m":5000},"94380":{"a":4000,"m":5000},"94400":{"a":6000,"m":8000},
  "94410":{"a":4000,"m":5000},"94420":{"a":4000,"m":5000},"94430":{"a":4000,"m":5000},
  "94440":{"a":4000,"m":5000},"94460":{"a":3500,"m":4500},"94470":{"a":3500,"m":4500},
  "94500":{"a":5000,"m":6500},"94510":{"a":3500,"m":4500},"94550":{"a":3500,"m":4500},
  "94600":{"a":5500,"m":7000},"94700":{"a":5000,"m":6500},"94800":{"a":5000,"m":6500},
  // Val-d'Oise (95) — sélection
  "95000":{"a":2800,"m":3200},"95100":{"a":2500,"m":3000},"95110":{"a":3000,"m":3500},
  "95130":{"a":3500,"m":4000},"95150":{"a":3000,"m":3500},"95200":{"a":3000,"m":3500},
  "95220":{"a":3500,"m":4000},"95300":{"a":2800,"m":3200},"95330":{"a":4000,"m":5000},
  "95370":{"a":4000,"m":5000},"95400":{"a":3500,"m":4000},"95500":{"a":3000,"m":3500},
  // Essonne (91) — sélection
  "91000":{"a":2800,"m":3200},"91100":{"a":2500,"m":3000},"91140":{"a":3000,"m":3500},
  "91170":{"a":3000,"m":3500},"91200":{"a":2800,"m":3200},"91230":{"a":4000,"m":5000},
  "91250":{"a":3500,"m":4000},"91300":{"a":2500,"m":3000},"91380":{"a":2800,"m":3200},
  "91400":{"a":2800,"m":3200},"91600":{"a":2500,"m":3000},
  // Yvelines (78) — sélection
  "78000":{"a":5500,"m":7000},"78100":{"a":3500,"m":4500},"78150":{"a":4000,"m":5500},
  "78160":{"a":3500,"m":4500},"78200":{"a":4000,"m":5500},"78230":{"a":4000,"m":5500},
  "78300":{"a":3500,"m":4500},"78360":{"a":3000,"m":4000},"78400":{"a":3500,"m":4500},
  "78500":{"a":5500,"m":7000},"78600":{"a":3500,"m":4500},"78700":{"a":3000,"m":4000},
  // Seine-et-Marne (77) — sélection
  "77000":{"a":2800,"m":3200},"77100":{"a":2500,"m":3000},"77300":{"a":2800,"m":3200},
  "77390":{"a":2800,"m":3200},"77400":{"a":3000,"m":3500},"77700":{"a":2800,"m":3200},
  // Lyon
  "69001":{"a":5500,"m":null},"69002":{"a":5500,"m":null},"69003":{"a":4500,"m":5500},
  "69004":{"a":4500,"m":5500},"69005":{"a":5000,"m":6000},"69006":{"a":5000,"m":6000},
  "69007":{"a":4500,"m":5500},"69008":{"a":4000,"m":5000},"69009":{"a":4000,"m":5000},
  "69100":{"a":4000,"m":5000},"69120":{"a":3500,"m":4500},"69130":{"a":4500,"m":5500},
  "69160":{"a":4500,"m":5500},"69300":{"a":4000,"m":5000},"69500":{"a":4000,"m":5000},
  // Marseille
  "13001":{"a":4500,"m":4000},"13002":{"a":3000,"m":3000},"13003":{"a":2500,"m":2500},
  "13004":{"a":2500,"m":2500},"13005":{"a":3500,"m":3500},"13006":{"a":5000,"m":5000},
  "13007":{"a":5000,"m":5500},"13008":{"a":4000,"m":4500},"13009":{"a":3000,"m":3500},
  "13010":{"a":2500,"m":2800},"13011":{"a":2500,"m":2800},"13012":{"a":2500,"m":2800},
  "13013":{"a":2000,"m":2500},"13014":{"a":2000,"m":2500},"13015":{"a":2000,"m":2500},
  "13016":{"a":2000,"m":2200},
  "13090":{"a":4000,"m":5000},"13100":{"a":4000,"m":5000},"13109":{"a":4000,"m":5000},
  "13290":{"a":3500,"m":4500},"13300":{"a":3500,"m":4000},"13400":{"a":3000,"m":3500},
  "13500":{"a":3000,"m":3500},"13600":{"a":3000,"m":3500},"13700":{"a":4000,"m":5500},
  "13800":{"a":3500,"m":4500},"13820":{"a":3500,"m":4500},
  // Bordeaux
  "33000":{"a":4000,"m":5000},"33100":{"a":4500,"m":5500},"33110":{"a":3500,"m":4500},
  "33150":{"a":4000,"m":5000},"33160":{"a":3500,"m":4500},"33170":{"a":3000,"m":4000},
  "33200":{"a":3500,"m":4500},"33300":{"a":4000,"m":5000},"33310":{"a":3000,"m":3500},
  "33400":{"a":3500,"m":4500},"33600":{"a":2800,"m":3500},"33700":{"a":3000,"m":4000},
  "33800":{"a":3000,"m":3500},
  // Toulouse
  "31000":{"a":3500,"m":3500},"31100":{"a":3500,"m":3500},"31200":{"a":3000,"m":3000},
  "31300":{"a":2800,"m":3000},"31400":{"a":3000,"m":3500},"31500":{"a":3000,"m":3500},
  "31520":{"a":2800,"m":3200},"31700":{"a":2800,"m":3500},
  // Nice & Côte d'Azur
  "06000":{"a":5000,"m":5500},"06100":{"a":3500,"m":4500},"06200":{"a":5500,"m":6500},
  "06300":{"a":4000,"m":5000},"06400":{"a":5000,"m":6000},"06500":{"a":4000,"m":5000},
  "06600":{"a":4500,"m":5500},"06700":{"a":3500,"m":4500},"06800":{"a":3500,"m":4500},
  "06000":{"a":5000,"m":5500},"06130":{"a":4000,"m":5000},"06140":{"a":3500,"m":4000},
  "06150":{"a":3500,"m":4500},"06160":{"a":3500,"m":4500},"06190":{"a":4000,"m":5500},
  "06210":{"a":4000,"m":5000},"06220":{"a":5500,"m":7000},"06230":{"a":3000,"m":4000},
  "06240":{"a":3500,"m":4500},"06250":{"a":4500,"m":5500},"06260":{"a":3500,"m":4500},
  "06270":{"a":4500,"m":5500},"06300":{"a":4000,"m":5000},"06320":{"a":4000,"m":5000},
  "06330":{"a":3500,"m":4500},"06340":{"a":3500,"m":4500},"06360":{"a":4000,"m":5000},
  "06370":{"a":4500,"m":5500},"06380":{"a":3500,"m":4500},"06390":{"a":3000,"m":4000},
  "06410":{"a":3500,"m":4000},"06430":{"a":3500,"m":4000},"06440":{"a":3500,"m":4500},
  "06450":{"a":3000,"m":4000},"06460":{"a":3500,"m":4000},"06480":{"a":3500,"m":4000},
  "06490":{"a":4000,"m":5000},"06510":{"a":3500,"m":4000},"06530":{"a":3500,"m":4000},
  "06540":{"a":3500,"m":4000},"06550":{"a":3500,"m":4000},"06560":{"a":5000,"m":6500},
  "06570":{"a":4000,"m":5000},"06580":{"a":4500,"m":5500},"06590":{"a":5000,"m":6500},
  "06610":{"a":3500,"m":4500},"06620":{"a":3000,"m":4000},"06630":{"a":5000,"m":6000},
  "06640":{"a":3000,"m":4000},"06650":{"a":3000,"m":4000},"06670":{"a":3500,"m":4000},
  "06690":{"a":3500,"m":4500},"06700":{"a":3500,"m":4000},"06710":{"a":3000,"m":4000},
  "06720":{"a":3500,"m":4500},"06730":{"a":3000,"m":3500},"06740":{"a":3500,"m":4000},
  "06750":{"a":3500,"m":4500},"06800":{"a":3500,"m":4500},
  // Nantes
  "44000":{"a":3500,"m":4000},"44100":{"a":3000,"m":3500},"44200":{"a":3500,"m":4000},
  "44300":{"a":3000,"m":3500},"44400":{"a":2500,"m":3000},"44700":{"a":3000,"m":3500},
  "44800":{"a":3500,"m":4500},"44980":{"a":3500,"m":4500},
  // Strasbourg
  "67000":{"a":3000,"m":3500},"67100":{"a":2500,"m":3000},"67200":{"a":2800,"m":3200},
  "67300":{"a":2000,"m":2500},"67400":{"a":2000,"m":2500},"67500":{"a":2500,"m":3000},
  "67540":{"a":3500,"m":4500},
  // Lille & Métropole
  "59000":{"a":3000,"m":3000},"59100":{"a":2500,"m":2800},"59130":{"a":2800,"m":3000},
  "59160":{"a":2200,"m":2500},"59170":{"a":2500,"m":2800},"59200":{"a":2500,"m":2800},
  "59260":{"a":2800,"m":3200},"59300":{"a":2000,"m":2200},"59350":{"a":2500,"m":2800},
  "59400":{"a":2500,"m":2800},"59500":{"a":2000,"m":2200},"59700":{"a":2800,"m":3200},
  "59800":{"a":2500,"m":2800},
  // Rennes
  "35000":{"a":3500,"m":4000},"35100":{"a":3000,"m":3500},"35200":{"a":3000,"m":3500},
  "35700":{"a":2800,"m":3200},"35800":{"a":2500,"m":3000},"35760":{"a":3000,"m":3500},
  // Montpellier
  "34000":{"a":3500,"m":3500},"34070":{"a":3000,"m":3500},"34080":{"a":2800,"m":3200},
  "34090":{"a":3000,"m":3500},"34170":{"a":2800,"m":3200},"34430":{"a":2500,"m":3000},
  // Grenoble
  "38000":{"a":2800,"m":3000},"38100":{"a":2500,"m":2800},"38130":{"a":2000,"m":2500},
  "38240":{"a":2800,"m":3200},"38330":{"a":2800,"m":3200},"38400":{"a":2500,"m":3000},
  // Toulon
  "83000":{"a":3000,"m":3500},"83100":{"a":2800,"m":3200},"83200":{"a":2500,"m":3000},
  "83400":{"a":3000,"m":3500},"83500":{"a":4000,"m":5000},"83600":{"a":2500,"m":3000},
  // Biarritz / Pays Basque
  "64100":{"a":4000,"m":5000},"64200":{"a":3500,"m":4500},"64600":{"a":5000,"m":6500},
  "64700":{"a":3500,"m":4500},"64000":{"a":2200,"m":2500},
  // Annecy
  "74000":{"a":5000,"m":6000},"74100":{"a":4500,"m":5500},"74200":{"a":5500,"m":7000},
  "74300":{"a":4500,"m":5500},"74400":{"a":4500,"m":5500},"74500":{"a":4000,"m":5000},
  "74600":{"a":4000,"m":5000},"74700":{"a":4000,"m":5000},"74800":{"a":4500,"m":5500},
  "74940":{"a":5000,"m":6500},"74960":{"a":4500,"m":5500},
  // Angers
  "49000":{"a":2800,"m":3000},"49100":{"a":2500,"m":2800},"49300":{"a":2200,"m":2500},
  // Reims
  "51100":{"a":2200,"m":2500},"51430":{"a":2000,"m":2200},
  // Saint-Étienne
  "42000":{"a":1200,"m":1500},"42100":{"a":1200,"m":1500},"42230":{"a":1500,"m":2000},
  // Tours
  "37000":{"a":2800,"m":3000},"37100":{"a":2500,"m":2800},"37200":{"a":2500,"m":2800},
  "37300":{"a":2500,"m":2800},
  // Clermont-Ferrand
  "63000":{"a":2200,"m":2500},"63100":{"a":2000,"m":2200},"63170":{"a":2000,"m":2200},
  // Dijon
  "21000":{"a":2500,"m":3000},"21100":{"a":2000,"m":2500},"21200":{"a":2000,"m":2500},
  // Le Havre
  "76600":{"a":2000,"m":2200},"76620":{"a":1800,"m":2000},"76700":{"a":2000,"m":2200},
  // Rouen
  "76000":{"a":2500,"m":2800},"76100":{"a":2200,"m":2500},"76300":{"a":2000,"m":2200},
  "76130":{"a":2200,"m":2500},"76160":{"a":2200,"m":2500},"76230":{"a":2000,"m":2200},
  // Caen
  "14000":{"a":2500,"m":2800},"14200":{"a":2000,"m":2200},"14400":{"a":2000,"m":2200},
  // Brest
  "29200":{"a":2000,"m":2200},"29800":{"a":1800,"m":2000},"29300":{"a":1800,"m":2000},
  // Lorient
  "56100":{"a":2200,"m":2500},"56850":{"a":2000,"m":2200},
  // Vannes
  "56000":{"a":3000,"m":3500},"56890":{"a":2500,"m":3000},
  // Quimper
  "29000":{"a":2200,"m":2500},
  // La Rochelle
  "17000":{"a":4000,"m":5000},"17100":{"a":3500,"m":4500},"17138":{"a":3500,"m":4500},
  "17140":{"a":3000,"m":4000},"17200":{"a":3500,"m":4500},"17300":{"a":2800,"m":3500},
  "17440":{"a":4000,"m":5500},"17470":{"a":4000,"m":5500},
  // Poitiers
  "86000":{"a":2200,"m":2500},"86280":{"a":2000,"m":2200},
  // Limoges
  "87000":{"a":1500,"m":2000},"87100":{"a":1500,"m":2000},"87280":{"a":1500,"m":1800},
  // Amiens
  "80000":{"a":2200,"m":2500},"80080":{"a":2000,"m":2200},"80090":{"a":2000,"m":2200},
  // Versailles + châteaux
  "78000":{"a":5500,"m":7000},"78150":{"a":4000,"m":5500},"78170":{"a":2500,"m":3000},
  // Metz
  "57000":{"a":2200,"m":2500},"57070":{"a":2000,"m":2200},"57155":{"a":2000,"m":2200},
  // Nancy
  "54000":{"a":2500,"m":2800},"54100":{"a":2000,"m":2200},"54520":{"a":2000,"m":2200},
  // Besançon
  "25000":{"a":2200,"m":2500},"25200":{"a":2000,"m":2200},"25300":{"a":2000,"m":2200},
  // Orléans
  "45000":{"a":2200,"m":2500},"45100":{"a":2000,"m":2200},"45400":{"a":2000,"m":2200},
  // Pau
  "64000":{"a":2200,"m":2500},
  // Perpignan
  "66000":{"a":2000,"m":2200},"66100":{"a":2000,"m":2200},"66140":{"a":2500,"m":3000},
};
// Cherche le prix DVF dans la table statique (fallback garanti)
function getDVFStatic(codePostal, typeBien) {
  const entry = DVF_REF[codePostal];
  if (!entry) return null;
  const isAppart = ["appartement","immeuble"].includes(typeBien);
  const price = isAppart ? entry.a : entry.m;
  return price ? { median: price, p25: Math.round(price * 0.83), p75: Math.round(price * 1.17), isStatic: true } : null;
}

function ImmoModule({ biens, setBiens, reportMode = "advisor", lang = "fr" }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [form, setForm] = useState(BLANK_BIEN);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [dvfEstimate, setDvfEstimate] = useState(null);
  const [dvfLoading, setDvfLoading] = useState(false);
  const debounceRef = useRef(null);

  const setF = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // ── Autocomplétion adresse (BAN API) ──
  async function searchAddresses(query) {
    if (!query || query.length < 3) { setAddressSuggestions([]); return; }
    setAddressLoading(true);
    try {
      const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=7`);
      const data = await r.json();
      setAddressSuggestions(data.features || []);
    } catch { setAddressSuggestions([]); }
    setAddressLoading(false);
  }
  function onAddressInput(val) {
    setF("adresse", val);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddresses(val), 320);
  }
  function selectAddress(feature) {
    const p = feature.properties;
    setF("adresse", p.name || "");
    setF("ville", p.city || "");
    setF("codePostal", p.postcode || "");
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setDvfEstimate(null);
  }

  // ── Estimation DVF (prix/m²) — 3 stratégies en cascade ──
  async function fetchDVFPrices() {
    const cp = form.codePostal;
    const surf = parseFloat(form.surface);
    if (!cp) return;
    setDvfLoading(true);
    setDvfEstimate(null);

    const typeMap = { appartement:"Appartement", maison:"Maison", immeuble:"Maison", local:"Local", terrain:"Dépendance" };
    const typeLocal = typeMap[form.typeBien] || "Appartement";
    const tout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
    const safeFetch = async (url, ms=10000) => {
      const r = await Promise.race([fetch(url), tout(ms)]);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    };

    let rows = null;
    const log = [];

    // Stratégie 1 : api.cquest.org
    const cqUrl = `https://api.cquest.org/dvf?code_postal=${cp}&type_local=${encodeURIComponent(typeLocal)}&nature_mutation=Vente`;
    try {
      const d = await safeFetch(cqUrl, 8000);
      rows = d.resultats || d.features || [];
      log.push("cquest OK");
    } catch(e) { log.push(`cquest: ${e.message}`); }

    // Stratégie 2 : tabular-api data.gouv.fr avec resource ID dynamique
    if (!rows || rows.length === 0) {
      try {
        const ds = await safeFetch(`https://www.data.gouv.fr/api/1/datasets/demandes-de-valeurs-foncieres-geolocalisees/`, 8000);
        const allRes = ds.resources || [];
        const csvRes = allRes
          .filter(r => r.format && ["csv","txt","CSV","TXT"].includes(r.format))
          .sort((a, b) => new Date(b.created_at||0) - new Date(a.created_at||0))[0];
        if (!csvRes) throw new Error("no resource");
        const tabUrl = `https://tabular-api.data.gouv.fr/api/resources/${csvRes.id}/data/?code_postal__exact=${cp}&type_local__exact=${encodeURIComponent(typeLocal)}&nature_mutation__exact=Vente&page_size=200`;
        const td = await safeFetch(tabUrl, 15000);
        rows = td.data || td.results || [];
        log.push(`tabular OK`);
      } catch(e) { log.push(`tabular: ${e.message}`); }
    }

    // Stratégie 3 : corsproxy.io → api.cquest.org
    if (!rows || rows.length === 0) {
      try {
        const d = await safeFetch(`https://corsproxy.io/?${encodeURIComponent(cqUrl)}`, 10000);
        rows = d.resultats || d.features || [];
        log.push("proxy OK");
      } catch(e) { log.push(`proxy: ${e.message}`); }
    }

    // — Stratégie 4 : données DVF statiques embarquées (fallback garanti)
    if (!rows || rows.length === 0) {
      const staticRef = getDVFStatic(cp, form.typeBien);
      if (staticRef) {
        const estimTotal = surf > 0 ? Math.round(staticRef.median * surf) : null;
        setDvfEstimate({ ...staticRef, mean: staticRef.median, count: null, estimTotal });
        setDvfLoading(false); return;
      }
      setDvfEstimate({ error: `Aucune donnée disponible pour le code postal ${cp}. Saisissez la valeur manuellement.`, count: 0 });
      setDvfLoading(false); return;
    }

    const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 2);
    const recent = rows.filter(row => !row.date_mutation || new Date(row.date_mutation) >= cutoff);
    const source = recent.length >= 10 ? recent : rows;
    const prices = source.map(row => {
      const val = parseFloat(row.valeur_fonciere);
      const s   = parseFloat(row.surface_reelle_bati);
      return (val > 0 && s > 10) ? Math.round(val / s) : null;
    }).filter(v => v && v > 500 && v < 40000);

    if (prices.length === 0) {
      const staticRef = getDVFStatic(cp, form.typeBien);
      if (staticRef) {
        const estimTotal = surf > 0 ? Math.round(staticRef.median * surf) : null;
        setDvfEstimate({ ...staticRef, mean: staticRef.median, count: null, estimTotal });
        setDvfLoading(false); return;
      }
      setDvfEstimate({ error: `Aucune vente valide trouvée pour ${cp}.`, count: 0 });
      setDvfLoading(false); return;
    }
    prices.sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const mean   = Math.round(prices.reduce((s, v) => s + v, 0) / prices.length);
    const p25    = prices[Math.floor(prices.length * 0.25)];
    const p75    = prices[Math.floor(prices.length * 0.75)];
    const estimTotal = surf > 0 ? Math.round(median * surf) : null;
    const usedRecent = recent.length >= 10;
    setDvfEstimate({ median, mean, p25, p75, count: prices.length, estimTotal, usedRecent, src: log.join(" | ") });
    setDvfLoading(false);
  }

  // ── Helpers calcul ──
  const getFrais  = b => b.fraisNotaireAuto ? calcFraisNotaire(b.prixAchat) : (parseFloat(b.fraisNotaireManuel) || 0);
  const getCout   = b => (parseFloat(b.prixAchat) || 0) + getFrais(b) + (parseFloat(b.travaux) || 0);
  const getValeur = b => parseFloat(b.valeurActuelle) || getCout(b);
  const getDette  = b => b.montantEmprunt ? calcCapitalRestant(b.montantEmprunt, b.tauxEmprunt, b.dureeEmprunt, b.dateDebutPret) : 0;
  const getMens   = b => b.montantEmprunt ? calcMensualite(b.montantEmprunt, b.tauxEmprunt, b.dureeEmprunt) : 0;
  const getLoyer  = b => b.usage === "locatif" ? (parseFloat(b.loyerMensuelHC) || 0) : 0;
  const getCF     = b => getLoyer(b) - getMens(b) - (parseFloat(b.assuranceEmprunt)||0) - (parseFloat(b.chargesCopro)||0) - (parseFloat(b.taxeFonciere)||0)/12;
  const getRend   = b => getLoyer(b) > 0 && getCout(b) > 0 ? (getLoyer(b) * 12 / getCout(b)) * 100 : 0;

  // ── Totaux ──
  const totalValeur         = biens.reduce((s, b) => s + getValeur(b), 0);
  const totalDettes         = biens.reduce((s, b) => s + getDette(b), 0);
  const totalCapNet         = totalValeur - totalDettes;
  const totalCapInvesti     = biens.reduce((s, b) => s + Math.max(0, getCout(b) - (parseFloat(b.montantEmprunt)||0)), 0);
  const totalRevLocatif     = biens.filter(b => b.usage === "locatif").reduce((s, b) => s + getLoyer(b) * 12, 0);
  const totalCFAnn          = biens.reduce((s, b) => s + getCF(b) * 12, 0);
  const immoAdvisorOpportunities = buildImmoAdvisorOpportunities(biens, totalCapNet, lang);

  // ── CRUD ──
  function saveBien() {
    if (!form.adresse || !form.prixAchat) return;
    const b = { ...form, id: form.id || Date.now() };
    setBiens(prev => form.id ? prev.map(x => x.id === b.id ? b : x) : [...prev, b]);
    setForm(BLANK_BIEN); setActiveTab("biens");
  }
  function startEdit(b) { setForm({ ...BLANK_BIEN, ...b }); setActiveTab("ajouter"); }
  function deleteBien(id) { if (window.confirm("Supprimer ce bien ?")) setBiens(prev => prev.filter(b => b.id !== id)); }

  // ── Calculs live formulaire ──
  const formFrais   = form.fraisNotaireAuto ? calcFraisNotaire(form.prixAchat) : (parseFloat(form.fraisNotaireManuel)||0);
  const formCout    = (parseFloat(form.prixAchat)||0) + formFrais + (parseFloat(form.travaux)||0);
  const formMens    = calcMensualite(form.montantEmprunt, form.tauxEmprunt, form.dureeEmprunt);
  const formCRD     = calcCapitalRestant(form.montantEmprunt, form.tauxEmprunt, form.dureeEmprunt, form.dateDebutPret);
  const formRend    = form.usage === "locatif" && formCout > 0 ? (parseFloat(form.loyerMensuelHC)||0) * 12 / formCout * 100 : 0;
  const formCF      = (parseFloat(form.loyerMensuelHC)||0) - formMens - (parseFloat(form.assuranceEmprunt)||0) - (parseFloat(form.chargesCopro)||0) - (parseFloat(form.taxeFonciere)||0)/12;

  // ── Style helpers ──
  const inp = { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,225,220,0.25)", borderRadius: 6, padding: "7px 10px", color: "#F5F7FA", fontSize: 13, fontFamily: SIA_FONT_STACK, width: "100%" };
  const secTitle = (icon, label) => (
    <div style={{ fontSize: 10, color: "#00E1DC", letterSpacing: "0.12em", fontWeight: "bold", marginTop: 22, marginBottom: 12, paddingBottom: 7, borderBottom: "1px solid rgba(0,225,220,0.15)", display: "flex", alignItems: "center", gap: 6 }}>
      <span>{icon}</span>{label}
    </div>
  );

  return (
    <div style={{ minHeight: "calc(100vh - 116px)" }}>
      {/* ── Sous-onglets ── */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(0,225,220,0.15)", padding: "0 24px", background: "rgba(0,0,0,0.2)" }}>
        {[
          { id: "dashboard", label: "📊 Dashboard" },
          { id: "biens",     label: `🏠 Mes biens (${biens.length})` },
          { id: "ajouter",   label: form.id ? "✏️ Modifier" : "＋ Ajouter un bien" },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id !== "ajouter") setForm(BLANK_BIEN); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "12px 20px", fontSize: 13, color: activeTab === tab.id ? "#00E1DC" : "#666", borderBottom: activeTab === tab.id ? "2px solid #00E1DC" : "2px solid transparent", fontFamily: "inherit", letterSpacing: "0.05em" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════ DASHBOARD ════════════════ */}
      {activeTab === "dashboard" && (
        <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
          {reportMode === "advisor" && (
            <AdvisorOpportunityPanel opportunities={immoAdvisorOpportunities} lang={lang} />
          )}
          {biens.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🏠</div>
              <div style={{ fontSize: 16, color: "#888", marginBottom: 16 }}>Aucun bien immobilier enregistré</div>
              <button onClick={() => setActiveTab("ajouter")}
                style={{ background: "linear-gradient(135deg,#00E1DC,#007A78)", border: "none", borderRadius: 10, padding: "12px 28px", cursor: "pointer", color: "#000", fontWeight: "bold", fontSize: 14, fontFamily: "inherit" }}>
                ＋ Ajouter votre premier bien
              </button>
            </div>
          ) : (
            <>
              {/* KPI Row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 12 }}>
                {[
                  { label: "Valeur brute du parc",  value: Math.round(totalValeur).toLocaleString('fr-FR') + " €", color: "#00E1DC",  sub: `${biens.length} bien${biens.length > 1 ? "s" : ""}` },
                  { label: "Dettes restantes",       value: Math.round(totalDettes).toLocaleString('fr-FR') + " €", color: "#e09955",  sub: `Taux dette ${totalValeur > 0 ? (totalDettes/totalValeur*100).toFixed(1) : 0}%` },
                  { label: "Capital net",            value: Math.round(totalCapNet).toLocaleString('fr-FR') + " €", color: totalCapNet >= 0 ? "#4a9e6b" : "#e05555", sub: `Investi: ${Math.round(totalCapInvesti).toLocaleString('fr-FR')} €` },
                ].map((k, i) => (
                  <div key={i} style={{ background: "rgba(15,15,25,0.8)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em", marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>
              {/* KPI Row 2 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Revenus locatifs bruts/an", value: Math.round(totalRevLocatif).toLocaleString('fr-FR') + " €", color: "#00E1DC", sub: `${Math.round(totalRevLocatif/12).toLocaleString('fr-FR')} €/mois` },
                  { label: "Cash-flow net annuel",      value: (totalCFAnn >= 0 ? "+" : "") + Math.round(totalCFAnn).toLocaleString('fr-FR') + " €", color: totalCFAnn >= 0 ? "#4a9e6b" : "#e05555", sub: `${Math.round(totalCFAnn/12).toLocaleString('fr-FR')} €/mois` },
                  { label: "Plus-value latente totale", value: (totalValeur - biens.reduce((s,b)=>s+getCout(b),0) >= 0 ? "+" : "") + Math.round(totalValeur - biens.reduce((s,b)=>s+getCout(b),0)).toLocaleString('fr-FR') + " €", color: totalValeur - biens.reduce((s,b)=>s+getCout(b),0) >= 0 ? "#4a9e6b" : "#e05555", sub: "vs coût d'acquisition" },
                ].map((k, i) => (
                  <div key={i} style={{ background: "rgba(15,15,25,0.8)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em", marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>
              {/* Tableau récap */}
              <div style={{ background: "rgba(15,15,25,0.8)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 12, overflow: "auto" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,225,220,0.15)", fontSize: 12, color: "#00E1DC", letterSpacing: "0.08em", fontWeight: "bold" }}>RÉCAPITULATIF DU PARC</div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Bien</th>
                      <th>Usage</th><th>Surface</th>
                      <th>€/m² achat</th><th>€/m² actuel</th>
                      <th>Valeur act.</th>
                      <th>Capital restant dû</th><th>Capital net</th>
                      <th>Loyer HC/mois</th><th>Cash-flow/mois</th>
                      <th>Rendement brut</th><th>Plus-value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {biens.map(b => {
                      const val = getValeur(b), dette = getDette(b), pv = val - getCout(b), cf = getCF(b), rd = getRend(b);
                      const surf = parseFloat(b.surface) || 0;
                      const pm2Achat   = surf > 0 ? Math.round(getCout(b) / surf) : null;
                      const pm2Actuel  = surf > 0 ? Math.round(val / surf) : null;
                      const pm2Delta   = pm2Achat && pm2Actuel ? pm2Actuel - pm2Achat : null;
                      return (
                        <tr key={b.id} onClick={() => startEdit(b)} style={{ cursor: "pointer" }}>
                          <td style={{ textAlign: "left" }}>
                            <div style={{ fontWeight: "bold", fontSize: 12, color: "#F5F7FA" }}>{b.adresse}</div>
                            <div style={{ fontSize: 11, color: "#666" }}>{b.ville} · {TYPE_BIEN_LABELS[b.typeBien]}</div>
                            {b.typeDetention === "sci" && <div style={{ fontSize: 10, color: "#8e6ac9" }}>SCI {b.sciNom}</div>}
                          </td>
                          <td><span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 12, background: (USAGE_COLORS[b.usage]||"#888") + "22", color: USAGE_COLORS[b.usage]||"#888" }}>{USAGE_LABELS[b.usage]}</span></td>
                          <td style={{ fontFamily: "monospace" }}>{b.surface} m²</td>
                          <td style={{ fontFamily: "monospace", color: "#888" }}>{pm2Achat ? pm2Achat.toLocaleString('fr-FR') + " €" : "—"}</td>
                          <td style={{ fontFamily: "monospace" }}>
                            {pm2Actuel ? pm2Actuel.toLocaleString('fr-FR') + " €" : "—"}
                            {pm2Delta !== null && pm2Delta !== 0 && <span style={{ fontSize: 10, color: pm2Delta >= 0 ? "#4a9e6b" : "#e05555", marginLeft: 5 }}>{pm2Delta >= 0 ? "+" : ""}{pm2Delta.toLocaleString('fr-FR')}</span>}
                          </td>
                          <td style={{ fontFamily: "monospace" }}>{Math.round(val).toLocaleString('fr-FR')} €</td>
                          <td style={{ fontFamily: "monospace", color: dette > 0 ? "#e09955" : "#555" }}>{dette > 0 ? Math.round(dette).toLocaleString('fr-FR') + " €" : "—"}</td>
                          <td style={{ fontFamily: "monospace", color: "#4a9e6b" }}>{Math.round(val - dette).toLocaleString('fr-FR')} €</td>
                          <td style={{ fontFamily: "monospace" }}>{b.usage === "locatif" ? Math.round(getLoyer(b)).toLocaleString('fr-FR') + " €" : "—"}</td>
                          <td style={{ fontFamily: "monospace", color: cf >= 0 ? "#4a9e6b" : "#e05555" }}>{b.montantEmprunt ? (cf >= 0 ? "+" : "") + Math.round(cf) + " €" : "—"}</td>
                          <td style={{ fontFamily: "monospace", color: "#00E1DC" }}>{rd > 0 ? rd.toFixed(2) + "%" : "—"}</td>
                          <td style={{ fontFamily: "monospace", color: pv >= 0 ? "#4a9e6b" : "#e05555" }}>{pv !== 0 ? (pv >= 0 ? "+" : "") + Math.round(pv).toLocaleString('fr-FR') + " €" : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ padding: "10px 20px", fontSize: 11, color: "#555" }}>💡 Cliquez sur une ligne pour modifier le bien.</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════ MES BIENS ════════════════ */}
      {activeTab === "biens" && (
        <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={() => { setForm(BLANK_BIEN); setActiveTab("ajouter"); }}
              style={{ background: "linear-gradient(135deg,#00E1DC,#007A78)", border: "none", borderRadius: 8, padding: "9px 20px", cursor: "pointer", color: "#000", fontWeight: "bold", fontSize: 13, fontFamily: "inherit" }}>
              ＋ Ajouter un bien
            </button>
          </div>
          {biens.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>Aucun bien enregistré.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {biens.map(b => {
                const val = getValeur(b), dette = getDette(b), cf = getCF(b), rd = getRend(b);
                const surf = parseFloat(b.surface) || 0;
                const pm2Achat  = surf > 0 ? Math.round(getCout(b) / surf) : null;
                const pm2Actuel = surf > 0 ? Math.round(val / surf) : null;
                const pm2Delta  = pm2Achat && pm2Actuel ? pm2Actuel - pm2Achat : null;
                return (
                  <div key={b.id} style={{ background: "rgba(15,15,25,0.9)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 14, padding: 20, position: "relative" }}>
                    <span style={{ position: "absolute", top: 14, right: 14, fontSize: 10, padding: "2px 8px", borderRadius: 12, background: (USAGE_COLORS[b.usage]||"#888") + "22", color: USAGE_COLORS[b.usage]||"#888" }}>{USAGE_LABELS[b.usage]}</span>
                    <div style={{ fontSize: 14, fontWeight: "bold", color: "#F5F7FA", marginBottom: 3, paddingRight: 90 }}>{b.adresse}</div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>
                      {b.ville} {b.codePostal} · {TYPE_BIEN_LABELS[b.typeBien]} · {b.surface} m²
                      {b.typeDetention === "sci" && <span style={{ color: "#8e6ac9", marginLeft: 8 }}>SCI {b.sciNom}</span>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {[
                        { l: "VALEUR ACTUELLE", v: Math.round(val).toLocaleString('fr-FR') + " €", c: "#00E1DC" },
                        { l: "CAPITAL NET",     v: Math.round(val-dette).toLocaleString('fr-FR') + " €", c: "#4a9e6b" },
                        ...(b.usage === "locatif" ? [
                          { l: "LOYER HC/MOIS",    v: Math.round(getLoyer(b)) + " €", c: "#00E1DC" },
                          { l: "CASH-FLOW/MOIS",   v: (cf >= 0 ? "+" : "") + Math.round(cf) + " €", c: cf >= 0 ? "#4a9e6b" : "#e05555" },
                        ] : []),
                        ...(b.montantEmprunt ? [{ l: "CAPITAL RESTANT DÛ", v: Math.round(dette).toLocaleString('fr-FR') + " €", c: "#e09955" }] : []),
                        ...(rd > 0 ? [{ l: "RENDEMENT BRUT", v: rd.toFixed(2) + "%", c: "#00E1DC" }] : []),
                      ].map((k, i) => (
                        <div key={i} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>{k.l}</div>
                          <div style={{ fontSize: 14, fontWeight: "bold", color: k.c, fontFamily: "monospace" }}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                    {pm2Achat && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 8, fontSize: 12 }}>
                        <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em", marginRight: 2 }}>€/M²</span>
                        <span style={{ color: "#888", fontFamily: "monospace" }}>Achat : {pm2Achat.toLocaleString('fr-FR')} €</span>
                        <span style={{ color: "#444" }}>→</span>
                        <span style={{ fontFamily: "monospace", fontWeight: "bold", color: pm2Delta >= 0 ? "#4a9e6b" : "#e05555" }}>
                          Actuel : {pm2Actuel.toLocaleString('fr-FR')} €
                        </span>
                        {pm2Delta !== null && pm2Delta !== 0 && (
                          <span style={{ fontSize: 10, color: pm2Delta >= 0 ? "#4a9e6b" : "#e05555", marginLeft: 2 }}>
                            ({pm2Delta >= 0 ? "+" : ""}{pm2Delta.toLocaleString('fr-FR')} €)
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => startEdit(b)} style={{ flex: 1, background: "rgba(0,225,220,0.1)", border: "1px solid rgba(0,225,220,0.3)", borderRadius: 8, padding: "7px", cursor: "pointer", color: "#00E1DC", fontSize: 12, fontFamily: "inherit" }}>✏️ Modifier</button>
                      <button onClick={() => deleteBien(b.id)} style={{ background: "rgba(224,85,85,0.08)", border: "1px solid rgba(224,85,85,0.2)", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: "#e05555", fontSize: 14, fontFamily: "inherit" }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ FORMULAIRE ════════════════ */}
      {activeTab === "ajouter" && (
        <div style={{ padding: 20, maxWidth: 860, margin: "0 auto", paddingBottom: 40 }}>
          <div style={{ background: "rgba(15,15,25,0.8)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 14, padding: "24px 28px" }}>
            <div style={{ fontSize: 14, color: "#00E1DC", fontWeight: "bold", letterSpacing: "0.06em", marginBottom: 4 }}>
              {form.id ? "✏️ MODIFIER LE BIEN" : "＋ AJOUTER UN BIEN IMMOBILIER"}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>* Seuls l'adresse et le prix d'achat sont obligatoires</div>

            {/* ── Identification ── */}
            {secTitle("📍", "IDENTIFICATION DU BIEN")}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.7fr", gap: 12, marginBottom: 12 }}>
              {/* Adresse avec autocomplete BAN */}
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  Adresse *
                  {addressLoading && <span style={{ fontSize: 9, color: "#00E1DC", letterSpacing: "0.05em" }}>recherche…</span>}
                </div>
                <input
                  value={form.adresse}
                  onChange={e => onAddressInput(e.target.value)}
                  onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                  placeholder="12 rue des Lilas"
                  autoComplete="off"
                  style={inp}
                />
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "#1a1a2e", border: "1px solid rgba(0,225,220,0.4)", borderRadius: "0 0 8px 8px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)", maxHeight: 280, overflowY: "auto" }}>
                    {addressSuggestions.map((feat, i) => (
                      <div key={i}
                        onMouseDown={() => selectAddress(feat)}
                        style={{ padding: "9px 14px", cursor: "pointer", borderBottom: i < addressSuggestions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,225,220,0.12)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ fontSize: 13, color: "#F5F7FA", fontFamily: SIA_FONT_STACK }}>{feat.properties.name}</div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>{feat.properties.postcode} {feat.properties.city}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Ville</div>
                <input value={form.ville} onChange={e => setF("ville", e.target.value)} placeholder="Paris" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Code postal</div>
                <input value={form.codePostal} onChange={e => { setF("codePostal", e.target.value); setDvfEstimate(null); }} placeholder="75001" style={inp} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Type de bien</div>
                <select value={form.typeBien} onChange={e => setF("typeBien", e.target.value)} style={{ ...inp }}>
                  {Object.entries(TYPE_BIEN_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Surface (m²)</div><input type="number" value={form.surface} onChange={e => setF("surface", e.target.value)} placeholder="65" style={inp} /></div>
              <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Année d'achat</div><input type="number" value={form.anneeAchat} onChange={e => setF("anneeAchat", e.target.value)} min="1970" max="2030" style={inp} /></div>
            </div>

            {/* ── Acquisition ── */}
            {secTitle("💰", "ACQUISITION")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Prix d'achat net vendeur (€) *</div><input type="number" value={form.prixAchat} onChange={e => setF("prixAchat", e.target.value)} placeholder="200 000" style={inp} /></div>
              <div>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  Frais de notaire (€)
                  <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", fontWeight: "normal" }}>
                    <input type="checkbox" checked={form.fraisNotaireAuto} onChange={e => setF("fraisNotaireAuto", e.target.checked)} style={{ width: "auto" }} /> Auto 7,7%
                  </label>
                </div>
                {form.fraisNotaireAuto
                  ? <div style={{ ...inp, color: "#00E1DC", background: "rgba(0,225,220,0.06)", cursor: "default" }}>{formFrais > 0 ? formFrais.toLocaleString('fr-FR') + " €" : "—"}</div>
                  : <input type="number" value={form.fraisNotaireManuel} onChange={e => setF("fraisNotaireManuel", e.target.value)} placeholder="Ex: 15 000" style={inp} />
                }
              </div>
              <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Travaux (€)</div><input type="number" value={form.travaux} onChange={e => setF("travaux", e.target.value)} placeholder="0" style={inp} /></div>
            </div>
            {formCout > 0 && (
              <div style={{ fontSize: 12, color: "#888", padding: "7px 12px", background: "rgba(0,225,220,0.05)", borderRadius: 8 }}>
                Coût total d'acquisition : <strong style={{ color: "#00E1DC", fontFamily: "monospace" }}>{formCout.toLocaleString('fr-FR')} €</strong>
                {form.surface && <span style={{ marginLeft: 16 }}>Soit <strong style={{ color: "#00E1DC" }}>{Math.round(formCout / parseFloat(form.surface)).toLocaleString('fr-FR')} €/m²</strong></span>}
              </div>
            )}

            {/* ── Mode de détention ── */}
            {secTitle("👥", "MODE DE DÉTENTION")}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              {[{ v: "personnel", l: "🧑 Détention personnelle" }, { v: "sci", l: "🏛️ SCI" }].map(opt => (
                <button key={opt.v} onClick={() => setF("typeDetention", opt.v)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid " + (form.typeDetention === opt.v ? "#00E1DC" : "rgba(0,225,220,0.2)"), background: form.typeDetention === opt.v ? "rgba(0,225,220,0.15)" : "transparent", color: form.typeDetention === opt.v ? "#00E1DC" : "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  {opt.l}
                </button>
              ))}
            </div>
            {form.typeDetention === "sci" && (
              <div style={{ background: "rgba(142,106,201,0.06)", border: "1px solid rgba(142,106,201,0.2)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Nom de la SCI</div><input value={form.sciNom} onChange={e => setF("sciNom", e.target.value)} placeholder="SCI Les Lilas" style={{ ...inp, width: "50%" }} /></div>
                <div style={{ fontSize: 10, color: "#8e6ac9", marginBottom: 8, letterSpacing: "0.08em" }}>ACTIONNAIRES</div>
                {form.sciActionnaires.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                    <input value={a.nom} onChange={e => { const arr = [...form.sciActionnaires]; arr[i] = { ...arr[i], nom: e.target.value }; setF("sciActionnaires", arr); }} placeholder="Nom actionnaire" style={{ ...inp, flex: 2 }} />
                    <input type="number" value={a.pct} onChange={e => { const arr = [...form.sciActionnaires]; arr[i] = { ...arr[i], pct: parseFloat(e.target.value)||0 }; setF("sciActionnaires", arr); }} placeholder="%" style={{ ...inp, width: 70 }} />
                    <span style={{ color: "#888", fontSize: 12, minWidth: 14 }}>%</span>
                    {form.sciActionnaires.length > 1 && <button onClick={() => setF("sciActionnaires", form.sciActionnaires.filter((_,j) => j !== i))} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 14 }}>✕</button>}
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => setF("sciActionnaires", [...form.sciActionnaires, { nom: "", pct: 0 }])}
                    style={{ background: "rgba(142,106,201,0.1)", border: "1px dashed rgba(142,106,201,0.3)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", color: "#8e6ac9", fontSize: 12, fontFamily: "inherit" }}>
                    + Actionnaire
                  </button>
                  {form.sciActionnaires.reduce((s,a) => s+(a.pct||0), 0) !== 100 &&
                    <span style={{ fontSize: 11, color: "#e09955" }}>⚠️ Total : {form.sciActionnaires.reduce((s,a) => s+(a.pct||0), 0)}% (doit être 100%)</span>}
                </div>
              </div>
            )}

            {/* ── Usage ── */}
            {secTitle("🎯", "USAGE DU BIEN")}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              {[{ v: "rp", l: "🏡 Résidence principale" }, { v: "locatif", l: "🏢 Investissement locatif" }, { v: "rs", l: "🌴 Résidence secondaire" }].map(opt => (
                <button key={opt.v} onClick={() => setF("usage", opt.v)}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid " + (form.usage === opt.v ? (USAGE_COLORS[opt.v]||"#00E1DC") : "rgba(0,225,220,0.2)"), background: form.usage === opt.v ? (USAGE_COLORS[opt.v]||"#00E1DC") + "18" : "transparent", color: form.usage === opt.v ? (USAGE_COLORS[opt.v]||"#00E1DC") : "#666", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  {opt.l}
                </button>
              ))}
            </div>

            {/* ── Locatif (conditionnel) ── */}
            {form.usage === "locatif" && (
              <div style={{ background: "rgba(0,225,220,0.04)", border: "1px solid rgba(0,225,220,0.15)", borderRadius: 10, padding: "14px 16px", marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: "#00E1DC", letterSpacing: "0.1em", fontWeight: "bold", marginBottom: 12 }}>💵 INFORMATIONS LOCATIVES</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 10 }}>
                  <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Loyer mensuel HC (€)</div><input type="number" value={form.loyerMensuelHC} onChange={e => setF("loyerMensuelHC", e.target.value)} placeholder="800" style={inp} /></div>
                  <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Charges locataires/mois (€)</div><input type="number" value={form.chargesLoc} onChange={e => setF("chargesLoc", e.target.value)} placeholder="80" style={inp} /></div>
                  <div>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Régime fiscal</div>
                    <select value={form.regimeFiscal} onChange={e => setF("regimeFiscal", e.target.value)} style={{ ...inp }}>
                      {Object.entries(REGIME_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Taxe foncière (€/an)</div><input type="number" value={form.taxeFonciere} onChange={e => setF("taxeFonciere", e.target.value)} placeholder="900" style={inp} /></div>
                  <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Charges copropriété (€/mois)</div><input type="number" value={form.chargesCopro} onChange={e => setF("chargesCopro", e.target.value)} placeholder="150" style={inp} /></div>
                </div>
                {formRend > 0 && (
                  <div style={{ fontSize: 12, color: "#888", padding: "7px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <span>Rendement brut : <strong style={{ color: "#00E1DC" }}>{formRend.toFixed(2)}%</strong></span>
                    <span>Revenus bruts/an : <strong style={{ color: "#00E1DC", fontFamily: "monospace" }}>{Math.round((parseFloat(form.loyerMensuelHC)||0)*12).toLocaleString('fr-FR')} €</strong></span>
                    <span>Cash-flow/mois : <strong style={{ color: formCF >= 0 ? "#4a9e6b" : "#e05555", fontFamily: "monospace" }}>{formCF >= 0 ? "+" : ""}{Math.round(formCF)} €</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* ── Valorisation actuelle ── */}
            {secTitle("📈", "VALORISATION ACTUELLE")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Colonne gauche : champ valeur + PV */}
              <div>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Estimation valeur actuelle (€) — laisser vide = coût d'acquisition</div>
                <input type="number" value={form.valeurActuelle} onChange={e => setF("valeurActuelle", e.target.value)} placeholder={formCout > 0 ? formCout.toLocaleString('fr-FR') : "Ex: 250 000"} style={inp} />
                {form.valeurActuelle && formCout > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 11, color: (parseFloat(form.valeurActuelle)-formCout) >= 0 ? "#4a9e6b" : "#e05555" }}>
                      Plus-value latente : {(parseFloat(form.valeurActuelle)-formCout) >= 0 ? "+" : ""}{Math.round(parseFloat(form.valeurActuelle)-formCout).toLocaleString('fr-FR')} €
                    </div>
                    {form.surface && (
                      <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 10, padding: "5px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 6, width: "fit-content" }}>
                        <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em" }}>€/M²</span>
                        <span style={{ color: "#888", fontFamily: "monospace" }}>Achat : {Math.round(formCout/parseFloat(form.surface)).toLocaleString('fr-FR')} €</span>
                        <span style={{ color: "#444" }}>→</span>
                        <span style={{ fontFamily: "monospace", fontWeight: "bold", color: parseFloat(form.valeurActuelle)/parseFloat(form.surface) >= formCout/parseFloat(form.surface) ? "#4a9e6b" : "#e05555" }}>
                          Actuel : {Math.round(parseFloat(form.valeurActuelle)/parseFloat(form.surface)).toLocaleString('fr-FR')} €
                        </span>
                        {(() => { const d = Math.round(parseFloat(form.valeurActuelle)/parseFloat(form.surface) - formCout/parseFloat(form.surface)); return d !== 0 ? <span style={{ fontSize: 10, color: d >= 0 ? "#4a9e6b" : "#e05555" }}>({d >= 0 ? "+" : ""}{d.toLocaleString('fr-FR')} €)</span> : null; })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Colonne droite : estimation DVF */}
              <div>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Estimation marché — ventes réelles (DVF)</div>
                <button
                  onClick={fetchDVFPrices}
                  disabled={!form.codePostal || dvfLoading}
                  style={{ width: "100%", padding: "8px 14px", background: form.codePostal && !dvfLoading ? "rgba(0,225,220,0.12)" : "rgba(0,0,0,0.2)", border: "1px solid " + (form.codePostal && !dvfLoading ? "rgba(0,225,220,0.4)" : "rgba(255,255,255,0.07)"), borderRadius: 6, color: form.codePostal && !dvfLoading ? "#00E1DC" : "#444", cursor: form.codePostal && !dvfLoading ? "pointer" : "not-allowed", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  {dvfLoading ? "⏳ Récupération…" : "🏠 Estimer via ventes récentes (2 ans)"}
                </button>
                {!form.codePostal && <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>Renseignez le code postal pour lancer l'estimation</div>}

                {/* Résultat DVF */}
                {dvfEstimate && !dvfEstimate.error && (
                  <div style={{ marginTop: 10, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,225,220,0.2)", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#00E1DC", letterSpacing: "0.1em", marginBottom: 8 }}>
                      📊 {dvfEstimate.isStatic ? "RÉFÉRENCE DVF 2024" : `${dvfEstimate.count} VENTES ANALYSÉES`}
                      {" "}· {form.codePostal} · {(TYPE_BIEN_LABELS[form.typeBien]||"").toUpperCase()}
                      {dvfEstimate.isStatic
                        ? <span style={{ color: "#888", marginLeft: 6 }}>· Données embarquées</span>
                        : dvfEstimate.usedRecent
                          ? <span style={{ color: "#4a9e6b", marginLeft: 6 }}>· 2 ANS</span>
                          : <span style={{ color: "#888", marginLeft: 6 }}>· HISTORIQUE</span>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <div style={{ padding: "8px 10px", background: "rgba(0,225,220,0.06)", borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Médiane</div>
                        <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: "bold", color: "#00E1DC" }}>{dvfEstimate.median.toLocaleString('fr-FR')} €/m²</div>
                      </div>
                      <div style={{ padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Moyenne</div>
                        <div style={{ fontSize: 15, fontFamily: "monospace", color: "#888" }}>{dvfEstimate.mean.toLocaleString('fr-FR')} €/m²</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 8, display: "flex", gap: 14 }}>
                      <span>Fourchette basse : <strong style={{ color: "#888" }}>{dvfEstimate.p25.toLocaleString('fr-FR')} €/m²</strong></span>
                      <span>Fourchette haute : <strong style={{ color: "#888" }}>{dvfEstimate.p75.toLocaleString('fr-FR')} €/m²</strong></span>
                    </div>
                    {dvfEstimate.estimTotal && form.surface && (
                      <div style={{ borderTop: "1px solid rgba(0,225,220,0.15)", paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#666" }}>Estimation pour {form.surface} m²</div>
                          <div style={{ fontSize: 17, fontFamily: "monospace", fontWeight: "bold", color: "#F5F7FA" }}>{dvfEstimate.estimTotal.toLocaleString('fr-FR')} €</div>
                          <div style={{ fontSize: 10, color: "#555" }}>Fourchette : {Math.round(dvfEstimate.p25 * parseFloat(form.surface)).toLocaleString('fr-FR')} – {Math.round(dvfEstimate.p75 * parseFloat(form.surface)).toLocaleString('fr-FR')} €</div>
                        </div>
                        <button
                          onClick={() => { setF("valeurActuelle", dvfEstimate.estimTotal); }}
                          style={{ background: "linear-gradient(135deg,#00E1DC,#007A78)", border: "none", borderRadius: 6, padding: "7px 16px", cursor: "pointer", color: "#000", fontWeight: "bold", fontSize: 12, fontFamily: "inherit" }}>
                          ✦ Appliquer
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {dvfEstimate && dvfEstimate.error && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#e05555", padding: "8px 12px", background: "rgba(224,85,85,0.06)", borderRadius: 6, border: "1px solid rgba(224,85,85,0.2)" }}>
                    ⚠ {dvfEstimate.error}
                  </div>
                )}
              </div>
            </div>

            {/* ── Financement ── */}
            {secTitle("🏦", "FINANCEMENT (optionnel)")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Capital emprunté (€)</div><input type="number" value={form.montantEmprunt} onChange={e => setF("montantEmprunt", e.target.value)} placeholder="160 000" style={inp} /></div>
              <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Taux nominal (%)</div><input type="number" value={form.tauxEmprunt} onChange={e => setF("tauxEmprunt", e.target.value)} placeholder="3.5" step="0.01" style={inp} /></div>
              <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Durée (ans)</div><input type="number" value={form.dureeEmprunt} onChange={e => setF("dureeEmprunt", e.target.value)} placeholder="20" style={inp} /></div>
              <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Début du prêt</div><input type="month" value={form.dateDebutPret} onChange={e => setF("dateDebutPret", e.target.value)} style={{ ...inp, colorScheme: "dark" }} /></div>
              <div><div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Assurance (€/mois)</div><input type="number" value={form.assuranceEmprunt} onChange={e => setF("assuranceEmprunt", e.target.value)} placeholder="50" style={inp} /></div>
            </div>
            {formMens > 0 && (
              <div style={{ fontSize: 12, color: "#888", padding: "7px 12px", background: "rgba(0,225,220,0.05)", borderRadius: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
                <span>Mensualité crédit : <strong style={{ color: "#e09955", fontFamily: "monospace" }}>{formMens.toLocaleString('fr-FR')} €/mois</strong></span>
                {parseFloat(form.assuranceEmprunt) > 0 && <span>Effort total : <strong style={{ color: "#e09955", fontFamily: "monospace" }}>{(formMens + parseFloat(form.assuranceEmprunt)).toLocaleString('fr-FR')} €/mois</strong></span>}
                {formCRD > 0 && <span>Capital restant dû : <strong style={{ color: "#e09955", fontFamily: "monospace" }}>{Math.round(formCRD).toLocaleString('fr-FR')} €</strong></span>}
                {form.prixAchat && <span>Apport : <strong style={{ color: "#6a8ec9", fontFamily: "monospace" }}>{Math.max(0, Math.round(formCout - (parseFloat(form.montantEmprunt)||0))).toLocaleString('fr-FR')} €</strong></span>}
              </div>
            )}

            {/* ── Actions ── */}
            <div style={{ display: "flex", gap: 10, marginTop: 28, justifyContent: "flex-end" }}>
              <button onClick={() => { setForm(BLANK_BIEN); setActiveTab("biens"); }}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 22px", cursor: "pointer", color: "#888", fontSize: 13, fontFamily: "inherit" }}>
                Annuler
              </button>
              <button onClick={saveBien} disabled={!form.adresse || !form.prixAchat}
                style={{ background: form.adresse && form.prixAchat ? "linear-gradient(135deg,#00E1DC,#007A78)" : "rgba(0,225,220,0.2)", border: "none", borderRadius: 8, padding: "10px 28px", cursor: form.adresse && form.prixAchat ? "pointer" : "not-allowed", color: form.adresse && form.prixAchat ? "#000" : "#555", fontWeight: "bold", fontSize: 14, fontFamily: "inherit" }}>
                {form.id ? "💾 Enregistrer les modifications" : "✦ Enregistrer le bien"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
