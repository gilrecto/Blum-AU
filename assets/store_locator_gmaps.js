class StoreLocator extends HTMLElement {
  constructor() {
    super();
    this.map = null;
    this.markers = [];
    this.storeData = [];
  }

  async connectedCallback() {
    this.innerHTML = `
      <div class="map-controls" style="margin-bottom: 1rem;">
        <input type="text" placeholder="Search stores..." id="storeSearch" style="width: 100%; padding: 8px;" />
      </div>
      <div style="display: flex; flex-direction: column-reverse; gap: 25px;">
        <div id="storeList"></div>
        <div id="map"></div>
      </div>
    `;

    await this.loadGoogleMaps();
    this.storeData = await this.fetchStores();
    this.initMap(this.storeData);
    this.initSearch();
  }

  async loadGoogleMaps() {
    return new Promise((resolve) => {
      if (window.google && window.google.maps) return resolve();

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=SECRET_KEY&callback=initMapAPI&libraries=marker`;
      script.async = true;
      script.defer = true;
      window.initMapAPI = resolve;
      document.head.appendChild(script);
    });
  }

  async fetchStores() {
    const query = `
      {
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

    return json.data.metaobjects.nodes.map(node => {
      const obj = {};
      node.fields.forEach(field => {
        obj[field.key] = field.value;
      });
      return obj;
    });
  }

  createCustomPin(store) {
    const pin = document.createElement('div');
    pin.className = 'custom-pin';
    pin.innerHTML = `<img src="/cdn/shop/files/MB_B2B_MapPin-UK.avif?v=1744331448" alt="${store.store_name}" width="30"/>`;
    return pin;
  }

  initMap(stores) {
    const isMobile = window.innerWidth <= 768;
    const mapOptions = {
      zoom: isMobile ? 4.5 : 5.4,
      center: isMobile
        ? { lat: -24.6439839, lng: 133.6174899 }
        : { lat: -26.5189783, lng: 133.2461994 },
      mapId: '39b40fc33f5b1288',
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: false,
      scaleControl: false,
    };
    
    this.map = new google.maps.Map(this.querySelector('#map'), mapOptions);
  
    const listEl = this.querySelector('#storeList');
    listEl.innerHTML = '';
  
    // Shared InfoWindow instance
    const sharedInfoWindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();
  
    const advancedMarkers = stores.map((store, i) => {
      const position = {
        lat: parseFloat(store.lat),
        lng: parseFloat(store.long),
      };

      bounds.extend(position);
  
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: this.map,
        content: this.createCustomPin(store),
        title: store.store_name,
      });
  
      const addressText = extractPlainText(store.store_address || '');
      const encodedAddress = encodeURIComponent(addressText);
  
      const infoContent = `
        <div class="info-box">
          <h3>${store.store_name}</h3>
          <p>${addressText}</p>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}" target="_blank" rel="noopener noreferrer">
            Directions
          </a>
        </div>
      `;
  
      marker.addListener('gmp-click', () => {
        sharedInfoWindow.setContent(infoContent);
        sharedInfoWindow.open(this.map, marker);
      });
  
      // Store list item
      const storeItem = document.createElement('div');
      storeItem.className = 'store-item';
      storeItem.style.padding = '8px 0';
      storeItem.style.borderBottom = '1px solid #eee';
      storeItem.innerHTML = `
        <h4>${store.store_name}</h4>
        <p style="font-size: 0.9em;">${addressText}</p>
      `;
      storeItem.addEventListener('click', () => {
        google.maps.event.trigger(marker, 'gmp-click');
        this.map.panTo(marker.position);
        this.map.setZoom(10);
      });
      listEl.appendChild(storeItem);
  
      this.markers.push(marker);
      return marker;
    });

    this.map.fitBounds(bounds);
  
    // Marker clustering
    new markerClusterer.MarkerClusterer({ map: this.map, markers: advancedMarkers });
  }

  initSearch() {
    const input = this.querySelector('#storeSearch');
    input.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase();

      this.markers.forEach((marker, index) => {
        const store = this.storeData[index];
        const match = store.store_name.toLowerCase().includes(keyword) ||
                      extractPlainText(store.store_address || '').toLowerCase().includes(keyword);

        marker.map = match ? this.map : null;

        const item = this.querySelectorAll('.store-item')[index];
        item.style.display = match ? '' : 'none';
      });
    });
  }
}

customElements.define('store-locator', StoreLocator);

const extractPlainText = (richTextJson) => {
  try {
    const obj = JSON.parse(richTextJson);
    const paragraphs = obj.children || [];
    return paragraphs
      .map(p => (p.children || []).map(child => child.value).join(''))
      .join('\n');
  } catch (e) {
    console.warn('Failed to parse richtext:', richTextJson);
    return richTextJson;
  }
}
