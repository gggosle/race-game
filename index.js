const CONFIG = {
    STORAGE_KEY: 'raceGameCars',
    MIN_SPEED: 5,
    MAX_SPEED: 55,
    FINISH_LINE_OFFSET: 80,
    TICK_INTERVAL: 100,
    DEFAULT_CAR_COUNT: 3
};

class Car {
    constructor(color, name, wins = 0) {
        this.color = color;
        this.name = name;
        this.wins = wins;
        this.position = 0;
        this.speed = this.generateRandomSpeed();
        this.intervalId = null;
        this.element = null;
        this.distanceDisplay = null;
    }

    generateRandomSpeed() {
        return Math.floor(Math.random() * (CONFIG.MAX_SPEED - CONFIG.MIN_SPEED)) + CONFIG.MIN_SPEED;
    }

    createNode() {
        const carNode = document.createElement('div');
        carNode.className = 'car-node';
        carNode.style.backgroundColor = this.color;
        carNode.innerHTML = `
            <div>${this.name}</div>
            <div class="wins" style="font-size: 8px;">Wins: ${this.wins}</div>
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

    move(finishLinePos, onFinish, onTick) {
        this.intervalId = setInterval(() => {
            this.position += this.speed;
            if (this.element) {
                this.element.style.left = `${this.position}px`;
            }
            onTick(this.position);

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

    reset() {
        this.stop();
        this.position = 0;
        if (this.element) {
            this.element.style.left = '0px';
        }
        this.speed = this.generateRandomSpeed();
    }

    serialize() {
        return {
            color: this.color,
            name: this.name,
            wins: this.wins
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
        this.elements.restartBtn.addEventListener('click', () => this.handleRestart());
        this.elements.resetBtn.addEventListener('click', () => this.handleResetAll());
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
        const { controlsInit, startBtn, restartBtn, resetBtn, setupBtn, racingArea } = this.elements;

        switch (state) {
            case 'init':
                controlsInit.style.display = 'block';
                startBtn.style.display = 'none';
                restartBtn.style.display = 'none';
                resetBtn.style.display = 'none';
                racingArea.style.display = 'none';
                break;
            case 'setup':
                startBtn.style.display = 'inline-block';
                restartBtn.style.display = 'none';
                resetBtn.style.display = 'none';
                racingArea.style.display = 'none';
                break;
            case 'ready':
                controlsInit.style.display = 'none';
                startBtn.style.display = 'inline-block';
                restartBtn.style.display = 'none';
                resetBtn.style.display = 'inline-block';
                racingArea.style.display = 'block';
                break;
            case 'racing':
                controlsInit.style.display = 'none';
                startBtn.style.display = 'none';
                restartBtn.style.display = 'inline-block';
                resetBtn.style.display = 'inline-block';
                break;
            case 'finished':
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

