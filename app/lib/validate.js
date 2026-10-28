/* 题库校验（浏览器页面和 scripts/check.mjs 共用这一份）：题号唯一、维度合法、复盘卡字段完整；
 * 真题三处对齐——真题索引引用的题必须是真题、维度一致、题干含本场 key、与复盘卡正文 Qn 完全一致。
 * 返回 { problems, warnings }，problems 非空时调用方必须拒绝写入。
 */
export function validateBank(bank) {
  const problems = [];
  const warnings = [];
  for (const k of ['dims', 'questions', 'reviews', 'realIndex']) {
    if (!Array.isArray(bank[k])) problems.push('缺少数组字段 ' + k);
  }
  if (problems.length) return { problems, warnings };

  const ids = bank.questions.map(q => q.id);
  const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
  if (dup.length) problems.push('重复题号: ' + dup.join(','));

  const dimIds = new Set(bank.dims.map(d => d.id));
  bank.questions.forEach(q => { if (!dimIds.has(q.dim)) problems.push('题 ' + q.id + ' 的维度 ' + q.dim + ' 不在 dims 中'); });

  const reviewIds = new Set();
  bank.reviews.forEach(r => {
    ['id', 'title', 'tag', 'hl', 'nav', 'md'].forEach(k => { if (!r[k]) problems.push('复盘卡缺字段 ' + k + '：' + (r.id || '?')); });
    if (!['green', 'orange', 'red'].includes(r.hl)) problems.push('复盘卡 ' + r.id + ' 的 hl 非 green/orange/red');
    if (r.score !== undefined && (typeof r.score !== 'number' || r.score < 0 || r.score > 10)) problems.push('复盘卡 ' + r.id + ' 的 score 须为 0–10 的数字');
    if (reviewIds.has(r.id)) problems.push('复盘卡 id 重复: ' + r.id);
    reviewIds.add(r.id);
  });

  // 历史教训：把真题挂到"意思相近的预测题"上，页面跳过去发现题干对不上。
  const qById = {};
  bank.questions.forEach(q => { qById[q.id] = q; });
  const isReal = q => q.real === true || /原题/.test(q.text || '');
  const indexed = new Set();
  bank.realIndex.forEach(c => {
    const tag = '真题索引「' + c.co + '」';
    if (!c.key) problems.push(tag + ' 缺 key（公司关键词，须出现在所引题目的题干里，如 "示例公司"）');
    const blockIds = new Set();
    (c.dims || []).forEach(d => (d.items || []).forEach(it => {
      const q = qById[it.id];
      if (!q) { problems.push(tag + ' 引用了题库不存在的 Q' + it.id); return; }
      blockIds.add(it.id); indexed.add(it.id);
      if (!isReal(q)) problems.push(tag + ' 的 Q' + it.id + ' 在题库里不是真题（real 未置 true）——要么新建真题，要么把该题标 real 并补上本场原题点评');
      if (q.dim !== d.d) problems.push(tag + ' 把 Q' + it.id + ' 放在 ' + d.d + '，但题库里它属于 ' + q.dim);
      if (c.key && !(q.text || '').includes(c.key)) problems.push(tag + ' 的 Q' + it.id + ' 题干里没有「' + c.key + '」——这题可能不是本场问的，挂错了号');
    }));
    if (c.rid) {
      const r = bank.reviews.find(x => x.id === c.rid);
      if (!r) { problems.push(tag + ' 的 rid=' + c.rid + ' 找不到对应复盘卡'); return; }
      const mdIds = new Set((r.md.match(/Q(\d{1,4})/g) || []).map(s => +s.slice(1)));
      mdIds.forEach(id => { if (!blockIds.has(id)) problems.push('复盘卡 ' + r.id + ' 提到 Q' + id + '，但真题索引「' + c.co + '」里没有'); });
      blockIds.forEach(id => { if (!mdIds.has(id)) problems.push('真题索引「' + c.co + '」有 Q' + id + '，但复盘卡 ' + r.id + ' 正文没提到'); });
    }
  });
  // 真题但没进任何索引：只告警（如笔试题没有场次块）
  bank.questions.forEach(q => { if (isReal(q) && !indexed.has(q.id)) warnings.push('真题 Q' + q.id + ' 未出现在任何真题索引块'); });
  return { problems, warnings };
}


