let tempSlider;
let stir = false;
let stirX = 250, stirY = 200;
let particles = [];
let stirSpeed = 0;

let waterLevel = 0;
let hasWater = false;
let soluteType = "none";
let addWaterBtn, soluteMenu, speedBtn, resetBtn;

let timeFactor = 1; // 时间加速因子
let tankX = 100, tankY = 100, tankW = 400, tankH = 200; // 加宽后的玻璃槽尺寸

let soluteColors = {
  salt: [255, 255, 255],
  sugar: [255, 230, 200],
  alum: [220, 255, 220]
};

function setup() {
  createCanvas(700, 450);

  // 设定随机种子，保证跨浏览器一致性
  randomSeed(12345);

  tempSlider = createSlider(0, 100, 25);
  tempSlider.position(550, 50);
  tempSlider.style('width', '60px');
  tempSlider.style('transform', 'scale(2)');
  tempSlider.style('transform-origin', 'left center');

  addWaterBtn = createButton('放水');
  addWaterBtn.position(100, 10);
  styleButton(addWaterBtn);
  addWaterBtn.mousePressed(() => {
    hasWater = true;
    waterLevel = min(waterLevel + 20, tankH);
  });

  soluteMenu = createSelect();
  soluteMenu.position(550, 100);
  soluteMenu.option('选择溶质', 'none');
  soluteMenu.option('食盐', 'salt');
  soluteMenu.option('糖', 'sugar');
  soluteMenu.option('明矾', 'alum');
  soluteMenu.changed(() => {
    soluteType = soluteMenu.value();
    if (soluteType !== 'none' && waterLevel > 0) {
      generateParticles();
    }
  });
  soluteMenu.style('font-size', '20px');
  soluteMenu.style('padding', '10px');

  speedBtn = createButton('加速');
  speedBtn.position(550, 150);
  styleButton(speedBtn);
  speedBtn.mousePressed(() => {
    if (timeFactor === 1) {
      timeFactor = 3;
      speedBtn.html('恢复速度');
    } else {
      timeFactor = 1;
      speedBtn.html('加速');
    }
  });

  resetBtn = createButton('恢复初始');
  resetBtn.position(550, 200);
  styleButton(resetBtn);
  resetBtn.mousePressed(resetSimulation);
}

function draw() {
  background(220);

  drawGlassTank();
  drawWaterPipe();
  drawStirRod();
  drawTempControl();
  drawMenuLabels();
  
  if (hasWater && waterLevel > 0) {
    fill(150, 200, 255, 100);
    noStroke();
    let yTop = tankY + tankH - waterLevel;
    rect(tankX, yTop, tankW, waterLevel);
  }

  updateParticles();
}

function styleButton(btn) {
  btn.style('font-size', '20px');
  btn.style('padding', '10px 20px');
}

function resetSimulation() {
  tempSlider.value(25);
  stirX = 250;
  stirY = 200;
  waterLevel = 0;
  hasWater = false;
  soluteType = 'none';
  soluteMenu.value('none');
  particles = [];
  timeFactor = 1;
  speedBtn.html('加速');
}

function drawGlassTank() {
  stroke(0);
  noFill();
  rect(tankX, tankY, tankW, tankH);

  for (let i = 0; i <= 10; i++) {
    let y = map(i, 0, 10, tankY, tankY + tankH);
    line(tankX - 5, y, tankX, y);
    noStroke();
    fill(0);
    textSize(10);
    text((10 - i) * 10, tankX - 25, y + 3);
    stroke(0);
  }
}

function drawWaterPipe() {
  stroke(180);
  fill(255); // 白色塑料管
  rect(tankX - 30, tankY - 40, 30, 20, 3);
  rect(tankX - 10, tankY - 40, 10, 40, 3);
  fill(200);
  ellipse(tankX - 5, tankY, 12, 12);
}

function drawStirRod() {
  let grad = drawingContext.createLinearGradient(stirX - 4, stirY - 40, stirX + 4, stirY + 40);
  grad.addColorStop(0, 'rgba(255,255,255,0.7)');
  grad.addColorStop(0.5, 'rgba(180,220,255,0.4)');
  grad.addColorStop(1, 'rgba(255,255,255,0.7)');
  drawingContext.fillStyle = grad;
  noStroke();
  rectMode(CENTER);
  rect(stirX, stirY, 8, 80, 5);
  rectMode(CORNER);
}

function drawTempControl() {
  fill(0);
  textSize(12);
  text("温度: " + tempSlider.value() + "°C", 550, 40);
}

function drawMenuLabels() {
  fill(0);
  text("溶质选择：", 550, 90);
}

function generateParticles() {
  particles = [];
  let col = soluteColors[soluteType];
  let bottomY = tankY + tankH;
  let centerX = tankX + tankW / 2;
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: random(centerX - 40, centerX + 40),
      y: random(bottomY - 20, bottomY - 5),
      vx: random(-0.3, 0.3),
      vy: random(-0.3, 0.3),
      col: col
    });
  }
}

function updateParticles() {
  if (waterLevel <= 0 || soluteType === 'none') return;

  let tempFactor = map(tempSlider.value(), 0, 100, 0.3, 2);
  let inWater = stirX > tankX && stirX < (tankX + tankW) && stirY > (tankY + tankH - waterLevel) && stirY < (tankY + tankH);
  let stirFactor = inWater ? (stirSpeed * 0.1 + 1) : 1;
  let baseSpeed = 0.5; // 默认速度减半

  // 粒子移动 + 边界修正
  for (let p of particles) {
    p.x += p.vx * tempFactor * stirFactor * timeFactor * baseSpeed;
    p.y += p.vy * tempFactor * stirFactor * timeFactor * baseSpeed;

    // 左右边界
    if (p.x < tankX) {
      p.x = tankX;
      p.vx *= -1;
    }
    if (p.x > tankX + tankW) {
      p.x = tankX + tankW;
      p.vx *= -1;
    }

    // 上下边界（水面到槽底）
    let waterTop = tankY + tankH - waterLevel;
    let waterBottom = tankY + tankH;
    if (p.y < waterTop) {
      p.y = waterTop;
      p.vy *= -1;
    }
    if (p.y > waterBottom) {
      p.y = waterBottom;
      p.vy *= -1;
    }
  }

  // 粒子间碰撞（简单反弹）
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let p1 = particles[i];
      let p2 = particles[j];
      let dx = p1.x - p2.x;
      let dy = p1.y - p2.y;
      let distSq = dx * dx + dy * dy;
      let minDist = 5;
      if (distSq < minDist * minDist) {
        let tmpVx = p1.vx;
        let tmpVy = p1.vy;
        p1.vx = p2.vx;
        p1.vy = p2.vy;
        p2.vx = tmpVx;
        p2.vy = tmpVy;
      }
    }
  }

  noStroke();
  for (let p of particles) {
    fill(p.col[0], p.col[1], p.col[2]);
    ellipse(p.x, p.y, 5, 5);
  }
  stirSpeed *= 0.95;
}

function mousePressed() {
  if (dist(mouseX, mouseY, stirX, stirY) < 40) {
    stir = true;
  }
}

function mouseDragged() {
  if (stir) {
    stirX = constrain(mouseX, 0, width);
    stirY = constrain(mouseY, 0, height);
    stirSpeed = abs(movedX) + abs(movedY);
  }
}

function mouseReleased() {
  stir = false;
}
