import { CONFIG } from '../config.js';

export class CarModel {
    constructor(color, name, wins = 0) {
        this.color = color;
        this.name = name;
        this.wins = wins;
        this.position = 0;
        this.velocity = 0;
        this.currentGear = 1;
        this.intervalId = null;
        
        this.weight = 0;
        this.power = 0;
        this.numGears = 0;
        this.topSpeed = 0;
        this.maxVelocitiesPerGear = [];
        
        this.generateStats();
    }

    generateStats() {
        this.weight = Math.floor(Math.random() * (2200 - 900 + 1)) + 900; // 900kg to 2200kg
        this.power = Math.floor(Math.random() * (700 - 100 + 1)) + 100; // 100hp to 700hp
        this.numGears = Math.floor(Math.random() * (6 - 4 + 1)) + 4; // 4 to 6 gears

        const ptwRatio = this.power / this.weight;
        this.topSpeed = Math.min(380, 100 + (ptwRatio * 500));

        this.maxVelocitiesPerGear = [];
        for (let i = 1; i <= this.numGears; i++) {
            const vMaxGear = Math.floor(this.topSpeed * Math.pow(i / this.numGears, 0.85));
            this.maxVelocitiesPerGear.push(vMaxGear);
        }
    }

    calculateAcceleration(v, gear = this.currentGear) {
        const ptwRatio = this.power / this.weight;
        
        let activeGear = gear;
        if (activeGear < this.numGears && v >= this.maxVelocitiesPerGear[activeGear - 1]) {
            activeGear++;
        }

        const vMaxGear = this.maxVelocitiesPerGear[activeGear - 1];
        const gMult = CONFIG.GEAR_MULTIPLIERS[activeGear - 1] || 1.0;

        if (v >= vMaxGear) {
            return { acceleration: 0, gear: activeGear };
        }

        const acceleration = ptwRatio * gMult * (1 - (v / vMaxGear));
        return { acceleration, gear: activeGear };
    }

    updatePhysics(dt) {
        const { acceleration, gear } = this.calculateAcceleration(this.velocity);
        this.currentGear = gear;
        
        this.velocity += acceleration * dt * CONFIG.ACCELERATION_MULTIPLIER;
        const distanceDelta = (this.velocity * CONFIG.SPEED_SCALE_KMH_TO_PX) * dt;
        this.position += distanceDelta;
        
        return { acceleration, gear, distanceDelta };
    }

    simulateFinishTime(finishLinePos) {
        const dt = CONFIG.TICK_INTERVAL / 1000;
        
        const originalVelocity = this.velocity;
        const originalPosition = this.position;
        const originalGear = this.currentGear;
        
        let totalTime = 0;
        while (this.position < finishLinePos && totalTime < CONFIG.SAFETY_CAP_SECONDS) {
            this.updatePhysics(dt);
            totalTime += dt;
        }

        const resultTime = totalTime;
        this.velocity = originalVelocity;
        this.position = originalPosition;
        this.currentGear = originalGear;

        return resultTime;
    }

    reset() {
        this.velocity = 0;
        this.currentGear = 1;
        this.position = 0;
        this.generateStats();
    }

    serialize() {
        return {
            color: this.color,
            name: this.name,
            wins: this.wins,
        };
    }

    static deserialize(data) {
        return new CarModel(data.color, data.name, data.wins || 0);
    }
}
