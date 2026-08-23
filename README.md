# AI 百宝箱

找到、看懂、接入每一种 AI 能力。

AI 百宝箱是一个亮色科技风的 AI 组件黄页，集中展示免费 API、MCP、模型、SDK 与 Agent 工具。每个组件提供中文功能说明、使用场景、免费方式、快速接入示例、官方文档和信息来源。

## 已实现

- 首页搜索、能力分类、免费/已验证筛选与响应式布局
- 首页 AI 工具顾问：短关键词精准搜索，完整需求生成步骤与站内工具方案
- 组件详情页、快速接入命令复制、同类组件和证据链接
- 已完整同步 `public-apis` 目录，并保留原有 AI / MCP 精选组件
- 每日发现 `public-apis` 新 API，并检索 GitHub 新增 MCP / Agent 组件
- 使用 Cloudflare Workers AI 自动生成中文摘要、标签、场景和接入说明
- 结构校验通过后由机器人提交到 GitHub，线上站点在 15 分钟内读取最新目录
- Cloudflare Workers AI 编辑接口独立部署，调用密钥仅保存在 Cloudflare 与 GitHub Secrets

## 架构

```text
public-apis + GitHub Search
          ↓ 每日 GitHub Actions
Cloudflare Workers AI（增量内容整理）
          ↓ 校验 + 自动提交
GitHub JSON 内容库
          ↓ 15 分钟缓存
AI 百宝箱线上站点
```

首页顾问同样复用这套 Worker：优先使用 Cloudflare Workers AI，异常时自动尝试 DeepSeek，两个模型都不可用时返回本地匹配方案。推荐链接只允许来自当前目录候选，避免生成不存在的工具。

当前不引入数据库、传统 CMS、用户系统、向量数据库或通用 API 代理。目录规模未达到 JSON 构建瓶颈前，这套结构更省钱、更透明，也更容易回滚。

## 本地运行

需要 Node.js 22.13+ 和 Python 3.9+。

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。修改 `data/catalog.json` 后可执行：

```bash
npm run validate:data
npm run import:data
npm run build
```

## GitHub 与 Cloudflare 配置

自动更新需要以下 GitHub Actions 配置：

| 类型 | 名称 | 用途 |
| --- | --- | --- |
| Secret | `EDITORIAL_API_TOKEN` | 调用编辑接口的站点专用密钥 |
| Variable | `CLOUDFLARE_EDITORIAL_ENDPOINT` | Workers AI 编辑接口地址 |
| Secret（Cloudflare，可选） | `DEEPSEEK_API_KEY` | 首页顾问的备用模型密钥 |

站点专用密钥不要写入仓库。编辑接口的 Cloudflare 配置位于 `wrangler.editor.jsonc`。

申请 DeepSeek 密钥后执行 `npx wrangler secret put DEEPSEEK_API_KEY --config wrangler.editor.jsonc` 即可启用备用链路；未配置时不影响 Cloudflare 主链路和本地兜底。

`Daily catalog update` 每天 UTC 00:20（新加坡时间 08:20）发现、整理、验证并提交增量内容，也可在 GitHub Actions 页面手动运行。

## 自动更新规则

1. 首次全量同步使用 `npm run import:data`；命令可重复执行，只补充尚未收录的条目。
2. 每天只处理最多 8 个新候选，控制免费额度和审核噪声；可用 `MAX_NEW_COMPONENTS` 调整。
3. AI 只整理文字，不允许改写官网、来源、认证方式等事实字段。
4. 新增组件统一标记为“待确认”；人工核对官网、免费政策与示例后再改为“已验证”。
5. Workers AI 不可用或返回内容未通过校验时，本次不发布，候选会在下一次运行重试。

手动测试采集逻辑：

```bash
python3 scripts/update_catalog.py --self-check
python3 scripts/update_catalog.py --full-import
python3 scripts/update_catalog.py
```

本地执行最后一条命令时，可按 `.env.example` 提供 Cloudflare 环境变量。不要再次运行 `--bootstrap`，否则会重置上游基线。

## 内容字段

内容位于 `data/catalog.json`。每条组件至少包含：唯一 `slug`、组件类型、能力分类、中文介绍、官网、文档、来源、认证方式、免费状态、验证状态、验证日期、标签、使用场景和快速接入示例。

用户也可以通过 GitHub Issue 模板提交组件。发布仓库后设置 `NEXT_PUBLIC_REPOSITORY_URL`，网站右上角的“提交组件”会自动指向该模板。
