import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { isReal, prioCmp, splitNote, buildCats } from '../app/lib/questions.js';
import { reviewGroups, estimateScore } from '../app/lib/reviewNav.js';
import { validateBank } from '../app/lib/validate.js';
import { mergeProfile } from '../app/lib/profile.js';
import { buildFramework } from '../app/content/framework.js';
import { answers, setAnswer, mergeAnswers, LS_KEY } from '../app/composables/useAnswers.js';
import { data } from '../app/composables/useData.js';
import { ui } from '../app/composables/useUi.js';
import QuestionItem from '../app/components/QuestionItem.vue';
import RealIndex from '../app/components/RealIndex.vue';
import App from '../app/App.vue';

const demo = () => JSON.parse(fs.readFileSync('examples/demo/interview-bank.json', 'utf8'));

describe('题库规则', () => {
  it('真题判定：real 或题干含“原题”', () => {
    expect(isReal({ real: true, text: 'x' })).toBe(true);
    expect(isReal({ text: '自我介绍（**A原题**）' })).toBe(true);
    expect(isReal({ text: '普通题' })).toBe(false);
  });
  it('排序：真题 > 高频 > 较可能 > 深挖，同级保持录入顺序', () => {
    const qs = [{ id: 1, star: 1, text: 'a' }, { id: 2, star: 3, text: 'b' }, { id: 3, star: 1, text: 'c', real: true }, { id: 4, star: 3, text: 'd' }];
    expect(qs.slice().sort(prioCmp).map(q => q.id)).toEqual([3, 2, 4, 1]);
  });
  it('真题备注从题干末尾括号剥离', () => {
    expect(splitNote({ real: true, text: '为什么做产品？（**A原题**｜【稳】ok）' })).toEqual({ main: '为什么做产品？', note: '**A原题**｜【稳】ok' });
  });
  it('demo 数据按维度分组且校验通过', () => {
    const b = demo();
    expect(validateBank(b).problems).toEqual([]);
    expect(buildCats(b).reduce((n, c) => n + c.qs.length, 0)).toBe(b.questions.length);
  });
});

describe('复盘导航', () => {
  it('有人工评分用人工值，没有就估算并标 auto', () => {
    const b = demo();
    const r = b.reviews[0];
    expect(reviewGroups(b)[0].items[0]).toMatchObject({ company: '示例公司', score: 7.5, scoreAuto: false });
    const b2 = { ...b, reviews: [{ ...r, score: undefined, company: undefined }] };
    const it2 = reviewGroups(b2)[0].items[0];
    expect(it2.scoreAuto).toBe(true);
    expect(it2.score).toBe(estimateScore(r));
    expect(it2.company).toBe('示例公司');
  });
  it('同公司不同写法并组', () => {
    const base = { hl: 'green', md: '', title: 't', tag: 't', nav: 'n' };
    const g = reviewGroups({ realIndex: [], reviews: [{ ...base, id: 'a', company: '示例' }, { ...base, id: 'b', company: '示例公司' }] });
    expect(g).toHaveLength(1);
    expect(g[0].items).toHaveLength(2);
  });
});

describe('profile', () => {
  it('缺省时用通用文案、不出现 undefined', () => {
    const fw = buildFramework(mergeProfile());
    expect(fw.think).toContain('设计/Case 题拆环节这一步不能省');
    expect(fw.classify + fw.think + fw.answer).not.toContain('undefined');
    expect(fw.classify + fw.think + fw.answer).not.toContain('我的真题卡点');
    expect(fw.maps.classify.root.c[2].c[2].lv).toBeUndefined();
  });
  it('有 D8 备注时维度行加粗、导图标红', () => {
    const fw = buildFramework(mergeProfile({ dimNotes: { D8: '短板' }, mindDimNotes: { D8: '必补' } }));
    expect(fw.classify).toContain('技术与落地顺序（**短板**）');
    expect(fw.maps.classify.root.c[2].c[2]).toMatchObject({ lv: 'hot', note: '必补' });
  });
  it('维度分类含 D12 反问和横切失分模式', () => {
    const fw = buildFramework(mergeProfile());
    expect(fw.classify).toContain('D12 反问');
    expect(fw.classify).toContain('横切的失分模式');
    expect(fw.maps.classify.root.c[4].c.map(n => n.t)).toContain('D12 反问');
  });
  it('traps 渲染成「我的真题卡点」并保留 Q 号', () => {
    const fw = buildFramework(mergeProfile({ traps: { reverse: 'Q7、Q9', offTopic: 'Q3' } }));
    expect(fw.answer).toContain('> 我的真题卡点：Q7、Q9');
    expect(fw.classify).toContain('防法：第一句正面回应题眼（见第三章）。 我的真题卡点：Q3');
    expect(fw.think).toContain('> 我的真题卡点：Q3');
  });
});

describe('答案存储', () => {
  beforeEach(() => { localStorage.clear(); answers.store = {}; vi.useFakeTimers(); });
  it('输入后写入 localStorage（键名与旧版一致）', () => {
    setAnswer('q3', '我的答案');
    expect(answers.store.q3).toBe('我的答案');
    vi.advanceTimersByTime(700);
    expect(JSON.parse(localStorage.getItem(LS_KEY))).toEqual({ q3: '我的答案' });
    vi.useRealTimers();
  });
  it('导入合并：文件里的答案覆盖同题，其他保留', () => {
    answers.store = { q1: 'a', q2: 'b' };
    mergeAnswers({ q2: 'B', q9: 'c' });
    expect(answers.store).toEqual({ q1: 'a', q2: 'B', q9: 'c' });
    expect(JSON.parse(localStorage.getItem(LS_KEY))).toEqual({ q1: 'a', q2: 'B', q9: 'c' });
    vi.useRealTimers();
  });
});

describe('组件', () => {
  beforeEach(() => { answers.store = {}; ui.printing = false; });
  it('QuestionItem：真题徽章、备注、输入同步', async () => {
    const w = mount(QuestionItem, { props: { q: { id: 7, star: 3, real: true, text: '目标用户是谁？（**A原题**｜【亮】好）' } } });
    expect(w.find('.lvl.real').exists()).toBe(true);
    expect(w.find('.q-note').text()).toContain('A原题');
    await w.find('textarea').setValue('**用户**');
    expect(answers.store.q7).toBe('**用户**');
    await w.find('[data-t="prev"]').trigger('click');
    expect(w.find('.preview').html()).toContain('<strong>用户</strong>');
  });
  it('打印时没写答案的题隐藏答案区', async () => {
    const w = mount(QuestionItem, { props: { q: { id: 8, star: 1, text: '题' } } });
    ui.printing = true; await nextTick();
    expect(w.find('.ans').attributes('style')).toContain('display: none');
  });
  it('RealIndex：统计、默认只展开第一场、全部展开', async () => {
    const idx = [
      { co: 'A', date: '1', dims: [{ d: 'D1', t: 't', items: [{ id: 1, t: 'x', f: '翻' }] }] },
      { co: 'B', date: '2', dims: [{ d: 'D2', t: 't', items: [{ id: 2, t: 'y' }, { id: 3, t: 'z' }] }] },
    ];
    const w = mount(RealIndex, { props: { index: idx } });
    expect(w.find('.ridx-hd').text()).toContain('已面 2 场 / 3 道真题');
    expect(w.findAll('.rco').map(x => x.classes('closed'))).toEqual([false, true]);
    expect(w.find('.rflag.f-fail').text()).toBe('翻');
    await w.find('[data-ra="open"]').trigger('click');
    expect(w.findAll('.rco.closed')).toHaveLength(0);
  });
  it('App：数据有问题时顶部显示校验横幅', () => {
    globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
    const b = demo();
    data.bank = b; data.profile = mergeProfile(); data.problems = ['示例问题'];
    const w = mount(App, { attachTo: document.body });
    expect(w.find('.data-problems').text()).toContain('示例问题');
    expect(w.findAll('.q')).toHaveLength(b.questions.length);
    expect(w.find('#profileMeta').text()).toBe('你的名字 / 目标岗位');
    w.unmount();
  });
});
