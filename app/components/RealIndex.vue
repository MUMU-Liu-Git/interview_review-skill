<script setup>
/* 真题索引：公司 → 维度 → 真题，三级可收缩；点题号跳到题库对应题目 */
import { computed, reactive, watch } from 'vue';
import { ui, jumpTo } from '../composables/useUi.js';

const props = defineProps({ index: { type: Array, required: true } });
const FLAGMAP = { '亮': 'star', '稳': 'ok', '改': 'fix', '漏': 'miss', '翻': 'fail' };
const LEGEND = [['亮', '最亮'], ['稳', '守住'], ['改', '待改'], ['漏', '漏答'], ['翻', '翻车']];

const total = computed(() => props.index.reduce((n, c) => n + c.dims.reduce((m, d) => m + d.items.length, 0), 0));
const count = c => c.dims.reduce((m, d) => m + d.items.length, 0);

// 默认：整块展开、第一场展开、其余场折叠、维度展开
const st = reactive({ box: false, co: {}, dim: {} });
props.index.forEach((c, ci) => { st.co[ci] = ci !== 0; });
const setAll = open => {
  props.index.forEach((c, ci) => { st.co[ci] = !open; c.dims.forEach((d, di) => { st.dim[ci + '-' + di] = !open; }); });
};
watch(() => ui.printing, p => { if (p) { st.box = false; setAll(true); } });
</script>

<template>
  <div class="ridx" :class="{ closed: st.box }">
    <div class="ridx-hd" @click="st.box = !st.box">🎯 真题索引 · 已面 {{ index.length }} 场 / {{ total }} 道真题</div>
    <div class="ridx-bd">
      <div class="ridx-tools">
        <button data-ra="open" @click.stop="setAll(true)">全部展开</button><button data-ra="close" @click.stop="setAll(false)">全部折叠</button>
        <span class="ridx-lg"><template v-for="([f, t], i) in LEGEND" :key="f"><span class="rflag" :class="'f-' + FLAGMAP[f]">{{ f }}</span>{{ t + (i < LEGEND.length - 1 ? ' ' : '') }}</template></span>
      </div>
      <div v-for="(c, ci) in index" :key="ci" class="rco" :class="{ closed: st.co[ci] }">
        <div class="rco-hd" @click.stop="st.co[ci] = !st.co[ci]">{{ c.co }}<span class="rco-date">{{ c.date }}</span><span class="rco-n">{{ count(c) }} 题 · {{ c.dims.length }} 维度</span></div>
        <div class="rco-bd">
          <div v-if="c.n" class="rco-note">{{ c.n }}</div>
          <div v-for="(d, di) in c.dims" :key="di" class="rdim" :class="{ closed: st.dim[ci + '-' + di] }">
            <div class="rdim-hd" @click.stop="st.dim[ci + '-' + di] = !st.dim[ci + '-' + di]"><span class="rdim-n">{{ d.d }}</span>{{ d.t }}<span class="rdim-c">{{ d.items.length }}</span></div>
            <div class="rdim-bd">
              <a v-for="it in d.items" :key="it.id" class="rq" :href="'#q' + it.id" :data-qid="'q' + it.id"
                @click.prevent.stop="jumpTo('q' + it.id)"><span class="rq-id">Q{{ it.id }}</span><span>{{ it.t }}<span v-if="it.f" class="rflag" :class="'f-' + (FLAGMAP[it.f] || 'ok')">{{ it.f }}</span></span></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
