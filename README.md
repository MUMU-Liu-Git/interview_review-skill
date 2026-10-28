# interview_review · AI产品经理面试复盘 skill

把一场AI产品经理面试的**录音转文字稿**交给 AI，自动整理进一张**本地运行的面试复盘练习页**（Vue 3）——真题按维度归档、现场表现一眼可见、可答题、可导出打印。

> Feed an interview transcript to your AI agent and get back a local Vue review page — real questions archived by dimension, on-the-spot performance flagged, answerable and exportable.

## 适用场景

秋招/社招一轮轮面试打下来，时间紧任务重。复盘时：面完就忘、真题散落在聊天记录和脑子里、二面三面前不知道该补哪。这个 skill 让**每一场面试都沉淀成可复用的资产**：

- 刚面完一场，想把录音转写稿整理成结构化复盘，记清哪里答得好、哪里翻车
- 攒了多家公司的真题，想按维度归档、形成自己的题库反复练
- 下一轮面试前，快速定位某家公司 / 某个维度的真题和上次失分点，针对性准备
- 想把题库和自己的答案导出、打印成纸质材料带去现场

## 核心流程

**① 导入** —— 把面试录音转文字稿（或直接几道真题）发给加载了本 skill 的 AI 智能体（Claude Code / Codex 等）。

**② 分析** —— AI 自动切分问答、把每个真实问题归到 D1–D11（包含数据口径、技术方案选型、评测与质量等核心维度） 维度、给现场表现判档（亮 / 稳 / 改 / 漏 / 翻），写出一张结构化「实战复盘」卡，并把真题沉淀进题库。所有内容写进你自己数据目录里的 `interview-bank.json`，页面打开时直接读取它，改完刷新即生效。

**③ 快速定位** —— 打开页面，顶部「真题索引」按「公司 × 维度」三级折叠，点任意题号一键跳到对应题目并高亮闪烁；左侧复盘目录按「公司 → 轮次」折叠、每场带评分角标，下方按 D1–D11 维度导航；翻车 / 漏答自动标红，一眼看到最该补的地方。

**④ 练答 & 另存** —— 每道题下可直接写答案（支持 Markdown + 四色荧光笔标记重点）。答案可**关联到本地一个真实的 `answers.json` 文件自动保存**（Chrome/Edge），清缓存、换浏览器都不丢、任何工具都能当文件读；其它浏览器用「导入 / 导出答案 JSON」手动存读。随时还能一键导出 **Markdown** 或打印 **PDF**（带完整配色与版式，和屏幕一致）。

## 产品优势

- **本地运行 · 无账号 · 无数据库**：页面是静态文件，用任意本地静态服务打开（`python3 -m http.server` 即可），断网可用，不需要后端或账号。数据就是两个 json 文件，改完刷新即生效，不存在页面和数据不同步。
- **隐私自主、答案可落地成文件**：面试内容很私人——数据只在你本地，想分享就发文件、想备份就复制，不经过任何云服务。答案可关联到磁盘上一个明文 JSON 文件自动保存（不只是浏览器缓存），不随清缓存丢失。
- **工具与数据分离**：skill 目录只有代码、模板和虚构示例；你的题库、复盘、姓名和个人例子都在 skill 外的数据目录。升级或重装 skill 不会碰你的数据，改进工具后提交代码也不用脱敏。
- **真题不流失、自动排序**：真题带黑色「真题」徽章，在每个维度内按「真题 > 高频 > 较可能 > 深挖」自动置顶，新增只管录入、永远不用手排编排序号。
- **复盘有章法**：固定的 D1–D11 维度 + 复盘卡结构（时间 / 分维度归类 / 现场表现 / 改进点），危险信号（翻车、漏答）自动渲染成红色，一眼get重点。
- **AI 代劳整理**：你只提供原始转写稿，归类、打标、写卡、入库都交给 AI；校验脚本（页面加载时也会跑）还会校验「题库 / 真题索引 / 复盘卡」三处题号对齐，防止点进去题目对不上。

## 目录结构

```
interview_review-skill/                 ← 工具（可公开）
├── SKILL.md                            skill 定义（AI 读这个来干活）
├── app/                                Vue 3 源码
│   ├── App.vue  main.js  index.html
│   ├── components/                     顶栏、目录、复盘卡、真题索引、题卡、思维导图……
│   ├── composables/                    数据加载、答案存储（localStorage + 本地文件）、页面状态
│   ├── lib/                            Markdown 解析、排序、复盘导航、校验规则
│   ├── content/framework.js            一、三、四章框架文本（抽象层，不写具体公司）
│   └── styles/main.css
├── dist/                               构建产物（已提交，部署不需要 npm）
├── examples/demo/                      全虚构示例：interview-bank.json + profile.json
├── scripts/
│   ├── check.mjs                       校验数据目录
│   ├── deploy.mjs                      把 dist 部署到数据目录
│   └── hooks/pre-commit                可选：提交前按屏蔽词表拦截个人信息
├── tests/                              vitest 测试
└── references/
    ├── data-schema.md                  数据结构与约束
    └── review-template.md              复盘卡 Markdown 结构模板

你的数据目录/                            ← 个人数据（不进仓库，放哪都行）
├── interview-bank.json                 唯一数据源（dims / questions / reviews / realIndex）
├── profile.json                        可选：姓名、目标岗位、维度备注、答题模板里的个人例子
├── interview-practice.html + app/      deploy 部署过来的页面，不要手改
└── .app-manifest.json                  deploy 记录（用于清理旧文件、发现手改）
```

## 快速开始

**只想看看效果**（需要 Node.js ≥ 20）：
```bash
npm install
npm run dev          # http://127.0.0.1:5173，用 examples/demo 的虚构数据
```

**建自己的数据目录**（只需要 Node.js，不需要 npm install）：
```bash
cp -r examples/demo ~/my-interview            # 放在 skill 目录以外的任意位置
export INTERVIEW_REVIEW_DATA=~/my-interview   # 也可以写进项目 CLAUDE.md：INTERVIEW_REVIEW_DATA=<路径>
node scripts/deploy.mjs "$INTERVIEW_REVIEW_DATA"
cd ~/my-interview && python3 -m http.server 8080 --bind 127.0.0.1
# 打开 http://127.0.0.1:8080/interview-practice.html
```
然后把示例的 `questions / reviews / realIndex` 换成你自己的（`dims` 维度框架保留不动），`profile.json` 改成你的信息，`node scripts/check.mjs ~/my-interview` 校验后刷新页面即可。字段说明见 `references/data-schema.md`。

**配合 AI skill 用（推荐）**：在支持 skill 的 AI 工具里加载本仓库并设置好数据目录，然后说「复盘这场面试」并贴上转录稿，AI 会按 `SKILL.md` 更新你的 bank 并校验。

**升级**：`git pull` 后重新跑一次 `deploy.mjs`，页面就用上新界面，数据不受影响。

**改界面**：改 `app/` 下的源码，`npm run dev` 实时预览（`DATA_DIR=<你的数据目录> npm run dev` 可以用自己的数据看），`npm test` 跑测试，`npm run build` 更新 `dist/`，再 deploy。

## 数据模型（一句话版）

`interview-bank.json` 四块：

- `dims`：D1–D11 十一个考察维度（框架层，一般不动）。
- `questions`：题库，每题带维度、难度、是否真题。
- `reviews`：实战复盘卡（Markdown 正文；可选 `company / round / score` 控制侧栏分组和评分）。
- `realIndex`：真题索引（公司 → 维度 → 真题）。

`check.mjs` 和页面共用一份校验规则：题号唯一、维度合法、真题索引与题库/复盘卡三处对齐；页面加载时发现问题会在顶部显示红色横幅。`deploy.mjs` 发现页面在上次部署后被手改过会拒绝覆盖。详见 `references/data-schema.md`。

## 提交前隐私检查（可选）

如果你也用这个工具记录真实面试，又想给仓库提改进，可以装上 `scripts/hooks/pre-commit`：它读取一份放在仓库外的屏蔽词表（每行一个词，路径由环境变量 `INTERVIEW_REVIEW_BLOCKLIST` 指定），暂存内容或文件名里出现屏蔽词就拒绝提交。在 `.git/hooks/pre-commit` 里导出这个变量再 `exec` 该脚本即可。

## License

MIT，见 [LICENSE](LICENSE)。仓库内所有示例公司、人名、数字均为虚构。
