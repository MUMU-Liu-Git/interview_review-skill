/* 实战复盘导航：公司 / 轮次 / 评分 三个字段的取值优先级
 *   ① reviews[] 自带 company / round / score（写在 interview-bank.json 里）
 *   ② 自动推导：公司取 realIndex.co 的「·」前一段，轮次从标题识别，评分按 hl + 【亮/稳/改/翻/漏】估算
 * 所以新复盘即使没填这三个字段，也会并入同公司分组、并一定带分数（估算分显示为「≈」） */
const ROUND_RE = /(一面|二面|三面|四面|终面|HR ?面|交叉面|两轮)/g;
const coKey = s => String(s || '').replace(/[（(][^）)]*[）)]/g, '').replace(/\s+/g, '');

// 公司：realIndex.co「公司 · 岗位轮次」的前一段 → 退回标题第一段（遇空格/·/轮次词截断）
export function deriveCompany(r, realIndex) {
  const ri = (realIndex || []).find(x => x.rid === r.id);
  if (ri && ri.co && ri.co.indexOf('·') > 0) return coKey(ri.co.split('·')[0]);
  return coKey(String(r.title || r.nav || r.id).split(/[\s·]/)[0].split(ROUND_RE)[0]) || r.id;
}

// 轮次：标题里的轮次词（多个用 + 连，「两轮」只在没有具体轮次时保留），带上紧跟轮次词的括号里的面试官身份
export function deriveRound(r) {
  const t = String(r.title || r.nav || '').replace(/·\s*实战复盘.*$/, '');
  let rk = [...new Set(t.match(ROUND_RE) || [])];
  if (rk.length > 1) rk = rk.filter(x => x !== '两轮');
  const role = (t.match(/(?:一面|二面|三面|四面|终面|HR ?面|交叉面)\s*[（(]([^）)]*)[）)]/) || [])[1];
  const roleOk = role && !new RegExp(ROUND_RE.source).test(role);
  return (rk.join('+') || '复盘') + (roleOk ? ' · ' + role.replace(/面$/, '') : '');
}

// 估算分（仅在没有人工评分时兜底）：hl 定档（绿 8.0 / 橙 7.0 / 红 6.5）
//   + (亮−改)/总题数×1.5（限 ±0.5） − 翻/漏 每个 0.15（最多 −0.5），按 0.5 取整
export function estimateScore(r) {
  const md = String(r.md || ''), n = k => (md.match(new RegExp('【' + k, 'g')) || []).length;
  const base = { green: 8, orange: 7, red: 6.5 }[r.hl] || 7;
  const tot = n('亮') + n('稳') + n('改') || 1;
  const adj = Math.max(-0.5, Math.min(0.5, (n('亮') - n('改')) / tot * 1.5));
  const v = base + adj - Math.min(0.5, (n('翻') + n('漏')) * 0.15);
  return Math.max(1, Math.min(10, Math.round(v * 2) / 2));
}

// 按公司分组：公司顺序 = 该公司在 reviews 中首次出现的位置（新卡置顶即公司置顶），组内按日期升序
export function reviewGroups(bank) {
  const groups = [], byCo = {};
  bank.reviews.forEach(r => {
    const m = Object.assign({}, r);
    m.company = m.company || deriveCompany(r, bank.realIndex);
    m.round = m.round || deriveRound(r);
    m.scoreAuto = typeof m.score !== 'number';
    if (m.scoreAuto) m.score = estimateScore(r);
    // 同公司不同写法（如「示例」vs「示例公司」）互相包含即并组
    let k = coKey(m.company);
    const hit = Object.keys(byCo).find(x => x.indexOf(k) >= 0 || k.indexOf(x) >= 0);
    if (hit) k = hit;
    if (!byCo[k]) { byCo[k] = { company: m.company, items: [] }; groups.push(byCo[k]); }
    byCo[k].items.push(m);
  });
  groups.forEach(g => g.items.sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))));
  return groups;
}
