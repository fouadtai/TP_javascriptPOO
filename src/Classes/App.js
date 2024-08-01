import config from '../../app.config.json';
import mapboxgl from 'mapbox-gl';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../assets/style.css';
import LocalEvent from './LocalEvent';

class App {
    constructor() {
        this.elDivMap = null;
        this.elSidebar = null;
        this.map = null;
        this.localEvent = new LocalEvent(this);
    }

    start() {
        this.loadDom();
        this.initMap();
        this.initSidebar();
        this.initEventListButton();
        this.localEvent.loadEventsFromLocalStorage();
    }

    loadDom() {
        const app = document.getElementById('app');
        app.style.display = 'flex';
        app.style.height = '100vh';

        this.elDivMap = document.createElement('div');
        this.elDivMap.id = 'map';
        this.elDivMap.style.flex = '1';

        this.elSidebar = document.createElement('div');
        this.elSidebar.id = 'sidebar';
        this.elSidebar.style.width = '300px';
        this.elSidebar.style.padding = '20px';
        this.elSidebar.style.backgroundColor = 'white';
        this.elSidebar.style.overflowY = 'auto';

        app.appendChild(this.elDivMap);
        app.appendChild(this.elSidebar);
    }

    initMap() {
        mapboxgl.accessToken = config.apis.mapbox_gl.apiKey;
        this.map = new mapboxgl.Map({
            container: this.elDivMap,
            style: config.apis.mapbox_gl.map_styles.satellite_streets,
            center: [2.79, 42.68],
            zoom: 12
        });

        const nav = new mapboxgl.NavigationControl();
        this.map.addControl(nav, 'top-left');

        this.map.on('click', this.handleClickMap.bind(this));
    }

    initSidebar() {
        const form = document.createElement('form');
        form.id = 'eventForm';
        form.innerHTML = `
            <h3>Crée un évènement</h3>
            <div class="mb-3">
                <label for="eventTitle" class="form-label">Titre de l'évènement</label>
                <input type="text" class="form-control" id="eventTitle" required>
            </div>
            <div class="mb-3">
                <label for="eventDescription" class="form-label">Description</label>
                <textarea class="form-control" id="eventDescription" rows="3"></textarea>
            </div>
            <div class="mb-3">
                <label for="startDate" class="form-label">Date de début</label>
                <input type="datetime-local" class="form-control" id="startDate" required>
            </div>
            <div class="mb-3">
                <label for="endDate" class="form-label">Date de fin</label>
                <input type="datetime-local" class="form-control" id="endDate" required>
            </div>
            <div class="mb-3">
                <label for="latitude" class="form-label">Latitude</label>
                <input type="number" class="form-control" id="latitude" step="any" required>
            </div>
            <div class="mb-3">
                <label for="longitude" class="form-label">Longitude</label>
                <input type="number" class="form-control" id="longitude" step="any" required>
            </div>
            <button type="submit" class="btn btn-primary">Crée l'évènement</button>
        `;
        form.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.elSidebar.appendChild(form);
    }

    initEventListButton() {
        const button = document.createElement('button');
        button.innerText = 'Liste évènements';
        button.className = 'btn btn-info';
        button.style.position = 'absolute';
        button.style.top = '10px';
        button.style.left = '50px';
        button.addEventListener('click', this.showEventList.bind(this));
        document.body.appendChild(button);
    }

    showEventList() {
        const eventListContainer = document.createElement('div');
        eventListContainer.id = 'eventListContainer';
        eventListContainer.style.position = 'absolute';
        eventListContainer.style.top = '70px';
        eventListContainer.style.left = '50px';
        eventListContainer.style.backgroundColor = 'white';
        eventListContainer.style.padding = '10px';
        eventListContainer.style.border = '1px solid #ccc';
        eventListContainer.style.maxHeight = '400px';
        eventListContainer.style.overflowY = 'auto';

        const closeButton = document.createElement('button');
        closeButton.innerText = 'Close';
        closeButton.className = 'btn btn-secondary';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(eventListContainer);
        });

        const eventList = document.createElement('ul');
        eventList.className = 'list-group';

        this.localEvent.markers.forEach((event, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `
                <strong>${event.title}</strong><br>
                ${event.startDate.toLocaleString()} - ${event.endDate.toLocaleString()}<br>
                <button class="btn btn-sm btn-primary edit-event" data-id="${index}">Edit</button>
                <button class="btn btn-sm btn-danger delete-event" data-id="${index}">Delete</button>
            `;

            listItem.querySelector('.edit-event').addEventListener('click', () => this.localEvent.editEvent(index));
            listItem.querySelector('.delete-event').addEventListener('click', () => this.localEvent.deleteEvent(index));

            eventList.appendChild(listItem);
        });

        eventListContainer.appendChild(closeButton);
        eventListContainer.appendChild(eventList);
        document.body.appendChild(eventListContainer);
    }

    handleClickMap(event) {
        const { lng, lat } = event.lngLat;
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);
    }

    handleFormSubmit(event) {
        event.preventDefault();

        const title = document.getElementById('eventTitle').value;
        const description = document.getElementById('eventDescription').value;
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);

        const form = document.getElementById('eventForm');
        const editId = form.getAttribute('data-edit-id');

        if (editId !== null) {
            this.localEvent.updateEvent(parseInt(editId), { title, description, startDate, endDate, latitude, longitude });
            form.removeAttribute('data-edit-id');
            document.querySelector('#eventForm button[type="submit"]').textContent = 'Créer l\'événement';
        } else {
            this.localEvent.addEvent({ title, description, startDate, endDate, latitude, longitude });
        }

        form.reset();
    }
}

const app = new App();

export default app;
