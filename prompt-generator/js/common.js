// 共用小工具與模組註冊表
const $ = id => document.getElementById(id);
const v = id => $(id).value.trim();
const blank = s => !s || !s.trim();
function esc(s) { return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

// 每個模組檔把自己登記到這裡：{ build, note?, next, empty?, init? }
const MODULES = {};
