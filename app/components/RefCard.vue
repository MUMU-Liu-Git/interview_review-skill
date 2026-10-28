<script setup>
/* 参考型卡片：实战复盘卡（review）与第一、三、四章。正文是 Markdown，每一级标题可单独折叠。 */
import { computed, ref, onMounted, watch, nextTick } from 'vue';
import { mdToHtml } from '../lib/markdown.js';
import { ui, toggleCard } from '../composables/useUi.js';
import MindMap from './MindMap.vue';

const props = defineProps({
  id: { type: String, required: true },
  title: String,
  tag: String,
  md: String,
  review: Boolean,
  map: Object,          // { title, root } 可选思维导图
});

const html = computed(() => mdToHtml(props.md, { review: props.review }));
const refEl = ref(null);

// 标题折叠作用于 v-html 生成的节点：点标题，收起/展开其后到下一个同级或更高级标题之间的内容
function setFold(h, col) {
  const lv = +h.tagName[1];
  h.classList.toggle('collapsed', col);
  let sib = h.nextElementSibling;
  while (sib) {
    const sm = sib.tagName && sib.tagName.match(/^H([1-4])$/);
    if (sm && +sm[1] <= lv) break;
    sib.style.display = col ? 'none' : '';
    sib = sib.nextElementSibling;
  }
}
function bindFolds() {
  const box = refEl.value; if (!box) return;
  [...box.children].forEach(node => {
    if (!/^H[1-4]$/.test(node.tagName || '') || node.classList.contains('fold-h')) return;
    node.classList.add('fold-h');
    node.addEventListener('click', () => setFold(node, !node.classList.contains('collapsed')));
  });
}
onMounted(bindFolds);
watch(html, () => nextTick(bindFolds));
// 打印前展开全部标题
watch(() => ui.printing, p => {
  if (p && refEl.value) refEl.value.querySelectorAll('.fold-h.collapsed').forEach(h => setFold(h, false));
});
</script>

<template>
  <div :id="id" class="card" :class="{ collapsed: ui.collapsed[id], 'chap-break': ui.printing }">
    <h2 @click="toggleCard(id)"><span class="tag">{{ tag }}</span>{{ title }}</h2>
    <div ref="refEl" class="ref" :class="{ review }" v-html="html"></div>
    <template v-if="map">
      <div class="mm-title">{{ map.title }}</div>
      <MindMap :root="map.root" />
    </template>
  </div>
</template>
