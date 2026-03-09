const CONFIG = {
    STORAGE_KEY: 'raceGameCars',
    MIN_SPEED: 5,
    MAX_SPEED: 55,
    FINISH_LINE_OFFSET: 80,
    TICK_INTERVAL: 50,
    DEFAULT_CAR_COUNT: 3,
    GEAR_MULTIPLIERS: [3.0, 2.0, 1.5, 1.2, 1.0, 0.8] // Gear 1 = 3.0, Gear 2 = 2.0, etc.
};

class Car {
    constructor(color, name, wins = 0) {
        this.color = color;
        this.name = name;
        this.wins = wins;
        this.position = 0;
        this.velocity = 0;
        this.currentGear = 1;
        this.intervalId = null;
        this.element = null;
        this.distanceDisplay = null;
        
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

    calculateAcceleration(v) {
        const ptwRatio = this.power / this.weight;
        
        if (this.currentGear < this.numGears && v >= this.maxVelocitiesPerGear[this.currentGear - 1]) {
            this.currentGear++;
        }

        const vMaxGear = this.maxVelocitiesPerGear[this.currentGear - 1];
        const gMult = CONFIG.GEAR_MULTIPLIERS[this.currentGear - 1] || 1.0;

        if (v >= vMaxGear) {
            return 0;
        }

        return ptwRatio * gMult * (1 - (v / vMaxGear));
    }

    createNode() {
        const carNode = document.createElement('div');
        carNode.className = 'car-node';
        carNode.style.backgroundColor = this.color;
        carNode.innerHTML = `
            <div>${this.name}</div>
            <div class="wins" style="font-size: 8px;">Wins: ${this.wins}</div>
            <div class="stats" style="font-size: 7px; color: #ccc;">${this.power}hp / ${this.weight}kg</div>
        `;
        this.element = carNode;
        return carNode;
    }

    updateWinsDisplay() {
        if (this.element) {
            const winsDiv = this.element.querySelector('.wins');
            if (winsDiv) winsDiv.textContent = `Wins: ${this.wins}`;
        }
    }

    updateStatsDisplay() {
        if (this.element) {
            const statsDiv = this.element.querySelector('.stats');
            if (statsDiv) statsDiv.textContent = `${this.power}hp / ${this.weight}kg`;
        }
    }

    move(finishLinePos, onFinish, onTick) {
        const dt = CONFIG.TICK_INTERVAL / 1000;
        const speedScale = (1000 / 3600) * 10;

        this.intervalId = setInterval(() => {
            const acceleration = this.calculateAcceleration(this.velocity);
            
            this.velocity += acceleration * dt * 100;
            this.position += (this.velocity * speedScale) * dt;

            if (this.element) {
                this.element.style.left = `${this.position}px`;
            }
            onTick(Math.round(this.position));

            if (this.position >= finishLinePos) {
                this.stop();
                onFinish(this);
            }
        }, CONFIG.TICK_INTERVAL);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    simulateFinishTime(finishLinePos) {
        const dt = CONFIG.TICK_INTERVAL / 1000;
        const speedScale = (1000 / 3600) * 10;
        
        let simVelocity = this.velocity;
        let simPosition = this.position;
        let simGear = this.currentGear;
        let totalTime = 0;

        while (simPosition < finishLinePos && totalTime < 1000) {
            const ptwRatio = this.power / this.weight;
            if (simGear < this.numGears && simVelocity >= this.maxVelocitiesPerGear[simGear - 1]) {
                simGear++;
            }
            const vMaxGear = this.maxVelocitiesPerGear[simGear - 1];
            const gMult = CONFIG.GEAR_MULTIPLIERS[simGear - 1] || 1.0;
            
            let acceleration = 0;
            if (simVelocity < vMaxGear) {
                acceleration = ptwRatio * gMult * (1 - (simVelocity / vMaxGear));
            }

            simVelocity += acceleration * dt * 100;
            simPosition += (simVelocity * speedScale) * dt;
            totalTime += dt;
        }

        return totalTime;
    }

    skipToFinish(finishLinePos) {
        this.stop();
        this.position = finishLinePos;
        if (this.element) {
            this.element.style.left = `${this.position}px`;
        }
        if (this.distanceDisplay) {
            this.distanceDisplay.textContent = ` ${Math.round(this.position)}m`;
        }
    }

    reset() {
        this.stop();
        this.position = 0;
        this.velocity = 0;
        this.currentGear = 1;
        if (this.element) {
            this.element.style.left = '0px';
        }
        this.generateStats();
        this.updateStatsDisplay();
    }

    serialize() {
        return {
            color: this.color,
            name: this.name,
            wins: this.wins,
        };
    }

    static deserialize(data) {
        return new Car(data.color, data.name, data.wins || 0);
    }
}

class RaceManager {
    constructor() {
        this.cars = [];
        this.finishedCars = [];

        this.elements = {
            controlsInit: document.getElementById('controls-init'),
            carCountInput: document.getElementById('car-count'),
            setupBtn: document.getElementById('setup-btn'),
            carInputsContainer: document.getElementById('car-inputs-container'),
            startBtn: document.getElementById('start-btn'),
            skipBtn: document.getElementById('skip-btn'),
            restartBtn: document.getElementById('restart-btn'),
            resetBtn: document.getElementById('reset-btn'),
            racingArea: document.getElementById('racing-area'),
            tracksContainer: document.getElementById('tracks-container'),
            resultsDiv: document.getElementById('results')
        };

        this.initEventListeners();
        this.loadFromStorage();
    }

    initEventListeners() {
        this.elements.setupBtn.addEventListener('click', () => this.handleSetup());
        this.elements.startBtn.addEventListener('click', () => this.handleStart());
        this.elements.skipBtn.addEventListener('click', () => this.handleSkip());
        this.elements.restartBtn.addEventListener('click', () => this.handleRestart());
        this.elements.resetBtn.addEventListener('click', () => this.handleResetAll());
    }

    handleSkip() {
        if (this.finishedCars.length < this.cars.length) {
            const finishLinePos = this.elements.racingArea.clientWidth - CONFIG.FINISH_LINE_OFFSET;
            
            const remainingCars = this.cars
                .filter(car => !this.finishedCars.includes(car))
                .map(car => ({
                    car,
                    remainingTime: car.simulateFinishTime(finishLinePos)
                }))
                .sort((a, b) => a.remainingTime - b.remainingTime);

            remainingCars.forEach(({car}) => {
                car.skipToFinish(finishLinePos);
                this.handleCarFinished(car);
            });
        }
    }

    handleSetup() {
        const count = parseInt(this.elements.carCountInput.value);
        if (isNaN(count) || count < 1) return;

        this.elements.carInputsContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const group = document.createElement('div');
            group.className = 'car-input-group';
            const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
            group.innerHTML = `
                <div>Car ${i + 1}</div>
                <input type="text" placeholder="Name" class="car-name" value="Car ${i + 1}">
                <input type="color" class="car-color" value="${randomColor}">
            `;
            this.elements.carInputsContainer.appendChild(group);
        }

        this.updateUIState('setup');
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        this.cars = [];
    }

    handleStart() {
        if (this.cars.length === 0) {
            this.initializeCarsFromInputs();
        }
        this.startRace();
    }

    handleRestart() {
        this.cars.forEach(car => {
            car.reset();
            if (car.distanceDisplay) car.distanceDisplay.textContent = ' 0m';
        });
        this.finishedCars = [];
        this.elements.resultsDiv.textContent = '';
        this.updateUIState('ready');
    }

    handleResetAll() {
        this.cars.forEach(car => car.stop());
        this.cars = [];
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        
        this.elements.tracksContainer.innerHTML = '';
        this.elements.carInputsContainer.innerHTML = '';
        this.elements.resultsDiv.textContent = '';
        this.elements.carCountInput.value = CONFIG.DEFAULT_CAR_COUNT;
        
        this.updateUIState('init');
    }

    initializeCarsFromInputs() {
        const nameInputs = document.querySelectorAll('.car-name');
        const colorInputs = document.querySelectorAll('.car-color');
        
        this.cars = Array.from(nameInputs).map((input, i) => 
            new Car(colorInputs[i].value, input.value || `Car ${i + 1}`)
        );

        this.renderTracks();
        this.saveToStorage();
    }

    renderTracks() {
        this.elements.tracksContainer.innerHTML = '';
        this.elements.racingArea.style.display = 'block';

        this.cars.forEach(car => {
            const track = document.createElement('div');
            track.className = 'track';
            track.appendChild(car.createNode());
            
            const distanceDisplay = document.createElement('span');
            distanceDisplay.className = 'distance-display';
            distanceDisplay.style.cssText = 'margin-left: 80px; color: #fff; font-size: 12px;';
            distanceDisplay.textContent = ' 0m';
            track.appendChild(distanceDisplay);
            
            car.distanceDisplay = distanceDisplay;
            this.elements.tracksContainer.appendChild(track);
        });
    }

    startRace() {
        this.finishedCars = [];
        this.elements.resultsDiv.textContent = '';
        this.updateUIState('racing');

        const finishLinePos = this.elements.racingArea.clientWidth - CONFIG.FINISH_LINE_OFFSET;

        this.cars.forEach(car => {
            car.move(
                finishLinePos,
                (finishedCar) => this.handleCarFinished(finishedCar),
                (pos) => {
                    if (car.distanceDisplay) car.distanceDisplay.textContent = ` ${pos}m`;
                }
            );
        });
    }

    handleCarFinished(car) {
        this.finishedCars.push(car);
        
        if (this.finishedCars.length === 1) {
            car.wins++;
            car.updateWinsDisplay();
            this.elements.resultsDiv.textContent = `Winner: ${car.name}!`;
            this.saveToStorage();
            this.updateUIState('finished');
        }

        if (this.finishedCars.length === this.cars.length) {
            this.elements.resultsDiv.textContent += ` All cars finished.`;
        }
    }

    updateUIState(state) {
        const { controlsInit, startBtn, skipBtn, restartBtn, resetBtn, racingArea } = this.elements;

        switch (state) {
            case 'init':
                controlsInit.style.display = 'block';
                startBtn.style.display = 'none';
                skipBtn.style.display = 'none';
                restartBtn.style.display = 'none';
                resetBtn.style.display = 'none';
                racingArea.style.display = 'none';
                break;
            case 'setup':
                startBtn.style.display = 'inline-block';
                skipBtn.style.display = 'none';
                restartBtn.style.display = 'none';
                resetBtn.style.display = 'none';
                racingArea.style.display = 'none';
                break;
            case 'ready':
                controlsInit.style.display = 'none';
                startBtn.style.display = 'inline-block';
                skipBtn.style.display = 'none';
                restartBtn.style.display = 'none';
                resetBtn.style.display = 'inline-block';
                racingArea.style.display = 'block';
                break;
            case 'racing':
                controlsInit.style.display = 'none';
                startBtn.style.display = 'none';
                skipBtn.style.display = 'inline-block';
                restartBtn.style.display = 'inline-block';
                resetBtn.style.display = 'inline-block';
                break;
            case 'finished':
                skipBtn.style.display = 'none';
                restartBtn.style.display = 'inline-block';
                resetBtn.style.display = 'inline-block';
                break;
        }
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
                this.cars = carData.map(data => Car.deserialize(data));
                this.renderTracks();
                this.updateUIState('ready');
            } catch (e) {
                console.error("Failed to load cars from storage", e);
                localStorage.removeItem(CONFIG.STORAGE_KEY);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new RaceManager();
});

