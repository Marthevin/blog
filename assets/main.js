/* 铜与墨 · 客户端交互 */
(() => {
  /* ---- 主题切换 ---- */
  const themeBtn = document.getElementById("theme-btn");
  themeBtn?.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme === "dark";
    document.documentElement.dataset.theme = dark ? "" : "dark";
    localStorage.setItem("theme", dark ? "light" : "dark");
  });

  /* ---- 阅读进度条 ---- */
  const bar = document.querySelector(".progress i");
  if (bar) {
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = max > 0 ? (h.scrollTop / max) * 100 + "%" : "0";
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---- 代码高亮 + 复制按钮 ---- */
  const initCode = () => {
    if (window.hljs) document.querySelectorAll("pre code").forEach((el) => hljs.highlightElement(el));
    document.querySelectorAll(".post-content pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-btn"; btn.textContent = "复制";
      btn.addEventListener("click", async () => {
        await navigator.clipboard.writeText(pre.querySelector("code")?.innerText || "");
        btn.textContent = "已复制 ✓";
        setTimeout(() => (btn.textContent = "复制"), 1600);
      });
      pre.appendChild(btn);
    });
  };
  if (document.readyState === "complete") initCode();
  else addEventListener("load", initCode);

  /* ---- 文章目录 ---- */
  const toc = document.getElementById("toc");
  const content = document.getElementById("content");
  if (toc && content) {
    const heads = [...content.querySelectorAll("h2, h3")];
    if (heads.length >= 2) {
      toc.innerHTML = `<nav>${heads.map((h) =>
        `<a class="${h.tagName.toLowerCase()}" href="#${h.id}">${h.textContent.replace(/^#/, "")}</a>`).join("")}</nav>`;
      const links = toc.querySelectorAll("a");
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
          }
        });
      }, { rootMargin: "-80px 0px -70% 0px" });
      heads.forEach((h) => io.observe(h));
    }
  }

  /* ---- Ctrl+K 全站搜索 ---- */
  const palette = document.getElementById("palette");
  const input = document.getElementById("palette-input");
  const results = document.getElementById("palette-results");
  let index = null, sel = -1;

  const open = async () => {
    palette.hidden = false;
    input.value = ""; results.innerHTML = ""; sel = -1;
    input.focus();
    if (!index) {
      try { index = await (await fetch("/search-index.json")).json(); }
      catch { index = []; }
    }
  };
  const close = () => (palette.hidden = true);

  document.getElementById("search-btn")?.addEventListener("click", open);
  addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.hidden ? open() : close(); }
    if (e.key === "Escape" && !palette.hidden) close();
  });
  palette?.addEventListener("click", (e) => { if (e.target === palette) close(); });

  const hi = (text, q) => text.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>");
  input?.addEventListener("input", () => {
    const q = input.value.trim();
    sel = -1;
    if (!q || !index) { results.innerHTML = ""; return; }
    const ql = q.toLowerCase();
    const hits = index
      .map((p) => {
        let score = 0;
        if (p.title.toLowerCase().includes(ql)) score += 10;
        if (p.tags.some((t) => t.toLowerCase().includes(ql))) score += 5;
        const pos = p.text.toLowerCase().indexOf(ql);
        if (pos >= 0) score += 2;
        return { p, score, pos };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    results.innerHTML = hits.length
      ? hits.map(({ p, pos }) => {
          const snippet = pos >= 0 ? "…" + p.text.slice(Math.max(0, pos - 24), pos + 40) + "…" : p.tags.join(" / ");
          return `<li><a href="${p.url}"><div class="r-title">${hi(p.title, q)}</div><div class="r-meta">${p.date} · ${hi(snippet, q)}</div></a></li>`;
        }).join("")
      : `<li class="palette-empty">没有找到「${q}」相关的文章</li>`;
  });
  input?.addEventListener("keydown", (e) => {
    const items = [...results.querySelectorAll("li")].filter((li) => li.querySelector("a"));
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      sel = e.key === "ArrowDown" ? Math.min(sel + 1, items.length - 1) : Math.max(sel - 1, 0);
      items.forEach((li, i) => li.classList.toggle("sel", i === sel));
      items[sel]?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter" && items[sel]) location.href = items[sel].querySelector("a").href;
  });
})();
