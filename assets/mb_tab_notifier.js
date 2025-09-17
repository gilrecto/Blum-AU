class TabNotifier extends HTMLElement {
  constructor() {
    super();
    this.originalTitle = document.title;
    this.originalFavicon = this.getFaviconHref();
    this.message = this.dataset.title || 'Come back!';
    this.icon = this.dataset.icon || this.originalFavicon;
    this.pages = (this.dataset.pages || '').split(',').map(p => p.trim()).filter(Boolean);
    this.worker = null;
    this.typeIndex = 1;
    this.faviconFlashInterval = null;
  }

  connectedCallback() {
    if (!this.shouldRun()) return;
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('focus', this.onFocus);
  }

  disconnectedCallback() {
    this.stopWorker();
    this.stopFaviconFlash();
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('focus', this.onFocus);
  }

  shouldRun = () => {
    const path = location.pathname;
    return (
      (this.pages.includes('home') && path === '/') ||
      (this.pages.includes('pages') && path.includes('/pages/')) ||
      (this.pages.includes('product') && path.includes('/products/')) ||
      (this.pages.includes('catalog') && path.includes('/collections/')) ||
      (this.pages.includes('cart') && path.includes('/cart')) ||
      (this.pages.includes('cart_not_empty') && path.includes('/cart') && document.querySelector('tr.cart__row'))
    );
  };

  startWorker = () => {
    if (this.worker) return; // prevent duplicates
    const workerCode = () => {
      setInterval(() => postMessage(Date.now()), 350);
    };
    const blob = new Blob([`(${workerCode.toString()})()`], { type: 'text/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = () => {
      if (!document.hasFocus()) {
        document.title = this.message.substring(0, this.typeIndex);
        this.typeIndex = (this.typeIndex % this.message.length) + 1;
      }
    };
  };

  stopWorker = () => {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  };

  startFaviconFlash = () => {
    if (this.faviconFlashInterval) return;
    let toggle = false;
    this.faviconFlashInterval = setInterval(() => {
      this.setFavicon(toggle ? this.originalFavicon : this.icon);
      toggle = !toggle;
    }, 700);
  };

  stopFaviconFlash = () => {
    clearInterval(this.faviconFlashInterval);
    this.faviconFlashInterval = null;
    this.setFavicon(this.originalFavicon);
  };

  onBlur = () => {
    document.title = this.message;
    this.startWorker();
    this.startFaviconFlash();
  };

  onFocus = () => {
    document.title = this.originalTitle;
    this.typeIndex = 1;
    this.stopWorker();
    this.stopFaviconFlash();
  };

  getFaviconHref = () => {
    const link = document.querySelector('link[rel="shortcut icon"]');
    return link ? link.href : '/favicon.ico';
  };

  setFavicon = (href) => {
    let link = document.querySelector('link[rel="shortcut icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.head.appendChild(link);
    }
    link.href = href;
  };
}

customElements.define('tab-notifier', TabNotifier);