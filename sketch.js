// git add . - git commit -m "algo" - git push

// Constantes base

const FUERZA_MAG = 2; const TAM_CELDA = 50; const NUM_PARTICULAS = 400; const ANGULO_RUIDO_MAG = 50; const PASO_TIEMPO_RUIDO = 0.01;

let PASO_RUIDO_X = 0.1; let PASO_RUIDO_Y = 0.1;

let VELOCIDAD_MAX = 2;
const PASO_VEL = 0.5, VEL_MIN = 0.2, VEL_MAX = 20;

let rain;
let particulas = [];
let enPausa = false; 
let usarCurl = false; 
let trailOn = true;        // 'B' alterna
let mouseInfluence = true; // 'M' alterna
let noiseSeedOffset = 0;   // Desplazamiento del campo de ruido
let NOISE_ZOOM = 0.008;    // rueda del mouse
let theme = 1;             // 1 Neon, 2 Fuego, 3 Hielo, 4 Arcoiris

let kaleidoOn = false;      // 'K' para activar/desactivar
let KALEIDO_SPOKES = 6;     // cantidad de brazos
let KALEIDO_MIRROR = true;  // simetría espejo opcional

let KALEIDO_STEPS   = 64;    
let GLOW_SCALE      = 1.8;   
let GLOW_ALPHA      = 0.045; 
let HARD_CAP        = true;  


function setup() {
  createCanvas(windowWidth, windowHeight);
  
  colorMode(HSB, 1); //Cambia el modo de color a HSB (tono, saturación, brillo)
  strokeCap(ROUND); // extremos de las líneas redondos
  strokeWeight(1);
  blendMode(ADD); // los colores se pueden unir generando brillo
  soundFormats('mp3', 'ogg'); // para no usar preLoad q tarda en cargar
  loadSound('rain.mp3', (s) => {
    rain = s;
    rain.loop();
  });
  iniciar();
}

function draw() {

   if (enPausa) {
    dibujarHUD();
    return;
  }

  // Rastro de las viboras
  if (trailOn) {
    push();
    blendMode(BLEND);
    noStroke();
    fill(0, 0, 0, 0.09); // se controla el color y la opacidad
    rect(0, 0, width, height);
    pop();
  } else {
  //Sin rastro
    push();
    blendMode(BLEND);
    background(0);
    pop();
  }

  if (!enPausa) { // movimiento está activo.
    for (let i = 0; i < particulas.length; i++) {
      const p = particulas[i];
      p.aplicarFuerza(); // curl 
      p.actualizar();
      p.mostrar();
      if (p.fueraDeCanvas() || p.vida <= 0) 
        p.iniciar(); // si la particula sale del lienzo o si su tiempo de vida en la pantalla se agota
    }
  }

  if (keyIsDown(88)) { // Apretando la letra x hay repulsión
  for (let p of particulas) {
    const dir = p5.Vector.sub(p.pos, createVector(mouseX, mouseY)); // creas un vector q apunta va desde la posiicon del mouse hasta la posicion de las particulas
    dir.normalize().mult(2); // La fuerza aplicada de la repulsion
    p.vel.add(dir); // velocidad de las particulas x dir
  }
}

if (keyIsDown(90)) { // Apretando la letra z hay union
  for (let p of particulas) {
    const dir = p5.Vector.sub(createVector(mouseX, mouseY), p.pos); // lo contrario
    dir.normalize().mult(1.2);
    p.vel.add(dir); // 
  }
}

  dibujarHUD(); // HUD
}

function iniciar() { //Genera todas las partículas
  background(0);
  particulas = [];
  for (let i = 0; i < NUM_PARTICULAS; i++) {
    particulas.push(new Particula());
  }
}

function fuerza(pos) { // calcula el movimiento
  if (!usarCurl) { // Movimiento Snake
    const nx = (pos.x * NOISE_ZOOM) + noiseSeedOffset;
    const ny = (pos.y * NOISE_ZOOM) + noiseSeedOffset;
    const nz = frameCount * PASO_TIEMPO_RUIDO;
    const n = noise(nx, ny, nz);
    const angulo = n * ANGULO_RUIDO_MAG;
    return p5.Vector.fromAngle(angulo).setMag(FUERZA_MAG); // se crea un vector apartir del angulo del ruido perlin con magnitud fija
  } else {
    // Movimiento Curl: funcion matematica , lo que hace es crear calcula diferencia n ( ruido Perlin ) y aparti de la direccion dx , dy crea un vector siendo -dx lo que le permite lograr el movimiento curl
    const e = 0.0005; 
    const nx = (pos.x * NOISE_ZOOM) + noiseSeedOffset;
    const ny = (pos.y * NOISE_ZOOM) + noiseSeedOffset;
    const nz = frameCount * PASO_TIEMPO_RUIDO;

    const n1 = noise(nx, ny + e, nz);
    const n2 = noise(nx, ny - e, nz);
    const n3 = noise(nx + e, ny, nz);
    const n4 = noise(nx - e, ny, nz);

    const dx = (n1 - n2) / (2 * e);
    const dy = (n3 - n4) / (2 * e);

    const curl = createVector(dy, -dx).setMag(FUERZA_MAG);
    return curl;
  }
}

// funcion de atracción o repulsión : Con funcion matematica 
/*Calcula un vector desde la partícula hacia el mouse (dir).
Mide la distancia d y normaliza la dirección.
Si hacés click izquierdo, la fuerza es positiva (atracción).
Si hacés click derecho, es negativa (repulsión).
La fuerza se hace más intensa cuanto más cerca está la partícula del puntero. */ 

function fuerzaMouse(pos) {
  if (!mouseInfluence) return createVector(0, 0);
  const dir = createVector(mouseX - pos.x, mouseY - pos.y); // vector de dirección desde la partícula hacia el mouse.
  const d = max(1, dir.mag()); // distancia entre ambos puntos.
  dir.normalize();
  let mag = 0;

  if (mouseIsPressed && mouseButton === LEFT) {
    // Atrae
    mag = 3.0 * (1 / (d * 0.02));
  } else if (mouseIsPressed && mouseButton === RIGHT) {
    // Repele
    mag = -3.0 * (1 / (d * 0.02));
  } else {
    return createVector(0, 0);
  }
  return dir.mult(constrain(mag, -5, 5));
}

class Particula {
  constructor() { this.iniciar(); }

  iniciar() {

    if (mouseIsPressed) { // si el mouse está presionado, la particula aparece cerca del puntero en un rango entre -30 y 30
      this.pos = createVector(
        constrain(mouseX + random(-30, 30), 0, width), // constrain evita q el vector se salga del lienzo
        constrain(mouseY + random(-30, 30), 0, height)
      );
    } else { // si no esta presionado la particula nace en una pos aleatoria
      this.pos = createVector(random(width), random(height));
    }

    this.posAnterior = this.pos.copy(); // se guarda la pos anterior
    this.vel = createVector(0, 0); // inicializacion en 0
    this.acc = createVector(0, 0);

    this.vidaMax = int(random(600, 1600)); // vida max de cada particula en frames
    this.vida = this.vidaMax;
  }

  aplicarFuerza() {
    const fCampo = fuerza(this.pos); //la fuerza del mouse del mov curl o ondeante
    const fMouse = fuerzaMouse(this.pos); // la fuerza del mouse, que puede atraer o repeler según el click.
    this.acc.add(fCampo).add(fMouse); // Sumas ambas fuerzas (fisica)
  }

  actualizar() {
    this.posAnterior = this.pos.copy(); // actualiza pos anterior
    this.vel.add(this.acc); //actualiza velocidad
    this.vel.limit(VELOCIDAD_MAX); //Limita la velocidad máxima
    this.pos.add(this.vel); //Actualiza la posicion
    this.acc.mult(0); // Resetea la aceleracion cada frame
    this.vida--; // resta la vida
  }

  mostrar() { // dibuja la particula 
    const spd = this.vel.mag(); // magnitud del vector velocidad
    const sw = map(spd, 0, VELOCIDAD_MAX, 0.6, 2.6); // convierte ese valor en un grosor de una linea , velocidad baja 0.6 spd chico , velocidad alta 2.6 spd grande
    const col = colorSegunTema(this.vel); // elegir el color segun el tema  usando la velocidad porque la vel usa direccion y magnitud

    //dibujo del glow
    stroke(col.levels[0] / 255, col.levels[1] / 255, col.levels[2] / 255, 0.06);
    strokeWeight(sw * 2.2);
    line(this.posAnterior.x, this.posAnterior.y, this.pos.x, this.pos.y);

    //misma linea superpuesta
    stroke(col);
    strokeWeight(sw);
    line(this.posAnterior.x, this.posAnterior.y, this.pos.x, this.pos.y);

    //llama a la funcion del kaleidoscopio
  drawSegmentKaleido(
    this.posAnterior.x, this.posAnterior.y,
    this.pos.x, this.pos.y,
    sw, col
  );
}

  // si la particula se salio del lienzo devuelve true y se llama a la funcion iniciar generando nuevas particulas
  fueraDeCanvas() {
    return (this.pos.x < -5 || this.pos.x > width + 5 || this.pos.y < -5 || this.pos.y > height + 5);
  }
}

// Color / Temas

function colorSegunTema(vel) {
  const h = map(vel.heading(), -PI, PI, 0, 1); 
  let c;
  switch (theme) {
    case 1: // Neón
      c = color((h + 0.65) % 1, 1, 1, 0.6);
      break;
    case 2: // Fuego
      const s2 = constrain(map(vel.mag(), 0, VELOCIDAD_MAX, 0.4, 1), 0, 1);
      c = color(0.05 + 0.08 * h, s2, 1, 0.6);
      break;
    case 3: // Hielo
      c = color(0.55 + 0.1 * h, 0.4 + 0.6 * (1 - h), 1, 0.6);
      break;
    case 4: 
      c = color(0.78, 1, 1, 0.8); 
      break;
    case 5: 
      c = color(0.0, 1, 1, 0.8); 
      break;
    default:
      c = color(h, 1, 1, 0.6);
  }
  return c;
}

// Teclas presionadas

function keyPressed() {
  if (key === 'p' || key === 'P') enPausa = !enPausa;
  else if (key === 'b' || key === 'B') trailOn = !trailOn;
  else if (key === 'm' || key === 'M') mouseInfluence = !mouseInfluence;
  else if (key === 's' || key === 'S') saveCanvas('flowfield', 'png');
  else if (key === 'f' || key === 'F') usarCurl = !usarCurl;

  // velocidad: + y -
  else if (key === '+' || keyCode === 187 || keyCode === 107) {
    VELOCIDAD_MAX = Math.min(VEL_MAX, VELOCIDAD_MAX + PASO_VEL);
  } else if (key === '-' || keyCode === 189 || keyCode === 109) {
    VELOCIDAD_MAX = Math.max(VEL_MIN, VELOCIDAD_MAX - PASO_VEL);
  }

  
  else if (key === '1') theme = 1;
  else if (key === '2') theme = 2;
  else if (key === '3') theme = 3;
  else if (key === '4') theme = 4;
  else if (key === '5') theme = 5;

  if (key === 'x' || key === 'X') {
    for (let p of particulas) {
      let dir = p5.Vector.sub(p.pos, createVector(mouseX, mouseY));
      dir.normalize().mult(random(5, 10));
      p.vel.add(dir);
    }
  }

  else if (key === 'k' || key === 'K') kaleidoOn = !kaleidoOn;
}

function mouseWheel(e) {
  NOISE_ZOOM *= (e.delta > 0 ? 1.08 : 0.92);
  NOISE_ZOOM = constrain(NOISE_ZOOM, 0.002, 0.05);
  return false;
}


function dibujarHUD() {
  const hud = [
    `P: ${enPausa ? 'Reanudar' : 'Pausar'}`,
    `B: Recorrido ${trailOn ? 'ON' : 'OFF'}`,
    `M: Mouse ${mouseInfluence ? 'ON' : 'OFF'}`,
    `F: Mov ${usarCurl ? 'Curl' : 'Snake'}`,
    `1-5 Tema=${theme}`,
    `Vel(+/-): ${VELOCIDAD_MAX.toFixed(1)}`,
    `Zoom ruido (wheel): ${NOISE_ZOOM.toFixed(4)}`,
    `X: Repulsion`,
    `Z: Atraccion`,
    `K: Caleidoscopio ${kaleidoOn ? 'ON' : 'OFF'}`,
  ].join('   ');

  push();
  blendMode(BLEND);
  noStroke();
  fill(0, 0, 0, 0.45);
  rect(8, 8, textWidth(hud) + 24, 28, 6);
  fill(0, 0, 1);
  textSize(12);
  text(hud, 20, 26);
  pop();
}

function drawGlowLine(x1, y1, x2, y2, sw, col) {
  if (HARD_CAP) strokeCap(SQUARE); // si HARD_CAP esta activo cambia el trazado a cuadrado

  // Línea difusa (glow)
  stroke(col.levels[0]/255, col.levels[1]/255, col.levels[2]/255, GLOW_ALPHA);
  strokeWeight(sw * GLOW_SCALE);
  line(x1, y1, x2, y2);

  // Línea nítida del glow
  stroke(col);
  strokeWeight(sw);
  line(x1, y1, x2, y2);

  //Restaurar la forma redondeada
  if (HARD_CAP) strokeCap(ROUND);
}

function drawSegmentKaleido(x1, y1, x2, y2, sw, col) { //  x1, y1, x2, y2 = linea original , sw = grosor del trazo , col = color
  
  if (!kaleidoOn) {
    drawGlowLine(x1, y1, x2, y2, sw, col);
    return;
  }

  const cx = width * 0.5, cy = height * 0.5;
  let A = atan2(y1 - cy, x1 - cx);
  let B = atan2(y2 - cy, x2 - cx);
  const r1 = dist(x1, y1, cx, cy);
  const r2 = dist(x2, y2, cx, cy);

  
  const wedge = TWO_PI / KALEIDO_SPOKES;
  const half  = wedge * 0.5;

 
  const normToWedge = (ang) => {
    let t = (ang % wedge + wedge) % wedge;
    if (KALEIDO_MIRROR && t > half) t = wedge - t; 
    
    const step = wedge / KALEIDO_STEPS;
    t = Math.round(t / step) * step;
    
    const EPS = 1e-4;
    if (t === 0) t += EPS;
    if (KALEIDO_MIRROR && Math.abs(t - half) < EPS) t -= EPS;
    return t;
  };

  const aLocal = normToWedge(A);
  const bLocal = normToWedge(B);

  
  const glowColA = color(col.levels[0]/255, col.levels[1]/255, col.levels[2]/255, GLOW_ALPHA);
  const baseCol  = col;

  push();
  translate(cx, cy);
  if (HARD_CAP) strokeCap(SQUARE);

  for (let i = 0; i < KALEIDO_SPOKES; i++) {
    const rot = wedge * i;

    
    let x1a = r1 * cos(aLocal + rot), y1a = r1 * sin(aLocal + rot);
    let x2a = r2 * cos(bLocal + rot), y2a = r2 * sin(bLocal + rot);

    
    drawGlowLine(x1a, y1a, x2a, y2a, sw, col); 

    if (KALEIDO_MIRROR) {
      drawGlowLine(x1a, -y1a, x2a, -y2a, sw, col);
    }
  }

  if (HARD_CAP) strokeCap(ROUND);
  pop();
}

// Resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
