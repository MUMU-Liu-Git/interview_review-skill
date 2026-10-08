# interview_review · 面试复盘 skill

把一场面试的**录音转文字稿**交给 AI，自动生成一张**单文件、离线可用的 HTML 面试复盘页**——真题按维度归档、现场表现一眼可见、可答题、可导出打印。

> Feed an interview transcript to your AI agent and get back a single-file, offline HTML review page — real questions archived by dimension, on-the-spot performance flagged, answerable and exportable.

## 为什么需要它（适用场景）

秋招/社招一轮轮面试打下来，最浪费的是：面完就忘、真题散落在聊天记录和脑子里、二面三面前不知道该补哪。这个 skill 让**每一场面试都沉淀成可复用的资产**：

- 刚面完一场，想把录音转写稿整理成结构化复盘，记清哪里答得好、哪里翻车
- 攒了多家公司的真题，想按维度归档、形成自己的题库反复练
- 下一轮面试前，快速定位某家公司 / 某个维度的真题和上次失分点，针对性准备
- 想把题库和自己的答案导出、打印成纸质材料带去现场

## 核心流程

**① 导入** —— 把面试录音转文字稿（或直接几道真题）发给加载了本 skill 的 AI 智能体（Claude Code / Comate 等）。

**② 分析** —— AI 自动切分问答、把每个真实问题归到 D1–D11 维度、给现场表现判档（亮 / 稳 / 改 / 漏 / 翻），写出一张结构化「实战复盘」卡，并把真题沉淀进题库。所有内容写进单一数据源 `interview-bank.json`，再由脚本校验后注入 HTML。

**③ 快速定位** —— 打开页面，顶部「真题索引」按「公司 × 维度」三级折叠，点任意题号一键跳到对应题目并高亮闪烁；左侧按 D1–D11 维度导航；翻车 / 漏答自动标红，一眼看到最该补的地方。

**④ 练答 & 另存** —— 每道题下可直接写答案（支持 Markdown + 四色荧光笔），输入即自动存到浏览器本地；随时一键导出 **Markdown**，或打印 **PDF**（带完整配色与版式，和屏幕一致）。

## 产品优势

- **单文件 · 离线 · 零依赖**：数据内嵌在 HTML 里，双击即开、断网可用，不需要服务器、数据库或账号。
- **隐私自主**：面试内容很私人——数据只在你本地，想分享就发文件、想备份就复制，不经过任何云服务。
- **真题不流失、自动排序**：真题带黑色「真题」徽章，在每个维度内按「真题 > 高频 > 较可能 > 深挖」自动置顶，新增只管录入、永远不用手排。
- **复盘有章法**：固定的 D1–D11 维度 + 复盘卡结构（时间 / 分维度归类 / 现场表现 / 改进点），危险信号（翻车、漏答）自动渲染成红色，不会流于流水账。
- **AI 代劳整理**：你只提供原始转写稿，归类、打标、写卡、入库都交给 AI；同步脚本还会校验「题库 / 真题索引 / 复盘卡」三处题号对齐，防止点进去题目对不上。

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

**只想看看效果**：直接双击 `interview-practice.html`，里面有一套全虚构的示例数据，所有交互都能试。

**配合 AI skill 用（推荐）**：在支持 skill 的 AI 工具里加载本仓库，然后直接说「复盘这场面试」并贴上你的面试转录稿，AI 会按 `SKILL.md` 的流程自动更新数据并跑同步。

**手动维护**（不借助 AI 也能用）：
1. 编辑 `assets/interview-bank.json`，把示例的 `questions / reviews / realIndex` 换成你自己的（`dims` 维度框架保留不动）。字段说明见 `references/data-schema.md`。
2. 跑同步脚本（需要 Node.js）：
   ```bash
   node scripts/sync-bank.js assets/interview-bank.json interview-practice.html
   ```
3. 双击打开 `interview-practice.html`。

## 数据模型（一句话版）

单一数据源 `interview-bank.json` 四块：

- `dims`：D1–D11 十一个考察维度（框架层，一般不动）。
- `questions`：题库，每题带维度、难度、是否真题。
- `reviews`：实战复盘卡（Markdown 正文）。
- `realIndex`：真题索引（公司 → 维度 → 真题）。

`sync-bank.js` 在注入前做强校验：题号唯一、维度合法、真题索引与题库/复盘卡三处对齐，不通过就拒绝写入。详见 `references/data-schema.md`。

## License

MIT，见 [LICENSE](LICENSE)。仓库内所有示例公司、人名、数字均为虚构。
