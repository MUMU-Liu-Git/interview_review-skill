<script setup>
/* 顶栏：目录开关、姓名岗位、格式工具（加粗 / 四色荧光笔）、保存状态、导出菜单、关联本地文件 */
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { answers, saveNow, fmtTime, linkFile, reconnectFile, importJSON, exportJSON, exportMarkdown, setAnswer } from '../composables/useAnswers.js';
import { ui, isNarrow, printPDF } from '../composables/useUi.js';
import { toast } from '../composables/useToast.js';

const props = defineProps({ bank: Object, profile: Object });
const meta = computed(() => (props.profile.name || props.profile.role)
  ? (props.profile.name || '你的名字') + ' / ' + (props.profile.role || '目标岗位') : '你的名字 / 目标岗位');
const COLORS = [['b', '#A5D4FF', '蓝'], ['o', '#FFC078', '橙'], ['p', '#D9B8FF', '紫'], ['r', '#FF8FBE', '玫红']];
const menu = ref(false);
const boldOn = ref(false);

function toggleNav() { if (isNarrow()) ui.navOpen = !ui.navOpen; else ui.navCollapsed = !ui.navCollapsed; }
function pick(fn) { menu.value = false; fn(); }

// —— 格式化当前答案框的选区：直接改 textarea 的值，再同步到答案存储 ——
let lastTA = null;
const isInp = el => el && el.classList && el.classList.contains('inp');
function wrapSel(pre, post) {
  const ta = isInp(lastTA) ? lastTA : (isInp(document.activeElement) ? document.activeElement : null);
  if (!ta) { toast('先点进某道题的答案框并选中文本'); return; }
  const s = ta.selectionStart, e = ta.selectionEnd;
  if (s == null || s === e) { toast('先选中要格式化的文本'); return; }
  const v = ta.value;
  ta.value = v.slice(0, s) + pre + v.slice(s, e) + post + v.slice(e);
  setAnswer(ta.closest('.q').dataset.id, ta.value);
  ta.focus(); ta.setSelectionRange(s, e + pre.length + post.length);
}
function bold() { wrapSel('**', '**'); boldOn.value = true; setTimeout(() => { boldOn.value = false; }, 250); }

const onFocusIn = e => { if (isInp(e.target)) lastTA = e.target; };
const onMouseUp = () => {
  if (!ui.hlMode) return;
  const ta = document.activeElement;
  if (isInp(ta) && ta.selectionStart !== ta.selectionEnd) { lastTA = ta; wrapSel('==' + ui.hlColor + '|', '=='); }
};
const closeMenu = () => { menu.value = false; };
onMounted(() => {
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('click', closeMenu);
});
onBeforeUnmount(() => {
  document.removeEventListener('focusin', onFocusIn);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('click', closeMenu);
});
</script>

<template>
  <header>
    <button id="navToggle" title="收起/展开目录" @click="toggleNav">☰</button>
    <h1>面试题库 · 答题练习</h1>
    <span id="profileMeta" class="meta">{{ meta }}</span>
    <div class="spacer"></div>
    <div class="fmt-tools">
      <button id="fmtBold" class="fmt-btn" :class="{ on: boldOn }" title="加粗：在某道题答案里选中文本后点此" @click.stop="bold"><b>B</b></button>
      <div class="fmt-hl-wrap">
        <button id="fmtHl" class="fmt-btn" :class="{ on: ui.hlMode }" title="荧光笔：点开选色，选中答案文本即上色；再点关闭" @click.stop="ui.hlMode = !ui.hlMode">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16" /><path d="M14.5 4.5l5 5-8.5 8.5H6v-5z" /></svg>
        </button>
        <div id="hlPalette" class="hl-palette" :class="{ show: ui.hlMode }">
          <button v-for="[c, bg, t] in COLORS" :key="c" :data-c="c" :style="{ background: bg }" :title="t" :class="{ on: ui.hlColor === c }" @click.stop="ui.hlColor = c"></button>
        </div>
      </div>
    </div>
    <span id="status" class="status"><template v-if="answers.savedAt">已保存 <b>{{ fmtTime(answers.savedAt) }}</b></template><template v-else>未保存</template></span>
    <span id="fileStatus" class="meta">{{ answers.fileName ? '· 已关联 ' + answers.fileName : '' }}</span>
    <div class="exp-wrap">
      <button id="exportBtn" class="btn btn-ghost" @click.stop="menu = !menu">导出 ▾</button>
      <div id="expMenu" class="exp-menu" :class="{ show: menu }">
        <button v-if="answers.fsSupported" id="linkFileBtn" @click="pick(linkFile)">关联本地文件（自动保存）</button>
        <button id="impJson" @click="pick(importJSON)">导入答案 JSON</button>
        <button id="expJson" @click="pick(exportJSON)">导出答案 JSON</button>
        <button id="expMd" @click="pick(() => exportMarkdown(bank, profile))">导出 Markdown</button>
        <button id="expPdf" @click="pick(printPDF)">导出 PDF（打印）</button>
      </div>
    </div>
    <button v-show="answers.needReconnect" id="reconnectBtn" class="btn btn-ghost" @click="reconnectFile">重新连接答案文件</button>
    <button id="saveBtn" class="btn btn-primary" @click="saveNow(false)">保存答案</button>
  </header>
</template>
