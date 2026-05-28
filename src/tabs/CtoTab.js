// CTO tab wrapper around the shared portfolio module.

function CtoTab({ apiKey, onTotalChange, reportMode = "advisor", lang = "fr" }) {
  return (
    <PortfolioModule
      type="cto"
      apiKey={apiKey}
      onTotalChange={onTotalChange}
      reportMode={reportMode}
      lang={lang}
    />
  );
}
