<script setup>
import { computed } from 'vue';
import { esc, inline } from '../lib/markdown.js';

const props = defineProps({ node: { type: Object, required: true }, depth: { type: Number, default: 0 } });
const cls = computed(() => ['node', props.depth === 0 ? 'mm-root' : props.depth === 1 ? 'mm-l1' : 'mm-l2', props.node.lv].filter(Boolean));
// 节点文字 + 备注（备注是节点内的一个 span）
const html = computed(() => inline(esc(props.node.t)) +
  (props.node.note ? '<span class="mm-note">' + inline(esc(props.node.note)) + '</span>' : ''));
</script>

<template>
  <div class="mm-item">
    <div :class="cls" v-html="html"></div>
    <div v-if="node.c && node.c.length" class="mm-col">
      <div v-for="(ch, i) in node.c" :key="i" class="mm-row"><MindNode :node="ch" :depth="depth + 1" /></div>
    </div>
  </div>
</template>
