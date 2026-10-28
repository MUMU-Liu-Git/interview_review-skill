<script setup>
/* 左侧目录：实战复盘（公司 → 轮次 折叠 + 评分角标）+ 框架 / 题库维度 / 方法；滚动时高亮当前区块 */
import { computed, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { reviewGroups } from '../lib/reviewNav.js';
import { ui, isNarrow, setAllCards } from '../composables/useUi.js';

const props = defineProps({ bank: Object, cats: Array, total: Number });
const groups = computed(() => reviewGroups(props.bank));
const open = reactive({});
const cardIds = computed(() => props.bank.reviews.map(r => r.id).concat(['classify', 'bank'], props.cats.map(c => c.id), ['think', 'answer']));

const tip = r => r.title + '｜本场评分 ' + r.score.toFixed(1) + ' / 10' + (r.scoreAuto ? '（自动估算，未人工评分）' : '');
function onLink() { if (isNarrow()) ui.navOpen = false; }

// 滚到某场复盘时自动展开所属公司
watch(() => ui.current, id => {
  groups.value.forEach((g, gi) => { if (g.items.some(r => r.id === id)) open[gi] = true; });
});

let spy;
onMounted(() => nextTick(() => {
  spy = new IntersectionObserver(es => {
    es.forEach(en => { if (en.isIntersecting) ui.current = en.target.id; });
  }, { rootMargin: '-70px 0px -70% 0px' });
  cardIds.value.forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });
}));
onBeforeUnmount(() => spy && spy.disconnect());
</script>

<template>
  <aside id="sidebar">
    <div class="side-tools"><button id="collapseAll" @click="setAllCards(cardIds, true)">全部折叠</button><button id="expandAll" @click="setAllCards(cardIds, false)">全部展开</button></div>
    <div class="side-h">实战复盘 · {{ bank.reviews.length }} 场</div>
    <div v-for="(g, gi) in groups" :key="gi" class="rv-group" :class="{ open: open[gi] }">
      <button type="button" class="rv-co" :aria-expanded="open[gi] ? 'true' : 'false'" @click="open[gi] = !open[gi]">
        <span class="car">▶</span><span class="co-name">{{ g.company }}</span><span class="co-n">{{ g.items.length }} 轮</span>
      </button>
      <div class="rv-list">
        <a v-for="r in g.items" :key="r.id" :class="['hl-' + r.hl, { cur: ui.current === r.id }]" :href="'#' + r.id" :title="tip(r)" @click="onLink">
          <span class="rv-lb">★ {{ r.round }}{{ r.date ? ' · ' + r.date : '' }}</span>
          <span class="rv-sc" :class="{ auto: r.scoreAuto }">{{ (r.scoreAuto ? '≈' : '') + r.score.toFixed(1) }}</span>
        </a>
      </div>
    </div>
    <div class="side-h">框架</div>
    <a href="#classify" :class="{ cur: ui.current === 'classify' }" @click="onLink">一、维度分类</a>
    <div class="side-h">题库 · {{ total }} 题</div>
    <a href="#bank" :class="{ cur: ui.current === 'bank' }" @click="onLink">二、模拟面试问题集</a>
    <a v-for="c in cats" :key="c.id" :href="'#' + c.id" :class="{ cur: ui.current === c.id }" @click="onLink"><span class="ab">{{ c.id }}</span>{{ c.title }}（{{ c.qs.length }}）</a>
    <div class="side-h">方法</div>
    <a href="#think" :class="{ cur: ui.current === 'think' }" @click="onLink">三、思考框架</a><a href="#answer" :class="{ cur: ui.current === 'answer' }" @click="onLink">四、回答模板</a>
  </aside>
</template>
