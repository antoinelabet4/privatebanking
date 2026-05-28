// Inline explanatory info button used throughout the app.

function InfoTip({ text }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ position:"relative", display:"inline-flex", verticalAlign:"middle" }}>
      <button
        type="button"
        aria-label="Information"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:17, height:17, borderRadius:"50%", border:"1px solid rgba(0,225,220,0.45)", background:open ? "rgba(0,225,220,0.18)" : "rgba(0,225,220,0.06)", color:"#00E1DC", fontSize:10, fontWeight:"bold", marginLeft:6, cursor:"pointer", fontFamily:"inherit", padding:0, lineHeight:"15px" }}
      >
        i
      </button>
      {open && (
        <>
          <span onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:998 }} />
          <span style={{ position:"absolute", top:24, left:"50%", transform:"translateX(-50%)", zIndex:999, width:260, maxWidth:"70vw", padding:"10px 12px", borderRadius:8, background:"#071113", border:"1px solid rgba(0,225,220,0.35)", boxShadow:"0 14px 36px rgba(0,0,0,0.55)", color:"#cfd8dc", fontSize:11, lineHeight:1.55, letterSpacing:0, textTransform:"none", fontWeight:400, whiteSpace:"normal" }}>
            {text}
          </span>
        </>
      )}
    </span>
  );
}
