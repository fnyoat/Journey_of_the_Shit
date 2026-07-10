//=============================================================================
// fnyoat_CorePhysics.ts
//=============================================================================

/*:
 * @plugindesc [Core] 物理引擎核心 - 简单的物理计算
 * @author fnyoat
 *
 * @help
 * ============================================================================
 * 介绍
 * ============================================================================
 * 简单的物理引擎，只有三个值控制动量：
 * - velX: 水平速度
 * - velY: 垂直速度
 * - rotation: 旋转量
 * 
 * 物理规则：
 * - 重力持续让 velY 增加（向下）
 * - velX 自然衰减趋近 0
 * - 旋转量自然衰减趋近 0
 */

Imported = Imported || {};
Imported.fnyoat_CorePhysics = true;

// 确保 fnyoat 命名空间存在
window.fnyoat = window.fnyoat || {};

interface PhysicsConfig {
    velX?: number;
    velY?: number;
    rotationVel?: number;
    gravity?: number;
    friction?: number;
    rotationFriction?: number;
    fadeRate?: number;
}

class PhysicsObject {
    x: number;
    y: number;
    velX: number;
    velY: number;
    rotation: number;
    rotationVel: number;
    gravity: number;
    friction: number;
    rotationFriction: number;
    opacity: number;
    fadeProgress: number;
    fadeRate: number;

    constructor(x: number = 0, y: number = 0, config?: PhysicsConfig) {
        this.x = x;
        this.y = y;
        this.velX = config && config.velX !== undefined ? config.velX : 0;
        this.velY = config && config.velY !== undefined ? config.velY : 0;
        this.rotation = 0;
        this.rotationVel = config && config.rotationVel !== undefined ? config.rotationVel : 0;
        this.gravity = config && config.gravity !== undefined ? config.gravity : 0.4;
        this.friction = config && config.friction !== undefined ? config.friction : 0.98;
        this.rotationFriction = config && config.rotationFriction !== undefined ? config.rotationFriction : 0.99;
        this.opacity = 1;
        this.fadeProgress = 0;
        this.fadeRate = config && config.fadeRate !== undefined ? config.fadeRate : 0.015;
    }

    update(): void {
        this.velY += this.gravity;
        this.x += this.velX;
        this.y += this.velY;
        this.velX *= this.friction;
        this.rotationVel *= this.rotationFriction;
        this.rotation += this.rotationVel;
        this.fadeProgress += this.fadeRate;
        this.opacity = Math.max(0, 1 - this.fadeProgress);
    }

    getCurrentX(): number { return this.x; }
    getCurrentY(): number { return this.y; }
    getOpacity(): number { return Math.floor(this.opacity * 255); }
    isGone(): boolean { return this.fadeProgress >= 1; }
}

fnyoat.PhysicsObject = PhysicsObject;
