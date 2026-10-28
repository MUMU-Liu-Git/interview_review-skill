#!/usr/bin/env node
/* 把构建好的页面（dist/）部署到数据目录：node scripts/deploy.mjs [数据目录] [--force]
 *   dist/index.html → <数据目录>/interview-practice.html
 *   dist/app/*      → <数据目录>/app/
 * 数据文件（interview-bank.json / profile.json / 答案）一概不碰。部署过的文件记在 .app-manifest.json，
 * 下次部署只清理清单里已经不用的旧文件。页面在上次部署后被手改过则拒绝覆盖（--force 才覆盖）。 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(SKILL, 'dist');
const args = process.argv.slice(2);
const force = args.includes('--force');
const dir = args.find(a => !a.startsWith('--')) || process.env.INTERVIEW_REVIEW_DATA;
const fail = msg => { console.error('✗ ' + msg); process.exit(1); };

if (!dir) fail('用法: node scripts/deploy.mjs <数据目录>，或设置 INTERVIEW_REVIEW_DATA');
const target = path.resolve(dir);
if (!fs.existsSync(path.join(target, 'interview-bank.json'))) fail('不像数据目录（没有 interview-bank.json）：' + target);
if (!fs.existsSync(path.join(DIST, 'index.html'))) fail('还没有构建产物，先运行 npm run build');
if (target.startsWith(SKILL + path.sep) && !target.includes(path.sep + 'examples' + path.sep)) fail('不要部署到 skill 目录里');

const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');
const PAGE = 'interview-practice.html';
const manifestPath = path.join(target, '.app-manifest.json');
const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;

// 要写入的文件：相对数据目录的路径 → 源文件
const plan = { [PAGE]: path.join(DIST, 'index.html') };
const walk = (abs, rel) => fs.readdirSync(abs, { withFileTypes: true }).forEach(e => {
  const a = path.join(abs, e.name), r = rel + '/' + e.name;
  if (e.isDirectory()) walk(a, r); else plan[r.slice(1)] = a;
});
if (fs.existsSync(path.join(DIST, 'app'))) walk(path.join(DIST, 'app'), '/app');

// 防覆盖：清单里记过的文件被改过 → 拒绝
const pagePath = path.join(target, PAGE);
if (old && !force) {
  const changed = Object.entries(old.files).filter(([rel, h]) => {
    const p = path.join(target, rel);
    return fs.existsSync(p) && sha(fs.readFileSync(p)) !== h;
  }).map(([rel]) => rel);
  if (changed.length) fail('这些文件在上次部署后被直接修改过：' + changed.join('、') + '\n  页面是构建产物，改动请改 skill 的 app/ 源码后重新 build；确认要丢弃再加 --force');
}
// 第一次部署：数据目录里的旧页面（单文件版）先备份
if (!old && fs.existsSync(pagePath)) {
  const bak = path.join(target, 'interview-practice.before-vue-' + new Date().toISOString().slice(0, 10) + '.html');
  if (!fs.existsSync(bak)) { fs.copyFileSync(pagePath, bak); console.log('· 旧页面已备份到 ' + bak); }
}

const files = {};
for (const [rel, src] of Object.entries(plan)) {
  const dst = path.join(target, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  files[rel] = sha(fs.readFileSync(dst));
}
// 清理：只删上次清单里有、这次没有的文件
let removed = 0;
if (old) for (const rel of Object.keys(old.files)) {
  if (files[rel]) continue;
  const p = path.join(target, rel);
  if (fs.existsSync(p)) { fs.unlinkSync(p); removed++; }
}
// 旧版 build.js 的防覆盖戳已经没用了
const oldStamp = path.join(target, '.' + PAGE + '.build.sha256');
if (fs.existsSync(oldStamp)) fs.unlinkSync(oldStamp);

fs.writeFileSync(manifestPath, JSON.stringify({ deployedAt: new Date().toISOString(), files }, null, 2) + '\n');
console.log('✓ 已部署 %d 个文件%s → %s', Object.keys(files).length, removed ? '，清理旧文件 ' + removed + ' 个' : '', target);
console.log('  通过本地服务打开 ' + PAGE + '（不能双击打开）');
