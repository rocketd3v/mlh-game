const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');

const state = {
  running: false,
  score: 0,
  lastTime: 0,
  spawnTimer: 0,
  starTimer: 0,
  animationId: null,
  keys: {},
  meteors: [],
  stars: [],
  particles: []
};

const player = {
  x: canvas.width / 2,
  y: canvas.height - 34,
  radius: 18,
  speed: 6.5,
  color: '#7dd3fc'
};

function resetGame() {
  state.running = true;
  state.score = 0;
  state.spawnTimer = 0;
  state.starTimer = 0;
  state.meteors = [];
  state.stars = [];
  state.particles = [];

  player.x = canvas.width / 2;
  player.y = canvas.height - 34;

  scoreEl.textContent = String(state.score);
  statusEl.textContent = 'In play';
  statusEl.style.color = '#a7f3d0';
}

function startGame() {
  resetGame();
  if (state.animationId) cancelAnimationFrame(state.animationId);
  state.lastTime = 0;
  state.animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  state.running = false;
  statusEl.textContent = 'Game Over';
  statusEl.style.color = '#fca5a5';
  startBtn.textContent = 'Play Again';
  if (state.animationId) cancelAnimationFrame(state.animationId);
  state.animationId = null;
}

function updatePlayer() {
  if (state.keys.ArrowLeft || state.keys.a) player.x -= player.speed;
  if (state.keys.ArrowRight || state.keys.d) player.x += player.speed;
  if (state.keys.ArrowUp || state.keys.w) player.y -= player.speed;
  if (state.keys.ArrowDown || state.keys.s) player.y += player.speed;

  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
}

function spawnMeteor() {
  const radius = 12 + Math.random() * 18;
  const x = radius + Math.random() * (canvas.width - radius * 2);
  const y = -radius;
  const speed = 2 + Math.random() * 3.5;
  const drift = -0.7 + Math.random() * 1.4;

  state.meteors.push({ x, y, radius, speed, drift });
}

function spawnStar() {
  const radius = 10 + Math.random() * 6;
  const x = radius + Math.random() * (canvas.width - radius * 2);
  const y = -radius;
  const speed = 1.8 + Math.random() * 2.2;
  const drift = -0.8 + Math.random() * 1.6;

  state.stars.push({ x, y, radius, speed, drift });
}

function createBurst(x, y, color) {
  const count = 12;
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4,
      radius: 2 + Math.random() * 3,
      color,
      life: 30 + Math.random() * 25
    });
  }
}

function handleCollisions() {
  for (let i = state.meteors.length - 1; i >= 0; i -= 1) {
    const meteor = state.meteors[i];
    const distance = Math.hypot(meteor.x - player.x, meteor.y - player.y);

    if (distance < meteor.radius + player.radius) {
      createBurst(player.x, player.y, '#f87171');
      endGame();
      return;
    }
  }

  for (let i = state.stars.length - 1; i >= 0; i -= 1) {
    const star = state.stars[i];
    const distance = Math.hypot(star.x - player.x, star.y - player.y);

    if (distance < star.radius + player.radius) {
      state.score += 10;
      scoreEl.textContent = String(state.score);
      createBurst(star.x, star.y, '#facc15');
      state.stars.splice(i, 1);
    }
  }
}

function updateEntities(delta) {
  state.spawnTimer += delta;
  state.starTimer += delta;

  if (state.spawnTimer > 700) {
    spawnMeteor();
    state.spawnTimer = 0;
  }

  if (state.starTimer > 1800) {
    spawnStar();
    state.starTimer = 0;
  }

  for (let i = state.meteors.length - 1; i >= 0; i -= 1) {
    const meteor = state.meteors[i];
    meteor.y += meteor.speed * delta * 0.06;
    meteor.x += meteor.drift * delta * 0.06;

    if (meteor.y - meteor.radius > canvas.height) {
      state.meteors.splice(i, 1);
    }
  }

  for (let i = state.stars.length - 1; i >= 0; i -= 1) {
    const star = state.stars[i];
    star.y += star.speed * delta * 0.06;
    star.x += star.drift * delta * 0.06;

    if (star.y - star.radius > canvas.height) {
      state.stars.splice(i, 1);
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const particle = state.particles[i];
    particle.x += particle.dx * (delta * 0.06);
    particle.y += particle.dy * (delta * 0.06);
    particle.life -= delta * 0.06;

    if (particle.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.radius - 8);
  ctx.lineTo(player.x - 6, player.y - player.radius + 6);
  ctx.lineTo(player.x + 6, player.y - player.radius + 6);
  ctx.closePath();
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
}

function drawMeteor(meteor) {
  ctx.beginPath();
  ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fca5a5';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(meteor.x - meteor.radius * 0.3, meteor.y - meteor.radius * 0.2, meteor.radius * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#fdd6d6';
  ctx.fill();
}

function drawStar(star) {
  const spikes = 5;
  const outerRadius = star.radius;
  const innerRadius = star.radius * 0.45;

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i += 1) {
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = star.x + Math.cos(angle) * radius;
    const y = star.y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#facc15';
  ctx.fill();
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = Math.max(0, particle.life / 55);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawBackground() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 40; i += 1) {
    const x = (i * 137) % canvas.width;
    const y = (i * 79) % canvas.height;
    ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#7dd3fc';
    ctx.fillRect(x, y, 2, 2);
  }
}

function draw() {
  drawBackground();

  for (const meteor of state.meteors) drawMeteor(meteor);
  for (const star of state.stars) drawStar(star);
  drawParticles();
  drawPlayer();
}

function gameLoop(timestamp) {
  if (!state.running) return;

  if (!state.lastTime) state.lastTime = timestamp;
  const delta = timestamp - state.lastTime;
  state.lastTime = timestamp;

  updatePlayer();
  updateEntities(delta);
  handleCollisions();
  draw();

  if (state.running) {
    state.animationId = requestAnimationFrame(gameLoop);
  }
}

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  state.keys[key] = true;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  state.keys[key] = false;
});

startBtn.addEventListener('click', startGame);

statusEl.textContent = 'Ready';
statusEl.style.color = '#7dd3fc';
draw();
