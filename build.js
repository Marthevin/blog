/* 铜与墨 · 静态博客构建器
 * 用法: node build.js  → 生成 dist/ 目录,可直接部署
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = __dirname;
const OUT = path.join(__dirname, "dist");
const cfg = JSON.parse(fs.readFileSync(path.join(SRC, "site.config.json"), "utf8"));
// 子路径部署支持:从 cfg.url 推导 base path(如 https://user.github.io/blog → /blog),根域部署时为空
const BASE = (() => { try { return new URL(cfg.url).pathname.replace(/\/$/, ""); } catch { return ""; } })();

/* ---------- Markdown 渲染配置 ---------- */
const slugCount = {};
function slugify(text) {
  let s = String(text).trim().toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";
  if (slugCount[s] != null) { slugCount[s]++; s = `${s}-${slugCount[s]}`; } else slugCount[s] = 0;
  return s;
}
const renderer = {
  heading(text, depth) {
    const id = slugify(text);
    return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${text}</h${depth}>\n`;
  },
  image(href, title, text) {
    const t = title ? ` title="${title}"` : "";
    return `<figure><img src="${href}" alt="${text || ""}" loading="lazy"${t}>${text ? `<figcaption>${text}</figcaption>` : ""}</figure>`;
  },
};
marked.use({ renderer, mangle: false, headerIds: false });

/* ---------- 工具 ---------- */
const fmtDate = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const stripHtml = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const readMinutes = (text) => Math.max(1, Math.round(text.length / 400)); // 中文约 400 字/分钟
function write(rel, html) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (BASE && rel.endsWith(".html")) html = html.replace(/(href|src)="\//g, `$1="${BASE}/`);
  fs.writeFileSync(p, html);
}

/* ---------- 读取文章 ---------- */
function loadPosts() {
  const dir = path.join(SRC, "posts");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      Object.keys(slugCount).forEach((k) => delete slugCount[k]);
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      const slug = data.slug || f.replace(/\.md$/, "");
      const html = marked.parse(content);
      const plain = stripHtml(html);
      return {
        slug,
        title: data.title || slug,
        date: data.date ? new Date(data.date) : new Date(),
        tags: data.tags || [],
        summary: data.summary || plain.slice(0, 120) + "…",
        cover: data.cover || null,
        draft: !!data.draft,
        html, plain,
        minutes: readMinutes(plain),
        url: `/posts/${slug}/`,
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => b.date - a.date);
}

/* ---------- 布局 ---------- */
const traceSVG = `
<svg class="trace" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="cu" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="var(--copper)" stop-opacity=".15"/>
      <stop offset=".5" stop-color="var(--copper)" stop-opacity=".55"/>
      <stop offset="1" stop-color="var(--copper)" stop-opacity=".15"/>
    </linearGradient>
  </defs>
  <g class="trace-lines" fill="none" stroke="url(#cu)" stroke-width="1.5">
    <path d="M-20 60 H300 l40 40 H620 l40 -40 H1220"/>
    <path d="M-20 140 H180 l30 30 H520 l30 -30 H900 l30 30 H1220"/>
    <path d="M-20 230 H260 l50 -50 H700 l50 50 H1040 l40 -40 H1220"/>
    <path d="M-20 290 H420 l36 -36 H860 l36 36 H1220"/>
  </g>
  <g class="trace-pulse" fill="none" stroke="var(--signal)" stroke-width="2" stroke-linecap="round">
    <path class="p1" d="M-20 60 H300 l40 40 H620 l40 -40 H1220"/>
    <path class="p2" d="M-20 230 H260 l50 -50 H700 l50 50 H1040 l40 -40 H1220"/>
  </g>
  <g class="trace-pads" fill="var(--copper)" opacity=".5">
    <circle cx="300" cy="60" r="3.5"/><circle cx="660" cy="60" r="3.5"/>
    <circle cx="180" cy="140" r="3.5"/><circle cx="930" cy="170" r="3.5"/>
    <circle cx="310" cy="180" r="3.5"/><circle cx="750" cy="230" r="3.5"/>
    <circle cx="456" cy="254" r="3.5"/><circle cx="896" cy="290" r="3.5"/>
  </g>
</svg>`;

function layout({ title, desc, body, extraHead = "", bodyClass = "" }) {
  const navItems = cfg.nav.map((n) => `<a href="${n.href}">${esc(n.text)}</a>`).join("");
  return `<!DOCTYPE html>
<html lang="${cfg.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="${esc(cfg.author)}">
<link rel="alternate" type="application/rss+xml" title="${esc(cfg.title)}" href="/feed.xml">
<link rel="stylesheet" href="/assets/style.css">
<script>(function(){var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.dataset.theme="dark";})();</script>
${extraHead}
</head>
<body class="${bodyClass}">
<div class="progress" aria-hidden="true"><i></i></div>
<header class="site-head">
  <a class="brand" href="/"><span class="brand-mark"></span>${esc(cfg.title)}</a>
  <nav class="site-nav">${navItems}</nav>
  <div class="head-tools">
    <button class="tool" id="search-btn" title="搜索 (Ctrl+K)" aria-label="搜索"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>
    <button class="tool" id="theme-btn" title="切换主题" aria-label="切换深浅主题"><svg class="sun" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="moon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg></button>
  </div>
</header>
<main class="wrap">
${body}
</main>
<footer class="site-foot">
  <div class="foot-trace" aria-hidden="true"></div>
  <p>© ${new Date().getFullYear()} ${esc(cfg.author)} · ${cfg.social.map((s) => `<a href="${s.href}">${esc(s.text)}</a>`).join(" · ")}</p>
  <p class="foot-sub">用「铜与墨」构建 · <a href="/sitemap.xml">Sitemap</a></p>
</footer>
<div class="palette" id="palette" hidden>
  <div class="palette-box" role="dialog" aria-label="全站搜索">
    <input id="palette-input" type="search" placeholder="搜索文章标题、内容、标签… (Esc 关闭)" autocomplete="off">
    <ul id="palette-results"></ul>
  </div>
</div>
<script src="/assets/main.js" defer></script>
</body>
</html>`;
}

/* ---------- 页面片段 ---------- */
const postCard = (p, i) => `
<article class="card" style="--i:${i}">
  <div class="card-rail"><time datetime="${p.date.toISOString()}">${fmtDate(p.date)}</time><span class="rail-line"></span></div>
  <div class="card-body">
    <h2><a href="${p.url}">${esc(p.title)}</a></h2>
    <p class="card-summary">${esc(p.summary)}</p>
    <div class="card-meta">
      ${p.tags.map((t) => `<a class="tag" href="/tags/${encodeURIComponent(t)}/">${esc(t)}</a>`).join("")}
      <span class="dot">·</span><span>${p.minutes} 分钟</span>
    </div>
  </div>
</article>`;

function pagination(page, totalPages, base) {
  if (totalPages <= 1) return "";
  const link = (n) => (n === 1 ? base : `${base}page/${n}/`);
  return `<nav class="pager">
    ${page > 1 ? `<a href="${link(page - 1)}">← 较新</a>` : "<span></span>"}
    <span class="pager-num">${page} / ${totalPages}</span>
    ${page < totalPages ? `<a href="${link(page + 1)}">较早 →</a>` : "<span></span>"}
  </nav>`;
}

/* ---------- 生成 ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(SRC, "assets"), path.join(OUT, "assets"), { recursive: true });
if (BASE) {
  const mjs = path.join(OUT, "assets", "main.js");
  fs.writeFileSync(mjs, fs.readFileSync(mjs, "utf8").replace('"/search-index.json"', `"${BASE}/search-index.json"`));
}

const posts = loadPosts();
const allTags = {};
posts.forEach((p) => p.tags.forEach((t) => (allTags[t] = (allTags[t] || []).concat(p))));

/* 首页(分页) */
const perPage = cfg.postsPerPage || 8;
const totalPages = Math.max(1, Math.ceil(posts.length / perPage));
for (let pg = 1; pg <= totalPages; pg++) {
  const slice = posts.slice((pg - 1) * perPage, pg * perPage);
  const hero = pg === 1 ? `
<section class="hero">
  ${traceSVG}
  <p class="hero-eyebrow">${esc(cfg.subtitle)}</p>
  <h1 class="hero-title">${esc(cfg.title)}</h1>
  <p class="hero-desc">${esc(cfg.description)}</p>
</section>` : "";
  const body = `${hero}
<section class="post-list">
  <h2 class="section-label"><span>${pg === 1 ? "最新文章" : `第 ${pg} 页`}</span></h2>
  ${slice.map(postCard).join("")}
  ${pagination(pg, totalPages, "/")}
</section>`;
  write(pg === 1 ? "index.html" : `page/${pg}/index.html`, layout({ title: pg === 1 ? `${cfg.title} · ${cfg.subtitle}` : `第 ${pg} 页 · ${cfg.title}`, desc: cfg.description, body, bodyClass: "home" }));
}

/* 文章页 */
const hljsHead = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css" media="print" onload="this.media='all'">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" defer></script>`;
posts.forEach((p, idx) => {
  const prev = posts[idx + 1], next = posts[idx - 1];
  const giscus = cfg.giscus?.enabled ? `
<section class="comments"><script src="https://giscus.app/client.js"
  data-repo="${cfg.giscus.repo}" data-repo-id="${cfg.giscus.repoId}"
  data-category="${cfg.giscus.category}" data-category-id="${cfg.giscus.categoryId}"
  data-mapping="pathname" data-reactions-enabled="1" data-input-position="top"
  data-theme="preferred_color_scheme" data-lang="zh-CN" crossorigin="anonymous" async></script></section>` : "";
  const body = `
<article class="post">
  <header class="post-head">
    <p class="hero-eyebrow"><time datetime="${p.date.toISOString()}">${fmtDate(p.date)}</time> · ${p.minutes} 分钟阅读</p>
    <h1>${esc(p.title)}</h1>
    <div class="card-meta">${p.tags.map((t) => `<a class="tag" href="/tags/${encodeURIComponent(t)}/">${esc(t)}</a>`).join("")}</div>
  </header>
  <div class="post-grid">
    <div class="post-content" id="content">${p.html}</div>
    <aside class="toc" id="toc" aria-label="目录"></aside>
  </div>
  <nav class="post-nav">
    ${prev ? `<a class="post-nav-item" href="${prev.url}"><small>← 较早</small><span>${esc(prev.title)}</span></a>` : "<span></span>"}
    ${next ? `<a class="post-nav-item next" href="${next.url}"><small>较新 →</small><span>${esc(next.title)}</span></a>` : "<span></span>"}
  </nav>
  ${giscus}
</article>`;
  write(`posts/${p.slug}/index.html`, layout({ title: `${p.title} · ${cfg.title}`, desc: p.summary, body, extraHead: hljsHead, bodyClass: "is-post" }));
});

/* 归档 */
const byYear = {};
posts.forEach((p) => { const y = p.date.getFullYear(); (byYear[y] = byYear[y] || []).push(p); });
const archiveBody = `
<section class="archive">
  <h1 class="page-title">归档 <small>${posts.length} 篇</small></h1>
  ${Object.keys(byYear).sort((a, b) => b - a).map((y) => `
  <div class="archive-year"><h2>${y}</h2>
    <ul>${byYear[y].map((p) => `<li><time>${fmtDate(p.date).slice(5)}</time><a href="${p.url}">${esc(p.title)}</a></li>`).join("")}</ul>
  </div>`).join("")}
</section>`;
write("archive/index.html", layout({ title: `归档 · ${cfg.title}`, desc: "全部文章归档", body: archiveBody }));

/* 标签 */
const tagsIndex = `
<section class="archive">
  <h1 class="page-title">标签 <small>${Object.keys(allTags).length} 个</small></h1>
  <div class="tag-cloud">${Object.entries(allTags).sort((a, b) => b[1].length - a[1].length)
    .map(([t, ps]) => `<a class="tag tag-lg" href="/tags/${encodeURIComponent(t)}/">${esc(t)}<sup>${ps.length}</sup></a>`).join("")}</div>
</section>`;
write("tags/index.html", layout({ title: `标签 · ${cfg.title}`, desc: "按标签浏览", body: tagsIndex }));
Object.entries(allTags).forEach(([t, ps]) => {
  const body = `<section class="post-list"><h1 class="page-title">标签:${esc(t)} <small>${ps.length} 篇</small></h1>${ps.map(postCard).join("")}</section>`;
  write(`tags/${encodeURIComponent(t)}/index.html`, layout({ title: `标签:${t} · ${cfg.title}`, desc: `标签 ${t} 下的文章`, body }));
});

/* 独立页面 (pages/*.md) */
const pagesDir = path.join(SRC, "pages");
if (fs.existsSync(pagesDir)) {
  fs.readdirSync(pagesDir).filter((f) => f.endsWith(".md")).forEach((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(pagesDir, f), "utf8"));
    const slug = data.slug || f.replace(/\.md$/, "");
    const body = `<article class="post"><header class="post-head"><h1>${esc(data.title || slug)}</h1></header><div class="post-content">${marked.parse(content)}</div></article>`;
    write(`${slug}/index.html`, layout({ title: `${data.title || slug} · ${cfg.title}`, desc: data.summary || cfg.description, body }));
  });
}

/* 404 */
write("404.html", layout({ title: `404 · ${cfg.title}`, desc: "页面不存在", body: `<section class="hero">${traceSVG}<h1 class="hero-title">404</h1><p class="hero-desc">信号未找到。这条走线没有连接到任何焊盘。</p><p><a class="tag tag-lg" href="/">← 返回首页</a></p></section>` }));

/* RSS */
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(cfg.title)}</title><link>${cfg.url}</link><description>${esc(cfg.description)}</description><language>${cfg.lang}</language>
${posts.slice(0, 20).map((p) => `<item><title>${esc(p.title)}</title><link>${cfg.url}${p.url}</link><guid>${cfg.url}${p.url}</guid><pubDate>${p.date.toUTCString()}</pubDate><description>${esc(p.summary)}</description></item>`).join("\n")}
</channel></rss>`;
write("feed.xml", feed);

/* Sitemap */
const urls = ["/", "/archive/", "/tags/", ...posts.map((p) => p.url), ...Object.keys(allTags).map((t) => `/tags/${encodeURIComponent(t)}/`)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${cfg.url}${u}</loc></url>`).join("\n")}
</urlset>`);

/* 搜索索引 */
write("search-index.json", JSON.stringify(posts.map((p) => ({
  title: p.title, url: BASE + p.url, tags: p.tags, date: fmtDate(p.date),
  text: p.plain.slice(0, 3000),
}))));

console.log(`✅ 构建完成:${posts.length} 篇文章 → dist/`);
