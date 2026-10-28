<script setup>
/* 页面骨架：顶栏 + 目录 + 进度条 + 正文（复盘卡 → 一 → 二 → 三 → 四）+ 提示 */
import { computed, onMounted, watch, nextTick } from 'vue';
import { data } from './composables/useData.js';
import { answers } from './composables/useAnswers.js';
import { toastState } from './composables/useToast.js';
import { jumpTo } from './composables/useUi.js';
import { buildCats } from './lib/questions.js';
import { buildFramework } from './content/framework.js';
import AppHeader from './components/AppHeader.vue';
import SideNav from './components/SideNav.vue';
import RefCard from './components/RefCard.vue';
import QuestionBank from './components/QuestionBank.vue';

const bank = computed(() => data.bank);
const cats = computed(() => buildCats(bank.value));
const total = computed(() => bank.value.questions.length);
const fw = computed(() => buildFramework(data.profile));
const progress = computed(() => {
  const done = bank.value.questions.filter(q => (answers.store['q' + q.id] || '').trim()).length;
  return (done / (total.value || 1) * 100) + '%';
});

watch(() => data.profile.name, n => { document.title = '面试题库与思考/回答框架' + (n ? ' · ' + n : ''); }, { immediate: true });

// 复盘正文里的题号按钮（v-html 生成）→ 跳题
function onWrapClick(e) {
  const a = e.target.closest('a.qjump');
  if (a) { e.preventDefault(); jumpTo(a.dataset.qid); }
}
// 带锚点打开（如从作战地图跳来 #baidumap、#q12）：渲染完成后再定位
onMounted(() => nextTick(() => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id) jumpTo(id, { flash: /^q\d+$/.test(id) });
}));
</script>

<template>
  <AppHeader :bank="bank" :profile="data.profile" />
  <SideNav :bank="bank" :cats="cats" :total="total" />
  <div class="progwrap"><div id="progbar" class="progbar" :style="{ width: progress }"></div></div>
  <div id="wrap" class="wrap" @click="onWrapClick">
    <div v-if="data.problems.length" class="card data-problems">
      <h2><span class="tag">数据校验</span>interview-bank.json 有 {{ data.problems.length }} 处问题，页面可能显示错位</h2>
      <ul><li v-for="(p, i) in data.problems" :key="i">{{ p }}</li></ul>
    </div>
    <RefCard v-for="r in bank.reviews" :id="r.id" :key="r.id" :title="r.title" :tag="r.tag" :md="r.md" review />
    <RefCard id="classify" title="一、面试问题的维度分类" tag="章节一" :md="fw.classify" :map="fw.maps.classify" />
    <QuestionBank :cats="cats" :total="total" :real-index="bank.realIndex" :bank-sources="data.profile.slots.bankSources" />
    <RefCard id="think" title="三、通用快速思考框架" tag="章节三" :md="fw.think" :map="fw.maps.think" />
    <RefCard id="answer" title="四、结构化回答模板" tag="章节四" :md="fw.answer" :map="fw.maps.answer" />
  </div>
  <div id="toast" class="toast" :class="{ show: toastState.show }">{{ toastState.msg }}</div>
</template>
