class FreeMiniSelector extends HTMLElement {
  constructor() {
    super();
    this.qualifierType = this.dataset.qualifier;
    this.minQty = Number(this.dataset.minQty || 0);
    this.minSpend = Number(this.dataset.minSpend || 0);
    this.widgetTitle = this.getAttribute('widget-title') || 'CHOOSE A FREE MINI';
    this.newWidgetTitle = 'Choose A Free Mini';
    this.checkoutBtn = document.querySelector('.cart-drawer--checkout-btn');
    this.hasShownPopup = false;
    this.isUpdating = false;
    this.titleChanged = false;
    this.loader = null;
    this.popup = null;
    this.debounceTimer = null;
  }

  static get observedAttributes() {
    return ['mode'];
  }

  connectedCallback() {
    this._bindUI();
    this._wireCartEvents();
    this._initializeElements();
    setTimeout(() => this._initialCheck(), 500);
  }

  attributeChangedCallback(name) {
    if (name === 'mode') this._applyMode();
  }

  _bindUI() {
    this.titleEl = this.querySelector('.free-minis-widget > .title');
    this.items = this.querySelectorAll('.mini-items .item');
    this.changeButtons = this.querySelectorAll('button[change-cart-mini]');

    this.changeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.isUpdating) return;
        const itemEl = btn.closest('.item');
        if (!itemEl) return;
        this.changeMini(itemEl);
      });
    });
  }

  _wireCartEvents() {
    document.addEventListener('cart:updated', () => this._debouncedCheck());
    document.addEventListener('productAddedToCart', (e) => this._debouncedCheck(e?.detail?.cartData));
    document.addEventListener('productRemovedFromCart', () => this._debouncedCheck());
    document.addEventListener('shopify:section:load', () => this._debouncedCheck());
    document.addEventListener('cart:refresh', () => this._debouncedCheck());
    document.addEventListener('cart:change', () => this._debouncedCheck());
  }

  _debouncedCheck(cartData = null) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this._checkAndSync(cartData), 300);
  }

  _initializeElements() {
    this.loader = document.getElementById('freeMiniLoader');
    this.popup = document.getElementById('freeMiniPopup');
    
    if (this.popup) {
      const closeBtn = document.getElementById('freeMiniPopupClose');
      const overlay = document.getElementById('freeMiniPopupOverlay');
      
      if (closeBtn) closeBtn.addEventListener('click', () => this._hidePopup());
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this._hidePopup();
        });
      }
    }
  }

  async _initialCheck() {
    try {
      const cart = await this._getCart();
      if (cart?.items?.length > 0) {
        await this._checkAndSync(cart);
      } else {
        this._updateWidgetMode(false);
        this._hideAllButtons();
      }
    } catch (error) {
      console.error('Error during initial check:', error);
    }
  }

  _applyMode() {
    const mode = this.getAttribute('mode');
    this.style.display = mode === 'hide' ? 'none' : 'block';
  }

  _showLoader() {
    if (this.loader && !this.loader.classList.contains('ts:flex')) {
      this.loader.classList.remove('ts:hidden');
      this.loader.classList.add('ts:flex');
    }
  }

  _hideLoader() {
    if (this.loader && this.loader.classList.contains('ts:flex')) {
      this.loader.classList.add('ts:hidden');
      this.loader.classList.remove('ts:flex');
    }
  }

  _showPopup() {
    if (this.popup) {
      this.popup.classList.remove('ts:hidden');
      this.popup.classList.add('ts:flex');
      setTimeout(() => this._hidePopup(), 3000);
    }
  }

  _hidePopup() {
    if (this.popup) {
      this.popup.classList.add('ts:hidden');
      this.popup.classList.remove('ts:flex');
    }
  }

  async _getCart() {
    const res = await fetch('/cart.js', { credentials: 'same-origin' });
    return res.json();
  }

  _collectMiniIds() {
    return Array.from(this.items).map(el => Number(el.getAttribute('product-id')));
  }

  _findMiniInCart(cart, miniIds) {
    let inCart = false, count = 0, id = null;
    cart.items.forEach(item => {
      if (miniIds.includes(item.id)) {
        inCart = true;
        count += item.quantity;
        id = item.id;
      }
    });
    return { inCart, count, id };
  }

  async _checkAndSync(passedCart = null) {
    if (this.isUpdating) return;
    
    try {
      const cart = passedCart || await this._getCart();
      const miniIds = this._collectMiniIds();
      const { inCart, count, id } = this._findMiniInCart(cart, miniIds);
      
      // If cart is empty, hide everything immediately
      if (!cart.items || cart.items.length === 0) {
        this._updateWidgetMode(false);
        this._hideAllButtons();
        this.hasShownPopup = false;
        this.titleChanged = false;
        return;
      }
      
      // Calculate eligible totals
      let qty = cart.item_count;
      let spend = cart.total_price / 100;
      
      // Get product data for exclusions
      const productPromises = cart.items.map(item => 
        fetch(`/products/${item.handle}.js`).then(r => r.json()).catch(() => null)
      );
      
      const products = await Promise.all(productPromises);
      const processedIds = [];
      
      products.forEach((product, index) => {
        if (!product) return;
        
        const item = cart.items[index];
        let prodId = product.variants[0]?.id;
        
        // Find correct variant
        if (product.variants.length > 1) {
          const variant = product.variants.find(v => v.id === item.id);
          if (variant) prodId = variant.id;
        }
        
        if (!processedIds.includes(prodId)) {
          processedIds.push(prodId);
          
          const tags = product.tags || [];
          const isExcluded = tags.includes('no_free_mini') ||  product.type === 'Gift Cards' || product.type === 'Insurance';
          
          cart.items.forEach(item => {
            if (item.id === prodId) {
              if (isExcluded) {
                qty = qty - item.quantity;
                if (this.qualifierType === 'min_spend' && 
                    (product.type === 'Gift Cards' || product.type === 'Insurance')) {
                  spend -= (item.price / 100);
                }
              }
            }
          });
        }
      });
      
      // Remove free minis from count
      cart.items.forEach(item => {
        if (miniIds.includes(item.id)) {
          qty = qty - item.quantity;
        }
      });

      // Check qualification
      const qualifies = this.qualifierType === 'min_spend' 
        ? spend >= this.minSpend 
        : qty >= this.minQty;

      const hasEligibleProducts = qty > 0 || spend > 0;
      
      if (hasEligibleProducts) {
        this._updateWidgetMode(true);
        
        if (qualifies) {
          // Only change title once when qualifying
          if (!this.titleChanged) {
            this._updateTitle(this.newWidgetTitle);
            this.titleChanged = true;
          }

          if (!inCart && !this.hasShownPopup) {
            await this._addMini(miniIds[0], 'new');
            this._showPopup();
            this.hasShownPopup = true;
          } else if (count > 1) {
            await this._setMiniQuantity(id, 1);
          }
          
          this._updateMiniButtons(id || miniIds[0], true);
        } else {
          // Not qualified - hide buttons and reset title
          this._updateTitle(this.widgetTitle);
          this.titleChanged = false;
          this._hideAllButtons();
          this.hasShownPopup = false;
          
          if (inCart) {
            await this._removeMini(id);
          }
        }
      } else {
        // No eligible products
        this._updateWidgetMode(false);
        this._hideAllButtons();
        this.hasShownPopup = false;
        this.titleChanged = false;
        
        if (inCart) {
          await this._removeMini(id);
        }
      }
    } catch (error) {
      console.error('Error in _checkAndSync:', error);
    }
  }

  _updateTitle(text) {
    if (this.titleEl) this.titleEl.textContent = text;
  }

  _hideAllButtons() {
    this.items.forEach(el => {
      el.classList.remove('mini--in-cart');
      const btn = el.querySelector('button[change-cart-mini]');
      if (btn) {
        btn.style.display = 'none';
        btn.disabled = false;
      }
    });
  }

  _updateMiniButtons(selectedVariantId, showButtons = false) {
    this.items.forEach(el => {
      const variantId = Number(el.getAttribute('product-id'));
      const btn = el.querySelector('button[change-cart-mini]');
      const span = btn?.querySelector('span');
      
      if (btn && span) {
        if (showButtons) {
          btn.style.display = 'block';
          
          if (variantId === selectedVariantId) {
            el.classList.add('mini--in-cart');
            btn.disabled = true;
            span.textContent = 'IN CART';
          } else {
            el.classList.remove('mini--in-cart');
            btn.disabled = false;
            span.textContent = 'CHANGE';
          }
        } else {
          btn.style.display = 'none';
          btn.disabled = false;
        }
      }
    });
  }

  _disableAllButtons() {
    this.changeButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
    });
  }

  _enableAllButtons() {
    this.changeButtons.forEach(btn => {
      btn.disabled = false;
      btn.style.pointerEvents = 'auto';
    });
  }

  async _addMini(variantId, kind = 'new') {
    if (this.isUpdating) return;
    
    try {
      this.isUpdating = true;
      this._disableAllButtons();
      this._showLoader();
      
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1 }] })
      });
      
      if (!response.ok) throw new Error('Failed to add mini');
      
      await this._refreshCart();
      
    } catch (error) {
      console.error('Error adding mini:', error);
    } finally {
      this.isUpdating = false;
      this._enableAllButtons();
      this._hideLoader();
    }
  }

  async _removeMini(variantId) {
    if (this.isUpdating) return;
    
    try {
      this.isUpdating = true;
      this._disableAllButtons();
      this._showLoader();
      
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(variantId), quantity: 0 })
      });
      
      if (!response.ok) throw new Error('Failed to remove mini');
      
      await this._refreshCart();
      
    } catch (error) {
      console.error('Error removing mini:', error);
    } finally {
      this.isUpdating = false;
      this._enableAllButtons();
      this._hideLoader();
    }
  }

  async _setMiniQuantity(variantId, qty) {
    if (this.isUpdating) return;
    
    try {
      this.isUpdating = true;
      this._showLoader();
      
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(variantId), quantity: qty })
      });

      await this._refreshCart();
    } catch (error) {
      console.error('Error setting mini quantity:', error);
    } finally {
      this.isUpdating = false;
      this._hideLoader();
    }
  }

  async changeMini(targetItemEl) {
    if (this.isUpdating) return;
    
    const newId = Number(targetItemEl.getAttribute('product-id'));
    const cart = await this._getCart();
    const miniIds = this._collectMiniIds();
    const { inCart, id: currentId } = this._findMiniInCart(cart, miniIds);

    if (inCart && currentId === newId) return;

    try {
      this.isUpdating = true;
      this._disableAllButtons();
      this._showLoader();
      
      if (inCart && currentId) {
        await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: String(currentId), quantity: 0 })
        });
      }
      
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(newId), quantity: 1 }] })
      });
      
      await this._refreshCart();
      this._updateMiniButtons(newId, true);
      
    } catch (error) {
      console.error('Error changing mini:', error);
    } finally {
      this.isUpdating = false;
      this._enableAllButtons();
      this._hideLoader();
    }
  }

  async _refreshCart() {
    try {
      // Get fresh cart data
      const freshCart = await this._getCart();
      
      // Update cart counts in header and other locations
      const cartCounts = document.querySelectorAll('.js-cart-count, .js-cart-form-item_count, .header__cart-count .cart-count-number');
      cartCounts.forEach(count => {
        if (count) count.textContent = freshCart.item_count;
      });
      
      // Update header cart visibility
      const headerCartCount = document.querySelector('.header__cart-count');
      if (headerCartCount) {
        headerCartCount.className = headerCartCount.className.replace(/header-cart-count-\d+/, `header-cart-count-${freshCart.item_count}`);
        if (freshCart.item_count === 0) {
          headerCartCount.classList.add('opacity-0', 'hidden-xs');
        } else {
          headerCartCount.classList.remove('opacity-0', 'hidden-xs');
        }
      }
      
      // Trigger cart drawer refresh if it exists
      if (window.shtCartDrawer && typeof window.shtCartDrawer.refreshCart === 'function') {
        window.shtCartDrawer.refreshCart();
      }
      
      // Trigger cart notification panel refresh if it exists
      if (window.cartNotificationPanel && typeof window.cartNotificationPanel.refresh === 'function') {
        window.cartNotificationPanel.refresh();
      }
      
      // Update cart drawer content if open
      const cartDrawer = document.querySelector('#shtCartDrawer');
      if (cartDrawer && !cartDrawer.hasAttribute('hidden')) {
        try {
          const response = await fetch(`${window.location.origin}${window.routes.cart_url}?section_id=cart-drawer`);
          if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('.cart-drawer__wrapper');
            const currentContent = cartDrawer.querySelector('.cart-drawer__wrapper');
            if (newContent && currentContent) {
              currentContent.innerHTML = newContent.innerHTML;
            }
          }
        } catch (error) {
          console.error('Error updating cart drawer:', error);
        }
      }
      
      // Update main cart page if we're on it
      if (window.location.pathname === '/cart') {
        try {
          const response = await fetch(`${window.location.origin}/cart?section_id=main-cart`);
          if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('#mainCartContainer');
            const currentContent = document.querySelector('#mainCartContainer');
            if (newContent && currentContent) {
              currentContent.innerHTML = newContent.innerHTML;
            }
          }
        } catch (error) {
          console.error('Error updating main cart:', error);
        }
      }
      
      // Dispatch cart events
      document.dispatchEvent(new CustomEvent('cart:updated', { 
        detail: { cart: freshCart } 
      }));
      
      // Update free shipping bar if it exists
      const freeShippingBars = document.querySelectorAll('sht-free-shipping-bar');
      freeShippingBars.forEach(bar => {
        if (bar.dataset.totalPrice !== undefined) {
          bar.dataset.totalPrice = freshCart.total_price;
          if (bar.updateProgress && typeof bar.updateProgress === 'function') {
            bar.updateProgress();
          }
        }
      });
      
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  }

  _updateWidgetMode(show) {
    this.setAttribute('mode', show ? 'show' : 'hide');
  }
}

customElements.define('free-mini-selector', FreeMiniSelector);