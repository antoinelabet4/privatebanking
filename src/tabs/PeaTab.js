// PEA tab wrapper around the shared portfolio module.

function PeaTab({ apiKey, onTotalChange, reportMode = "advisor", lang = "fr" }) {
  return (
    <PortfolioModule
      type="pea"
      apiKey={apiKey}
      onTotalChange={onTotalChange}
      reportMode={reportMode}
      lang={lang}
    />
  );
}
