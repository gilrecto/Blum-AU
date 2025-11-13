/**
 * Quick Add Direct to Cart Component
 * Handles direct add to cart functionality for product cards
 */
class SHTQuickAddDirect {
  constructor() {
    this.buttons = document.querySelectorAll('.js-quick-add-direct');
    this.cartNotiType = document.body.getAttribute('data-cart-show-type');
    this.cartType = document.body.getAttribute('data-cart-type');
    this.stickyHeader = SHTHelper.qs('sht-sticky-header');
    this.headerCartStatus = SHTHelper.qs('#headerCartStatus');

    this.init();
  }

  init() {
    this.buttons.forEach(button => {
      button.addEventListener('click', this.handleQuickAdd.bind(this, button));
    });
  }

  async handleQuickAdd(button, event) {
    event.preventDefault();

    if (button.classList.contains('loading')) {
      return;
    }

    const variantId = button.dataset.productId;

    if (!variantId) {
      console.error('No variant ID found');
      return;
    }

    this.setLoadingState(button, true);

    try {
      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', '1');

      const config = {
        ...SHTHelper.fetchConfigHTTP,
        body: formData
      };

      const response = await fetch(routes.cart_add_url, config);
      const data = await response.json();

      if (data.status) {
        this.showError(button, data.description || data.message);
      } else {
        this.handleSuccess(button, data);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showError(button, 'An error occurred. Please try again.');
    } finally {
      this.setLoadingState(button, false);
    }
  }

  setLoadingState(button, isLoading) {
    const spinner = button.querySelector('.js-quick-add-spinner');

    if (isLoading) {
      button.classList.add('loading');
      button.setAttribute('disabled', 'disabled');
      if (spinner) {
        spinner.classList.remove('hidden');
      }
    } else {
      button.classList.remove('loading');
      button.removeAttribute('disabled');
      if (spinner) {
        spinner.classList.add('hidden');
      }
    }
  }

  handleSuccess(button, data) {
    if (this.stickyHeader && this.stickyHeader.dataset.isEnabled && typeof this.stickyHeader.reveal === 'function') {
      this.stickyHeader.reveal();
    }

    if (this.headerCartStatus) {
      this.headerCartStatus.classList.remove('header-cart-status--animate');
    }

    if (typeof SHTHelper.forceUpdateCartStatus === 'function') {
      SHTHelper.forceUpdateCartStatus(data);
    }

    if (this.cartNotiType === 'show_drawer' && this.cartType === 'drawer') {
      setTimeout(() => {
        const cartDrawer = SHTHelper.qs('sht-cart-drwr');
        if (cartDrawer && typeof cartDrawer.openDrawer === 'function') {
          cartDrawer.openDrawer(button);
        }
      }, 300);
    } else if (this.cartType === 'page') {
      window.location.assign(window.routes.cart_url);
    }

    this.showSuccessFeedback(button);
  }

  showSuccessFeedback(button) {
    const btnText = button.querySelector('.js-quick-add-btn-text');
    if (btnText) {
      const originalText = btnText.textContent;
      btnText.textContent = '✓ Added';

      setTimeout(() => {
        btnText.textContent = originalText;
      }, 2000);
    }
  }

  showError(button, message) {
    console.error('Add to cart error:', message);

    const btnText = button.querySelector('.js-quick-add-btn-text');
    if (btnText) {
      const originalText = btnText.textContent;
      btnText.textContent = 'Error';

      setTimeout(() => {
        btnText.textContent = originalText;
      }, 2000);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SHTQuickAddDirect();
  });
} else {
  new SHTQuickAddDirect();
}

document.addEventListener('shopify:section:load', () => {
  new SHTQuickAddDirect();
});