/* 题库：真题判定、优先级排序、真题备注拆分（规则与原模板一致） */

// 真题判定：real:true，或题干含"原题"（转录稿原句）。真题权重最高
export function isReal(q) {
  return q.real === true || /原题/.test(q.text || '');
}

// 优先级排序：真题 > 高频(3) > 较可能(2) > 深挖(1)；同级保持录入顺序（Array.sort 是稳定排序）。
// 新真题只需 append，渲染时自动落到正确位置，无需手动重排。
export function prioCmp(a, b) {
  return (isReal(b) - isReal(a)) || (b.star - a.star);
}

export const LEVEL_TEXT = { 3: '高频', 2: '较可能', 1: '深挖' };

// 真题备注（原题来源/点评）：从题干末尾的（…原题…｜…）括号剥离，单独显示成小一号灰字
export function splitNote(q) {
  if (!isReal(q)) return { main: q.text, note: '' };
  const m = q.text.match(/^([\s\S]*?)（([^（）]*(?:原题|｜)[\s\S]*?)）\s*$/);
  return m ? { main: m[1], note: m[2] } : { main: q.text, note: '' };
}

// 按维度分组，组内按优先级排序
export function buildCats(bank) {
  return bank.dims.map(d => ({
    ...d,
    qs: bank.questions.filter(q => q.dim === d.id).slice().sort(prioCmp),
  }));
}

export function allQuestionIds(bank) {
  return bank.questions.map(q => q.id).sort((a, b) => a - b);
}
