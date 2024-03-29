import { VectorMath, Vec2 } from "./VectorMath";
import { VerletObject } from "./VerletObject";

type GridCell = {
  x: number;
  y: number;
  massCenterX: number;
  massCenterY: number;
  mass: number;
  objectIndexes: number[];
};

export class VerletWorld {
  subSteps = 4;
  dt = 0.01;
  worldSize = 0;

  gravity = 6.674;
  constraintRadius = 0;
  constraintCenter = VectorMath.create(0, 0);
  objects: VerletObject[] = [];

  gridFactor = 0;
  grid: GridCell[] = [];

  constructor(objectsCount = 64, worldSize = 128, gridRatio = 8, baseMass = 25, massToRadiusRatio = 45) {
    this.gridFactor = worldSize / gridRatio;
    this.worldSize = worldSize;
    this.constraintRadius = this.worldSize / 2;
    this.constraintCenter = VectorMath.create(this.worldSize / 2, this.worldSize / 2);

    for (let i = 0; i < objectsCount; i++) {
      const pos = Math.min(Math.max(Math.random(), 0.2), 0.8);
      const position = {
        x: this.worldSize / 2 + ((this.worldSize / 2) * pos) * Math.cos(i),
        y: this.worldSize / 2 + ((this.worldSize / 2) * pos) * Math.sin(i)
      };

      const positionLast = {
        x: this.worldSize / 2 + ((this.worldSize / 2) * pos) * Math.cos(i + 0.001),
        y: this.worldSize / 2 + ((this.worldSize / 2) * pos) * Math.sin(i + 0.001)
      };

      const object = new VerletObject(
        position,
        positionLast,
        baseMass * Math.random(),
        massToRadiusRatio
      );
      this.objects.push(object);
    }
  }

  pushToGrid(x: number, y: number, index: number) {
    const cell = this.grid.find(_ => _.x === x && _.y === y);

    if (cell) {
      cell.objectIndexes.push(index);
      cell.mass += this.objects[index].mass;
      cell.massCenterX = (cell.massCenterX + this.objects[index].position.x) / 2;
      cell.massCenterY = (cell.massCenterY + this.objects[index].position.y) / 2;
    } else {
      this.grid.push({
        x, y,
        objectIndexes: [index],
        massCenterX: this.objects[index].position.x,
        massCenterY: this.objects[index].position.y,
        mass: this.objects[index].mass,
      });
    }
  }

  update() {
    try {
      this.resolveGravityChunkOptimized();
      for (let i = 0; i < this.subSteps; i++) {
        this.resolveCollisionsChunkOptimized();
        this.applyConstraint();
        this.updatePositions(this.dt / this.subSteps);
      }
    } catch (e) {
      console.error(e);
    }
  }

  updatePositions(dt: number) {
    this.grid = [];

    this.objects.forEach((object, objectIndex) => {
      object.updatePosition(dt);

      const [cellX, cellY] = [
        Math.floor(this.gridFactor * (object.position.x / this.worldSize)),
        Math.floor(this.gridFactor * (object.position.y / this.worldSize)),
      ];

      this.pushToGrid(cellX, cellY, objectIndex);
    });
  }

  resolveGravityChunkOptimized() {
    for (let i = 0; i < this.objects.length; i++) {
      const object1 = this.objects[i];

      this.grid.filter(_ => !_.objectIndexes.includes(i)).forEach((cell) => {
        const massCenter = VectorMath.create(cell.massCenterX, cell.massCenterY);
        const velocitySquared = VectorMath.lengthSquared(VectorMath.subtract(object1.position, massCenter));
        const force = this.gravity * ((object1.mass * cell.mass) / velocitySquared);

        const acceleration = force / Math.sqrt(velocitySquared);
        object1.accelerate(VectorMath.multiply(VectorMath.subtract(massCenter, object1.position), acceleration));
      });
    }
  }

  resolveGravityBruteForce() {
    for (let i = 0; i < this.objects.length; i++) {
      const object1 = this.objects[i];
      for (let j = i; j < this.objects.length; j++) {
        if (i === j) {
          continue;
        }

        const object2 = this.objects[j];
        const velocitySquared = VectorMath.lengthSquared(VectorMath.subtract(object1.position, object2.position));
        const force = this.gravity * ((object1.mass * object2.mass) / velocitySquared);

        const acceleration = force / Math.sqrt(velocitySquared);
        object1.accelerate(VectorMath.multiply(VectorMath.subtract(object2.position, object1.position), acceleration));
        object2.accelerate(VectorMath.multiply(VectorMath.subtract(object1.position, object2.position), acceleration));
      }
    }
  }

  applyConstraint() {
    this.objects.forEach((object) => {
      const velocity = VectorMath.subtract(this.constraintCenter, object.position);
      const distance = VectorMath.lengthNormal(velocity);

      if (distance > (this.constraintRadius - object.radius)) {
        const diff = VectorMath.divide(velocity, distance);
        object.positionLast = VectorMath.clone(object.position);
        object.position = VectorMath.subtract(
          this.constraintCenter,
          VectorMath.multiply(diff, this.constraintRadius - object.radius)
        );
      }
    });
  }

  /*
   * This is collisions resolver checker, but chunk-optimized
   */
  resolveCollisionsChunkOptimized() {
    this.grid.forEach((cell) => {
      let indexes = [
        ...cell.objectIndexes,
        ...(this.grid.find(_ => _.x - 1 === cell.x && _.y === cell.y)?.objectIndexes || []),
        ...(this.grid.find(_ => _.x + 1 === cell.x && _.y === cell.y)?.objectIndexes || []),
        ...(this.grid.find(_ => _.x === cell.x && _.y - 1 === cell.y)?.objectIndexes || []),
        ...(this.grid.find(_ => _.x === cell.x && _.y + 1 === cell.y)?.objectIndexes || []),
      ];

      indexes = [...new Set(indexes)];

      if (indexes.length < 2) {
        return;
      }

      for (let i = 0; i < indexes.length; i++) {
        const object1 = this.objects[indexes[i]];
        for (let j = i; j < indexes.length; j++) {
          if (i === j) {
            continue;
          }

          const object2 = this.objects[indexes[j]];
          this.applyCollisions(object1, object2);
        }
      }
    });
  }

  /*
   * This is collisions resolver checker, but bruteforce
   */
  resolveCollisionsBruteForce() {
    for (let i = 0; i < this.objects.length; i++) {
      const object1 = this.objects[i];
      for (let j = i; j < this.objects.length; j++) {
        if (i === j) {
          continue;
        }

        const object2 = this.objects[j];
        this.applyCollisions(object1, object2);
      }
    }
  }

  applyCollisions(object1: VerletObject, object2: VerletObject) {
    const collideResponsibility = 0.375;

    const velocity = VectorMath.subtract(object1.position, object2.position);
    const distanceSquared = VectorMath.lengthSquared(velocity);
    const distanceMinimal = object1.radius + object2.radius;

    // Check overlapping
    if (distanceSquared < (distanceMinimal * distanceMinimal)) {
      const distance = Math.sqrt(distanceSquared);
      const diff = VectorMath.divide(velocity, distance);

      const commonMass = (object1.mass + object2.mass)
      const object1MassRatio = object1.mass / commonMass;
      const object2MassRatio = object2.mass / commonMass;

      const delta = collideResponsibility * (distance - distanceMinimal);

      // Upd positions
      object1.position = VectorMath.subtract(
        object1.position,
        VectorMath.divide(VectorMath.multiply(diff, object2MassRatio * delta), 2)
      );
      object2.position = VectorMath.add(
        object2.position,
        VectorMath.divide(VectorMath.multiply(diff, object1MassRatio * delta), 2)
      );
    }
  }
}
