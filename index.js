class Car {
    constructor(color, name) {
        this.color = color;
        this.name = name;
        this.speed = Math.floor(Math.random() * 50) + 5;
        this.position = 0;
        this.intervalId = null;
        this.element = null;
        this.wins = 0;
    }

    createNode() {
        const carNode = document.createElement('div');
        carNode.className = 'car-node';
        carNode.style.backgroundColor = this.color;
        carNode.innerHTML = `<div>${this.name}</div><div class="wins" style="font-size: 8px;">Wins: ${this.wins}</div>`;
        this.element = carNode;
        return carNode;
    }

    updateWinsDisplay() {
        if (this.element) {
            const winsDiv = this.element.querySelector('.wins');
            if (winsDiv) {
                winsDiv.textContent = `Wins: ${this.wins}`;
            }
        }
    }

    move(finishLinePos, onFinish, onTick) {
        this.intervalId = setInterval(() => {
            this.position += this.speed;
            this.element.style.left = this.position + 'px';
            onTick(this.position);

            if (this.position >= finishLinePos) {
                clearInterval(this.intervalId);
                onFinish(this.name);
            }
        }, 100);
    }

    reset() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.position = 0;
        if (this.element) {
            this.element.style.left = '0px';
        }
        this.speed = Math.floor(Math.random() * 50) + 5;
    }

    serialize() {
        return {
            color: this.color,
            name: this.name,
            wins: this.wins,
        };
    }

    static deserialize(data) {
        const car = new Car(data.color, data.name);
        car.wins = data.wins || 0;
        return car;
    }
}

const controlsInit = document.getElementById('controls-init');
const carCountInput = document.getElementById('car-count');
const setupBtn = document.getElementById('setup-btn');
const carInputsContainer = document.getElementById('car-inputs-container');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const resetBtn = document.getElementById('reset-btn');
const racingArea = document.getElementById('racing-area');
const tracksContainer = document.getElementById('tracks-container');
const resultsDiv = document.getElementById('results');

let cars = [];
let finishedCars = [];

function saveCarsToLocalStorage() {
    const serializedCars = cars.map(car => car.serialize());
    localStorage.setItem('raceGameCars', JSON.stringify(serializedCars));
}

function loadCarsFromLocalStorage() {
    const savedCars = localStorage.getItem('raceGameCars');
    if (savedCars) {
        const carData = JSON.parse(savedCars);
        cars = carData.map(data => Car.deserialize(data));
        
        // Restore UI
        controlsInit.style.display = 'none';
        racingArea.style.display = 'block';
        tracksContainer.innerHTML = '';
        
        cars.forEach((car, index) => {
            const track = document.createElement('div');
            track.className = 'track';
            track.appendChild(car.createNode());
            
            const distanceDisplay = document.createElement('span');
            distanceDisplay.className = 'distance-display';
            distanceDisplay.style.marginLeft = '80px';
            distanceDisplay.style.color = '#fff';
            distanceDisplay.style.fontSize = '12px';
            distanceDisplay.textContent = ' 0m';
            track.appendChild(distanceDisplay);
            
            tracksContainer.appendChild(track);
        });

        startBtn.style.display = 'inline-block';
        startBtn.disabled = false;
        restartBtn.style.display = 'none';
        resetBtn.style.display = 'none';
        setupBtn.disabled = false;
    }
}

// Load on start
window.addEventListener('load', loadCarsFromLocalStorage);

setupBtn.addEventListener('click', () => {
    const count = parseInt(carCountInput.value);
    if (isNaN(count) || count < 1) return;

    carInputsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const group = document.createElement('div');
        group.className = 'car-input-group';
        group.innerHTML = `
            <div>Car ${i + 1}</div>
            <input type="text" placeholder="Name" class="car-name" value="Car ${i + 1}">
            <input type="color" class="car-color" value="#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}">
        `;
        carInputsContainer.appendChild(group);
    }
    startBtn.style.display = 'inline-block';
    startBtn.disabled = false;
    restartBtn.style.display = 'none';
    resetBtn.style.display = 'none';
    
    racingArea.style.display = 'none';
    resultsDiv.textContent = '';
    localStorage.removeItem('raceGameCars');
});

function initRace() {
    const names = document.querySelectorAll('.car-name');
    const colors = document.querySelectorAll('.car-color');
    
    cars = [];
    tracksContainer.innerHTML = '';
    
    names.forEach((nameInput, index) => {
        const car = new Car(colors[index].value, nameInput.value || `Car ${index + 1}`);
        cars.push(car);
        
        const track = document.createElement('div');
        track.className = 'track';
        track.appendChild(car.createNode());
        
        const distanceDisplay = document.createElement('span');
        distanceDisplay.className = 'distance-display';
        distanceDisplay.style.marginLeft = '80px';
        distanceDisplay.style.color = '#fff';
        distanceDisplay.style.fontSize = '12px';
        distanceDisplay.textContent = ' 0m';
        track.appendChild(distanceDisplay);
        
        tracksContainer.appendChild(track);
    });

    racingArea.style.display = 'block';
    saveCarsToLocalStorage();
}

startBtn.addEventListener('click', () => {
    controlsInit.style.display = 'none';
    if (cars.length === 0) {
        initRace();
    }
    
    finishedCars = [];
    resultsDiv.textContent = '';
    
    startBtn.disabled = true;
    startBtn.style.display = 'none';
    setupBtn.disabled = true;

    restartBtn.style.display = 'none';
    resetBtn.style.display = 'none';

    const finishLinePos = racingArea.clientWidth - 80; 

    cars.forEach((car, index) => {
        const distanceDisplay = tracksContainer.children[index].querySelector('.distance-display');

        car.move(finishLinePos, (name) => {
            finishedCars.push(name);
            if (finishedCars.length === 1) {
                car.wins++;
                car.updateWinsDisplay();
                resultsDiv.textContent = `Winner: ${name}!`;
                saveCarsToLocalStorage();
            }
            if (finishedCars.length === cars.length) {
                restartBtn.style.display = 'inline-block';
                resetBtn.style.display = 'inline-block';
                setupBtn.disabled = false;
                resultsDiv.textContent += ` All cars finished.`;
            }
        }, (pos) => {
            distanceDisplay.textContent = ` ${pos}m`;
        });
    });
});

restartBtn.addEventListener('click', () => {
    cars.forEach((car, index) => {
        car.reset();
        const distanceDisplay = tracksContainer.children[index].querySelector('.distance-display');
        distanceDisplay.textContent = ' 0m';
    });
    finishedCars = [];
    resultsDiv.textContent = '';
    startBtn.style.display = 'inline-block';
    startBtn.disabled = false;
    restartBtn.style.display = 'none';
    resetBtn.style.display = 'none';
});

resetBtn.addEventListener('click', () => {
    cars.forEach(car => car.reset());
    cars = [];
    localStorage.removeItem('raceGameCars');
    racingArea.style.display = 'none';
    tracksContainer.innerHTML = '';
    carInputsContainer.innerHTML = '';
    resultsDiv.textContent = '';
    controlsInit.style.display = 'block';
    startBtn.style.display = 'none';
    startBtn.disabled = true;
    restartBtn.style.display = 'none';
    resetBtn.style.display = 'none';
    
    setupBtn.disabled = false;
    carCountInput.value = 3;
});

