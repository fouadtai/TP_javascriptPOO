// LocalEvent.js
import mapboxgl from 'mapbox-gl';

class LocalEvent {
    constructor(app) {
        this.app = app;
        this.markers = []; // Array to store event data
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
            .addTo(this.app.map);

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

        // Add hover popup
        const hoverPopup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false
        });

        markerElement.addEventListener('mouseenter', () => {
            hoverPopup
                .setLngLat([longitude, latitude])
                .setHTML(`<h5>${title}</h5><p>Début: ${new Date(startDate).toLocaleString()}</p>`)
                .addTo(this.app.map);
        });

        markerElement.addEventListener('mouseleave', () => {
            hoverPopup.remove();
        });

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

        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('startDate').value = new Date(event.startDate).toISOString().slice(0, 16);
        document.getElementById('endDate').value = new Date(event.endDate).toISOString().slice(0, 16);
        document.getElementById('latitude').value = event.latitude;
        document.getElementById('longitude').value = event.longitude;

        const submitButton = document.querySelector('#eventForm button[type="submit"]');
        submitButton.textContent = 'Modifier l\'événement';

        document.getElementById('eventForm').setAttribute('data-edit-id', id);

        event.popup.remove();
    }

    updateEvent(id, eventData) {
        const { title, description, startDate, endDate, latitude, longitude } = eventData;
        const event = this.markers[id];

        event.title = title;
        event.description = description;
        event.startDate = startDate;
        event.endDate = endDate;
        event.latitude = latitude;
        event.longitude = longitude;

        event.marker.setLngLat([longitude, latitude]);

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

export default LocalEvent;
