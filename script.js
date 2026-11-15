(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const highScoreEl = document.getElementById("high-score");
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");

  const GRID = 15;
  const CELL = canvas.width / GRID;
  const TICK_MS = 110;
  const STORAGE_KEY = "nokia-snake-high";

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const OPPOSITE = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  let snake, dir, nextDir, food, score, highScore, running, paused, lastTick, rafId;

  function loadHigh() {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? parseInt(v, 10) || 0 : 0;
  }

  function saveHigh(v) {
    localStorage.setItem(STORAGE_KEY, String(v));
  }

  function randomEmptyCell() {
    const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
    let x, y, key;
    do {
      x = Math.floor(Math.random() * GRID);
      y = Math.floor(Math.random() * GRID);
      key = `${x},${y}`;
    } while (occupied.has(key));
    return { x, y };
  }

  function resetGame() {
    const mid = Math.floor(GRID / 2);
    snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    dir = "right";
    nextDir = "right";
    food = randomEmptyCell();
    score = 0;
    scoreEl.textContent = `Score: ${score}`;
    running = false;
    paused = false;
    lastTick = 0;
  }

  function showOverlay(title, msg) {
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    highScore = loadHigh();
    highScoreEl.textContent = highScore > 0 ? `Best: ${highScore}` : "";
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startGame() {
    resetGame();
    hideOverlay();
    running = true;
    paused = false;
    lastTick = performance.now();
    if (rafId) cancelAnimationFrame(rafId);
    loop(lastTick);
  }

  function gameOver() {
    running = false;
    if (score > highScore) {
      highScore = score;
      saveHigh(highScore);
    }
    showOverlay("GAME OVER", `Score: ${score}  ·  Press Start`);
  }

  function setDirection(newDir) {
    if (!DIRS[newDir]) return;
    if (OPPOSITE[dir] === newDir) return;
    nextDir = newDir;
  }

  function tick() {
    if (!running || paused) return;

    dir = nextDir;
    const head = snake[0];
    const d = DIRS[dir];
    const nx = head.x + d.x;
    const ny = head.y + d.y;

    // Wall collision
    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) {
      gameOver();
      return;
    }

    // Self collision
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === nx && snake[i].y === ny) {
        gameOver();
        return;
      }
    }

    snake.unshift({ x: nx, y: ny });

    if (nx === food.x && ny === food.y) {
      score += 10;
      scoreEl.textContent = `Score: ${score}`;
      food = randomEmptyCell();
    } else {
      snake.pop();
    }
  }

  function drawCell(x, y, fill, inset = 1) {
    ctx.fillStyle = fill;
    ctx.fillRect(
      x * CELL + inset,
      y * CELL + inset,
      CELL - inset * 2,
      CELL - inset * 2
    );
  }

  function draw() {
    // Background grid feel
    ctx.fillStyle = "#8bac0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle checker
    ctx.fillStyle = "rgba(15, 56, 15, 0.06)";
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }

    // Food
    drawCell(food.x, food.y, "#0f380f", 2);
    // Small highlight on food
    ctx.fillStyle = "#306230";
    ctx.fillRect(food.x * CELL + 5, food.y * CELL + 5, 4, 4);

    // Snake
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      drawCell(seg.x, seg.y, isHead ? "#0f380f" : "#1a4a1a", isHead ? 1 : 2);
    });

    // Pause indicator
    if (paused && running) {
      ctx.fillStyle = "rgba(15, 56, 15, 0.55)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f380f";
      ctx.font = "12px 'Press Start 2P'";
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (!running) {
      draw();
      return;
    }
    if (paused) {
      draw();
      return;
    }
    if (now - lastTick >= TICK_MS) {
      lastTick = now;
      tick();
    }
    draw();
  }

  // Keyboard
  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!running) startGame();
      else {
        paused = !paused;
      }
      return;
    }
    if (e.key === "p" || e.key === "P") {
      if (running) paused = !paused;
      return;
    }
    const d = keyMap[e.key];
    if (d) {
      e.preventDefault();
      if (!running) startGame();
      setDirection(d);
    }
  });

  // On-screen buttons
  document.querySelectorAll(".btn[data-dir]").forEach((btn) => {
    const fire = (e) => {
      e.preventDefault();
      const d = btn.getAttribute("data-dir");
      if (!running) startGame();
      setDirection(d);
    };
    btn.addEventListener("click", fire);
    btn.addEventListener("touchstart", fire, { passive: false });
  });

  pauseBtn.addEventListener("click", () => {
    if (!running) {
      startGame();
      return;
    }
    paused = !paused;
  });

  startBtn.addEventListener("click", startGame);

  // Swipe controls
  let touchStart = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < 24) return;
      if (!running) startGame();
      if (absX > absY) setDirection(dx > 0 ? "right" : "left");
      else setDirection(dy > 0 ? "down" : "up");
    },
    { passive: true }
  );

  // Init
  highScore = loadHigh();
  resetGame();
  showOverlay("Nokia Snake", "Press Start or Space");
  draw();
})();
