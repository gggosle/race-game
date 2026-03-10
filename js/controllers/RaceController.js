import { CONFIG } from '../config.js';
import { CarModel } from '../models/CarModel.js';

export class RaceController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.view.bindSetup(this.handleSetup.bind(this));
        this.view.bindStart(this.handleStart.bind(this));
        this.view.bindSkip(this.handleSkip.bind(this));
        this.view.bindRestart(this.handleRestart.bind(this));
        this.view.bindReset(this.handleResetAll.bind(this));

        this.init();
    }

    init() {
        if (this.model.loadFromStorage()) {
            this.view.renderTracks(this.model.cars);
            this.view.updateUIState('ready');
        } else {
            this.view.updateUIState('init');
        }
    }

    handleSetup(count) {
        if (isNaN(count) || count < 1) return;

        this.view.renderCarInputs(count);
        this.view.updateUIState('setup');
        
        this.model.clearStorage();
        this.model.clearCars();
    }

    handleStart() {
        if (this.model.cars.length === 0) {
            const inputs = this.view.getCarInputs();
            inputs.forEach(input => {
                this.model.addCar(new CarModel(input.color, input.name));
            });
            this.view.renderTracks(this.model.cars);
            this.model.saveToStorage();
        }
        this.startRace();
    }

    startRace() {
        this.model.finishedCars = [];
        this.view.clearResults();
        this.view.updateUIState('racing');

        const finishLinePos = this.view.getRacingAreaWidth() - CONFIG.FINISH_LINE_OFFSET;

        this.model.cars.forEach(car => {
            this.moveCar(car, finishLinePos);
        });
    }

    moveCar(car, finishLinePos) {
        const dt = CONFIG.TICK_INTERVAL / 1000;

        car.intervalId = setInterval(() => {
            car.updatePhysics(dt);
            this.view.updateCarPosition(car);

            if (car.position >= finishLinePos) {
                this.stopCar(car);
                this.handleCarFinished(car);
            }
        }, CONFIG.TICK_INTERVAL);
    }

    stopCar(car) {
        if (car.intervalId) {
            clearInterval(car.intervalId);
            car.intervalId = null;
        }
    }

    handleCarFinished(car) {
        if (this.model.finishedCars.includes(car)) return;
        
        this.model.finishedCars.push(car);
        
        if (this.model.finishedCars.length === 1) {
            car.wins++;
            this.view.updateCarWins(car);
            this.view.displayWinner(car.name);
            this.model.saveToStorage();
            this.view.updateUIState('finished');
        }

        if (this.model.finishedCars.length === this.model.cars.length) {
            this.view.appendResults(` All cars finished.`);
        }
    }

    handleSkip() {
        if (this.model.finishedCars.length < this.model.cars.length) {
            const finishLinePos = this.view.getRacingAreaWidth() - CONFIG.FINISH_LINE_OFFSET;
            
            const remainingCars = this.model.cars
                .filter(car => !this.model.finishedCars.includes(car))
                .map(car => ({
                    car,
                    remainingTime: car.simulateFinishTime(finishLinePos)
                }))
                .sort((a, b) => a.remainingTime - b.remainingTime);

            remainingCars.forEach(({car}) => {
                this.stopCar(car);
                car.position = finishLinePos;
                this.view.updateCarPosition(car);
                this.handleCarFinished(car);
            });
        }
    }

    handleRestart() {
        this.model.cars.forEach(car => this.stopCar(car));
        this.model.resetCars();
        this.model.cars.forEach(car => {
            this.view.updateCarPosition(car);
            this.view.updateCarStats(car);
        });
        this.view.clearResults();
        this.view.updateUIState('ready');
    }

    handleResetAll() {
        this.model.cars.forEach(car => this.stopCar(car));
        this.model.clearCars();
        this.model.clearStorage();
        
        this.view.renderTracks([]); // Clears tracks
        this.view.resetInputs(CONFIG.DEFAULT_CAR_COUNT);
        this.view.clearResults();
        this.view.updateUIState('init');
    }
}
