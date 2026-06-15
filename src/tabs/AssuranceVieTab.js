// Assurance Vie tab wrapper around the shared portfolio module.

function AssuranceVieTab({ apiKey, onTotalChange, reportMode = "advisor", lang = "fr" }) {
  return (
    <PortfolioModule
      type="av"
      apiKey={apiKey}
      onTotalChange={onTotalChange}
      reportMode={reportMode}
      lang={lang}
    />
  );
}
