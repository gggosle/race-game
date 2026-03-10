export class RaceView {
    constructor() {
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
        this.carElements = new Map();
        this.carDistanceDisplays = new Map();
    }

    bindSetup(handler) {
        this.elements.setupBtn.addEventListener('click', () => {
            const count = parseInt(this.elements.carCountInput.value);
            handler(count);
        });
    }

    bindStart(handler) {
        this.elements.startBtn.addEventListener('click', handler);
    }

    bindSkip(handler) {
        this.elements.skipBtn.addEventListener('click', handler);
    }

    bindRestart(handler) {
        this.elements.restartBtn.addEventListener('click', handler);
    }

    bindReset(handler) {
        this.elements.resetBtn.addEventListener('click', handler);
    }

    renderCarInputs(count) {
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
    }

    getCarInputs() {
        const nameInputs = document.querySelectorAll('.car-name');
        const colorInputs = document.querySelectorAll('.car-color');
        return Array.from(nameInputs).map((input, i) => ({
            name: input.value || `Car ${i + 1}`,
            color: colorInputs[i].value
        }));
    }

    renderTracks(cars) {
        this.elements.tracksContainer.innerHTML = '';
        this.elements.racingArea.style.display = 'block';
        this.carElements.clear();
        this.carDistanceDisplays.clear();

        cars.forEach(car => {
            const track = document.createElement('div');
            track.className = 'track';
            
            const carNode = this.createCarNode(car);
            track.appendChild(carNode);
            this.carElements.set(car, carNode);
            
            const distanceDisplay = document.createElement('span');
            distanceDisplay.className = 'distance-display';
            track.appendChild(distanceDisplay);
            this.carDistanceDisplays.set(car, distanceDisplay);
            
            this.updateCarPosition(car);
            this.elements.tracksContainer.appendChild(track);
        });
    }

    createCarNode(car) {
        const carNode = document.createElement('div');
        carNode.className = 'car-node';
        carNode.style.backgroundColor = car.color;
        carNode.innerHTML = `
            <div>${car.name}</div>
            <div class="wins" style="font-size: 8px;">Wins: ${car.wins}</div>
            <div class="stats" style="font-size: 7px; color: #ccc;">${car.power}hp / ${car.weight}kg</div>
        `;
        return carNode;
    }

    updateCarPosition(car) {
        const element = this.carElements.get(car);
        const distanceDisplay = this.carDistanceDisplays.get(car);
        if (element) {
            element.style.left = `${car.position}px`;
        }
        if (distanceDisplay) {
            distanceDisplay.textContent = ` ${Math.round(car.position)}m`;
        }
    }

    updateCarWins(car) {
        const element = this.carElements.get(car);
        if (element) {
            const winsDiv = element.querySelector('.wins');
            if (winsDiv) winsDiv.textContent = `Wins: ${car.wins}`;
        }
    }

    updateCarStats(car) {
        const element = this.carElements.get(car);
        if (element) {
            const statsDiv = element.querySelector('.stats');
            if (statsDiv) statsDiv.textContent = `${car.power}hp / ${car.weight}kg`;
        }
    }

    displayWinner(name) {
        this.elements.resultsDiv.textContent = `Winner: ${name}!`;
    }

    appendResults(text) {
        this.elements.resultsDiv.textContent += text;
    }

    clearResults() {
        this.elements.resultsDiv.textContent = '';
    }

    updateUIState(state) {
        const { controlsInit, startBtn, skipBtn, restartBtn, resetBtn, racingArea } = this.elements;

        const states = {
            init: {
                controlsInit: 'block',
                startBtn: 'none',
                skipBtn: 'none',
                restartBtn: 'none',
                resetBtn: 'none',
                racingArea: 'none'
            },
            setup: {
                controlsInit: 'block',
                startBtn: 'inline-block',
                skipBtn: 'none',
                restartBtn: 'none',
                resetBtn: 'none',
                racingArea: 'none'
            },
            ready: {
                controlsInit: 'none',
                startBtn: 'inline-block',
                skipBtn: 'none',
                restartBtn: 'none',
                resetBtn: 'inline-block',
                racingArea: 'block'
            },
            racing: {
                controlsInit: 'none',
                startBtn: 'none',
                skipBtn: 'inline-block',
                restartBtn: 'inline-block',
                resetBtn: 'inline-block',
                racingArea: 'block'
            },
            finished: {
                controlsInit: 'none',
                startBtn: 'none',
                skipBtn: 'none',
                restartBtn: 'inline-block',
                resetBtn: 'inline-block',
                racingArea: 'block'
            }
        };

        const config = states[state];
        if (!config) return;

        controlsInit.style.display = config.controlsInit;
        startBtn.style.display = config.startBtn;
        skipBtn.style.display = config.skipBtn;
        restartBtn.style.display = config.restartBtn;
        resetBtn.style.display = config.resetBtn;
        racingArea.style.display = config.racingArea;
    }

    getRacingAreaWidth() {
        return this.elements.racingArea.clientWidth;
    }

    resetInputs(defaultCount) {
        this.elements.carInputsContainer.innerHTML = '';
        this.elements.carCountInput.value = defaultCount;
    }
}
