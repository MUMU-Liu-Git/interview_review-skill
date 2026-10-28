#!/usr/bin/env node
/* 校验数据目录：node scripts/check.mjs [数据目录]（缺省读 INTERVIEW_REVIEW_DATA）
 * 规则和页面里用的是同一份 app/lib/validate.js。改完 interview-bank.json 后跑一次，通过再刷新页面。 */
import fs from 'node:fs';
import path from 'node:path';
import { validateBank } from '../app/lib/validate.js';

const dir = process.argv[2] || process.env.INTERVIEW_REVIEW_DATA;
const fail = msg => { console.error('✗ ' + msg); process.exit(1); };
if (!dir) fail('用法: node scripts/check.mjs <数据目录>，或设置 INTERVIEW_REVIEW_DATA');

const readJson = (name, optional) => {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) { if (optional) return null; fail('数据目录里没有 ' + name + '：' + p); }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { fail(name + ' 不是合法 JSON：' + e.message); }
};
const bank = readJson('interview-bank.json');
const profile = readJson('profile.json', true);
if (profile && (typeof profile !== 'object' || Array.isArray(profile))) fail('profile.json 必须是一个对象');

const { problems, warnings } = validateBank(bank);
if (warnings.length) console.warn('⚠ 提示：\n - ' + warnings.join('\n - '));
if (problems.length) fail('校验未通过：\n - ' + problems.join('\n - '));
console.log('✓ 校验通过：dims=%d questions=%d reviews=%d realIndex=%d%s',
  bank.dims.length, bank.questions.length, bank.reviews.length, bank.realIndex.length, profile ? ' + profile.json' : '');
