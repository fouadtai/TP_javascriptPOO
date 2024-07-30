import config from '../../app.config.json';
import mapboxgl from 'mapbox-gl';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../assets/style.css';

class App {
    elDivMap;
    elSidebar;
    map;
    markers = []; // Array to store markers

    constructor() {
        this.elDivMap = null;
        this.elSidebar = null;
        this.map = null;
    }

    start() {
        this.loadDom();
        this.initMap();
        this.initSidebar();
        this.initEventListButton();
        this.loadEventsFromLocalStorage();
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
                <textarea class="form-control" id="eventDescription" required></textarea>
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
        button.style.left = '40px';
        button.addEventListener('click', this.showEventList.bind(this));
        document.body.appendChild(button);
    }

    showEventList() {
        const eventListContainer = document.createElement('div');
        eventListContainer.id = 'eventListContainer';
        eventListContainer.style.position = 'absolute';
        eventListContainer.style.top = '50px';
        eventListContainer.style.left = '10px';
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

        this.markers.forEach((event, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `
                <strong>${event.title}</strong><br>
                ${event.startDate.toLocaleString()} - ${event.endDate.toLocaleString()}<br>
                <button class="btn btn-sm btn-primary edit-event" data-id="${index}">Edit</button>
                <button class="btn btn-sm btn-danger delete-event" data-id="${index}">Delete</button>
            `;

            listItem.querySelector('.edit-event').addEventListener('click', () => this.editEvent(index));
            listItem.querySelector('.delete-event').addEventListener('click', () => this.deleteEvent(index));

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
            // Modification d'un événement existant
            this.updateEvent(parseInt(editId), { title, description, startDate, endDate, latitude, longitude });
            form.removeAttribute('data-edit-id');
            document.querySelector('#eventForm button[type="submit"]').textContent = 'Créer l\'événement';
        } else {
            // Ajout d'un nouvel événement
            this.addEvent({ title, description, startDate, endDate, latitude, longitude });
        }

        form.reset();
    }

    addEvent(eventData) {
        const { title, description, startDate, endDate, latitude, longitude } = eventData;

        const currentDate = new Date();
        const timeDiff = new Date(startDate) - currentDate;
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        let markerColor;
        if (daysDiff < 0) {
            markerColor = 'red';
        } else if (daysDiff <= 3) {
            markerColor = 'orange';
        } else {
            markerColor = 'green';
        }

        const markerElement = document.createElement('div');
        markerElement.style.width = '20px';
        markerElement.style.height = '20px';
        markerElement.style.backgroundColor = markerColor;
        markerElement.style.borderRadius = '50%';
        markerElement.style.border = '2px solid white';

        const marker = new mapboxgl.Marker(markerElement)
            .setLngLat([longitude, latitude])
            .addTo(this.map);

        const popupContent = this.createPopupContent({
            id: this.markers.length,
            title,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            latitude,
            longitude
        });

        const popup = new mapboxgl.Popup({ offset: 25 })
            .setDOMContent(popupContent)
            .setLngLat([longitude, latitude]);

        marker.setPopup(popup);

        this.markers.push({ marker, popup, title, description, startDate, endDate, latitude, longitude });

        this.saveEventsToLocalStorage();
    }

    createPopupContent(event) {
        const container = document.createElement('div');
        const currentDate = new Date();
        const eventStartDate = new Date(event.startDate);
        const timeDiff = eventStartDate - currentDate;
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursDiff = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        let statusMessage = '';
        if (daysDiff < 0 || (daysDiff === 0 && hoursDiff < 0)) {
            statusMessage = '<p class="popup-status popup-status-passed">Quel dommage ! Vous avez raté cet événement !</p>';
        } else if (daysDiff <= 3) {
            statusMessage = `<p class="popup-status popup-status-soon">Attention, commence dans ${daysDiff} jour${daysDiff !== 1 ? 's' : ''} et ${hoursDiff} heure${hoursDiff !== 1 ? 's' : ''}</p>`;
        }

        container.innerHTML = `
            <h5 class="popup-title">${event.title}</h5>
            <p class="popup-description">${event.description}</p>
            <p class="popup-dates">Du: ${new Date(event.startDate).toLocaleString()}<br>Au: ${new Date(event.endDate).toLocaleString()}</p>
            ${statusMessage}
            <div class="popup-buttons">
                <button class="popup-edit-btn" data-id="${event.id}">Modifier</button>
                <button class="popup-delete-btn" data-id="${event.id}">Supprimer</button>
            </div>
        `;

        container.querySelector('.popup-edit-btn').addEventListener('click', () => this.editEvent(event.id));
        container.querySelector('.popup-delete-btn').addEventListener('click', () => this.deleteEvent(event.id));

        return container;
    }

    editEvent(id) {
        const event = this.markers[id];

        // Remplir le formulaire avec les détails de l'événement
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('startDate').value = new Date(event.startDate).toISOString().slice(0, 16);
        document.getElementById('endDate').value = new Date(event.endDate).toISOString().slice(0, 16);
        document.getElementById('latitude').value = event.latitude;
        document.getElementById('longitude').value = event.longitude;

        // Changer le texte du bouton de soumission
        const submitButton = document.querySelector('#eventForm button[type="submit"]');
        submitButton.textContent = 'Modifier l\'événement';

        // Ajouter un attribut data-edit-id au formulaire
        document.getElementById('eventForm').setAttribute('data-edit-id', id);

        // Fermer la popup
        event.popup.remove();
    }

    updateEvent(id, eventData) {
        const { title, description, startDate, endDate, latitude, longitude } = eventData;
        const event = this.markers[id];

        // Mettre à jour les données de l'événement
        event.title = title;
        event.description = description;
        event.startDate = startDate;
        event.endDate = endDate;
        event.latitude = latitude;
        event.longitude = longitude;

        // Mettre à jour la position du marqueur
        event.marker.setLngLat([longitude, latitude]);

        // Mettre à jour le contenu de la popup
        const popupContent = this.createPopupContent({
            id,
            title,
            description,
            startDate,
            endDate,
            latitude,
            longitude
        });
        event.popup.setDOMContent(popupContent);

        // Mettre à jour la couleur du marqueur
        const markerElement = event.marker.getElement();
        const markerColor = this.getMarkerColor(startDate);
        markerElement.style.backgroundColor = markerColor;

        this.saveEventsToLocalStorage();
    }

    getMarkerColor(startDate) {
        const currentDate = new Date();
        const timeDiff = new Date(startDate) - currentDate;
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff < 0) return 'red';
        if (daysDiff <= 3) return 'orange';
        return 'green';
    }


    deleteEvent(id) {
        const event = this.markers[id];
        event.marker.remove();
        event.popup.remove();
        this.markers.splice(id, 1);

        this.saveEventsToLocalStorage();
    }

    saveEventsToLocalStorage() {
        const events = this.markers.map(({ title, description, startDate, endDate, latitude, longitude }) => ({
            title,
            description,
            startDate,
            endDate,
            latitude,
            longitude
        }));
        localStorage.setItem('mapEvents', JSON.stringify(events));
    }

    loadEventsFromLocalStorage() {
        const storedEvents = localStorage.getItem('mapEvents');
        if (storedEvents) {
            const events = JSON.parse(storedEvents);
            events.forEach(event => this.addEvent(event));
        }
    }
}

const app = new App();
export default app;
