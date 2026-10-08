# interview_review · 面试复盘与题库 skill

把一场面试的**录音转文字稿**，一键整理成一张可交互的 **HTML「实战复盘」页**：自动切分问答、按维度归类、给每题判现场表现、生成复盘卡并把真题沉淀进题库。

页面是**单文件 HTML**，数据内嵌，**双击就能打开，不依赖任何服务器或后端**；答案写在浏览器本地。

> Turn an interview transcript into a single self-contained HTML review page — questions categorized by dimension, performance flagged, real questions archived into a reusable bank. No server, no backend; just open the HTML file.

## 这是什么

一个给 AI 编程智能体（Claude Code / Comate 等支持 skill 的工具）用的 **skill**，外加一个纯前端的 HTML 复盘页模板。核心能力：

- **转录稿 → 复盘卡**：喂一段面试录音转文字，自动产出一张结构化复盘卡（时间、分维度归类、现场表现、改进点）。
- **真题永久沉淀**：面试真实问到的题按 D1–D11 维度进题库，带「真题」徽章、自动排到维度最前。
- **现场表现一眼可见**：每题打一个 flag——亮 / 稳 / 改 / 漏 / 翻；翻车、漏答自动渲染成红色。
- **一个页面随身带**：题库、真题索引、复盘卡、思考/回答框架都在一个 HTML 里，可答题、可导出 Markdown/PDF。

## 目录结构

```
interview_review-skill/
├── SKILL.md                      skill 定义（AI 读这个来干活）
├── interview-practice.html       复盘页（已内嵌示例数据，双击即可预览）
├── assets/
│   └── interview-bank.json       单一数据源（dims / questions / reviews / realIndex）
├── scripts/
│   └── sync-bank.js              校验 + 把 json 注入 HTML
└── references/
    ├── data-schema.md            数据结构与约束
    └── review-template.md        复盘卡 Markdown 结构模板
```

## 快速开始

**只想看看效果**：直接双击 `interview-practice.html`，里面有一套全虚构的示例数据。

**自己用（手动）**：
1. 编辑 `assets/interview-bank.json`，把示例的 `questions / reviews / realIndex` 换成你自己的（`dims` 维度框架保留不动）。字段说明见 `references/data-schema.md`。
2. 跑同步脚本（需要 Node.js）：
   ```bash
   node scripts/sync-bank.js assets/interview-bank.json interview-practice.html
   ```
3. 双击打开 `interview-practice.html`。

**配合 AI skill 用（推荐）**：在支持 skill 的 AI 工具里加载本仓库，然后直接说「复盘这场面试」并贴上你的面试转录稿，AI 会按 `SKILL.md` 的流程自动更新 json 并跑同步。

## 数据模型（一句话版）

单一数据源 `interview-bank.json` 有四块：

- `dims`：D1–D11 十一个考察维度（框架层，一般不动）。
- `questions`：题库，每题带维度、难度、是否真题。
- `reviews`：实战复盘卡（Markdown 正文）。
- `realIndex`：真题索引（公司 → 维度 → 真题）。

`sync-bank.js` 会在注入前做强校验：题号唯一、维度合法、真题索引与题库/复盘卡三处对齐，不通过就拒绝写入。详见 `references/data-schema.md`。

## 为什么是单文件 HTML

面试复盘是很私人的东西，不该依赖任何云服务。这个页面把数据内嵌进 HTML，**双击即开、断网可用、数据只在你本地**，想分享就发文件、想备份就复制文件。

## 许可证

MIT，见 [LICENSE](LICENSE)。仓库内所有示例公司、人名、数字均为虚构。
