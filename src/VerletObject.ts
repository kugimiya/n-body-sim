import { VectorMath, Vec2 } from "./VectorMath";

export class VerletObject {
  position: Vec2;
  positionLast: Vec2;
  acceleration: Vec2;
  velocity: Vec2;
  velocityLength: number;

  mass: number;
  radius: number;

  constructor(position: { x: number, y: number }, positionLast: { x: number, y: number }, mass = 1, massToRadiusRatio = 45) {
    this.mass = mass;
    this.radius = mass / massToRadiusRatio;

    this.position = position;
    this.positionLast = positionLast;
    this.acceleration = VectorMath.create(0, 0);
  }

  updatePosition(dt = 0.1) {
    this.velocity = VectorMath.subtract(this.position, this.positionLast);

    this.positionLast = VectorMath.clone(this.position);

    this.position = VectorMath.add(
      this.position,
      VectorMath.add(this.velocity, VectorMath.multiply(this.acceleration, dt * dt))
    );

    this.acceleration = VectorMath.create(0, 0);
    this.velocityLength = VectorMath.lengthNormal(this.velocity);
  }

  accelerate(value: Vec2) {
    this.acceleration = VectorMath.add(this.acceleration, value);
  }
}
