import { createApp, h } from 'vue';
import './styles/main.css';
import App from './App.vue';
import { data, loadData } from './composables/useData.js';
import { initAnswers } from './composables/useAnswers.js';
import { bindBodyClasses, bindPrint } from './composables/useUi.js';

// 数据加载完再挂载：锚点定位、滚动高亮都依赖完整的 DOM
loadData().then(() => {
  if (data.status !== 'ready') {
    createApp({ render: () => h('div', { class: 'load-error' }, [h('h2', '页面打不开'), h('pre', data.error)]) }).mount('#app');
    return;
  }
  initAnswers();
  bindBodyClasses();
  bindPrint();
  createApp(App).mount('#app');
});
