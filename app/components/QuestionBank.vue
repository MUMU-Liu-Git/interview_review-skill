<script setup>
/* 章节二：题库总卡（说明 + 真题索引）与各维度题卡 */
import { ui, toggleCard } from '../composables/useUi.js';
import RealIndex from './RealIndex.vue';
import QuestionItem from './QuestionItem.vue';

defineProps({ cats: Array, total: Number, realIndex: Array, bankSources: String });
</script>

<template>
  <div id="bank" class="card" :class="{ collapsed: ui.collapsed.bank, 'chap-break': ui.printing }">
    <h2 @click="toggleCard('bank')"><span class="tag">章节二</span>二、模拟面试问题集（{{ total }} 题）</h2>
    <div class="cat-desc">按维度出题，源自简历关键词 + {{ bankSources }} + 面试官当场反馈。每个维度内按优先级自动排序：<span class="lvl real">真题</span>（权重最高，转录稿原句）→ <span class="lvl l3">高频</span>必答 → <span class="lvl l2">较可能</span> → <span class="lvl l1">深挖</span>。新真题 append 即自动归位，无需手动重排。</div>
    <RealIndex :index="realIndex" />
  </div>
  <div v-for="c in cats" :id="c.id" :key="c.id" class="card" :class="{ collapsed: ui.collapsed[c.id] }">
    <h2 @click="toggleCard(c.id)"><span class="tag">{{ c.tag }}</span>{{ c.id }} · {{ c.title }}</h2>
    <div class="cat-desc" v-html="c.desc"></div>
    <QuestionItem v-for="q in c.qs" :key="q.id" :q="q" />
  </div>
</template>
