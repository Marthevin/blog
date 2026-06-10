# 铜与墨 · 个人博客系统

一套零数据库、纯静态的个人博客。Markdown 写作,一条命令构建,可发布到 GitHub Pages / Vercel / Netlify / 任意静态托管,后续更新只需新增 `.md` 文件并推送。

## ✨ 功能

- **设计**:「铜与墨」视觉系统 —— PCB 铜走线签名动效、宋体大标题、瓷白/阻焊蓝双主题
- **写作**:Markdown + Front Matter,支持草稿、自定义 slug、封面、摘要
- **阅读体验**:暗夜模式、阅读进度条、文章目录(滚动高亮)、代码高亮 + 一键复制、上一篇/下一篇
- **检索**:`Ctrl+K` 全站搜索(标题/正文/标签,键盘上下选择)
- **站点能力**:标签页、年度归档、分页、RSS 订阅、Sitemap、404 页
- **评论**:内置 giscus 支持(基于 GitHub Discussions,免服务器)
- **可访问性**:键盘焦点可见、`prefers-reduced-motion` 降级、移动端完整适配

## 🚀 快速开始

```bash
npm install        # 首次安装依赖
npm run build      # 构建 → 生成 dist/
npm run preview    # 本地预览 http://localhost:3000
```

## ✍️ 写新文章(日常更新流程)

```bash
npm run new -- "文章标题" my-post-slug
```

会在 `posts/` 下生成带 Front Matter 的草稿。写完后删掉 `draft: true`,然后:

```bash
npm run build   # 本地构建检查(可选,部署平台也会自动构建)
git add . && git commit -m "post: 文章标题" && git push
```

推送后 GitHub Actions 会自动构建并发布,**全程不需要手动操作服务器**。

Front Matter 字段:

```yaml
---
title: 文章标题        # 必填
date: 2026-06-10      # 必填
tags: [AI, 硬件]      # 可选
summary: 一句话摘要    # 可选,缺省取正文前 120 字
slug: custom-url      # 可选,缺省用文件名
draft: true           # 可选,true 时不发布
---
```

## 📦 发布

### 方式一:GitHub Pages(推荐,免费)

1. 新建 GitHub 仓库,推送本项目全部文件
2. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**
3. 修改 `site.config.json` 中的 `url` 为 `https://你的用户名.github.io/仓库名`
4. 推送即自动部署(工作流已在 `.github/workflows/deploy.yml` 配好)

### 方式二:Vercel / Netlify

直接导入仓库即可,`vercel.json` 已配置好构建命令。Netlify 设置 Build command 为 `npm run build`、Publish directory 为 `dist`。

### 方式三:任意静态托管 / 国内服务器

`npm run build` 后把 `dist/` 整个目录上传到 OSS / COS / Nginx 静态目录即可。

## ⚙️ 自定义

全部站点配置集中在 **`site.config.json`**:站名、副标题、导航、社交链接、每页文章数。

- **开启评论**:在 [giscus.app](https://giscus.app) 按指引获取 `repoId` 等参数,填入 `site.config.json` 的 `giscus` 字段并把 `enabled` 设为 `true`
- **改配色**:`assets/style.css` 顶部的 CSS 变量(`--copper`、`--signal` 等)
- **关于页**:编辑 `pages/about.md`;在 `pages/` 下新增 `.md` 即新增独立页面

## 📁 目录结构

```
├── site.config.json   # 站点配置(改这里)
├── posts/             # 文章(.md)
├── pages/             # 独立页面(关于等)
├── assets/            # 样式与脚本
├── build.js           # 构建器
├── new-post.js        # 新建文章脚本
├── dist/              # 构建产物(自动生成,勿手改)
└── .github/workflows/ # 自动部署
```
