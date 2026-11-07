/*
 * NEON BRICK BREAKER: COSMIC EDITION (HTML5 canvas version)
 * Advanced Java Programming - CSN302
 * Team: Aryan Bihari - 1000024126, Aaddeep Biswas - 1000025763, Vansh Minhas - 1000024608
 *
 * Controls
 *   Desktop: Left/Right or A/D or mouse = move, Space/click = launch & pause, R = restart, M = mute
 *   Mobile : drag on the board = move, tap = launch & pause
 */
(() => {
  'use strict';

  // ---------- Constants (same values as the Java version) ----------
  const W = 1000, H = 720;
  const ROWS = 5, COLS = 10, BRICK_W = 86, BRICK_H = 25, GAP = 7;
  const SPEED = 1.25;          // overall game speed multiplier
  const TICK_MS = 10;          // game logic runs at 100 steps per second on every device
  const PADDLE_Y = H - 82, PADDLE_W = 178, PADDLE_H = 16, BALL = 17;
  const PADDLE_NAME = 'RAVI SHANKAR JHA';
  const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif';
  const font = (weight, size) => `${weight} ${size}px ${FONT}`;

  const NAMES = [
  'Nikunj Sharma',
  'Debolina Tapadar',
  'Aryan Bihari',
  'Vatsal Bajpai',
  'Tarun Botham',
  'Tanisha Sharma',
  'Rishi Rastogi',
  'Mohammad Shoaib',
  'Kavyansh Pathak',
  'Harshit Bansal',
  'Rajayvardhan Rathore',
  'Aaryan Gour',
  'Piyush Chauhan',
  'Avidev Rawat',
  'Rishab Rawat',
  'Mehwish Malaaika Noor',
  'Vaibhav Gangwar',
  'Aryan Kansal',
  'Saud Alam',
  'Vansh Minhas',
  'Akhilash Sharma',
  'Anshuman Singh',
  'Md Asif',
  'Archit Gurung',
  'Ayushman Pandey',
  'Prashansha Rawat',
  'Tarun Suyal',
  'Ayush Anand',
  'Yash walia',
  'Arjun Tomar',
  'Punit',
  'Utkarsh Thakur',
  'Siddharth Singh Chauhan',
  'Satyarth Rathi',
  'Mayank Kumar',
  'Kanishk Yadav',
  'Samarth Sawarna',
  'Sumit Singh Dhauni',
  'Ayaansh Visiyait',
  'Anchal Sahu',
  'Sarvagya Sharma',
  'Ayushman Barthwal',
  'Khushi kumari',
  'Sachin Rawat',
  'Nikhil Kumar Singh',
  'AADDEEP BISWAS',
  'Manuj Bajaj',
  'SHSHANK',
  'Vinayak Baunthiyal',
  'Priyanshu Kumar',
  'Harsh Dev Singh',
  'Km Ritika Negi',
  'Shivam Mishra',
  'Rishabh Bibhuti',
  'Umika Thakur',
  'RITVIK PANDEY',
  'Ram Singh',
  'Himanshu Rawat'
  ];

  const BRICK_COLORS = [
    [[255, 70, 115], [255, 100, 125]],
    [[255, 135, 65], [255, 175, 75]],
    [[255, 225, 70], [255, 245, 130]],
    [[0, 245, 190], [75, 255, 220]],
    [[85, 135, 255], [140, 170, 255]],
  ];

  const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const darker = c => c.map(v => Math.floor(v * 0.7));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const btnPlay = document.getElementById('btnPlay');
  const btnRestart = document.getElementById('btnRestart');
  const btnSound = document.getElementById('btnSound');
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  // ---------- Sound ----------
  // Only the boom effect (played when a brick breaks). Browsers need a tap or key press
  // before they allow audio, so everything is set up on the first interaction.
  const Sound = {
    enabled: true,
    audioCtx: null,
    buffer: null,
    ready: false,
    active: 0,
    fallback: false,

    load() {
      try { this.enabled = localStorage.getItem('bb-sound') !== 'off'; } catch (e) { /* ignore */ }
      refreshSoundButton();
    },

    unlock() {
      if (this.ready) { if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume(); return; }
      this.ready = true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.fallback = true; return; }
      try {
        this.audioCtx = new AC();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        fetch('assets/boom.mp3')
          .then(r => r.arrayBuffer())
          .then(buf => new Promise((res, rej) => this.audioCtx.decodeAudioData(buf, res, rej)))
          .then(decoded => { this.buffer = decoded; })
          .catch(() => { this.fallback = true; });   // e.g. page opened straight from disk
      } catch (e) { this.fallback = true; }
    },

    boom() {
      if (!this.enabled || this.active >= 6) return;   // don't flood the audio system
      const LEN = 1.0, FADE = 0.35;                    // first second, with a fade-out
      if (this.buffer && this.audioCtx) {
        const t = this.audioCtx.currentTime;
        const src = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        src.buffer = this.buffer;
        gain.gain.setValueAtTime(1, t);
        gain.gain.setValueAtTime(1, t + LEN - FADE);
        gain.gain.linearRampToValueAtTime(0, t + LEN);
        src.connect(gain).connect(this.audioCtx.destination);
        this.active++;
        src.onended = () => { this.active = Math.max(0, this.active - 1); };
        src.start(t, 0, LEN);
      } else if (this.fallback) {
        const a = new Audio('assets/boom.mp3');
        this.active++;
        const done = () => { this.active = Math.max(0, this.active - 1); };
        a.play().catch(done);
        setTimeout(() => { a.pause(); done(); }, LEN * 1000);
      }
    },

    toggle() {
      this.enabled = !this.enabled;
      try { localStorage.setItem('bb-sound', this.enabled ? 'on' : 'off'); } catch (e) { /* ignore */ }
      refreshSoundButton();
    },
  };

  function refreshSoundButton() {
    btnSound.textContent = Sound.enabled ? 'Sound on' : 'Sound off';
    btnSound.setAttribute('aria-pressed', String(Sound.enabled));
  }

  // ---------- Game state ----------
  let paddleX, ballX, ballY, ballDX, ballDY;
  let launched, paused, gameOver, won;
  let bricks, brickNames;
  let score, lives, level, remainingBricks, bonusMilestones;
  let moveLeft = false, moveRight = false;
  let glow = 0;
  let nameDeck = [];
  let fallingNames = [];
  let showCredits = true;
  let creditScroll = 0;

  // A shuffled deck so every name is used before any repeats.
  function nextName() {
    if (nameDeck.length === 0) {
      nameDeck = NAMES.slice();
      for (let i = nameDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nameDeck[i], nameDeck[j]] = [nameDeck[j], nameDeck[i]];
      }
    }
    return nameDeck.pop();
  }

  function resetBricks() {
    remainingBricks = 0;
    bricks = []; brickNames = [];
    for (let r = 0; r < ROWS; r++) {
      bricks.push([]); brickNames.push([]);
      for (let c = 0; c < COLS; c++) {
        bricks[r].push(true);
        brickNames[r].push(nextName());
        remainingBricks++;
      }
    }
  }

  function restartGame() {
    showCredits = false;
    score = 0; lives = 3; level = 1; bonusMilestones = 0;
    paddleX = W / 2 - PADDLE_W / 2;
    ballX = W / 2; ballY = H - 115;
    ballDX = 3.5; ballDY = -4.2;
    launched = false; paused = false; gameOver = false; won = false;
    fallingNames = [];
    resetBricks();
    syncButtons();
  }

  // ---------- Credits scene ----------
  const CR = { TITLE: 0, HEAD: 1, TEXT: 2, GAP: 4 };
  const creditHeights = { [CR.TITLE]: 64, [CR.HEAD]: 40, [CR.TEXT]: 32, [CR.GAP]: 36 };
  const creditLines = [
    [CR.TITLE, 'NEON BRICK BREAKER'],
    [CR.HEAD, 'COSMIC EDITION'],
    [CR.GAP],
    [CR.HEAD, 'ADVANCED JAVA PROGRAMMING  \u2022  CSN302'],
    [CR.GAP],
    [CR.HEAD, 'DEVELOPED BY'],
    [CR.TEXT, 'Aryan Bihari  \u2014  1000024126'],
    [CR.TEXT, 'Aaddeep Biswas  \u2014  1000025763'],
    [CR.TEXT, 'Vansh Minhas  \u2014  1000024608'],
    [CR.GAP],
    [CR.HEAD, 'SUBMITTED TO'],
    [CR.TEXT, 'Mr. Ravi Shankar Jha'],
    [CR.GAP],
    [CR.GAP],
    [CR.HEAD, 'THANK YOU FOR PLAYING'],
    [CR.GAP],
  ];

  function endCredits() { showCredits = false; syncButtons(); }

  // ---------- Input actions ----------
  function pressAction() {          // Space / tap / click / Launch button
    Sound.unlock();
    if (showCredits) endCredits();
    else if (gameOver || won) restartGame();
    else if (!launched) { launched = true; syncButtons(); }
    else { paused = !paused; syncButtons(); }
  }

  function syncButtons() {
    let label = 'Launch';
    if (showCredits) label = 'Skip intro';
    else if (gameOver || won) label = 'Play again';
    else if (!launched) label = 'Launch';
    else label = paused ? 'Resume' : 'Pause';
    btnPlay.textContent = label;
  }

  window.addEventListener('keydown', e => {
    const k = e.code;
    if (['ArrowLeft', 'ArrowRight', 'Space', 'ArrowUp', 'ArrowDown'].includes(k)) e.preventDefault();
    Sound.unlock();
    if (k === 'ArrowLeft' || k === 'KeyA') moveLeft = true;
    else if (k === 'ArrowRight' || k === 'KeyD') moveRight = true;
    else if (k === 'Space' && !e.repeat) { if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur(); pressAction(); }
    else if (k === 'Enter' && showCredits) endCredits();
    else if (k === 'KeyR' && !e.repeat) restartGame();
    else if (k === 'KeyM' && !e.repeat) Sound.toggle();
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLeft = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight = false;
  });
  window.addEventListener('blur', () => { moveLeft = moveRight = false; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && launched && !paused && !gameOver && !won) { paused = true; syncButtons(); }
  });

  // Mouse and touch: the paddle follows the pointer; a short tap launches/pauses.
  let down = null;
  function pointerToGameX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left) / rect.width * W;
  }
  function movePaddleTo(e) {
    if (showCredits || paused || gameOver || won) return;
    paddleX = clamp(pointerToGameX(e) - PADDLE_W / 2, 12, W - PADDLE_W - 12);
  }
  canvas.addEventListener('pointerdown', e => {
    Sound.unlock();
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    movePaddleTo(e);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' || down) movePaddleTo(e);
  });
  canvas.addEventListener('pointerup', e => {
    if (down) {
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 12 && performance.now() - down.t < 400) pressAction();
    }
    down = null;
  });
  canvas.addEventListener('pointercancel', () => { down = null; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  btnPlay.addEventListener('click', () => { pressAction(); });
  btnRestart.addEventListener('click', () => { Sound.unlock(); restartGame(); });
  btnSound.addEventListener('click', () => { Sound.unlock(); Sound.toggle(); });
  [btnPlay, btnRestart, btnSound].forEach(b => b.addEventListener('pointerup', () => b.blur()));

  // ---------- Update (one 10 ms step) ----------
  function updateFallingNames() {
    const floor = H - 40;
    for (let i = fallingNames.length - 1; i >= 0; i--) {
      const f = fallingNames[i];
      if (f.y < floor) {
        f.vy = Math.min(f.vy + 0.05, 4);
        f.y += f.vy;
        if (f.y >= floor) f.y = floor;
      } else if (++f.landed > 150) {
        fallingNames.splice(i, 1);     // rests at the bottom, then fades away
      }
    }
  }

  const overlap = (ax, ay, aw, ah, bx, by, bw, bh) =>
    ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  function updateGame() {
    if (moveLeft) paddleX -= 9;
    if (moveRight) paddleX += 9;
    paddleX = clamp(paddleX, 12, W - PADDLE_W - 12);
    updateFallingNames();
    if (!launched) {
      ballX = paddleX + PADDLE_W / 2 - BALL / 2;
      ballY = PADDLE_Y - BALL - 3;
      return;
    }

    ballX += ballDX * SPEED; ballY += ballDY * SPEED;
    if (ballX <= 2) { ballX = 2; ballDX = Math.abs(ballDX); }
    if (ballX + BALL >= W - 2) { ballX = W - BALL - 2; ballDX = -Math.abs(ballDX); }
    if (ballY <= 76) { ballY = 76; ballDY = Math.abs(ballDY); }

    const bx = Math.trunc(ballX), by = Math.trunc(ballY);
    if (overlap(bx, by, BALL, BALL, paddleX, PADDLE_Y, PADDLE_W, PADDLE_H) && ballDY > 0) {
      const hit = (ballX + BALL / 2) - (paddleX + PADDLE_W / 2);
      ballDX = (hit / (PADDLE_W / 2)) * 5.8;
      if (Math.abs(ballDX) < 1.5) ballDX = ballDX < 0 ? -1.5 : 1.5;
      ballDY = -Math.abs(ballDY);
      ballY = PADDLE_Y - BALL - 1;
    }

    outer:
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!bricks[r][c]) continue;
        const x = 20 + c * (BRICK_W + GAP), y = 110 + r * (BRICK_H + GAP);
        if (overlap(bx, by, BALL, BALL, x, y, BRICK_W, BRICK_H)) {
          bricks[r][c] = false; remainingBricks--;
          fallingNames.push({
            text: brickNames[r][c], x: x + BRICK_W / 2, y: y + BRICK_H / 2,
            vy: 0.6, landed: 0, phase: Math.random() * 6.28, color: BRICK_COLORS[r][c % 2],
          });
          score += 10 * level;
          Sound.boom();
          // Every 100 score points reached: add a +5 bonus once per milestone.
          const milestones = Math.floor(score / 100);
          if (milestones > bonusMilestones) {
            score += 5 * (milestones - bonusMilestones);
            bonusMilestones = milestones;
          }
          ballDY = -ballDY;
          break outer;
        }
      }
    }

    if (ballY > H) {
      lives--;
      launched = false;
      ballX = paddleX + PADDLE_W / 2; ballY = PADDLE_Y - BALL - 3;
      ballDX = (Math.random() < 0.5 ? 1 : -1) * (3.2 + level * 0.3);
      ballDY = -(4.0 + level * 0.3);
      if (lives <= 0) gameOver = true;
      syncButtons();
    }

    if (remainingBricks === 0) {
      if (level < 3) {
        level++; ballDX *= 1.16; ballDY *= 1.16;
        resetBricks(); launched = false;
      } else {
        won = true;
      }
      syncButtons();
    }
  }

  function tick() {
    if (showCredits) {
      creditScroll += 1.4;
      // finished once the last line has scrolled off the top
      let y = H + 40 - creditScroll;
      for (const l of creditLines) y += creditHeights[l[0]];
      if (y < 0) endCredits();
    } else if (!paused && !gameOver && !won) {
      updateGame();
    }
    glow += 0.06;
  }

  // ---------- Drawing ----------
  function roundRectPath(x, y, w, h, arc) {          // arc = full arc diameter, like Java's fillRoundRect
    const r = Math.min(arc / 2, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  const fillRR = (x, y, w, h, arc) => { roundRectPath(x, y, w, h, arc); ctx.fill(); };
  const strokeRR = (x, y, w, h, arc) => { roundRectPath(x + 0.5, y + 0.5, w, h, arc); ctx.stroke(); };
  const fillCircle = (cx, cy, r) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };

  // The starfield never changes, so it is drawn once and reused every frame.
  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  (function buildBackground() {
    const g = bg.getContext('2d');
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, 'rgb(5,8,30)'); grad.addColorStop(1, 'rgb(23,12,55)');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(30,100,255,0.063)';
    for (let i = 0; i < 5; i++) {
      const x = (i * 227 + 80) % W, y = (i * 139 + 120) % H;
      g.beginPath(); g.arc(x, y, 90, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 125; i++) {
      const x = (i * 173 + 41) % W, y = (i * 97 + 19) % H;
      const size = (i % 7 === 0) ? 3 : 1;
      g.fillStyle = `rgba(180,220,255,${i % 4 === 0 ? 0.7 : 0.35})`;
      g.beginPath(); g.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(0,240,255,0.118)'; g.lineWidth = 1;
    for (let y = 80; y < H; y += 40) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
  })();

  function textCentered(t, y) { ctx.textAlign = 'center'; ctx.fillText(t, W / 2, y); ctx.textAlign = 'left'; }

  function drawCredits() {
    ctx.textBaseline = 'alphabetic';
    let y = H + 40 - creditScroll;
    for (const l of creditLines) {
      const style = l[0];
      const fade = clamp(Math.min((y - 40) / 120, (H - 60 - y) / 90 + 1), 0, 1);
      if (fade > 0 && style !== CR.GAP) {
        ctx.globalAlpha = fade;
        if (style === CR.TITLE) {
          ctx.font = font('bold', 46);
          ctx.fillStyle = 'rgba(0,245,255,0.2)';
          for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) { ctx.save(); ctx.translate(dx, dy); textCentered(l[1], y); ctx.restore(); }
          ctx.fillStyle = 'rgb(0,245,255)'; textCentered(l[1], y);
        } else if (style === CR.HEAD) {
          ctx.font = font('bold', 16); ctx.fillStyle = 'rgb(255,205,95)'; textCentered(l[1], y);
        } else {
          ctx.font = font('bold', 22); ctx.fillStyle = '#fff'; textCentered(l[1], y);
        }
        ctx.globalAlpha = 1;
      }
      y += creditHeights[style];
    }
  }

  function drawStat(label, value, x, color) {
    ctx.fillStyle = 'rgb(145,165,220)'; ctx.font = font('bold', 10); ctx.fillText(label, x, 20);
    ctx.fillStyle = color; ctx.font = font('bold', 20); ctx.fillText(String(value), x, 46);
  }

  function drawHUD() {
    const g = ctx.createLinearGradient(0, 0, 0, 70);
    g.addColorStop(0, 'rgb(13,18,50)'); g.addColorStop(1, 'rgb(18,30,75)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 70);
    ctx.fillStyle = 'rgb(0,245,255)'; ctx.font = font('bold', 27); ctx.fillText('NEON BRICK BREAKER', 22, 32);
    ctx.font = font('bold', 11); ctx.fillStyle = 'rgb(180,205,255)';
    ctx.fillText('COSMIC EDITION  \u2022  ADVANCED JAVA', 24, 52);
    drawStat('SCORE', score, 580, 'rgb(255,230,100)');
    drawStat('LIVES', lives, 730, 'rgb(255,100,140)');
    drawStat('LEVEL', level, 860, 'rgb(80,255,190)');
    ctx.fillStyle = 'rgba(0,245,255,0.39)'; ctx.fillRect(15, 69, W - 30, 1);
  }

  function brickLabel(full) {
    const max = BRICK_W - 10;
    if (ctx.measureText(full).width <= max) return full;
    const p = full.split(' ');
    const short = p[0] + ' ' + p[p.length - 1][0] + '.';
    if (ctx.measureText(short).width <= max) return short;
    return p[0];
  }

  // Draws the label in the brick, shrinking the font slightly if even the first name is too wide.
  function brickFont(label) {
    for (let size = 11; size >= 8; size--) {
      ctx.font = font('bold', size);
      if (ctx.measureText(label).width <= BRICK_W - 10) break;
    }
  }

  function drawBricks() {
    ctx.textBaseline = 'middle';
    ctx.font = font('bold', 11);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!bricks[r][c]) continue;
        const x = 20 + c * (BRICK_W + GAP), y = 110 + r * (BRICK_H + GAP);
        const base = BRICK_COLORS[r][c % 2];
        ctx.fillStyle = rgba(base, 0.18); fillRR(x - 3, y - 3, BRICK_W + 6, BRICK_H + 6, 13);
        const g = ctx.createLinearGradient(0, y, 0, y + BRICK_H);
        g.addColorStop(0, rgba(base)); g.addColorStop(1, rgba(darker(base)));
        ctx.fillStyle = g; fillRR(x, y, BRICK_W, BRICK_H, 9);
        ctx.fillStyle = 'rgba(255,255,255,0.67)'; ctx.fillRect(x + 8, y + 4, BRICK_W - 16, 1);
        ctx.strokeStyle = 'rgba(255,255,255,0.31)'; ctx.lineWidth = 1; strokeRR(x, y, BRICK_W, BRICK_H, 9);
        ctx.font = font('bold', 11);
        const label = brickLabel(brickNames[r][c]);
        brickFont(label);
        const tx = x + (BRICK_W - ctx.measureText(label).width) / 2, ty = y + BRICK_H / 2 + 1;
        ctx.fillStyle = 'rgba(0,0,0,0.43)'; ctx.fillText(label, tx + 1, ty + 1);
        ctx.fillStyle = 'rgb(15,20,45)'; ctx.fillText(label, tx, ty);
      }
    }
    ctx.textBaseline = 'alphabetic';
  }

  function drawFallingNames() {
    ctx.font = font('bold', 16);
    ctx.textBaseline = 'middle';
    for (const f of fallingNames) {
      const alpha = f.landed > 0 ? Math.max(0, 1 - f.landed / 150) : 1;
      const sway = f.landed > 0 ? 0 : Math.sin(f.y / 28 + f.phase) * 6;
      const w = ctx.measureText(f.text).width;
      const x = f.x + sway - w / 2, y = f.y;
      ctx.fillStyle = rgba(f.color, 0.27 * alpha); fillRR(x - 8, y - 12, w + 16, 24, 14);
      ctx.fillStyle = `rgba(0,0,0,${0.47 * alpha})`; ctx.fillText(f.text, x + 1, y + 1);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.fillText(f.text, x, y);
    }
    ctx.textBaseline = 'alphabetic';
  }

  function drawPaddle() {
    ctx.fillStyle = 'rgba(0,240,255,0.16)'; fillRR(paddleX - 8, PADDLE_Y - 7, PADDLE_W + 16, PADDLE_H + 14, 24);
    const g = ctx.createLinearGradient(0, PADDLE_Y, 0, PADDLE_Y + PADDLE_H);
    g.addColorStop(0, 'rgb(0,255,255)'); g.addColorStop(1, 'rgb(55,90,255)');
    ctx.fillStyle = g; fillRR(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 16);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; strokeRR(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 16);
    ctx.font = font('bold', 10); ctx.textBaseline = 'middle';
    const px = paddleX + (PADDLE_W - ctx.measureText(PADDLE_NAME).width) / 2, py = PADDLE_Y + PADDLE_H / 2 + 1;
    ctx.fillStyle = 'rgba(255,255,255,0.47)'; ctx.fillText(PADDLE_NAME, px + 1, py + 1);
    ctx.fillStyle = 'rgb(5,10,40)'; ctx.fillText(PADDLE_NAME, px, py);
    ctx.textBaseline = 'alphabetic';
  }

  function drawBall() {
    const cx = ballX + BALL / 2, cy = ballY + BALL / 2;
    ctx.fillStyle = 'rgba(0,255,255,0.18)'; fillCircle(cx, cy, BALL / 2 + 8);
    ctx.fillStyle = 'rgba(0,245,255,0.39)'; fillCircle(cx, cy, BALL / 2 + 4);
    const g = ctx.createRadialGradient(ballX + 5, ballY + 4, 0, ballX + 5, ballY + 4, BALL);
    g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgb(0,190,255)');
    ctx.fillStyle = g; fillCircle(cx, cy, BALL / 2);
  }

  function drawOverlay(title, subtitle) {
    ctx.fillStyle = 'rgba(2,5,22,0.84)'; fillRR(190, 280, 620, 135, 25);
    ctx.strokeStyle = 'rgba(0,245,255,0.39)'; ctx.lineWidth = 2; strokeRR(190, 280, 620, 135, 25);
    ctx.font = font('bold', 31); ctx.fillStyle = 'rgb(0,245,255)'; textCentered(title, 330);
    ctx.font = font('bold', 14); ctx.fillStyle = '#fff'; textCentered(subtitle, 365);
    ctx.font = font('normal', 11); ctx.fillStyle = 'rgb(165,190,255)';
    textCentered('BRICK BREAKER DELUXE  \u2022  ARCADE MODE', 390);
  }

  function draw() {
    const scale = canvas.width / W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(bg, 0, 0);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';

    if (showCredits) {
      drawCredits();
      ctx.font = font('bold', 12);
      ctx.fillStyle = `rgba(140,170,220,${(0.55 + 0.35 * Math.sin(glow * 2)).toFixed(3)})`;
      textCentered(isTouch ? 'TAP TO SKIP' : 'PRESS SPACE TO SKIP', H - 18);
      return;
    }

    drawHUD();
    drawBricks();
    drawFallingNames();
    drawPaddle();
    drawBall();
    const go = isTouch ? 'TAP' : 'PRESS SPACE';
    if (!launched && !gameOver && !won) drawOverlay('READY PLAYER ONE', `${go} TO LAUNCH`);
    if (paused) drawOverlay('GAME PAUSED', `${go} TO RESUME`);
    if (gameOver) drawOverlay('GAME OVER', `Score: ${score}   \u2022   ${isTouch ? 'Tap' : 'Press SPACE or R'} to retry`);
    if (won) drawOverlay('COSMIC CHAMPION!', `Final score: ${score}   \u2022   ${isTouch ? 'Tap' : 'Press SPACE or R'} to play again`);
    ctx.font = font('bold', 12); ctx.fillStyle = 'rgb(140,170,220)';
    ctx.fillText(isTouch
      ? 'DRAG: MOVE     TAP: LAUNCH / PAUSE'
      : 'MOVE: \u2190 \u2192 / A D / MOUSE     SPACE: LAUNCH / PAUSE     R: RESTART     M: MUTE', 22, H - 18);
  }

  // ---------- Sizing & main loop ----------
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);

  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(now - last, 100);   // cap so a background tab can't cause a huge catch-up
    last = now;
    while (acc >= TICK_MS) { tick(); acc -= TICK_MS; }
    draw();
    requestAnimationFrame(frame);
  }

  Sound.load();
  restartGame();
  showCredits = true;       // credits play once when the page opens
  syncButtons();
  resize();
  requestAnimationFrame(frame);
})();
