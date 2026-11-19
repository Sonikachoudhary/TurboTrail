const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreNode = document.querySelector('#score');
const bestNode = document.querySelector('#best');
const overlay = document.querySelector('#overlay');
const titleNode = document.querySelector('#overlay-title');
const copyNode = document.querySelector('#overlay-copy');
const tagNode = document.querySelector('#overlay-tag');
const statusNode = document.querySelector('#status');
const lanes = [132, 240, 348];
const player = { lane: 1, y: 520, color: '#68e8d0' };
let traffic = [];
let running = false;
let elapsed = 0;
let score = 0;
let roadOffset = 0;
let spawnClock = 0;
let lastTime = 0;
let best = loadBest();
let animationId = 0;

bestNode.textContent = String(best).padStart(4, '0');

function loadBest() {
  try { return Number(localStorage.getItem('neon-lane-best') || 0); } catch { return 0; }
}

function roundedRect(x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawCar(centerX, y, color, playerCar = false) {
  const w = playerCar ? 54 : 50;
  const h = playerCar ? 88 : 82;
  const x = centerX - w / 2;
  // tires
  roundedRect(x - 4, y + 15, 7, 20, 3, '#0a1015');
  roundedRect(x + w - 3, y + 15, 7, 20, 3, '#0a1015');
  roundedRect(x - 4, y + h - 34, 7, 20, 3, '#0a1015');
  roundedRect(x + w - 3, y + h - 34, 7, 20, 3, '#0a1015');
  // body
  roundedRect(x, y, w, h, 12, color);
  roundedRect(x + 8, y + 12, w - 16, 24, 7, playerCar ? '#173641' : '#36232b');
  roundedRect(x + 9, y + h - 28, w - 18, 15, 5, playerCar ? '#b9fff0' : '#ffc0a1');
  // lights
  roundedRect(x + 4, y + 5, 11, 4, 2, playerCar ? '#d6fff7' : '#ffe2a9');
  roundedRect(x + w - 15, y + 5, 11, 4, 2, playerCar ? '#d6fff7' : '#ffe2a9');
  if (playerCar) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.shadowBlur = 0;
  }
}

function drawRoad(dt = 0) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#111b26');
  grad.addColorStop(1, '#080d13');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 640);

  // distant city lights
  for (let i = 0; i < 16; i++) {
    const x = i * 31 + 4;
    const height = 40 + ((i * 47) % 94);
    ctx.fillStyle = i % 2 ? '#101a23' : '#121e28';
    ctx.fillRect(x, 0, 22, height);
    ctx.fillStyle = i % 3 ? '#ffbd6940' : '#68e8d044';
    for (let wy = 12; wy < height - 8; wy += 19) ctx.fillRect(x + 6, wy, 3, 4);
  }

  // road surface
  ctx.fillStyle = '#161e25';
  ctx.fillRect(48, 0, 384, 640);
  ctx.fillStyle = '#d8e7e521';
  ctx.fillRect(48, 0, 3, 640);
  ctx.fillRect(429, 0, 3, 640);
  ctx.fillStyle = '#68e8d011';
  ctx.fillRect(52, 0, 3, 640);
  ctx.fillRect(425, 0, 3, 640);

  roadOffset = (roadOffset + dt * (running ? 230 + elapsed * 11 : 90)) % 96;
  ctx.fillStyle = '#b6c3c633';
  for (const x of [186, 294]) {
    for (let y = -96 + roadOffset; y < 640; y += 96) {
      roundedRect(x - 2, y, 4, 47, 2, '#c9d5d533');
    }
  }

  // roadside lamps
  for (let y = -60 + roadOffset * .7; y < 640; y += 150) {
    ctx.fillStyle = '#68e8d055';
    ctx.fillRect(25, y, 2, 24);
    ctx.fillRect(453, y + 55, 2, 24);
    ctx.fillStyle = '#68e8d0';
    ctx.fillRect(23, y - 2, 6, 3);
    ctx.fillRect(451, y + 53, 6, 3);
  }
}

function draw() {
  drawRoad(0);
  traffic.forEach(car => drawCar(lanes[car.lane], car.y, car.color));
  drawCar(lanes[player.lane], player.y, player.color, true);
}

function move(direction) {
  if (!running) return;
  player.lane = Math.max(0, Math.min(2, player.lane + direction));
}

function startGame() {
  cancelAnimationFrame(animationId);
  traffic = [];
  elapsed = 0;
  score = 0;
  spawnClock = 0;
  player.lane = 1;
  running = true;
  lastTime = performance.now();
  scoreNode.textContent = '0000';
  overlay.classList.add('hidden');
  statusNode.textContent = 'DRIVE';
  draw();
  animationId = requestAnimationFrame(frame);
}

function endGame() {
  running = false;
  if (score > best) {
    best = score;
    try { localStorage.setItem('neon-lane-best', String(best)); } catch {}
    bestNode.textContent = String(best).padStart(4, '0');
  }
  tagNode.textContent = 'RUN OVER';
  titleNode.innerHTML = `CRASHED<br>OUT`;
  copyNode.innerHTML = `Score: <b>${String(score).padStart(4, '0')}</b><br>Tap below and try again.`;
  document.querySelector('#start').innerHTML = 'TRY AGAIN <span>↗</span>';
  statusNode.textContent = 'CRASH';
  overlay.classList.remove('hidden');
}

function frame(now) {
  if (!running) return;
  const dt = Math.min((now - lastTime) / 1000, 0.04);
  lastTime = now;
  elapsed += dt;
  score = Math.floor(elapsed * 10);
  roadOffset = (roadOffset + dt * (230 + elapsed * 11)) % 96;
  scoreNode.textContent = String(score).padStart(4, '0');

  const speed = 260 + Math.min(elapsed * 13, 300);
  spawnClock += dt;
  const spawnEvery = Math.max(0.48, 1.12 - elapsed * 0.008);
  if (spawnClock >= spawnEvery) {
    spawnClock = 0;
    const lane = Math.floor(Math.random() * 3);
    const colors = ['#ff7188', '#ffbd69', '#aa91ff'];
    traffic.push({ lane, y: -100, color: colors[Math.floor(Math.random() * colors.length)] });
  }

  traffic.forEach(car => { car.y += speed * dt; });
  traffic = traffic.filter(car => car.y < 680);

  for (const car of traffic) {
    if (car.lane === player.lane && car.y + 72 > player.y + 10 && car.y < player.y + 78) {
      draw();
      endGame();
      return;
    }
  }

  draw();
  animationId = requestAnimationFrame(frame);
}

document.querySelector('#start').addEventListener('click', startGame);
document.querySelector('#left').addEventListener('click', () => move(-1));
document.querySelector('#right').addEventListener('click', () => move(1));
document.addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D', ' '].includes(event.key)) event.preventDefault();
  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') move(-1);
  if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') move(1);
  if (event.key === ' ' && !running) startGame();
});

draw();

