const canvas = document.getElementById('playground');
const ctx = canvas.getContext('2d');

// Fun floating "3D" balls with mouse interaction, inspired by Bruno Simon's playful vibe
let balls = [];
for (let i = 0; i < 7; i++) {
  balls.push({
    x: 80 + Math.random() * 400,
    y: 70 + Math.random() * 200,
    r: 30 + Math.random() * 22,
    vx: 1 + Math.random() * 2,
    vy: 1 + Math.random() * 2,
    color: `hsl(${Math.random() * 360},72%,60%)`
  });
}
let mouse = { x: 0, y: 0, down: false };

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * canvas.width / rect.width;
  mouse.y = (e.clientY - rect.top) * canvas.height / rect.height;
});
canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let ball of balls) {
    // Move balls
    ball.x += ball.vx * (ball.r/32);
    ball.y += ball.vy * (ball.r/32);

    // Bounce off walls
    if (ball.x < ball.r || ball.x > canvas.width - ball.r) ball.vx *= -1;
    if (ball.y < ball.r || ball.y > canvas.height - ball.r) ball.vy *= -1;

    // Mouse interaction
    let dx = ball.x - mouse.x, dy = ball.y - mouse.y;
    let dist = Math.sqrt(dx*dx+dy*dy);
    if (dist < ball.r + 28 && mouse.down) {
      ball.vx += dx * 0.06 * (Math.random()-0.2);
      ball.vy += dy * 0.06 * (Math.random()-0.2);
    }

    // Draw shadow
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + ball.r*0.65, ball.r*0.82, ball.r*0.32, 0, 0, Math.PI*2);
    ctx.fillStyle = "#22223b";
    ctx.fill();
    ctx.restore();

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowColor = "#4448";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();

    // 3D highlight
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(ball.x-ball.r*0.36, ball.y-ball.r*0.28, ball.r*0.5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }
  requestAnimationFrame(loop);
}
loop();