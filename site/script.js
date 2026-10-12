/* ═══════════════════════════════════════════
   FAISHALLRR // 3D BACKGROUND + UI + CHATBOT
   ═══════════════════════════════════════════ */

/* ── 1. THREE.JS BACKGROUND ───────────────── */
(function init3D() {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("bg3d");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070d, 0.055);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 14;

  // wireframe icosahedron (objek utama)
  const geo = new THREE.IcosahedronGeometry(3.4, 1);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff0045,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0.5, -2);
  scene.add(mesh);

  // inti bercahaya
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff9d, wireframe: true, transparent: true, opacity: 0.35 })
  );
  mesh.add(core);

  // partikel starfield
  const count = 900;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 70;
  const stars = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3)),
    new THREE.PointsMaterial({ color: 0x7d8ba3, size: 0.07, transparent: true, opacity: 0.85 })
  );
  scene.add(stars);

  // grid lantai
  const grid = new THREE.GridHelper(90, 60, 0xff0045, 0x1b2436);
  grid.position.y = -6;
  scene.add(grid);

  // kursor parallax
  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  let scrollY = 0;
  window.addEventListener("scroll", () => (scrollY = window.scrollY), { passive: true });

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mesh.rotation.x = t * 0.16;
    mesh.rotation.y = t * 0.24;
    core.rotation.x = -t * 0.5;
    core.rotation.z = t * 0.4;

    stars.rotation.y = t * 0.015;
    grid.position.z = (t * 1.4) % 3;

    // parallax halus ke kursor + scroll
    camera.position.x += (mouse.x * 2.4 - camera.position.x) * 0.045;
    camera.position.y += (mouse.y * 1.4 + scrollY * 0.0016 - camera.position.y) * 0.045;
    camera.lookAt(scene.position);

    // glitch pulse merah berkala
    mat.opacity = 0.4 + Math.abs(Math.sin(t * 2.1)) * 0.28;

    renderer.render(scene, camera);
  })();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ── 2. TYPING EFFECT HERO ────────────────── */
(function typing() {
  const el = document.querySelector(".hero-sub");
  if (!el) return;
  const full = el.dataset.text || "";
  let i = 0;
  (function step() {
    el.textContent = full.slice(0, i);
    if (i++ <= full.length) setTimeout(step, 42 + Math.random() * 45);
  })();
})();

/* ── 3. SCROLL REVEAL ─────────────────────── */
(function reveal() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();

/* ── 4. TILT 3D PADA KARTU STACK ──────────── */
(function tilt() {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  });
})();

/* ── 5. LOAD REPOS DARI GITHUB API ────────── */
(async function repos() {
  const grid = document.getElementById("repoGrid");
  if (!grid) return;
  try {
    const res = await fetch("https://api.github.com/users/FaishallRr/repos?sort=updated&per_page=6");
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error("empty");

    grid.innerHTML = data
      .map(
        (r) => `
      <a class="repo-card reveal visible" href="${r.html_url}" target="_blank" rel="noopener">
        <h3>${esc(r.name)}</h3>
        <p>${esc(r.description || "No description — classified project.")}</p>
        <div class="repo-meta">
          <span class="lang">${esc(r.language || "mixed")}</span>
          <span class="stars">★ ${r.stargazers_count}</span>
          <span class="forks">⑂ ${r.forks_count}</span>
        </div>
      </a>`
      )
      .join("");
  } catch {
    grid.innerHTML = `
      <div class="card skeleton" style="color:var(--neon-red)">
        &gt; ERR_CONNECTION: github api unreachable — check firewall, neo.
      </div>`;
  }
})();

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ── 6. ERROR OVERLAY (easter egg) ────────── */
(function errorFX() {
  const overlay = document.getElementById("errorOverlay");
  const open = document.getElementById("glitchBtn");
  const close = document.getElementById("recoverBtn");
  if (!overlay || !open || !close) return;

  open.addEventListener("click", () => {
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    typeInto(overlay.querySelector(".error-msg"), "SIGNAL_INTERRUPT — consciousness buffer overflow");
  });
  close.addEventListener("click", () => {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  });

  function typeInto(el, text) {
    if (!el) return;
    el.textContent = "";
    let i = 0;
    (function step() {
      el.textContent = text.slice(0, i) + (i < text.length ? "_" : "");
      if (i++ < text.length) setTimeout(step, 28);
    })();
  }
})();

/* ── 7. CHATBOT NEURA.EXE (rule-based FAQ) ── */
(function chatbot() {
  const win = document.getElementById("chatWindow");
  const body = document.getElementById("chatBody");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatText");
  const toggle = document.getElementById("chatToggle");
  const closeBtn = document.getElementById("chatClose");
  const suggBox = document.getElementById("chatSuggestions");
  if (!win) return;

  const SUGGESTIONS = ["siapa kamu?", "skill apa?", "cara kontak?", "project apa aja?"];

  const RULES = [
    {
      keys: ["halo", "hai", "hi", "hello", "pagi", "siang", "malam", "assalam"],
      reply:
        "Halo, netizen ⚡ Aku NEURA.EXE — asisten digitalnya Faishal.\nMau tahu soal skills, project, atau cara kontak?",
    },
    {
      keys: ["siapa", "kenal", "kamu siapa", "about", "tentang", "faishal", "kenalan"],
      reply:
        "Faishal Rasyid Rusianto — mahasiswa Informatika UDINUS, 2+ tahun di dunia tech.\nWeb & Android developer, aktif di HMTI, suka hal yang glow-in-the-dark ✨",
    },
    {
      keys: ["skill", "keahlian", "teknologi", "tech", "stack", "bisa apa", "bahasa"],
      reply:
        "Loadout saat ini 🛠️\n• Frontend: Next.js, React, Tailwind\n• Backend: Node.js, REST API, MySQL\n• Mobile: Android (Kotlin/Java)\n• DevOps: Docker, Git, GitHub Actions\n• Design: Figma",
    },
    {
      keys: ["project", "repo", "kerjaan", "portofolio", "aplikasi", "buat"],
      reply:
        "Cek section EXPERIMENT_LAB di atas 👆 — data repo-nya di-fetch langsung dari GitHub API.\nAtau kunjungi github.com/FaishallRr",
    },
    {
      keys: ["kontak", "contact", "hubungi", "email", "chat", "dm", "reach"],
      reply:
        "Uplink channels 📡\n• Instagram: @_faishallrr\n• LinkedIn: faishal-rasyid-rusianto\n• Discord: faishalrr\n• YouTube: @faishalrr\n\nScroll ke section ESTABLISH_UPLINK.",
    },
    {
      keys: ["3d", "website", "halaman", "portfolio", "situs", "web ini"],
      reply:
        "Halaman ini pakai Three.js (wireframe 3D + partikel) dan tema cyberpunk glitch.\nSemua vanilla JS — tanpa framework, tanpa build step 🚀",
    },
    {
      keys: ["error", "404", "bug", "glitch", "rusak", "sinyal"],
      reply:
        "Kamu suka animasi error? 😈 Klik tombol 'trigger_error()' di nav, atau buka /404.html untuk efek SIGNAL_LOST ala CRT.",
    },
    {
      keys: ["kerja", "job", "collab", "kerjasama", "project bareng", "open"],
      reply: "Terbuka untuk kolaborasi & open source! 🤝\nLewat LinkedIn atau Discord — link ada di section contact.",
    },
    {
      keys: ["umur", "age", "dimana", "asal", "kampus", "udinus", "sekolah"],
      reply: "Informatika di Universitas Dian Nuswantoro (UDINUS), Semarang 🎓\nAktif juga di HMTI (Himpunan Mahasiswa Teknik Informatika).",
    },
    {
      keys: ["musik", "spotify", "lagu", "dengar"],
      reply: "Spotify Pulse-nya ada di README (repo utama) 🎧 — recently played di-update otomatis.",
    },
    {
      keys: ["terima kasih", "makasih", "thanks", "thx", "mantap", "keren"],
      reply: "Sama-sama ⚡ Tetap nge-glow, netizen.",
    },
  ];

  const FALLBACKS = [
    "Query tidak dikenal 🤔 Coba: 'skill', 'project', 'kontak', atau 'error'.",
    "Aku belum punya data itu di memori lokal. Tapi ketik 'skill' atau 'kontak' dan aku bocorkan semuanya 😄",
    "404 — jawaban tidak ditemukan. Coba salah satu saran di bawah 👇",
  ];

  function findReply(text) {
    const q = text.toLowerCase();
    for (const rule of RULES) {
      if (rule.keys.some((k) => q.includes(k))) return rule.reply;
    }
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }

  function addMsg(text, who) {
    const div = document.createElement("div");
    div.className = "msg " + who;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function botSay(text) {
    const t = addMsg("> _neura is thinking..._", "bot typing");
    setTimeout(() => {
      t.classList.remove("typing");
      t.textContent = "";
      let i = 0;
      (function step() {
        t.textContent = text.slice(0, i);
        body.scrollTop = body.scrollHeight;
        if (i++ < text.length) setTimeout(step, 12);
      })();
    }, 550);
  }

  function renderSuggestions() {
    suggBox.innerHTML = "";
    SUGGESTIONS.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s;
      b.addEventListener("click", () => handle(s));
      suggBox.appendChild(b);
    });
  }

  function handle(text) {
    const clean = text.trim();
    if (!clean) return;
    addMsg(clean, "user");
    botSay(findReply(clean));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handle(input.value);
    input.value = "";
  });

  let greeted = false;
  function openChat() {
    win.classList.add("open");
    win.setAttribute("aria-hidden", "false");
    if (!greeted) {
      greeted = true;
      botSay(
        "> BOOT NEURA.EXE ...\nHalo! Aku NEURA, asisten FAQ-nya Faishal ⚡\nPertanyaan cepat:"
      );
      renderSuggestions();
    }
    input.focus();
  }

  toggle.addEventListener("click", () => (win.classList.contains("open") ? closeChat() : openChat()));
  closeBtn.addEventListener("click", closeChat);

  function closeChat() {
    win.classList.remove("open");
    win.setAttribute("aria-hidden", "true");
  }
})();
