/* 读取数据目录里的 interview-bank.json + profile.json（和页面同目录），加载后跑一遍校验。
 * 页面不再内嵌数据：改完 json 刷新即可，不存在"页面里的数据和 json 不同步"。 */
import { reactive } from 'vue';
import { validateBank } from '../lib/validate.js';
import { mergeProfile } from '../lib/profile.js';

export const data = reactive({
  status: 'loading',   // loading | ready | error
  error: '',
  bank: null,
  profile: mergeProfile(),
  problems: [],
});

async function getJson(url, optional) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) {
    if (optional && r.status === 404) return null;
    throw new Error(url + ' 读取失败（HTTP ' + r.status + '）');
  }
  try { return await r.json(); }
  catch (e) { throw new Error(url + ' 不是合法 JSON：' + e.message); }
}

export async function loadData(base = './') {
  if (location.protocol === 'file:') {
    data.status = 'error';
    data.error = '这个页面需要通过本地服务打开（直接双击 HTML 读不到数据文件）。请先启动本地服务，例如双击「interview.command」，再从 http://127.0.0.1 打开。';
    return;
  }
  try {
    const [bank, profile] = await Promise.all([
      getJson(base + 'interview-bank.json'),
      getJson(base + 'profile.json', true),
    ]);
    const { problems, warnings } = validateBank(bank);
    if (warnings.length) console.warn('题库提示：\n' + warnings.join('\n'));
    const broken = ['dims', 'questions', 'reviews', 'realIndex'].some(k => !Array.isArray(bank[k]));
    data.bank = bank;
    data.profile = mergeProfile(profile);
    data.problems = problems;
    data.status = broken ? 'error' : 'ready';
    if (broken) data.error = 'interview-bank.json 结构不完整：\n' + problems.join('\n');
  } catch (e) {
    data.status = 'error';
    data.error = e.message;
  }
}
