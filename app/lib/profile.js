/* 个人信息：来自数据目录的 profile.json；缺省字段用这里的通用文案 */
export const PROFILE_DEFAULT = {
  name: '', role: '', dimNotes: {}, mindDimNotes: {},
  // traps：各小节末尾的「我的真题卡点」，值是一段含 Q 号的文字，键见 content/framework.js 的 tp()/ti()
  traps: {},
  slots: {
    chainNote: '设计/Case 题拆环节这一步不能省。',
    evidenceExample: '把抽象结论换成具体场景',
    discipline: '设计/Case 题最常见的失分就是一上来就给方案——先分析后方案，记死。',
    storyPain: '不说抽象结论，说一个能放出画面的具体场景（谁、在什么情境下、被什么卡住）',
    storyFrame: '"重点讲两个功能——前者解决 A，后者解决 B"',
    storyMechanism: 'workflow 怎么走、Prompt 改了什么、关键参数为什么这么定',
    storyNumbers: '每个数字都能说出分母（渗透率、留存、成本降幅、无效输出降幅……）',
    bankSources: '真实面试真题',
    mindStoryPain: '说一个能放出画面的场景',
    mindStoryFrame: '前者解决 A·后者解决 B',
  },
};

export function mergeProfile(raw) {
  raw = raw || {};
  return Object.assign({}, PROFILE_DEFAULT, raw, {
    dimNotes: Object.assign({}, raw.dimNotes),
    mindDimNotes: Object.assign({}, raw.mindDimNotes),
    traps: Object.assign({}, raw.traps),
    slots: Object.assign({}, PROFILE_DEFAULT.slots, raw.slots),
  });
}
