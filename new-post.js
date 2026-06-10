/* 快速新建文章: npm run new -- "文章标题" [slug] */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const title = process.argv[2];
if (!title) { console.log('用法: npm run new -- "文章标题" [英文slug]'); process.exit(1); }
const slug = process.argv[3] || title.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, "-").replace(/^-|-$/g, "");
const date = new Date().toISOString().slice(0, 10);
const file = path.join(__dirname, "posts", `${slug}.md`);
if (fs.existsSync(file)) { console.error(`❌ 已存在: ${file}`); process.exit(1); }
fs.writeFileSync(file, `---
title: ${title}
date: ${date}
tags: []
summary: 
draft: true
---

正文从这里开始…
`);
console.log(`✅ 已创建: posts/${slug}.md (草稿状态,完成后删除 draft: true)`);
