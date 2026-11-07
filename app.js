(function () {
  "use strict";

  const STORE_KEY = "bibleGame.v1";
  const SECTIONS = window.GAME_SECTIONS || [];
  const byId = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
  const app = document.getElementById("app");
  const scorebar = document.getElementById("scorebar");
  const modalRoot = document.getElementById("modal");

  let S = null; // game state (persisted)
  const T = { handle: null, endAt: 0, remaining: 0, total: 0, paused: false, onEnd: null, lastWhole: null };

  /* ---------- helpers ---------- */
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const maxPerSection = () => Math.min(...SECTIONS.map((s) => s.pool.length));
  const teamName = (i) => esc(S.settings.teams[i]);
  const other = (i) => 1 - i;

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
  }
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { return null; }
  }
  function clearSaved() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
  }

  // Sanity-check scrambles so a typo in questions.js is caught early.
  SECTIONS.filter((s) => s.id === "scramble").forEach((s) => {
    [s.example, ...s.pool].forEach((q) => {
      const norm = (w) => w.toUpperCase().replace(/[^A-Z]/g, "").split("").sort().join("");
      if (norm(q.scrambled) !== norm(q.answer)) console.warn("Scramble letters do not match answer:", q);
    });
  });

  /* ---------- sound ---------- */
  let audio = null;
  function initAudio() {
    if (audio) return;
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
  }
  function tone(freq, dur, type = "sine", vol = 0.2, delay = 0) {
    if (!audio || !S || !S.settings.sound) return;
    try {
      const t0 = audio.currentTime + delay;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g).connect(audio.destination);
      o.start(t0);
      o.stop(t0 + dur);
    } catch (e) { /* ignore */ }
  }
  const sfx = {
    tick: () => tone(880, 0.08, "square", 0.08),
    correct: () => { tone(660, 0.15, "sine", 0.25); tone(880, 0.15, "sine", 0.25, 0.12); tone(1320, 0.3, "sine", 0.25, 0.24); },
    wrong: () => tone(160, 0.45, "sawtooth", 0.18),
    buzzer: () => { tone(120, 0.7, "square", 0.2); tone(90, 0.7, "square", 0.15); },
  };

  /* ---------- timer ---------- */
  function startTimer(seconds, onEnd, startPaused = false) {
    stopTimer();
    T.total = seconds;
    T.remaining = seconds * 1000;
    T.onEnd = onEnd;
    T.paused = startPaused;
    T.lastWhole = null;
    if (!startPaused) runTimer();
    drawTimer();
  }
  function runTimer() {
    T.endAt = Date.now() + T.remaining;
    T.handle = setInterval(() => {
      T.remaining = Math.max(0, T.endAt - Date.now());
      const whole = Math.ceil(T.remaining / 1000);
      if (whole !== T.lastWhole) {
        if (whole <= 5 && whole > 0 && T.lastWhole !== null) sfx.tick();
        T.lastWhole = whole;
      }
      drawTimer();
      if (T.remaining <= 0) {
        const cb = T.onEnd;
        stopTimer();
        cb && cb();
      }
    }, 100);
  }
  function stopTimer() {
    if (T.handle) clearInterval(T.handle);
    T.handle = null;
  }
  function togglePause() {
    if (!S.current || S.current.phase === "done") return;
    if (T.paused) { T.paused = false; runTimer(); }
    else { T.paused = true; stopTimer(); }
    drawTimer();
    const btn = document.getElementById("pauseBtn");
    if (btn) btn.textContent = T.paused ? "▶ Resume" : "⏸ Pause";
  }
  function drawTimer() {
    const num = document.getElementById("timerNum");
    const bar = document.getElementById("timerBar");
    if (!num || !bar) return;
    const secs = Math.ceil(T.remaining / 1000);
    num.textContent = secs;
    const pct = T.total ? (T.remaining / (T.total * 1000)) * 100 : 0;
    bar.style.width = pct + "%";
    const urgent = secs <= 5;
    num.classList.toggle("urgent", urgent);
    bar.classList.toggle("urgent", urgent);
    num.classList.toggle("paused", T.paused);
  }

  /* ---------- game setup ---------- */
  function newGame(settings) {
    clearSaved();
    S = {
      settings,
      scores: [0, 0],
      sectionScores: {},
      active: 0,
      boards: {},
      results: {},
      introSeen: {},
      screen: "sections",
      section: null,
      current: null,
    };
    settings.sections.forEach((id) => {
      const sec = byId[id];
      const n = Math.min(settings.perSection, sec.pool.length);
      S.boards[id] = shuffle(sec.pool.map((_, i) => i)).slice(0, n);
      S.results[id] = new Array(n).fill(null);
      S.sectionScores[id] = [0, 0];
    });
    save();
    render();
  }
  const remaining = (id) => S.results[id].filter((r) => r === null).length;
  const totalRemaining = () => S.settings.sections.reduce((n, id) => n + remaining(id), 0);

  /* ---------- question flow ---------- */
  function pickTile(i) {
    const id = S.section;
    if (S.results[id][i] !== null) return;
    S.current = { section: id, tile: i, team: S.active, phase: "main", outcome: null };
    S.screen = "question";
    save();
    render();
    startTimer(S.settings.timer, onTimeout);
  }
  function onTimeout() {
    sfx.buzzer();
    advanceMiss(true);
  }
  function markCorrect() {
    const c = S.current;
    if (!c || c.phase === "done") return;
    stopTimer();
    const scorer = c.phase === "main" ? c.team : other(c.team);
    S.scores[scorer]++;
    S.sectionScores[c.section][scorer]++;
    S.results[c.section][c.tile] = { by: scorer, bonus: c.phase === "bonus" };
    c.outcome = { by: scorer, bonus: c.phase === "bonus" };
    c.phase = "done";
    sfx.correct();
    save();
    render();
  }
  function markWrong() {
    if (!S.current || S.current.phase === "done") return;
    sfx.wrong();
    advanceMiss(false);
  }
  function advanceMiss(timedOut) {
    const c = S.current;
    stopTimer();
    if (c.phase === "main") {
      c.phase = "bonus";
      c.mainTimedOut = timedOut;
      save();
      render();
      startTimer(S.settings.bonusTimer, onTimeout);
    } else {
      S.results[c.section][c.tile] = { by: -1 };
      c.outcome = { by: -1 };
      c.phase = "done";
      save();
      render();
    }
  }
  function continueAfterQuestion() {
    const c = S.current;
    if (!c || c.phase !== "done") return;
    S.active = other(c.team);
    S.current = null;
    S.screen = remaining(S.section) > 0 ? "board" : "sections";
    if (totalRemaining() === 0) S.screen = "end";
    save();
    render();
  }

  /* ---------- modal ---------- */
  function openModal(html, onMount) {
    modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal">${html}</div></div>`;
    modalRoot.hidden = false;
    modalRoot.querySelector(".modal-backdrop").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) closeModal();
    });
    onMount && onMount(modalRoot);
  }
  function closeModal() {
    modalRoot.hidden = true;
    modalRoot.innerHTML = "";
  }
  function confirmDialog(message, yesLabel, onYes) {
    openModal(
      `<p class="modal-msg">${message}</p>
       <div class="row end">
         <button class="btn ghost" data-act="no">Cancel</button>
         <button class="btn danger" data-act="yes">${yesLabel}</button>
       </div>`,
      (root) => {
        root.querySelector('[data-act="no"]').onclick = closeModal;
        root.querySelector('[data-act="yes"]').onclick = () => { closeModal(); onYes(); };
      }
    );
  }
  function showAnswerKey() {
    const id = S.section;
    const sec = byId[id];
    const rows = S.boards[id]
      .map((qi, tile) => {
        const q = sec.pool[qi];
        const used = S.results[id][tile] !== null;
        const clue = q.emoji || q.first || q.scrambled || (q.image ? q.clue || "(image)" : "");
        return `<tr class="${used ? "used" : ""}"><td>${tile + 1}</td><td>${esc(clue)}</td><td><strong>${esc(q.answer)}</strong>${
          q.alt ? `<br><small>Also: ${esc(q.alt.join(", "))}</small>` : ""
        }</td></tr>`;
      })
      .join("");
    openModal(
      `<h2>Answer key: ${esc(sec.title)}</h2>
       <p class="warn">For the moderator only. Hide this from the audience.</p>
       <div class="key-wrap"><table class="key"><thead><tr><th>#</th><th>Clue</th><th>Answer</th></tr></thead><tbody>${rows}</tbody></table></div>
       <div class="row end"><button class="btn" data-act="close">Close</button></div>`,
      (root) => (root.querySelector('[data-act="close"]').onclick = closeModal)
    );
  }

  /* ---------- prompt rendering ---------- */
  function promptHTML(sec, q, revealed) {
    if (sec.id === "pictures") {
      return q.image
        ? `<div class="pic"><img src="${esc(q.image)}" alt="Picture clue">${
            q.clue ? `<div class="pic-clue">${esc(q.clue)}</div>` : ""
          }</div>`
        : `<div class="pic emoji">${esc(q.emoji)}</div>`;
    }
    if (sec.id === "pairs") {
      return `<div class="pair">${esc(q.first)} <span class="amp">&amp;</span> ${
        revealed ? `<span class="filled">${esc(q.answer)}</span>` : `<span class="blank"></span>`
      }</div>`;
    }
    if (sec.id === "scramble") {
      const letters = (revealed ? q.answer.toUpperCase() : q.scrambled.toUpperCase()).split("");
      return `<div class="letters ${revealed ? "solved" : ""}">${letters.map((l) => `<span>${esc(l)}</span>`).join("")}</div>`;
    }
    return "";
  }
  function answerHTML(q, showText = true) {
    return `<div class="answer">
      ${showText ? `<div class="answer-label">Answer</div>
      <div class="answer-text">${esc(q.answer)}</div>` : ""}
      ${q.alt ? `<div class="answer-alt">Also accept: ${esc(q.alt.join(", "))}</div>` : ""}
      ${q.hint ? `<div class="answer-hint">${esc(q.hint)}</div>` : ""}
    </div>`;
  }

  /* ---------- screens ---------- */
  function renderScorebar() {
    if (!S || S.screen === "setup") { scorebar.hidden = true; return; }
    scorebar.hidden = false;
    const canAdjust = S.screen === "board" || S.screen === "sections";
    const showTurn = S.screen === "board" || S.screen === "sections" || S.screen === "intro";
    scorebar.innerHTML = [0, 1]
      .map(
        (i) => `<div class="team team-${i} ${showTurn && S.active === i ? "active" : ""}">
          ${showTurn && S.active === i ? `<span class="turn">Picking</span>` : ""}
          <span class="team-name">${teamName(i)}</span>
          <span class="team-score">${S.scores[i]}</span>
          ${canAdjust ? `<span class="adjust"><button data-adj="${i}" data-d="-1" title="Remove a point">−</button><button data-adj="${i}" data-d="1" title="Add a point">+</button></span>` : ""}
        </div>`
      )
      .join("");
    scorebar.querySelectorAll("[data-adj]").forEach((b) => {
      b.onclick = () => {
        const i = +b.dataset.adj;
        S.scores[i] = Math.max(0, S.scores[i] + +b.dataset.d);
        save();
        renderScorebar();
      };
    });
  }

  function renderSetup() {
    const saved = loadSaved();
    const resumable = saved && saved.screen && saved.screen !== "end";
    const max = maxPerSection();
    const d = { teams: ["Team A", "Team B"], timer: 20, bonusTimer: 10, perSection: Math.min(12, max), sound: true };
    app.innerHTML = `
      <section class="screen setup">
        <h1 class="logo">Bible Games</h1>
        <p class="lead">Two teams. Three rounds. One winner.</p>
        ${
          resumable
            ? `<div class="card resume">
                 <div><strong>A game is in progress.</strong><br><span class="muted">${esc(saved.settings.teams[0])} ${saved.scores[0]}, ${esc(saved.settings.teams[1])} ${saved.scores[1]}</span></div>
                 <button class="btn primary" id="resumeBtn">Resume game</button>
               </div>`
            : ""
        }
        <form class="card form" id="setupForm">
          <h2>${resumable ? "Or start a new game" : "Game settings"}</h2>
          <div class="grid2">
            <label>Team 1 name<input name="t0" value="${d.teams[0]}" maxlength="24" required></label>
            <label>Team 2 name<input name="t1" value="${d.teams[1]}" maxlength="24" required></label>
            <label>Timer (seconds)<input name="timer" type="number" min="5" max="180" value="${d.timer}" required></label>
            <label>Bonus timer (seconds)<input name="bonus" type="number" min="5" max="180" value="${d.bonusTimer}" required></label>
            <label>Questions per section<input name="per" type="number" min="1" max="${max}" value="${d.perSection}" required></label>
            <label class="check"><input name="sound" type="checkbox" checked> Sound effects</label>
          </div>
          <fieldset>
            <legend>Sections</legend>
            ${SECTIONS.map((s) => `<label class="check"><input type="checkbox" name="sec" value="${s.id}" checked> ${esc(s.title)} <span class="muted">(${s.pool.length} in bank)</span></label>`).join("")}
          </fieldset>
          <p class="error" id="setupErr" hidden></p>
          <button class="btn primary big" type="submit">${resumable ? "Start new game" : "Start game"}</button>
          ${resumable ? `<p class="muted small">Starting a new game clears the saved game.</p>` : ""}
        </form>
      </section>`;
    if (resumable) {
      document.getElementById("resumeBtn").onclick = () => {
        initAudio();
        S = saved;
        render();
        if (S.screen === "question" && S.current && S.current.phase !== "done") {
          startTimer(S.current.phase === "main" ? S.settings.timer : S.settings.bonusTimer, onTimeout, true);
          const btn = document.getElementById("pauseBtn");
          if (btn) btn.textContent = "▶ Resume";
        }
      };
    }
    document.getElementById("setupForm").onsubmit = (e) => {
      e.preventDefault();
      initAudio();
      const f = new FormData(e.target);
      const sections = f.getAll("sec");
      const err = document.getElementById("setupErr");
      if (!sections.length) { err.textContent = "Pick at least one section."; err.hidden = false; return; }
      const clamp = (v, lo, hi, dflt) => { v = parseInt(v, 10); return isNaN(v) ? dflt : Math.min(hi, Math.max(lo, v)); };
      newGame({
        teams: [String(f.get("t0")).trim() || "Team A", String(f.get("t1")).trim() || "Team B"],
        timer: clamp(f.get("timer"), 5, 180, 20),
        bonusTimer: clamp(f.get("bonus"), 5, 180, 10),
        perSection: clamp(f.get("per"), 1, max, 12),
        sound: f.get("sound") === "on",
        sections,
      });
    };
  }

  function renderSections() {
    app.innerHTML = `
      <section class="screen">
        <h1>Choose a section</h1>
        <p class="lead"><span class="pill team-${S.active}">${teamName(S.active)}</span> picks next.</p>
        <div class="section-cards">
          ${S.settings.sections
            .map((id) => {
              const s = byId[id];
              const left = remaining(id);
              const total = S.results[id].length;
              return `<button class="section-card" data-sec="${id}" ${left === 0 ? "disabled" : ""}>
                  <span class="sc-title">${esc(s.title)}</span>
                  <span class="sc-sub">${esc(s.subtitle)}</span>
                  <span class="sc-left">${left === 0 ? "All done" : `${left} of ${total} left`}</span>
                </button>`;
            })
            .join("")}
        </div>
        <div class="row center"><button class="btn danger ghost" id="endBtn">End game</button></div>
      </section>`;
    app.querySelectorAll("[data-sec]").forEach((b) => {
      b.onclick = () => {
        S.section = b.dataset.sec;
        S.screen = S.introSeen[S.section] ? "board" : "intro";
        save();
        render();
      };
    });
    document.getElementById("endBtn").onclick = askEnd;
  }

  function renderIntro() {
    const sec = byId[S.section];
    const ex = sec.example;
    app.innerHTML = `
      <section class="screen intro">
        <p class="eyebrow">How to play</p>
        <h1>${esc(sec.title)}</h1>
        <ol class="howto">${sec.howTo.map((h) => `<li>${esc(h)}</li>`).join("")}</ol>
        <div class="card example">
          <p class="eyebrow">Example</p>
          <div id="exPrompt">${promptHTML(sec, ex, false)}</div>
          <div id="exAnswer"></div>
          <button class="btn" id="exReveal">Show answer</button>
        </div>
        <div class="row center"><button class="btn primary big" id="toBoard">Choose a question →</button></div>
      </section>`;
    document.getElementById("exReveal").onclick = (e) => {
      document.getElementById("exPrompt").innerHTML = promptHTML(sec, ex, true);
      document.getElementById("exAnswer").innerHTML = answerHTML(ex, sec.id === "pictures");
      e.target.remove();
    };
    document.getElementById("toBoard").onclick = () => {
      S.introSeen[S.section] = true;
      S.screen = "board";
      save();
      render();
    };
  }

  function renderBoard() {
    const id = S.section;
    const sec = byId[id];
    const tiles = S.results[id]
      .map((r, i) => {
        if (r === null) return `<button class="tile" data-tile="${i}">${i + 1}</button>`;
        const label = r.by === -1 ? "No points" : `${teamName(r.by)}${r.bonus ? " (bonus)" : ""}`;
        return `<div class="tile used ${r.by === -1 ? "none" : "by-" + r.by}"><span class="tnum">${i + 1}</span><span class="tby">${label}</span></div>`;
      })
      .join("");
    app.innerHTML = `
      <section class="screen board">
        <div class="board-head">
          <div>
            <p class="eyebrow">${esc(sec.title)}</p>
            <h1><span class="pill team-${S.active}">${teamName(S.active)}</span>, pick a number</h1>
          </div>
        </div>
        <div class="tiles">${tiles}</div>
        <div class="row center wrap">
          <button class="btn ghost" id="howBtn">How to play</button>
          <button class="btn ghost" id="keyBtn">Answer key</button>
          <button class="btn" id="switchBtn">Switch section</button>
          <button class="btn danger ghost" id="endBtn">End game</button>
        </div>
      </section>`;
    app.querySelectorAll("[data-tile]").forEach((b) => (b.onclick = () => pickTile(+b.dataset.tile)));
    document.getElementById("howBtn").onclick = () => { S.screen = "intro"; save(); render(); };
    document.getElementById("keyBtn").onclick = showAnswerKey;
    document.getElementById("switchBtn").onclick = () => { S.screen = "sections"; save(); render(); };
    document.getElementById("endBtn").onclick = askEnd;
  }

  function renderQuestion() {
    const c = S.current;
    const sec = byId[c.section];
    const q = sec.pool[S.boards[c.section][c.tile]];
    const done = c.phase === "done";
    const bonus = c.phase === "bonus";
    const answering = bonus ? other(c.team) : c.team;

    let banner;
    if (!done) {
      banner = bonus
        ? `<div class="banner bonus team-${answering}">Bonus: ${teamName(answering)}</div>`
        : `<div class="banner team-${answering}">${teamName(answering)}</div>`;
    } else if (c.outcome.by === -1) {
      banner = `<div class="banner none">No points this time</div>`;
    } else {
      banner = `<div class="banner win team-${c.outcome.by}">+1 ${teamName(c.outcome.by)}${c.outcome.bonus ? " (bonus)" : ""}</div>`;
    }

    app.innerHTML = `
      <section class="screen question">
        <p class="eyebrow">${esc(sec.title)} · Question ${c.tile + 1}</p>
        ${banner}
        ${bonus ? `<p class="muted">${teamName(c.team)} ${c.mainTimedOut ? "ran out of time" : "missed it"}. ${teamName(answering)}, it's yours to steal.</p>` : ""}
        <div class="prompt-box">${promptHTML(sec, q, done)}</div>
        ${done ? answerHTML(q, sec.id === "pictures") : `
          <div class="timer">
            <div class="timer-num" id="timerNum"></div>
            <div class="timer-track"><div class="timer-bar" id="timerBar"></div></div>
          </div>`}
        <div class="row center wrap controls">
          ${
            done
              ? `<button class="btn primary big" id="contBtn">Continue →</button>`
              : `<button class="btn correct big" id="okBtn">✓ Correct</button>
                 <button class="btn wrong big" id="noBtn">✗ Wrong</button>
                 <button class="btn ghost" id="pauseBtn">${T.paused ? "▶ Resume" : "⏸ Pause"}</button>`
          }
        </div>
        ${done ? "" : `<p class="muted small keys">Keys: C correct · W wrong · Space pause</p>`}
      </section>`;
    if (done) {
      document.getElementById("contBtn").onclick = continueAfterQuestion;
    } else {
      document.getElementById("okBtn").onclick = markCorrect;
      document.getElementById("noBtn").onclick = markWrong;
      document.getElementById("pauseBtn").onclick = togglePause;
      drawTimer();
    }
  }

  function askEnd() {
    confirmDialog("End the game now and show the final scores?", "End game", () => {
      S.screen = "end";
      save();
      render();
    });
  }

  function renderEnd() {
    stopTimer();
    const [a, b] = S.scores;
    const headline = a === b ? "It's a tie!" : `${teamName(a > b ? 0 : 1)} wins!`;
    const rows = S.settings.sections
      .map((id) => `<tr><td>${esc(byId[id].title)}</td><td>${S.sectionScores[id][0]}</td><td>${S.sectionScores[id][1]}</td></tr>`)
      .join("");
    app.innerHTML = `
      <section class="screen end">
        <p class="eyebrow">Final scores</p>
        <h1 class="logo">${headline}</h1>
        <div class="final">
          <div class="final-team team-${0} ${a >= b ? "lead" : ""}"><span>${teamName(0)}</span><strong>${a}</strong></div>
          <div class="final-team team-${1} ${b >= a ? "lead" : ""}"><span>${teamName(1)}</span><strong>${b}</strong></div>
        </div>
        <table class="breakdown">
          <thead><tr><th>Section</th><th>${teamName(0)}</th><th>${teamName(1)}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="muted small">Totals include any manual score adjustments.</p>
        <div class="row center"><button class="btn primary big" id="newBtn">New game</button></div>
      </section>`;
    document.getElementById("newBtn").onclick = () => {
      clearSaved();
      S = null;
      render();
    };
  }

  function render() {
    closeModal();
    if (!S) { renderScorebar(); renderSetup(); return; }
    renderScorebar();
    ({ sections: renderSections, intro: renderIntro, board: renderBoard, question: renderQuestion, end: renderEnd }[S.screen] || renderSections)();
    window.scrollTo(0, 0);
  }

  /* ---------- keyboard shortcuts for the moderator ---------- */
  document.addEventListener("keydown", (e) => {
    if (!S || S.screen !== "question" || !modalRoot.hidden) return;
    if (e.target.matches("input, textarea")) return;
    const k = e.key.toLowerCase();
    if (S.current.phase === "done") {
      if (k === "enter" || k === " ") { e.preventDefault(); continueAfterQuestion(); }
      return;
    }
    if (k === "c") markCorrect();
    else if (k === "w") markWrong();
    else if (k === " ") { e.preventDefault(); togglePause(); }
  });

  render();
})();
