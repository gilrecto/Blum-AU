// import Swiper bundle with all modules installed
import Swiper from 'swiper/bundle';

// import styles bundle
import 'swiper/css/bundle';

class SwiperSlider extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this.swiperInstance = null;
    this.isWaitingForConfig = true; // Wait for the config to be set
  }

  connectedCallback() {
    if (this._config) {
      this.handleResponsiveSwiper();
    }
    window.addEventListener('resize', this.handleResponsiveSwiper.bind(this));
    
    // Fallback: hide skeleton after 3 seconds regardless
    setTimeout(() => {
      this.hideSkeleton();
    }, 3000);
  }

  set config(newConfig) {
    this._config = newConfig;
    this.isWaitingForConfig = false;
    this.handleResponsiveSwiper(true);
    
    // Show skeleton initially
    this.showSkeleton();
  }

  get config() {
    return this._config;
  }

  initializeSwiper(config) {
    if (this.swiperInstance) return;

    const defaultConfig = {
      slidesPerView: 1,
      spaceBetween: 10,
      loop: false,
      freeMode: true,
      grabCursor: true,
      breakpoints: {},
      on: {
        init: () => {
          this.hideSkeleton();
        },
        imagesReady: () => {
          this.hideSkeleton();
        }
      }
    };

    const finalConfig = { ...defaultConfig, ...(config || {}) };
    this.swiperInstance = new Swiper(this.querySelector('.swiper'), finalConfig);
  }

  destroySwiper() {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = null;
    }
  }

  handleResponsiveSwiper(forceRecheck = false) {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    if (this.isWaitingForConfig) return; // Wait until config is set

    if (isMobile && this.hasAttribute('destroy-on-mobile')) {
      if (this.swiperInstance) {
        this.destroySwiper();
      }
      this.classList.add('grid-view');
    } else {
      if (!this.swiperInstance || forceRecheck) {
        this.classList.remove('grid-view');
        this.initializeSwiper(this._config);
      }
    }
  }

  hideSkeleton() {
    const skeletonId = this.getAttribute('data-skeleton-id');
    if (skeletonId) {
      const skeleton = document.getElementById(skeletonId);
      if (skeleton) {
        skeleton.style.display = 'none';
        this.classList.remove('ts:opacity-0');
        this.classList.add('ts:opacity-100');
      }
    }
  }

  showSkeleton() {
    const skeletonId = this.getAttribute('data-skeleton-id');
    if (skeletonId) {
      const skeleton = document.getElementById(skeletonId);
      if (skeleton) {
        skeleton.style.display = 'flex';
        this.classList.add('ts:opacity-0');
        this.classList.remove('ts:opacity-100');
      }
    }
  }
}

customElements.define('swiper-slider', SwiperSlider);
