import config from '../../app.config.json';
import mapboxgl from 'mapbox-gl';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../assets/style.css';

class App {
    elDivMap;
    map;

    constructor() {
        // Initialize properties in the constructor
        this.elDivMap = null;
        this.map = null;
    }

    start() {
        this.loadDom();
        this.initMap();
    }

    loadDom() {
        const app = document.getElementById('app');
        this.elDivMap = document.createElement('div');
        this.elDivMap.id = 'map';
        // Append the map div to the app container
        app.appendChild(this.elDivMap);
    }

    initMap() {
        mapboxgl.accessToken = config.apis.mapbox_gl.apiKey;
        this.map = new mapboxgl.Map({
            container: this.elDivMap,
            style: config.apis.mapbox_gl.map_styles.satellite_streets,
            center: [2.79, 42.68],
            zoom: 12
        });

        // Correctly instantiate NavigationControl
        const nav = new mapboxgl.NavigationControl();
        this.map.addControl(nav, 'top-left');

        // Add a click event listener on the map
        this.map.on('click', this.handleClickMap.bind(this));
    }

    handleClickMap(event) {
        console.log(event);
    }
}

const app = new App();
export default app;
