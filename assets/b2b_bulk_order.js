const quantityDecreaseButtons = document.querySelectorAll(".quantity-decrease");
const quantityIncreaseButtons = document.querySelectorAll(".quantity-increase");
const addToCartButton = document.getElementById("add-to-cart--bulk");
const sidebarCart = document.querySelector("#dropdown-cart");
const sidebarCart__noItems = document.querySelector("#dropdown-cart .no-items");
const sidebarCart__hasItems = document.querySelector("#dropdown-cart .has-items");
const cartCount = document.querySelectorAll("header span[data-cart-count]");
const total = document.querySelector("#dropdown-cart .total .price");
const sidebarCartProducts =  document.querySelector(".mini-products-list");
const html =  document.querySelector("html");
const loader = document.querySelector('.loader');
let formData = {
  'items': []
};

const updateQuantity = (event, increment) => {
  const targetId = event.target.dataset.target;
  const quantityInput = document.querySelector(`#quantity_${targetId}`);
  let quantity = parseInt(quantityInput.value);

  increment ? quantity += 1 : quantity = Math.max(quantity - 1, 0);
  quantityInput.value = quantity;
}

quantityDecreaseButtons.forEach(button => {
  button.addEventListener("click", event => {
    updateQuantity(event, false);
  });
});

quantityIncreaseButtons.forEach(button => {
  button.addEventListener("click", event => {
    updateQuantity(event, true);
  });
});

addToCartButton.addEventListener("click", function() {
  formData.items = [];
  document.querySelectorAll('.bulk-order-table input[type="number"]').forEach(input => {
    const quantity = parseInt(input.value);
    const id = parseInt(input.id.split('_')[1])
    if (quantity > 0) {
      formData.items.push({'id': id, 'quantity': quantity});
    }
  });
  
  show(loader);
  formData.items.length ? ajaxAddToCart(formData) : errorPopup('All quantities are set to zero');
});

const ajaxAddToCart = (data) => {
  fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  }).then(response => {
    document.querySelectorAll('.bulk-order-table input[type="number"]').forEach(input => {
      input.value = 0
    });

    if(response.ok) {
      fetch('/cart.js')
      .then(response => response.json())
      .then(data => {
        window.location.href = "/cart";
        hide(loader);
      });
    } else {
      errorPopup("There's some errors with the items you want to add in the cart!");
    }
  }).catch(error => {
    const mssg = `Error adding products to cart: ${error}`;
    hide(loader);
    errorPopup(mssg);
  });
}

const errorPopup = (message) => {
  const errorModal = document.querySelector('.error-modal');
  const errorModalMessage = document.querySelector('.error-message');

  hide(loader);

  errorModalMessage.innerText = message;
  show(errorModal);

  setTimeout(function() {
    hide(errorModal);
  }, 2000);
}

const show = (element) => {
  element.style.opacity = 1;
  element.style.visibility = 'visible';
}

const hide = (element) => {
  element.removeAttribute('style');
}

document.querySelectorAll('.toggle-variants').forEach(button => {
  button.addEventListener('click', event => {
    const productId = event.target.dataset.target;
    const variants = document.getElementById(`variants-${productId}`);
    variants.classList.toggle('open');
    
    const buttonText = variants.classList.contains('open') ? 'Hide Variants' : 'Show Variants';
    event.target.innerText = buttonText
  });
});