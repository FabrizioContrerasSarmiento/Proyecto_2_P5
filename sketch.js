//git add . - git commit -m "algo" - git push


const FUERZA_MAG = 2;
const TAM_CELDA = 50;
const NUM_PARTICULAS = 200;
const PASO_RUIDO_X = 0.1;
const PASO_RUIDO_Y = 0.1;
const PASO_TIEMPO_RUIDO = 0.01;
const VELOCIDAD_MAX = 2;

let particulas = [];


function setup() {
  createCanvas(windowWidth, windowHeight);
  blendMode(ADD);
  colorMode(HSB, 1);
  strokeCap(SQUARE);
  strokeWeight(1);
  iniciar();
}

function draw() {
  for (let i = 0; i < particulas.length; i++) {
    const p = particulas[i];
    p.aplicarFuerza();
    p.actualizar();
    p.mostrar();
    if (p.fueraDeCanvas()) p.iniciar();
  }
}

function iniciar() {
  background(0);
  particulas = [];
  for (let i = 0; i < NUM_PARTICULAS; i++) {
    particulas.push(new Particula());
  }
}

function fuerza(pos) {
  const gx = floor(pos.x / TAM_CELDA);
  const gy = floor(pos.y / TAM_CELDA);

  const ang = noise(gx * PASO_RUIDO_X, gy * PASO_RUIDO_Y, frameCount * PASO_TIEMPO_RUIDO) * TWO_PI;

  return p5.Vector.fromAngle(ang).setMag(FUERZA_MAG);
}

class Particula {
  constructor() { this.iniciar(); }

  iniciar() {
    this.pos = createVector(random(width), random(height));
    this.posAnterior = this.pos.copy();
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
  }

  aplicarFuerza() {
    this.acc.add(fuerza(this.pos));
  }

  actualizar() {
    this.posAnterior.set(this.pos);
    this.vel.add(this.acc);
    this.vel.limit(VELOCIDAD_MAX);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  mostrar() {
    const tono = map(this.vel.heading(), -PI, PI, 0, 1);
    const c = color(tono, 1, 1, 0.12);
    stroke(c);
    line(this.posAnterior.x, this.posAnterior.y, this.pos.x, this.pos.y);
  }

  fueraDeCanvas() {
    return (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height);
  }
}

function keyPressed() {
  if (key === 'c' || key === 'C') {
    background(0);
    for (const p of particulas) p.posAnterior.set(p.pos);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  iniciar();
}
