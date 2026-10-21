// ── 頁面控制：分頁切換、即時產生、複製、記憶欄位 ──
let mode = "0";

function update() {
  const m = MODULES[mode];
  if (m.note) m.note();
  const p = m.build();
  $("out").textContent = p || m.empty || "";
  $("copy").disabled = !p;
  $("count").textContent = p ? `${p.length.toLocaleString()} 字元` : "";
  $("next").textContent = m.next;
  save();
}

function setMode(m) {
  mode = m;
  document.querySelectorAll("[data-m]").forEach(el => el.classList.toggle("on", el.dataset.m === m));
  update();
}

$("tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setMode(b.dataset.m); });
document.querySelectorAll("input, textarea").forEach(el => {
  el.addEventListener("input", update);
  if (el.type === "checkbox" || el.type === "radio") el.addEventListener("change", update);
});

$("copy").addEventListener("click", async () => {
  const text = $("out").textContent;
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  const b = $("copy"); b.textContent = "已複製 ✓";
  setTimeout(() => (b.textContent = "複製 Prompt"), 1500);
});

// 記住欄位內容（只存在這台電腦的這個瀏覽器）
const KEY = "teaching-prompts-v2";
const FIELDS = ["m0_docs", "m0_topic", "m0_max", "m0_words", "m1_menu", "m1_manual", "m1_words", "m1_extra", "m2_n", "m2_group", "m3_mc", "m3_sa", "m3_case"];
function save() {
  try {
    const d = { mode, pickedNo, attach: $("m1_attach").checked, struct: structOpts() };
    FIELDS.forEach(id => (d[id] = $(id).value));
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "{}");
    FIELDS.forEach(id => { if (d[id] != null) $(id).value = d[id]; });
    $("m1_attach").checked = !!d.attach;
    if (d.struct) setStructOpts(d.struct);
    pickedNo = d.pickedNo || null;
    if (d.mode && MODULES[d.mode]) mode = d.mode;
  } catch {}
}

load();
Object.values(MODULES).forEach(m => m.init && m.init());
setMode(mode);
