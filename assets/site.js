// PxlDash landing page.
//
// Board images are real 128×64 frames rendered by the pxldash server from its
// preview fixtures. Each one is drawn onto a canvas as a grid of round LED
// dots with a soft bloom, so the page shows what the panel actually shows.

(function () {
  "use strict";

  const W = 128;
  const H = 64;
  const SUBSTRATE = "#07080b";
  const WELL = "#14161c";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── frames ──────────────────────────────────────────────

  const frameCache = new Map();

  // Load a board PNG and return its pixels as a Uint8ClampedArray (RGBA).
  function loadFrame(src) {
    if (!frameCache.has(src)) {
      frameCache.set(
        src,
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = W;
            c.height = H;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            resolve({ data: ctx.getImageData(0, 0, W, H).data, source: c });
          };
          img.onerror = reject;
          img.src = src;
        })
      );
    }
    return frameCache.get(src);
  }

  // ── LED renderer ────────────────────────────────────────

  function drawLED(canvas, frame) {
    const cssWidth = canvas.clientWidth || canvas.parentElement.clientWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pitch = Math.max(2, (cssWidth * dpr) / W);
    const width = Math.round(pitch * W);
    const height = Math.round(pitch * H);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    const { data, source } = frame;
    const litR = pitch * 0.43;
    const wellR = pitch * 0.3;

    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.fillStyle = SUBSTRATE;
    ctx.fillRect(0, 0, width, height);

    // Unlit wells first, in one path — they're the dark grid the light sits on.
    ctx.fillStyle = WELL;
    ctx.beginPath();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (data[i] + data[i + 1] + data[i + 2] < 24) {
          const cx = (x + 0.5) * pitch;
          const cy = (y + 0.5) * pitch;
          ctx.moveTo(cx + wellR, cy);
          ctx.arc(cx, cy, wellR, 0, Math.PI * 2);
        }
      }
    }
    ctx.fill();

    // Lit dots, each in its own colour.
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r + g + b < 24) continue;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc((x + 0.5) * pitch, (y + 0.5) * pitch, litR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Bloom: the frame itself, blurred and added on top, so lit dots glow
    // gently into their neighbours the way they do through a diffuser.
    if ("filter" in ctx) {
      ctx.globalCompositeOperation = "lighter";
      ctx.imageSmoothingEnabled = true;
      ctx.filter = `blur(${pitch * 1.1}px)`;
      ctx.globalAlpha = 0.45;
      ctx.drawImage(source, 0, 0, width, height);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  // Keep a canvas's current frame so it can be redrawn on resize.
  const current = new WeakMap();

  async function show(canvas, src) {
    const frame = await loadFrame(src);
    current.set(canvas, frame);
    drawLED(canvas, frame);
  }

  const resizer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const frame = current.get(entry.target);
      if (frame) drawLED(entry.target, frame);
    }
  });

  // ── static galleries ────────────────────────────────────

  document.querySelectorAll("canvas[data-src]").forEach((c) => {
    show(c, c.dataset.src);
    resizer.observe(c);
  });

  // ── hero rotation ───────────────────────────────────────

  // Mirrors the wall: one board at a time, a hard cut between them, and a
  // row of pills where the current one fills over its dwell.
  document.querySelectorAll("[data-rotate]").forEach((figure) => {
    const boards = JSON.parse(figure.querySelector("script[type='application/json']").textContent);
    const canvas = figure.querySelector("canvas");
    const label = figure.querySelector(".panel-label");
    const pillRow = figure.querySelector(".pills");
    const dwell = 6000;

    pillRow.style.setProperty("--dwell", `${dwell}ms`);
    const pills = boards.map(() => {
      const pill = document.createElement("span");
      pill.className = "pill";
      pillRow.append(pill);
      return pill;
    });

    boards.forEach((b) => loadFrame(b.src));
    resizer.observe(canvas);

    let index = 0;
    let timer = null;

    function go(i) {
      index = (i + boards.length) % boards.length;
      const board = boards[index];
      show(canvas, board.src);
      label.textContent = board.label;
      canvas.setAttribute("aria-label", board.label);
      pills.forEach((p, n) => {
        p.classList.toggle("done", n < index);
        p.classList.remove("on");
      });
      // Restart the fill animation on the current pill.
      void pills[index].offsetWidth;
      pills[index].classList.add("on");
    }

    function start() {
      stop();
      if (reduceMotion) return;
      timer = setInterval(() => go(index + 1), dwell);
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    canvas.setAttribute("role", "img");
    go(0);
    start();

    // Don't rotate in a background tab; pick up where it left off.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else {
        go(index);
        start();
      }
    });
  });

  // ── module glyphs ───────────────────────────────────────

  document.querySelectorAll("[data-glyph]").forEach((el) => {
    for (const bit of el.dataset.glyph) {
      const dot = document.createElement("i");
      if (bit === "0") dot.className = "off";
      el.append(dot);
    }
    el.setAttribute("aria-hidden", "true");
  });
})();
