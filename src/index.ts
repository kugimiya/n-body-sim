import { VerletWorld } from './VerletWorld';
import { VerletWorldDrawer } from './VerletWorldDrawer';

// init values
let worldSize = 512;
let objectsCount = 512;
let gridRatio = 6;
let baseMass = 25;
let massToRadiusRatio = 30;

// setup elements
const drawPane = document.getElementById('drawPane');

const resetSettingBtn = document.getElementById('reset-settings');
const stopSimBtn = document.getElementById('stop-sim');
const restartSimBtn = document.getElementById('restart-sim');
const pauseSimBtn = document.getElementById('pause-sim');
const unPauseSimBtn = document.getElementById('uspause-sim');

const worldSizeInput = document.getElementById('worldSize') as HTMLInputElement;
const objectsCountInput = document.getElementById('objectsCount') as HTMLInputElement;
const gridRatioInput = document.getElementById('gridRatio') as HTMLInputElement;
const baseMassInput = document.getElementById('baseMass') as HTMLInputElement;
const massToRadiusRatioInput = document.getElementById('massToRadiusRatio') as HTMLInputElement;

// reset settings func
const reset = () => {
  worldSize = 512;
  objectsCount = 512;
  gridRatio = 6;
  baseMass = 25;
  massToRadiusRatio = 30;

  worldSizeInput.value = worldSize.toString();
  objectsCountInput.value = objectsCount.toString();
  gridRatioInput.value = gridRatio.toString();
  baseMassInput.value = baseMass.toString();
  massToRadiusRatioInput.value = massToRadiusRatio.toString();
};
reset();

// setup dbg
const dbg = document.createElement('pre');
dbg.style.position = 'absolute';
dbg.style.zIndex = '1';
dbg.style.margin = '0';
drawPane.appendChild(dbg);

// setup scene
const canvas = document.createElement('canvas');
canvas.style.position = 'absolute';
canvas.width = 768;
canvas.height = 768;
canvas.style.border = '1px solid black';
drawPane.appendChild(canvas);

// setup simulator
let world = new VerletWorld(objectsCount, worldSize, gridRatio, baseMass, massToRadiusRatio);
let drawer = new VerletWorldDrawer(canvas.getContext('2d'), world);

// start loop
let shouldStop = false;
let shouldPauseSim = false;
let averageTime = 0;
const animate = () => {
  const time = Date.now();
  if (!shouldPauseSim) {
    world.update();
  }
  drawer.draw();
  const finalTime = Date.now() - time;
  averageTime = Math.round(1000 * ((averageTime + finalTime) / 2)) / 1000;
  const averageVelocity = world.objects.reduce((acc, cur) => (acc + cur.velocityLength) / 2, 0);

  dbg.textContent = [
    `Average frameTime: ${averageTime}ms`,
    `Current frameTime: ${finalTime}ms`,
    `Active chunks: ${world.grid.length}`,
    `Objects: ${world.objects.length}`,
    `Average velocity: ${Math.round(1000 * averageVelocity) / 1000}`
  ].join('\n');

  if (!shouldStop) {
    requestAnimationFrame(animate);
  }
}

// setup form
(document.getElementById('canvasW') as HTMLInputElement).addEventListener('change', (ev) => {
  canvas.width = (ev.target as unknown as { value: number }).value;
});

(document.getElementById('canvasH') as HTMLInputElement).addEventListener('change', (ev) => {
  canvas.height = (ev.target as unknown as { value: number }).value;
});

resetSettingBtn.addEventListener('click', () => {
  reset();
});

stopSimBtn.addEventListener('click', () => {
  shouldStop = true;
});

pauseSimBtn.addEventListener('click', () => {
  shouldPauseSim = true;
});

unPauseSimBtn.addEventListener('click', () => {
  shouldPauseSim = false;
});

restartSimBtn.addEventListener('click', () => {
  shouldStop = true;

  setTimeout(() => {
    worldSize = Number(worldSizeInput.value);
    objectsCount = Number(objectsCountInput.value);
    gridRatio = Number(gridRatioInput.value);
    baseMass = Number(baseMassInput.value);
    massToRadiusRatio = Number(massToRadiusRatioInput.value);

    world = new VerletWorld(objectsCount, worldSize, gridRatio, baseMass, massToRadiusRatio);
    drawer = new VerletWorldDrawer(canvas.getContext('2d'), world);
    shouldStop = false;
    averageTime = 0;
    animate();
  }, 1000);
});

// setup interactivity
let isMove = false;
canvas.addEventListener('mousedown', () => {
  isMove = true;
});
canvas.addEventListener('mouseup', () => {
  isMove = false;
});
canvas.addEventListener('mouseleave', () => {
  isMove = false;
});
canvas.addEventListener('mousemove', (ev) => {
  if (isMove) {
    drawer.offsetX += ev.movementX;
    drawer.offsetY += ev.movementY;
  }
});
canvas.addEventListener('wheel', (ev) => {
  // offsetX
  const factor = ev.deltaY > 0 ? -0.1 : 0.1
  drawer.scaleFactor += factor;
  drawer.offsetX += (ev.offsetX * (factor * -1));
  drawer.offsetY += (ev.offsetY * (factor * -1));
});

animate();
