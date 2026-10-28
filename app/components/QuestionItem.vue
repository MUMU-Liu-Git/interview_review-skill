<script setup>
/* 单道题：题干（真题徽章 + 难度 + 星级 + 真题备注）+ 答案编辑 / 预览 */
import { computed, ref, watch } from 'vue';
import { esc, inline, mdToHtml } from '../lib/markdown.js';
import { isReal, splitNote, LEVEL_TEXT } from '../lib/questions.js';
import { answers, setAnswer } from '../composables/useAnswers.js';
import { ui } from '../composables/useUi.js';

const props = defineProps({ q: { type: Object, required: true } });
const qid = computed(() => 'q' + props.q.id);
const real = computed(() => isReal(props.q));
const value = computed(() => answers.store[qid.value] || '');
const answered = computed(() => !!value.value.trim());

const textHtml = computed(() => {
  const { main } = splitNote(props.q);
  const s = props.q.star;
  return (real.value ? '<span class="lvl real">真题</span>' : '') +
    '<span class="lvl l' + s + '">' + LEVEL_TEXT[s] + '</span>' + inline(esc(main)) +
    '<span class="stars">' + '★'.repeat(s) + '</span>';
});
const noteHtml = computed(() => { const { note } = splitNote(props.q); return note ? '｜ ' + inline(esc(note)) : ''; });

const tab = ref('edit');
// 打印时：有答案显示预览、没答案整块隐藏；打印结束回到编辑
const showPreview = computed(() => tab.value === 'prev' || (ui.printing && answered.value));
const hideAns = computed(() => ui.printing && !answered.value);
const previewHtml = computed(() => showPreview.value ? mdToHtml(value.value) : '');
watch(() => ui.printing, p => { if (!p) tab.value = 'edit'; });

function onInput(e) { setAnswer(qid.value, e.target.value); }
</script>

<template>
  <div :id="qid" class="q" :class="{ answered, 'is-real': real }" :data-id="qid">
    <div class="q-head">
      <div class="q-num">{{ q.id }}</div>
      <div class="q-body">
        <div class="q-text" v-html="textHtml"></div>
        <div v-if="noteHtml" class="q-note" v-html="noteHtml"></div>
      </div>
    </div>
    <div v-show="!hideAns" class="ans">
      <div class="tabs">
        <button class="tab" :class="{ on: !showPreview }" data-t="edit" @click="tab = 'edit'">编辑</button>
        <button class="tab" :class="{ on: showPreview }" data-t="prev" @click="tab = 'prev'">预览</button>
      </div>
      <textarea v-show="!showPreview" class="inp" :value="value" @input="onInput"
        placeholder="在这里写你的答案，支持 Markdown（**加粗**、- 列表、# 标题、> 引用、`代码`）"></textarea>
      <div v-show="showPreview" class="preview" v-html="previewHtml"></div>
      <div class="hint">支持 Markdown · 输入即暂存本地 · 每 5 分钟自动保存</div>
    </div>
  </div>
</template>
