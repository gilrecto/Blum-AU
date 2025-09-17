  import mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';

  class StoreLocator extends HTMLElement {
    constructor() {
      super();
      this.map = null;
      this.popup = null;
      this.stores = [];
    }

    connectedCallback() {
      const template = document.getElementById('store-locator-template');
      this.appendChild(template.content.cloneNode(true));
      this.initMap();
    }

    async initMap() {
      mapboxgl.accessToken = 'pk.eyJ1IjoibWJnaWwiLCJhIjoiY205cWtkdDY0MWNvaTJrc2U0OWlhN21jNCJ9.DYZamX-BEPu-Q52dSd-iHg';
      this.map = new mapboxgl.Map({
        container: this.querySelector('#map'),
        style: 'mapbox://styles/mbgil/cm9htlmo1000z01so9pzcccru',
        center: [133.2461994, -26.5189783],
        zoom: window.innerWidth < 768 ? 4.5 : 5.4,
        attributionControl: false
      });

      this.map.addControl(new mapboxgl.NavigationControl());
      await this.fetchStores();
      this.setupSearch();
      this.map.on('load', () => {
        this.addGeoJsonSource();
        this.addClusterLayers();
        this.addClickHandlers();
        this.addStoreList();
        this.fitMapToStores();
      });
    }

    async fetchStores() {
      const query = `{
        metaobjects(type: "our_partners", first: 100) {
          nodes {
            fields {
              key
              value
            }
          }
        }
      }`;

      const response = await fetch('/api/2023-10/graphql.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': '0dc576071e13449904c1ebeb00ac4e1f',
        },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();

      this.stores = json.data.metaobjects.nodes.map(node => {
        const obj = {};
        node.fields.forEach(field => {
          obj[field.key] = field.value;
        });
        return obj;
      });
    }

    addGeoJsonSource() {
      const features = this.stores.map(store => ({
        type: 'Feature',
        properties: {
          store_name: store.store_name,
          store_address: this.extractPlainText(store.store_address),
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(store.long), parseFloat(store.lat)],
        },
      }));

      this.map.addSource('stores', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });
    }

    fitMapToStores() {
      if (!this.stores.length) return;
      const bounds = new mapboxgl.LngLatBounds();
      this.stores.forEach(store => {
        bounds.extend([parseFloat(store.long), parseFloat(store.lat)]);
      });
      this.map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000
      });
    }

    addClusterLayers() {
      this.map.loadImage('/cdn/shop/files/MB_B2B_MapPin-UK.avif?v=1744331448', (error, image) => {
        if (!this.map.hasImage('store-pin') && !error && image) {
          this.map.addImage('store-pin', image);
        }

        this.map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'stores',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#61ace7',
            'circle-radius': 15,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#000000'
          }
        });

        this.map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'stores',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          }
        });

        this.map.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'stores',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'store-pin',
            'icon-size': 0.5,
            'icon-anchor': 'bottom'
          }
        });
      });
    }

    addClickHandlers() {
      this.map.on('click', 'clusters', (e) => {
        const features = this.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        this.map.getSource('stores').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          this.map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      this.map.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { store_name, store_address } = e.features[0].properties;
        const encodedAddress = encodeURIComponent(store_address);

        if (this.popup) this.popup.remove();
        this.popup = new mapboxgl.Popup({ offset: 40 })
          .setLngLat(coordinates)
          .setHTML(`
            <div class="info-box">
              <h3>${store_name}</h3>
              <p>${store_address}</p>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" target="_blank">Directions</a>
            </div>
          `)
          .addTo(this.map);
      });

      this.map.on('mouseenter', 'clusters', () => this.map.getCanvas().style.cursor = 'pointer');
      this.map.on('mouseleave', 'clusters', () => this.map.getCanvas().style.cursor = '');
      this.map.on('mouseenter', 'unclustered-point', () => this.map.getCanvas().style.cursor = 'pointer');
      this.map.on('mouseleave', 'unclustered-point', () => this.map.getCanvas().style.cursor = '');
    }

    addStoreList() {
      const list = this.querySelector('#store-list');
      list.innerHTML = '';
      this.stores.forEach(store => {
        const lng = parseFloat(store.long);
        const lat = parseFloat(store.lat);
        const plainTextAddress = this.extractPlainText(store.store_address);
        const li = document.createElement('li');
        li.innerHTML = `
          <h4>${store.store_name}</h4>
          <p style="font-size: 0.9em;">${plainTextAddress}</p>
        `;
        li.addEventListener('click', () => {
          this.map.flyTo({ center: [lng, lat], zoom: 8 });
        });
        list.appendChild(li);
      });
    }

    extractPlainText(jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        return parsed.children.map(child => child.children.map(grand => grand.value).join('')).join('\n');
      } catch (e) {
        return jsonStr;
      }
    }

    setupSearch() {
      const search = this.querySelector('#storeSearch');
      search.addEventListener('input', () => {
        const keyword = search.value.toLowerCase();
        const list = this.querySelectorAll('#store-list li');
        list.forEach(li => {
          li.style.display = li.textContent.toLowerCase().includes(keyword) ? '' : 'none';
        });
        this.fitMapToStores();
      });
    }
  }

  customElements.define('store-locator', StoreLocator);