/* 答案存储：localStorage（草稿缓存）+ 可选关联磁盘上一个真实 json 文件自动写入。
 * 键名与旧版单文件页完全一致（interview_answers_v1 / interview_saved_at / IndexedDB ivReview.kv.answersFile），
 * 同一个地址打开时旧答案和已关联的文件都能直接读到。 */
import { reactive } from 'vue';
import { toast } from './useToast.js';

export const LS_KEY = 'interview_answers_v1';
export const LS_TS = 'interview_saved_at';
const IDB_NAME = 'ivReview', IDB_STORE = 'kv', IDB_KEY = 'answersFile';

export const answers = reactive({
  store: {},              // { q12: '答案 markdown' }
  savedAt: null,          // Date | null
  fileName: '',           // 已关联文件名
  needReconnect: false,   // 有句柄但没有读写权限
  fsSupported: typeof window !== 'undefined' && 'showSaveFilePicker' in window,
});

let fileHandle = null, fileWriteTimer = null, lsTimer = null;

function writeLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(answers.store)); } catch (e) { /* 配额满时忽略，保存按钮会提示 */ }
}

export function initAnswers() {
  try { answers.store = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { answers.store = {}; }
  const ts = localStorage.getItem(LS_TS);
  answers.savedAt = ts ? new Date(ts) : null;
  // 5 分钟自动保存；离开页面前保存
  setInterval(() => saveNow(true), 5 * 60 * 1000);
  window.addEventListener('beforeunload', writeLocal);
  if (answers.fsSupported) restoreFileHandle();
}

// 输入时调用：内存立即更新，600ms 后落 localStorage，1.2s 后写关联文件
export function setAnswer(id, value) {
  answers.store[id] = value;
  clearTimeout(lsTimer);
  lsTimer = setTimeout(() => { writeLocal(); scheduleFileWrite(); }, 600);
}

export function fmtTime(d) {
  const p = n => String(n).padStart(2, '0');
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

export function saveNow(silent) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(answers.store));
    const now = new Date();
    localStorage.setItem(LS_TS, now.toISOString());
    answers.savedAt = now;
    writeFile();
    if (!silent) toast('已保存 · ' + fmtTime(now));
  } catch (e) { toast('保存失败：' + e.message); }
}

// —— IndexedDB：只用来记住"关联的是哪个文件"的句柄 ——
let _idb;
function idbDB() {
  return _idb ? Promise.resolve(_idb) : new Promise((res, rej) => {
    const o = indexedDB.open(IDB_NAME, 1);
    o.onupgradeneeded = () => o.result.createObjectStore(IDB_STORE);
    o.onsuccess = () => { _idb = o.result; res(_idb); };
    o.onerror = () => rej(o.error);
  });
}
async function idbSet(k, v) {
  const db = await idbDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite'); tx.objectStore(IDB_STORE).put(v, k);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(k) {
  const db = await idbDB();
  return new Promise((res, rej) => {
    const r = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(k);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}

async function writeFile() {
  if (!fileHandle) return;
  try {
    const w = await fileHandle.createWritable();
    await w.write(JSON.stringify(answers.store, null, 2));
    await w.close();
  } catch (e) { toast('写入文件失败：' + e.message); }
}
function scheduleFileWrite() {
  if (!fileHandle) return;
  clearTimeout(fileWriteTimer);
  fileWriteTimer = setTimeout(writeFile, 1200);
}
async function ensurePerm(h, request) {
  const opt = { mode: 'readwrite' };
  if ((await h.queryPermission(opt)) === 'granted') return true;
  if (request && (await h.requestPermission(opt)) === 'granted') return true;
  return false;
}

// 文件里的答案与当前答案合并（文件优先），合并结果写回 localStorage
export function mergeAnswers(obj) {
  answers.store = Object.assign({}, answers.store, obj);
  writeLocal();
}
async function mergeFromHandle(h) {
  try {
    const t = (await (await h.getFile()).text()).trim();
    if (t) mergeAnswers(JSON.parse(t));
  } catch (e) { /* 空文件或新文件 */ }
}

export async function linkFile() {
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: 'interview-answers.json',
      types: [{ description: '面试答案 JSON', accept: { 'application/json': ['.json'] } }],
    });
    await mergeFromHandle(fileHandle);
    await idbSet(IDB_KEY, fileHandle);
    await writeFile();
    answers.fileName = fileHandle.name;
    answers.needReconnect = false;
    toast('已关联本地文件，之后自动保存');
  } catch (e) { if (e.name !== 'AbortError') toast('关联失败：' + e.message); }
}

export async function reconnectFile() {
  if (!fileHandle) return;
  if (await ensurePerm(fileHandle, true)) {
    await mergeFromHandle(fileHandle);
    answers.needReconnect = false;
    toast('已重新连接答案文件');
  } else toast('未获得文件读写权限');
}

async function restoreFileHandle() {
  try {
    const h = await idbGet(IDB_KEY);
    if (!h) return;
    fileHandle = h;
    answers.fileName = h.name;
    if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') await mergeFromHandle(h);
    else answers.needReconnect = true;
  } catch (e) { /* 浏览器不支持或句柄失效 */ }
}

function download(content, type, name) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
const today = () => new Date().toISOString().slice(0, 10);

export function exportJSON() {
  download(JSON.stringify(answers.store, null, 2), 'application/json;charset=utf-8', 'interview-answers_' + today() + '.json');
  toast('已导出答案 JSON');
}

export function importJSON() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { mergeAnswers(JSON.parse(r.result)); scheduleFileWrite(); toast('已从文件载入答案'); }
      catch (e) { toast('文件解析失败：' + e.message); }
    };
    r.readAsText(f);
  };
  inp.click();
}

// 导出 Markdown：按维度分节，只导出写了答案的题
export function exportMarkdown(bank, profile) {
  let md = '# 面试答案备份' + (profile.name ? ' · ' + profile.name : '') + '\n\n> 导出时间：' + new Date().toLocaleString() + '\n\n';
  const dimTitle = {}; bank.dims.forEach(d => { dimTitle[d.id] = d.id + ' ' + d.title; });
  const map = {}; bank.questions.forEach(q => { map[q.id] = { cat: dimTitle[q.dim], text: q.text }; });
  let cur = '';
  bank.questions.map(q => q.id).sort((a, b) => a - b).forEach(n => {
    const v = (answers.store['q' + n] || '').trim(); if (!v) return;
    if (map[n].cat !== cur) { cur = map[n].cat; md += '\n## ' + cur + '\n\n'; }
    md += '**Q' + n + '. ' + map[n].text + '**\n\n' + v + '\n\n---\n\n';
  });
  download(md, 'text/markdown;charset=utf-8', '面试答案备份_' + today() + '.md');
  toast('已导出 Markdown 备份');
}
