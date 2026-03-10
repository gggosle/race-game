import { CONFIG } from '../config.js';
import { CarModel } from './CarModel.js';

export class RaceModel {
    constructor() {
        this.cars = [];
        this.finishedCars = [];
    }

    addCar(car) {
        this.cars.push(car);
    }

    resetCars() {
        this.cars.forEach(car => car.reset());
        this.finishedCars = [];
    }

    clearCars() {
        this.cars = [];
        this.finishedCars = [];
    }

    saveToStorage() {
        const serialized = this.cars.map(car => car.serialize());
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(serialized));
    }

    loadFromStorage() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            try {
                const carData = JSON.parse(saved);
                this.cars = carData.map(data => CarModel.deserialize(data));
                return true;
            } catch (e) {
                console.error("Failed to load cars from storage", e);
                localStorage.removeItem(CONFIG.STORAGE_KEY);
            }
        }
        return false;
    }

    clearStorage() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    }
}
