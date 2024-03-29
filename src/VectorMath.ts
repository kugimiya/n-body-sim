export type Vec2 = {
  x: number;
  y: number;
}

export class VectorMath {
  static create(x: number, y: number): Vec2 {
    return { x, y };
  }

  static subtract(v1: Vec2, v2: Vec2): Vec2 {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
  }

  static add(v1: Vec2, v2: Vec2): Vec2 {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
  }

  static multiply(v1: Vec2, v: number): Vec2 {
    return { x: v1.x * v, y: v1.y * v };
  }

  static divide(v1: Vec2, v: number): Vec2 {
    return { x: v1.x / v, y: v1.y / v };
  }

  static lengthNormal(v1: Vec2) {
    return Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  }

  static lengthSquared(v1: Vec2) {
    return v1.x * v1.x + v1.y * v1.y;
  }

  static clone(v1: Vec2): Vec2 {
    return { ...v1 };
  }
}
