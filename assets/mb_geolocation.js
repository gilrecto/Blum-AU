class GeoPopupHandler {
  constructor() {
    this.geoPopup = document.getElementById('mb-geo-popup');
    this.getStorage = localStorage.getItem("MB_US_hide_geo_popup");
    this.closeButtons = document.querySelectorAll(".click_to_close");
    this.EU_COUNTRIES = [
      { code: 'DE', url: 'https://de.metalbird.eu/' },
      { code: 'FR', url: 'https://fr.metalbird.eu/' },
      { code: 'NL', url: 'https://nl.metalbird.eu/' }
    ];
    this.countryLatLong = [
      { latitude: -25.274400, longitude: 133.775100, place: 'AU', url: 'https://metalbird.com.au/' },
      { latitude: 52.370216, longitude: 4.895168, place: 'NL', url: 'https://www.metalbird.nl/' },
      { latitude: 43.651070, longitude: -79.347015, place: 'CA', url: 'https://metalbird.ca/' },
      { latitude: 44.500000, longitude: -89.500000, place: 'US', url: 'https://metalbird.com/' },
      { latitude: 50.04606, longitude: 15.2551, place: 'FR', url: 'https://www.metalbird.fr/' },
      { latitude: -36.848461, longitude: 174.763336, place: 'NZ', url: 'https://www.metalbird.co.nz/' },
      { latitude: 51.509865, longitude: -0.118092, place: 'UK', url: 'https://www.metalbird.co.uk/' }
    ];
    this.init();
  }

  // Method to initialize event listeners and other setup
  init() {
    this.setupCloseButton();
    this.getLocationData();
  }

  // Method to set up the close button
  setupCloseButton() {
    this.closeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        this.geoPopup.style.display = 'none';
        localStorage.setItem("MB_US_hide_geo_popup", "popup-hide");
        document.body.removeAttribute('style');
      });
    });
  }

  // Method to get URL parameters
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return params.toString();
  }

  // Method to get location data from the API
  getLocationData() {
    fetch('https://ipapi.co/json/?key=XqyOLgflhSDkWIlpPYH2JNREtUVYdeFhpDh3wTctmfy6ZcAOuw')
      .then(response => response.json())
      .then(data => {
        const { country_code: gl, country_name, continent_code, latitude: the_lat, longitude: the_long } = data;
        let needRedirection = true;

        let currentLocation = this.getCurrentLocation();
        let { location_url, location_place } = this.getNearestLocation(gl, the_lat, the_long);

        if (continent_code === 'EU') {
          this.EU_COUNTRIES.forEach((place) => {
            if (place.code === gl && location_url === currentLocation) {
              needRedirection = false;
            }
          });
        }

        if (location_url === currentLocation) {
          needRedirection = false;
          this.geoPopup.style.display = 'none';
          localStorage.setItem("MB_US_hide_geo_popup", "popup-hide");
        }

        if (needRedirection) {
          document.querySelector(".text_to_change").innerText = `${country_name}?`;
          if (!this.getStorage) {
            localStorage.setItem("MB_US_hide_geo_popup", "");
            this.getStorage = localStorage.getItem("MB_US_hide_geo_popup");
            this.geoPopup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
          } else if (this.getStorage === 'popup-hide') {
            this.geoPopup.style.display = 'none';
            document.body.removeAttribute('style');
          }

          this.setButtonRedirect(".link_to_update", location_url, location_place);
        }
      });
  }

  // Method to get the current location URL
  getCurrentLocation() {
    let url = window.location.href;
    let urlObj = new URL(url);
    urlObj.search = '';
    urlObj.hash = '';
    return `${urlObj.origin}/`;
  }

  // Method to find the nearest location based on the lat/long data
  getNearestLocation(gl, lat, long) {
    let nearestLocation = { location_url: '', location_place: '' };
    let distanceNearest = Infinity;

    this.countryLatLong.forEach((place) => {
      const locationDifference = this.calculateDistance(lat, long, place.latitude, place.longitude, 'K');
  
      if (place.place === gl) {
        distanceNearest = 0;
        nearestLocation = { location_place: place.place, location_url: place.url };
      } else if (locationDifference <= distanceNearest) {
        distanceNearest = locationDifference;
        nearestLocation = { location_place: place.place, location_url: place.url };
      }
    });

    return nearestLocation;
  }

  // Method to redirect the button with the calculated URL and location
  setButtonRedirect(button, baseUrl, region) {
    const params = this.getUrlParams();
    const fullUrl = `${baseUrl}?${params}`;
    const geoButton = this.geoPopup.querySelector(button);
    const regionText = geoButton.querySelector('.region');

    if (geoButton) {
      geoButton.href = params === '' ? baseUrl : fullUrl;
      regionText.innerText = region;
    }
  }

  // Method to calculate the distance between two locations
  calculateDistance(lat1, lon1, lat2, lon2, unit) {
    if (lat1 === lat2 && lon1 === lon2) return 0;
  
    const radlat1 = Math.PI * lat1 / 180;
    const radlat2 = Math.PI * lat2 / 180;
    const theta = lon1 - lon2;
    const radtheta = Math.PI * theta / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  
    if (dist > 1) dist = 1;
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI * 60 * 1.1515;
    if (unit === "K") dist *= 1.609344;
    if (unit === "N") dist *= 0.8684;
  
    return dist;
  }
}