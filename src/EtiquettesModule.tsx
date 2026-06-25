import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCnWg6Y2THauxyM4yk_QqhOcyybU0-WRI4",
  authDomain: "moorea-qualite.firebaseapp.com",
  projectId: "moorea-qualite",
  storageBucket: "moorea-qualite.appspot.com",
  messagingSenderId: "639598259840",
  appId: "1:639598259840:web:ff3c048f9aac1b99f40065"
};
const app2 = getApps().find((a: any) => a.name === "moorea-etiquettes") || initializeApp(firebaseConfig, "moorea-etiquettes");
const db = getFirestore(app2);

const CHAMPS_VARIABLES = [
  { key: "lotNo", label: "Lot No" },
  { key: "poids", label: "Poids net (KG)" },
  { key: "prodDate", label: "Prod. Date" },
  { key: "expDate", label: "Exp. Date" },
];

const CHAMPS_FIXES = [
  { key: "nomArabe", label: "Nom produit (arabe)", placeholder: "جبنة بلو دوفيرنيي" },
  { key: "nomAnglais", label: "Nom produit (anglais)", placeholder: "BLEU D'AUVERGNE CHEESE" },
  { key: "origine", label: "Origine (anglais)", placeholder: "France" },
  { key: "origineArabe", label: "Origine (arabe)", placeholder: "فرنسا" },
  { key: "ingredientsArabe", label: "Ingrédients (arabe)", placeholder: "حليب البقر مبستر...", multiline: true },
  { key: "ingredientsAnglais", label: "Ingrédients (anglais)", placeholder: "Pasteurized cow's milk...", multiline: true },
  { key: "tauxMatiere", label: "Taux matière grasse (%)", placeholder: "58" },
  { key: "tauxHumidite", label: "Taux humidité (%)", placeholder: "47" },
  { key: "nutritionArabe", label: "Valeurs nutritionnelles (arabe)", placeholder: "الطاقة كيلو جول...", multiline: true },
  { key: "nutritionAnglais", label: "Valeurs nutritionnelles (anglais)", placeholder: "Energy: KJ 1402...", multiline: true },
  { key: "exporteur", label: "Exportateur", placeholder: "Leo Fresh" },
  { key: "exporteurArabe", label: "Exportateur (arabe)", placeholder: "ليو فريش" },
  { key: "importeur", label: "Importateur", placeholder: "Fresh Express" },
  { key: "importeurArabe", label: "Importateur (arabe)", placeholder: "شركة فريش اكسبريس" },
  { key: "website", label: "Site web", placeholder: "www.freshexpressint.com" },
];

const DEFAUT: Record<string, string> = {
  nomArabe: "", nomAnglais: "", origine: "France", origineArabe: "فرنسا",
  ingredientsArabe: "", ingredientsAnglais: "", tauxMatiere: "", tauxHumidite: "",
  nutritionArabe: "", nutritionAnglais: "",
  exporteur: "Leo Fresh", exporteurArabe: "ليو فريش",
  importeur: "Fresh Express", importeurArabe: "شركة فريش اكسبريس",
  website: "www.freshexpressint.com",
  lotNo: "", poids: "", prodDate: "", expDate: "",
};

// Génère le HTML d'une étiquette
function etiquetteHTML(p: Record<string, string>): string {
  return `
  <div class="etiquette">
    <div class="row-center"><b class="big rtl">اسم المنتج: ${p.nomArabe || ""}</b></div>
    <div class="row-center"><b class="med">Product Name: ${p.nomAnglais || ""}</b></div>
    <hr/>
    <div class="row2">
      <b>Origin: ${p.origine || ""}</b>
      <b class="rtl">المنشأ: ${p.origineArabe || ""}</b>
    </div>
    <div class="row2">
      <b>Lot No: ${p.lotNo || ""}</b>
      <b class="rtl">رقم اللوت:</b>
    </div>
    <hr/>
    <div class="row-center rtl"><b>${p.ingredientsArabe || ""}</b></div>
    <div class="row-center"><b>Ingredients: ${p.ingredientsAnglais || ""}</b></div>
    <hr/>
    <div class="row-center rtl"><b>نسبة الدسم: ${p.tauxMatiere || ""}٪ &nbsp;|&nbsp; نسبة الرطوبة: ${p.tauxHumidite || ""}٪</b></div>
    <hr/>
    <div class="row2">
      <b>Net Weight: ${p.poids || ""} KG</b>
      <b class="rtl">الوزن الصافي: كجم</b>
    </div>
    <hr/>
    <div class="row-center"><b>ملاحظة Notice/</b></div>
    <div class="row-center small"><b>- Dairy was produced from an animal that did not show symptoms of anthrax during milking</b></div>
    <div class="row-center small"><b>- The milk was immediately cooled and heat treated at least enough for the pasteurization</b></div>
    <hr/>
    <div class="row2">
      <b>Prod. Date: ${p.prodDate || ""}</b>
      <b class="rtl">تاريخ الإنتاج:</b>
    </div>
    <div class="row2">
      <b>Exp. Date: ${p.expDate || ""}</b>
      <b class="rtl">تاريخ الانتهاء:</b>
    </div>
    <hr/>
    <div class="row-center rtl"><b>المعلومات الغذائية لكل 100 غرام</b></div>
    <div class="row-center small rtl"><b>${p.nutritionArabe || ""}</b></div>
    <div class="row-center"><b>Nutritional Value per 100 Grs</b></div>
    <div class="row-center small"><b>${p.nutritionAnglais || ""}</b></div>
    <hr/>
    <div class="row2">
      <b class="small">Exporter: ${p.exporteur || ""}</b>
      <b class="small rtl">المصدر: ${p.exporteurArabe || ""}</b>
    </div>
    <div class="row2">
      <b class="small">Importer: ${p.importeur || ""}</b>
      <b class="small rtl">المستورد: ${p.importeurArabe || ""}</b>
    </div>
    <div class="row-center"><b class="small">${p.website || ""}</b></div>
  </div>`;
}

function imprimerEtiquettes(produits: Record<string, string>[]): string {
  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif}.etiquette{width:100%;border:1px solid #000;padding:6mm;page-break-after:always;margin-bottom:10px}.etiquette:last-child{page-break-after:avoid;margin-bottom:0}hr{border:none;border-top:1px solid #000;margin:3px 0}b{display:block;font-weight:bold;font-size:11pt;line-height:1.4}b.big{font-size:14pt}b.med{font-size:12pt}b.small{font-size:9pt}b.rtl{direction:rtl;text-align:right;unicode-bidi:embed}.row-center{text-align:center;margin:2px 0}.row-center b{display:inline}.row2{display:flex;justify-content:space-between;align-items:center;margin:2px 0}.row2 b{flex:1}.row2 b.rtl{text-align:right}@page{size:11cm 17.5cm;margin:0}@media print{.no-print{display:none!important}}`;
  return `<style>${css}</style>` + produits.map(p => etiquetteHTML(p)).join("\n");
}

async function parseDocx(file: File): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer;
        const uint8 = new Uint8Array(buf);
        const str = String.fromCharCode(...Array.from(uint8));
        const xmlMatch = str.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
        const lines = xmlMatch.map((m: string) => m.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
        const extract = (pattern: RegExp) => {
          for (const line of lines) { const m = line.match(pattern); if (m) return m[1]?.trim() || ""; }
          return "";
        };
        resolve({
          nomAnglais: extract(/Product Name:\s*(.+)/i),
          nomArabe: lines.find((l: string) => /[\u0600-\u06FF]/.test(l))?.replace(/^سم المنتج:\s*/, "") || "",
          origine: extract(/Origin:\s*([A-Za-z ]+)/i),
          origineArabe: extract(/المنشأ:\s*(.+)/),
          lotNo: extract(/Lot No:\s*([^\s]+)/i),
          poids: extract(/Net Weight:\s*([\d.,]+)/i),
          ingredientsArabe: lines.find((l: string) => /المكونات:/.test(l))?.replace(/المكونات:\s*/, "") || "",
          ingredientsAnglais: lines.find((l: string) => /^Ingredients:/i.test(l))?.replace(/^Ingredients:\s*/i, "") || "",
          tauxMatiere: "", tauxHumidite: "",
          nutritionArabe: lines.find((l: string) => /الطاقة/.test(l)) || "",
          nutritionAnglais: lines.find((l: string) => /^Energy:/i.test(l)) || "",
          exporteur: extract(/Exporter:\s*(.+)/i),
          exporteurArabe: extract(/المصدر:\s*(.+)/),
          importeur: extract(/Importer:\s*(.+)/i),
          importeurArabe: extract(/المستورد:\s*(.+)/),
          website: extract(/(www\.[^\s]+)/i),
          prodDate: extract(/Prod\.?\s*Date:?\s*([\d/]+)/i),
          expDate: extract(/Exp\.?\s*Date:?\s*([\d/]+)/i),
        });
      } catch { resolve({ ...DEFAUT }); }
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function EtiquettesModule({ onClose }: { onClose: () => void }) {
  const [produits, setProduits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vue, setVue] = useState<"liste" | "creer" | "lot">("liste");
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, string>>(DEFAUT);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [search, setSearch] = useState("");
  const [lotSelects, setLotSelects] = useState<Record<string, boolean>>({});
  const [lotVars, setLotVars] = useState<Record<string, Record<string, string>>>({});
  const [printHTML, setPrintHTML] = useState<string | null>(null);

  useEffect(() => { fetchProduits(); }, []);

  async function fetchProduits() {
    setLoading(true);
    const snap = await getDocs(collection(db, "etiquettes_produits"));
    setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  async function handleImportDocx(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setImporting(true);
    let importes = 0;
    for (let i = 0; i < files.length; i++) {
      setImportProgress({ current: i + 1, total: files.length });
      try {
        const parsed = await parseDocx(files[i]);
        await addDoc(collection(db, "etiquettes_produits"), parsed);
        importes++;
      } catch {}
    }
    await fetchProduits();
    setImporting(false);
    setImportProgress(null);
    e.target.value = "";
    if (files.length === 1) {
      const snap = await getDocs(collection(db, "etiquettes_produits"));
      const docs = snap.docs;
      if (docs.length) { const last = docs[docs.length - 1]; setForm({ ...last.data() } as any); setSelected({ id: last.id, ...last.data() }); setVue("creer"); }
    } else {
      alert(`✅ ${importes} étiquette${importes > 1 ? "s" : ""} importée${importes > 1 ? "s" : ""}`);
    }
  }

  async function sauvegarder() {
    setSaving(true);
    try {
      if (selected?.id) await updateDoc(doc(db, "etiquettes_produits", selected.id), form);
      else await addDoc(collection(db, "etiquettes_produits"), form);
      await fetchProduits(); setVue("liste");
    } catch (e: any) { alert("Erreur: " + e.message); }
    setSaving(false);
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer ?")) return;
    await deleteDoc(doc(db, "etiquettes_produits", id));
    await fetchProduits();
  }

  function ouvrirLot() {
    const sel: Record<string, boolean> = {};
    const vars: Record<string, Record<string, string>> = {};
    produits.forEach(p => {
      sel[p.id] = true;
      vars[p.id] = { lotNo: p.lotNo || "", poids: p.poids || "", prodDate: p.prodDate || "", expDate: p.expDate || "" };
    });
    setLotSelects(sel);
    setLotVars(vars);
    setVue("lot");
  }

  function genererLot() {
    const selection = produits.filter(p => lotSelects[p.id]);
    if (!selection.length) { alert("Sélectionne au moins une étiquette"); return; }
    const data = selection.map(p => ({ ...p, ...lotVars[p.id] }));
    const html = imprimerEtiquettes(data);
    setPrintHTML(html);
    selection.forEach(p => { if (lotVars[p.id]) updateDoc(doc(db, "etiquettes_produits", p.id), lotVars[p.id]); });
  }

  const nbSelected = Object.values(lotSelects).filter(Boolean).length;
  const filtres = produits.filter(p =>
    (p.nomAnglais || "").toLowerCase().includes(search.toLowerCase()) || (p.nomArabe || "").includes(search)
  );

  const btn = (bg: string, color = "#fff"): React.CSSProperties => ({
    background: bg, color, border: "none", borderRadius: 8, padding: "8px 16px",
    fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
  });

  const topBar = (titre: string, right: React.ReactNode) => (
    <div style={{ background: "#0a0a0a", borderBottom: "3px solid #f59e0b", position: "sticky", top: 0, zIndex: 200, paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => vue === "liste" ? onClose() : setVue("liste")}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Retour</button>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>{titre}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{right}</div>
      </div>
    </div>
  );

  // ── LISTE ──
  if (vue === "liste") return (
    <div style={{ minHeight: "100vh", background: "#f5f3ee", fontFamily: "'Syne', sans-serif" }}>
      {topBar("🏷️ Leofresh · Étiquettes", <>
        <label style={{ ...btn("#fef3c7", "#92400e"), cursor: importing ? "wait" : "pointer" }}>
          {importProgress ? `⏳ ${importProgress.current}/${importProgress.total}` : importing ? "⏳..." : "📂 Importer .docx"}
          <input type="file" accept=".docx" multiple style={{ display: "none" }} onChange={handleImportDocx} />
        </label>
        <button style={btn("#f59e0b", "#0a0a0a")} onClick={() => { setForm({ ...DEFAUT }); setSelected(null); setVue("creer"); }}>+ Nouveau</button>
        {produits.length > 0 && <button style={btn("#16a34a")} onClick={ouvrirLot}>🖨️ Imprimer lot</button>}
      </>)}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 12px 80px" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..."
          style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e0d0", borderRadius: 10, fontSize: 13, marginBottom: 16, outline: "none", background: "#fff" }} />
        {loading ? <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Chargement...</div>
        : filtres.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: 14, border: "1.5px solid #e8e0d0" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🏷️</p>
            <p style={{ fontWeight: 700, color: "#1a2e1a", marginBottom: 4 }}>Aucun produit</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Importe un ou plusieurs .docx pour commencer</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {filtres.map(p => (
              <div key={p.id} style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 14, padding: 16, borderTop: "3px solid #f59e0b" }}>
                <p style={{ fontWeight: 800, fontSize: 14, color: "#1a2e1a", marginBottom: 2 }}>{p.nomAnglais || "—"}</p>
                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "right", marginBottom: 8 }}>{p.nomArabe}</p>
                <p style={{ fontSize: 11, color: "#6b7280" }}>🌍 {p.origine || "—"}</p>
                {p.lotNo && <p style={{ fontSize: 11, color: "#6b7280" }}>📦 Lot : {p.lotNo}</p>}
                {p.expDate && <p style={{ fontSize: 11, color: "#6b7280" }}>📅 DLC : {p.expDate}</p>}
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <button style={{ ...btn("#f59e0b", "#0a0a0a"), flex: 1, justifyContent: "center", fontSize: 12 }}
                    onClick={() => { setForm({ ...p }); setSelected(p); setVue("creer"); }}>✏️ Modifier</button>
                  <button style={{ ...btn("#fff5f5", "#dc2626"), fontSize: 12 }} onClick={() => supprimer(p.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── CRÉER / MODIFIER ──
  if (vue === "creer") return (
    <div style={{ minHeight: "100vh", background: "#f5f3ee", fontFamily: "'Syne', sans-serif" }}>
      {topBar(selected ? "✏️ Modifier" : "➕ Nouveau", <>
        <button style={btn("#e8e0d0", "#374151")} onClick={() => setVue("liste")}>Annuler</button>
        <button style={btn("#f59e0b", "#0a0a0a")} onClick={sauvegarder} disabled={saving}>{saving ? "..." : "💾 Sauvegarder"}</button>
      </>)}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 12px 80px" }}>
        <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, color: "#15803d", fontSize: 13, marginBottom: 12 }}>🔄 Champs variables</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
            {CHAMPS_VARIABLES.map(c => (
              <div key={c.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>{c.label}</label>
                <input value={form[c.key] || ""} onChange={e => setForm(f => ({ ...f, [c.key]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #bbf7d0", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1.5px solid #e8e0d0", borderRadius: 12, padding: 16 }}>
          <p style={{ fontWeight: 700, color: "#1a2e1a", fontSize: 13, marginBottom: 12 }}>📋 Informations fixes</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
            {CHAMPS_FIXES.map(c => (
              <div key={c.key} style={(c as any).multiline ? { gridColumn: "1 / -1" } : {}}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>{c.label}</label>
                {(c as any).multiline
                  ? <textarea value={form[c.key] || ""} onChange={e => setForm(f => ({ ...f, [c.key]: e.target.value }))} placeholder={(c as any).placeholder}
                      style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e8e0d0", borderRadius: 8, fontSize: 13, outline: "none", minHeight: 64, resize: "vertical" }} />
                  : <input value={form[c.key] || ""} onChange={e => setForm(f => ({ ...f, [c.key]: e.target.value }))} placeholder={(c as any).placeholder}
                      style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e8e0d0", borderRadius: 8, fontSize: 13, outline: "none" }} />
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── OVERLAY IMPRESSION ──
  if (printHTML) return (
    <div style={{ position: "fixed", inset: 0, background: "#f5f3ee", zIndex: 800, overflowY: "auto" }}>
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "#0a0a0a", position: "sticky", top: 0, zIndex: 1 }}>
        <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>🏷️ Étiquettes Leofresh</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()} style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖨️ Imprimer</button>
          <button onClick={() => setPrintHTML(null)} style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>✕ Fermer</button>
        </div>
      </div>
      <div style={{ maxWidth: "11cm", margin: "20px auto", padding: "0 10px 40px" }} dangerouslySetInnerHTML={{ __html: printHTML }} />
    </div>
  );

  // ── LOT D'IMPRESSION ──
  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ee", fontFamily: "'Syne', sans-serif" }}>
      {topBar(`🖨️ Lot — ${nbSelected} sélectionnée${nbSelected > 1 ? "s" : ""}`, <>
        <button style={{ ...btn("#e8e0d0", "#374151"), fontSize: 12 }}
          onClick={() => {
            const allSelected = nbSelected === produits.length;
            const newSel: Record<string, boolean> = {};
            produits.forEach(p => { newSel[p.id] = !allSelected; });
            setLotSelects(newSel);
          }}>
          {nbSelected === produits.length ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
        <button style={btn("#16a34a")} onClick={genererLot} disabled={nbSelected === 0}>
          🖨️ Imprimer {nbSelected} étiquette{nbSelected > 1 ? "s" : ""}
        </button>
      </>)}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 12px 80px" }}>
        <div style={{ background: "#fff", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#15803d", fontWeight: 600 }}>
          ✅ Coche · Mets à jour lot/dates · Clique Imprimer → fenêtre d'impression directe
        </div>
        {produits.map(p => {
          const checked = !!lotSelects[p.id];
          const vars = lotVars[p.id] || {};
          return (
            <div key={p.id} style={{ background: checked ? "#fff" : "#fafaf9", border: `1.5px solid ${checked ? "#f59e0b" : "#e8e0d0"}`, borderRadius: 12, padding: 12, marginBottom: 8, transition: "all .1s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={checked}
                  onChange={() => setLotSelects(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                  style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#f59e0b", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: checked ? "#1a2e1a" : "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nomAnglais || "—"}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{p.nomArabe}</p>
                </div>
              </div>
              {checked && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
                  {CHAMPS_VARIABLES.map(c => (
                    <div key={c.key}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 3 }}>{c.label}</label>
                      <input value={vars[c.key] || ""} onChange={e => setLotVars(lv => ({ ...lv, [p.id]: { ...(lv[p.id] || {}), [c.key]: e.target.value } }))}
                        style={{ width: "100%", padding: "5px 7px", border: "1.5px solid #fde68a", borderRadius: 6, fontSize: 12, outline: "none", background: "#fffbeb" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
