/* 页面级交互状态：卡片折叠、目录开关、打印、荧光笔模式。
 * 原单文件页靠直接改 DOM class 实现，这里收成一份响应式状态，组件按状态渲染。 */
import { reactive, watchEffect, nextTick } from 'vue';
import { toast } from './useToast.js';

export const ui = reactive({
  collapsed: {},        // 卡片 id → true（折叠）
  navCollapsed: false,  // 宽屏：目录收起、内容挤满
  navOpen: false,       // 窄屏：目录浮层打开
  printing: false,      // 打印 / 导出 PDF 期间：全部展开、答案显示为预览
  hlMode: false,
  hlColor: 'b',
  current: '',          // 滚动高亮的区块 id
});

// CSS 依赖 body 上的状态类，统一在这里同步
export function bindBodyClasses() {
  watchEffect(() => {
    const b = document.body.classList;
    b.toggle('nav-collapsed', ui.navCollapsed);
    b.toggle('nav-open', ui.navOpen);
    b.toggle('printing', ui.printing);
    b.toggle('hl-mode', ui.hlMode);
  });
}

export const isNarrow = () => window.matchMedia('(max-width:860px)').matches;

export function toggleCard(id) { ui.collapsed[id] = !ui.collapsed[id]; }
export function setAllCards(ids, collapse) { ids.forEach(id => { ui.collapsed[id] = collapse; }); }

// 跳到某道题（或任意锚点）：先展开所在卡片，再滚动并闪一下
export async function jumpTo(id, { flash = true } = {}) {
  let el = document.getElementById(id);
  if (!el) { toast('题库中暂无 ' + id.toUpperCase()); return; }
  const card = el.closest('.card');
  if (card && ui.collapsed[card.id]) { ui.collapsed[card.id] = false; await nextTick(); el = document.getElementById(id); }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (!flash) return;
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 1900);
}

// 打印：先进入 printing 状态让组件全部展开，渲染完再调起打印；afterprint 时恢复
export function printPDF() {
  ui.printing = true;
  Object.keys(ui.collapsed).forEach(k => { ui.collapsed[k] = false; });
  nextTick(() => setTimeout(() => window.print(), 80));
}
export function bindPrint() {
  window.addEventListener('afterprint', () => { ui.printing = false; });
}
