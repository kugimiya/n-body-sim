import { VerletWorld } from "./VerletWorld";

export class VerletWorldDrawer {
  scaleFactor = 1;
  offsetX = 0;
  offsetY = 0;

  ctx: CanvasRenderingContext2D;
  world: VerletWorld;

  drawDebug = false;

  constructor(ctx: CanvasRenderingContext2D, world: VerletWorld) {
    this.ctx = ctx;
    this.world = world;

    this.scaleFactor = Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / world.worldSize;
  }

  draw() {
    // clear screen
    this.ctx.beginPath();
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fill();
    this.ctx.closePath();

    // draw constraint
    this.ctx.beginPath();
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeStyle = "rgba(0, 0, 0, .05)";
    this.ctx.arc(
      this.offsetX + (this.world.constraintCenter.x * this.scaleFactor),
      this.offsetY + (this.world.constraintCenter.y * this.scaleFactor),
      this.world.constraintRadius * this.scaleFactor, 0, 360);
    this.ctx.stroke();
    this.ctx.closePath();

    // draw dbg: grid
    if (this.drawDebug) {
      this.ctx.lineWidth = 0.5;
      this.ctx.strokeStyle = "rgba(0, 0, 0, .015)";
      this.ctx.fillStyle = "rgba(0, 0, 0, .01)";

      const cellSize = this.world.worldSize / this.world.gridFactor;
      for (let i = 0; i < this.world.gridFactor; i++) {
        for (let j = 0; j < this.world.gridFactor; j++) {
          const cell = this.world.grid.find(_ => _.x === i && _.y === j);

          this.ctx.beginPath();
          this.ctx.rect(
            this.offsetX + ((i * cellSize) * this.scaleFactor),
            this.offsetY + ((j * cellSize) * this.scaleFactor),
            cellSize * this.scaleFactor,
            cellSize * this.scaleFactor
          );
          this.ctx.stroke();
          if (cell?.objectIndexes?.length) {
            this.ctx.fill();
          }
          this.ctx.closePath();
        }
      }
    }

    // draw objects
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "black";
    this.ctx.fillStyle = "black";

    this.world.objects.forEach((object) => {
      this.ctx.beginPath();
      this.ctx.arc(
        this.offsetX + (object.position.x * this.scaleFactor),
        this.offsetY + (object.position.y * this.scaleFactor),
        object.radius * this.scaleFactor, 0, 360
      );
      this.ctx.stroke();
      this.ctx.fill();
      this.ctx.closePath();
    });
  }
}
