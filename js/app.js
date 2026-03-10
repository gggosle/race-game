import { RaceModel } from './models/RaceModel.js';
import { RaceView } from './views/RaceView.js';
import { RaceController } from './controllers/RaceController.js';

document.addEventListener('DOMContentLoaded', () => {
    const model = new RaceModel();
    const view = new RaceView();
    window.game = new RaceController(model, view);
});
