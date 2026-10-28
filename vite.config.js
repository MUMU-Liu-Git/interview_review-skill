import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'node:fs';
import path from 'node:path';

// 开发时页面要读的数据文件：默认用虚构示例，改界面时可指向自己的数据目录
//   DATA_DIR=../../2_personal/hq/review npm run dev
const DATA_DIR = path.resolve(process.env.DATA_DIR || 'examples/demo');
const DATA_FILES = ['interview-bank.json', 'profile.json'];

function serveDataDir() {
  return {
    name: 'serve-data-dir',
    configureServer(server) { server.middlewares.use(dataMiddleware); },
    configurePreviewServer(server) { server.middlewares.use(dataMiddleware); },
  };
}

function dataMiddleware(req, res, next) {
  const name = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\//, '');
  if (!DATA_FILES.includes(name)) return next();
  const file = path.join(DATA_DIR, name);
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(file).pipe(res);
}

export default defineConfig({
  root: 'app',
  base: './',
  plugins: [vue(), serveDataDir()],
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1' },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // 产物放 app/，避开数据目录里已有的 assets/
    assetsDir: 'app',
  },
  test: {
    root: '.',
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
  },
});
