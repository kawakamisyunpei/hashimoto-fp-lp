/* ========================================
   橋本一利 プロフィールLP - main.js
   フェーズ3：動き
   - ヘッダーのスクロール状態
   - ヒーローの読み込み時フェードアップ
   - スクロールで各要素がふわっと出現（stagger付き）
   ※ prefers-reduced-motion を尊重
   ======================================== */
(() => {
  "use strict";

  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------- 1. ヘッダーのスクロール状態 -------- */
  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      header.classList.toggle("is-scrolled", y > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // 動きを減らす設定なら、以降のアニメーションは行わない（内容はそのまま表示）
  if (prefersReduced) return;

  /* 要素を初期状態（非表示・少し下）にするヘルパー */
  const hide = (el, delay = 0) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px) scale(0.985)";
    el.style.transition =
      `opacity 0.9s ${EASE} ${delay}ms, transform 0.9s ${EASE} ${delay}ms`;
    el.style.willChange = "opacity, transform";
  };
  const show = (el) => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0) scale(1)";
    el.addEventListener(
      "transitionend",
      () => { el.style.willChange = "auto"; },
      { once: true }
    );
  };

  /* -------- 2. ヒーローの読み込み時アニメーション -------- */
  const heroTargets = document.querySelectorAll(
    ".hero__eyebrow, .hero__lead, .hero__btn"
  );
  heroTargets.forEach((el, i) => hide(el, 120 + i * 130));
  // 次フレームで表示（トランジションを発火させる）
  requestAnimationFrame(() =>
    requestAnimationFrame(() => heroTargets.forEach(show))
  );

  /* -------- 3. スクロールで出現 -------- */
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          show(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  const observe = (el, delay = 0) => {
    hide(el, delay);
    observer.observe(el);
  };

  // (a) 単体でふわっと出す要素
  const singles = document.querySelectorAll(
    ".section__eyebrow, .section__title, .section__lead," +
    ".profile__photo, .profile__body," +
    ".message__body, .step," +
    ".band__text, .line-cta__avatar, .line-cta__btn, .line-cta__gifts-heading"
  );
  singles.forEach((el) => observe(el));

  // (b) グリッド内の子要素は index に応じて少しずつ遅らせる（stagger）
  const staggerGroups = [
    ".concept__list",
    ".promise__list",
    ".gift__list",
    ".closing__tags",
  ];
  staggerGroups.forEach((groupSel) => {
    // 色分けメソッドは つかう→ふやす→まもる の順にゆっくり浮き出す（間隔を広げる）
    const stepMs = groupSel === ".concept__list" ? 340 : 80;
    const maxMs = groupSel === ".concept__list" ? 900 : 480;
    document.querySelectorAll(groupSel).forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        observe(child, Math.min(i * stepMs, maxMs));
      });
    });
  });
})();

/* ========================================
   「私に相談できること」アイコンタブ
   - タブを一定間隔で自動送り（先頭へループ）
   - タブに連動して詳細パネルも自動で切替
   - クリックで選択／ホバー・操作で一時停止
   ======================================== */
(() => {
  "use strict";
  const tablist = document.querySelector(".tabs");
  const panelsWrap = document.querySelector(".panels");
  if (!tablist || !panelsWrap) return;
  const tabs = Array.from(tablist.querySelectorAll(".tab"));
  const panels = Array.from(panelsWrap.querySelectorAll(".panel"));
  const N = tabs.length;
  if (!N || panels.length !== N) return;

  let idx = 0;
  const show = (i) => {
    idx = ((i % N) + N) % N;
    tabs.forEach((t, k) => {
      const on = k === idx;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach((p, k) => {
      const on = k === idx;
      p.classList.toggle("is-active", on);
      if (on) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
  };

  tabs.forEach((t, i) => t.addEventListener("click", () => { show(i); nudge(); }));

  /* --- 自動送り（一定間隔）／ホバー・操作で一時停止 --- */
  const INTERVAL = 4000;
  let timer = null;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const play = () => { stop(); timer = window.setInterval(() => show(idx + 1), INTERVAL); };
  const nudge = () => { stop(); window.setTimeout(play, 8000); };

  [tablist, panelsWrap].forEach((el) => {
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") stop(); });
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") play(); });
    el.addEventListener("touchstart", nudge, { passive: true });
  });

  show(0);
  play();
})();

/* ========================================
   Messageセクションのフリップカード
   - 画面に入るたびクルクル回転（登場演出）
   ======================================== */
(() => {
  "use strict";
  const flip = document.querySelector(".message__flip-inner");
  const clickArea = document.querySelector(".message__flip");
  if (!flip || !clickArea) return;

  // タップ／クリックで表裏を反転（常時有効）
  clickArea.addEventListener("click", () => {
    flip.classList.remove("is-flipping");
    flip.classList.toggle("is-flipped");
  });

  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  // 画面に入るたび、表に戻してクルクル回転（登場演出）
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        flip.classList.remove("is-flipping", "is-flipped");
        void flip.offsetWidth; // リフローでアニメを毎回再生
        flip.classList.add("is-flipping");
      } else {
        flip.classList.remove("is-flipping");
      }
    });
  }, { threshold: 0.35 });
  io.observe(flip);
})();
