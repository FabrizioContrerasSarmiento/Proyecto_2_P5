//git add . - git commit -m "algo" - git push


const FUERZA_MAG = 2;         
const TAM_CELDA = 50;           
const NUM_PARTICULAS = 200;    
const ANGULO_RUIDO_MAG = 50;    
const PASO_RUIDO_X = 0.1;       
const PASO_RUIDO_Y = 0.1;       
const PASO_TIEMPO_RUIDO = 0.01; 
let VELOCIDAD_MAX = 2;        
const PASO_VEL = 0.5;         
const VEL_MIN = 0.2;          
const VEL_MAX = 20;           

let particulas; 
let enPausa = false;


function setup() {
  createCanvas(windowWidth, windowHeight);
  blendMode(ADD);
  colorMode(HSB, 1);
  strokeCap(SQUARE);
  strokeWeight(1);
  iniciar();
}


function draw() {
  if (!enPausa) {
    particulas.forEach(p => {
      p.aplicarFuerza();
      p.actualizar();
      p.mostrar();
      if (p.fueraDeCanvas()) p.iniciar();
    });
  }

push();
blendMode(BLEND);
noStroke();
fill(0, 0, enPausa ? 0.6 : 0.25);
rect(8, 8, 260, 36, 4); 
fill(0, 0, 1);
textSize(12);
text(`P: ${enPausa ? 'Reanudar' : 'Pausar'}   C: Limpiar   Vel(+/-): ${VELOCIDAD_MAX.toFixed(1)}`, 14, 30);
pop();
}


function iniciar() {
  background("#000000");
  particulas = [];
  for (let i = 0; i < NUM_PARTICULAS; i++) {
    particulas.push(new Particula());
  }
}


function fuerza(pos) {
  let x = floor(pos.x / TAM_CELDA);
  let y = floor(pos.y / TAM_CELDA);
  let angulo = noise(x * PASO_RUIDO_X, y * PASO_RUIDO_Y, frameCount * PASO_TIEMPO_RUIDO) * ANGULO_RUIDO_MAG;
  let f = p5.Vector.fromAngle(angulo).setMag(FUERZA_MAG);
  return f;
}


class Particula {
  constructor() { this.iniciar(); }

  iniciar() {
    this.pos = createVector(random(width), random(height));
    this.posAnterior = this.pos.copy();
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
  }

  mostrar() {
    stroke(this.colorLinea());
    line(this.posAnterior.x, this.posAnterior.y, this.pos.x, this.pos.y);
  }

  colorLinea() {
    let tono = map(this.vel.heading(), -PI, PI, 0, 1);
    let c = color(tono, 1, 1);
    c.setAlpha(0.1);
    return c;
  }

  actualizar() {
    this.posAnterior = this.pos.copy();
    this.vel.add(this.acc);
    this.vel.limit(VELOCIDAD_MAX);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  fueraDeCanvas() {
    return (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height);
  }

  aplicarFuerza() {
    this.acc.add(fuerza(this.pos));
  }
}


function keyPressed() {
  if (key === 'p' || key === 'P') {
    enPausa = !enPausa;
  } else if (key === 'c' || key === 'C') {
    limpiarLienzo();
  }
}

function keyPressed() {
  if (key === 'p' || key === 'P') {
    enPausa = !enPausa;
  } else if (key === 'c' || key === 'C') {
    limpiarLienzo();
  } 
  else if (key === '+' ) { 
    VELOCIDAD_MAX = Math.min(VEL_MAX, VELOCIDAD_MAX + PASO_VEL);
  } else if (key === '-') { 
    VELOCIDAD_MAX = Math.max(VEL_MIN, VELOCIDAD_MAX - PASO_VEL);
  }
}

function limpiarLienzo() {
  push();
  blendMode(BLEND);   
  background(0);      
  pop();
  for (const p of particulas) p.posAnterior.set(p.pos);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  iniciar();
}