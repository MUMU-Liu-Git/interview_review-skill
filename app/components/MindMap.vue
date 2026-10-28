<script setup>
/* 思维导图：根节点 → 一级 → 二级，递归渲染（MindNode 调用自身） */
import MindNode from './MindNode.vue';
defineProps({ root: { type: Object, required: true } });
</script>

<template>
  <div class="mm"><div class="mm-row"><MindNode :node="root" :depth="0" /></div></div>
</template>
