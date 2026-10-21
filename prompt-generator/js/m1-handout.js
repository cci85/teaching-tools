// ── [1] 講義生成：解析「講義邊界速查」、結構勾選、組出 Prompt ──
function parseMenu(text) {
  const topics = [], shared = [];
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/^[`\s]+|[`\s]+$/g, "");
    const parts = line.split(/[｜|]/).map(s => s.trim());
    if (parts.length < 2) continue;
    const field = key => {
      const p = parts.find(x => x.startsWith(key + "：") || x.startsWith(key + ":"));
      return p ? p.slice(key.length + 1).trim() : "";
    };
    const splitList = s => s.split(/[、，,；;]/).map(x => x.trim()).filter(x => x && x !== "無");
    const m = parts[0].match(/^子主題\s*(\d+)$/);
    if (m) {
      topics.push({ no: m[1], name: parts[1], concepts: splitList(field("專屬")), pre: field("先備") });
    } else if (parts[0] === "共用") {
      shared.push({ name: parts[1], owner: field("歸屬"), refs: field("引用") });
    }
  }
  return { topics, shared };
}

let menu = { topics: [], shared: [] };
let pickedNo = null;

function renderMenu() {
  menu = parseMenu($("m1_menu").value);
  const has = menu.topics.length > 0;
  $("m1_pick").hidden = !has;
  if (!has) { pickedNo = null; renderConcepts(); return; }
  if (!menu.topics.some(t => t.no === pickedNo)) pickedNo = null;
  $("m1_topics").innerHTML = menu.topics.map(t => `
    <label class="check"><input type="radio" name="m1_topic" value="${t.no}" ${t.no === pickedNo ? "checked" : ""}>
      <span><b>${t.no}. ${esc(t.name)}</b><br><span class="meta">先備：${esc(t.pre || "無")}｜${t.concepts.length} 個專屬概念</span></span></label>`).join("");
  $("m1_topics").querySelectorAll("input").forEach(el => el.addEventListener("change", () => {
    pickedNo = el.value; renderConcepts(); update();
  }));
  renderConcepts();
}

function renderConcepts() {
  const t = menu.topics.find(t => t.no === pickedNo);
  $("m1_conceptsWrap").hidden = !t;
  $("m1_manualWrap").hidden = !!t;
  if (!t) return;
  const owned = menu.shared.filter(s => new RegExp("子主題\\s*" + t.no + "(?!\\d)").test(s.owner)).map(s => s.name);
  const all = [...new Set([...t.concepts, ...owned])];
  $("m1_concepts").innerHTML = all.map(c =>
    `<label class="chip"><input type="checkbox" value="${esc(c)}" checked>${esc(c)}</label>`).join("");
  $("m1_concepts").querySelectorAll("input").forEach(el => el.addEventListener("change", update));
}

// 讀取「講義結構」區塊的勾選
function structOpts() {
  const radio = name => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
  return {
    intro: $("s_intro").checked,
    overview: $("s_overview").checked,
    format: radio("s_format") || HANDOUT_DEFAULTS.format,
    examples: radio("s_examples") || HANDOUT_DEFAULTS.examples
  };
}
function setStructOpts(o) {
  const x = { ...HANDOUT_DEFAULTS, ...o };
  $("s_intro").checked = !!x.intro;
  $("s_overview").checked = !!x.overview;
  ["s_format", "s_examples"].forEach(name => {
    const key = name === "s_format" ? "format" : "examples";
    const el = document.querySelector(`input[name="${name}"][value="${x[key]}"]`);
    if (el) el.checked = true;
  });
}
function renderOutline() {
  $("m1_outline").innerHTML = handoutSections(structOpts())
    .map(s => `<li>${esc(s.title)}${s.key === "core" ? ' <small>（占主要篇幅）</small>' : ""}</li>`).join("");
}

function build1() {
  const t = menu.topics.find(t => t.no === pickedNo);
  let subTopic, scopeBlock = "";
  if (t) {
    subTopic = `子主題 ${t.no}：${t.name}`;
    const boxes = [...$("m1_concepts").querySelectorAll("input")];
    const on = boxes.filter(b => b.checked).map(b => b.value);
    const off = boxes.filter(b => !b.checked).map(b => b.value);
    if (off.length && on.length) {
      scopeBlock = `本次講義只完整說明下列專屬核心概念：${on.join("、")}。\n` +
        `菜單中原屬本子主題、但這次不寫入正文的概念：${off.join("、")}（請在「延伸閱讀與資料界限」一節列為「本講義未涵蓋」，不要在正文展開）。\n\n`;
    }
  } else {
    subTopic = v("m1_manual");
    if (blank(subTopic)) return "";
    if (/^\d+$/.test(subTopic)) subTopic = `子主題菜單中編號 ${subTopic} 的子主題（請在講義標題下方先寫出該子主題的完整名稱，並依菜單中該編號所列的專屬核心概念撰寫）`;
  }
  const w = v("m1_words").replace(/\s*字$/, "");
  const wordLine = blank(w) ? "約 6000 字" : `${w} 字`;
  const menuText = $("m1_attach").checked ? $("m1_menu").value.trim() : "";
  const menuBlock = menuText ? `以下是先前子主題菜單整理出的「講義邊界速查」，請以此作為各子主題的概念歸屬依據（規則 16 所稱的「子主題菜單」即指此內容）：\n\n${menuText}\n\n` : "";
  const openLine = menuText ? `我選定的子主題是：「${subTopic}」。` : `接續你剛才列出的子主題菜單，我選定的子主題是：「${subTopic}」。`;
  const extra = v("m1_extra");
  return menuBlock + `${openLine}請直接撰寫完整講義，不需要先輸出內容藍圖。\n\n` + scopeBlock +
    handoutBody(subTopic, wordLine, structOpts()) + (blank(extra) ? "" : `\n\n教師補充要求：${extra}`);
}

function note1() {
  renderOutline();
  const words = parseInt(v("m1_words"), 10) || 6000;
  const n = $("m1_conceptsWrap").hidden ? 0 : $("m1_concepts").querySelectorAll("input:checked").length;
  const warn = [], info = [];
  if (words > 6000) warn.push(`${words} 字超過 NotebookLM 單次輸出約 6000 字的實際上限，後段可能被截斷。`);
  if (n > 0) {
    // 刪除學習目標、重點整合表、自我檢核後，核心節約占全文七成
    const o = structOpts();
    const share = 0.85 - (o.intro ? 0.1 : 0) - (o.examples === "section" ? 0.15 : 0);
    const per = Math.round(words * share / n);
    const msg = `勾了 ${n} 個概念，核心節每個概念平均約 ${per} 字。`;
    if (per < 400) warn.push(msg + "篇幅太薄，容易變成名詞解釋清單；建議取消幾個，或拆成兩份講義。");
    else info.push(msg);
  }
  if ($("m1_attach").checked && blank(v("m1_menu"))) warn.push("勾了附上速查，但上方沒有貼內容。");
  $("m1_note").className = "note" + (warn.length ? " warn" : "");
  $("m1_note").textContent = [...warn, ...info].join(" ");
}

MODULES["1"] = {
  build: build1, note: note1,
  empty: "（請選一個子主題，或在「手填子主題」輸入）",
  next: "下一步：回到 [0] 那個 NotebookLM 對話貼上（不要開新對話）。",
  init() {
    $("m1_menu").addEventListener("input", () => { renderMenu(); update(); });
    renderMenu();
  }
};
