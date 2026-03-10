# Metalbird Blum AU Theme

Shopify Online Store 2.0 theme for the Metalbird storefront. This codebase combines retail merchandising, campaign landing experiences, and B2B/wholesale functionality in a section-driven theme built with Liquid, Vite, and Tailwind CSS.

## Overview

This theme is designed to support more than a standard catalog storefront. In addition to core Shopify templates, it includes custom merchandising modules, campaign-specific layouts, localized storefront features, and operational tools for wholesale buyers.

## Feature Highlights

### Storefront and merchandising

- Online Store 2.0 architecture with reusable sections, blocks, snippets, and JSON templates
- Custom product discovery flows including predictive search, collection/search filtering, color swatches, and featured collection modules
- Quick shop modal, configurable quick add behavior, product recommendations, and sale badge support
- Rich product presentation with media galleries, hotspot merchandising, sticky purchase elements, and review/rating hooks
- Cart drawer and cart notification flows with add-to-cart confirmation handling
- Cart upsell logic and free-shipping / free-mini promotional hooks

### Content and campaign experiences

- Multiple layout experiences for the main storefront, gift shop, and LOTR/campaign pages
- Flexible content sections for slideshows, image banners, image-with-text, video banners, testimonials, timelines, logo lists, countdowns, and promotional timer bars
- Dedicated custom templates for branded landing pages such as About, FAQ, Help Center, customer reviews, product knowledge, merch guide, look book, and asset/resource pages
- Installation video modules with lazy-loaded media behavior
- Gift shop-focused merchandising sections and campaign-specific product presentation

### B2B and account functionality

- B2B context templates for product, collection, cart, page, header, and footer experiences
- Wholesale quick order form for bulk purchasing workflows
- Full customer account flow support including login, registration, addresses, order history, password reset, and account activation

### Localization and store discovery

- Locale files included for English, German, Spanish, French, Italian, and Japanese
- Country and language switchers for localized storefront control
- Geolocation helper hooks
- Partner/store locator section with selectable Google Maps or Mapbox implementation

### Integrations and performance

- SEO, Open Graph, and Twitter card metadata support
- Hooks for Loox, Judge.me ratings, Klaviyo onsite integration, VWO, and additional marketing/tracking snippets
- Vite-powered asset pipeline with versioned outputs into Shopify `assets/`
- Tailwind CSS v4 support alongside existing theme CSS
- Swiper-based sliders and lazy-loaded scripts/media
- Optimized header loading and instant page preloading support

## Key Templates and Experiences

The repo includes standard Shopify storefront templates plus several custom templates and alternate experiences:

- Home, collection, product, cart, search, blog, article, customer account, password, 404, and gift card
- Custom content pages such as About, FAQ, Help Center, customer reviews, look book, merch guide, product knowledge, and assets/resources
- Specialized storefront variants for gift shop, LOTR/campaign pages, and B2B contexts

## Tech Stack

- Shopify Liquid and JSON templates
- Shopify CLI
- Vite 5 with `vite-plugin-shopify`
- Tailwind CSS 4
- Swiper
- Vanilla JavaScript and modular theme assets

## Project Structure

```text
assets/      Compiled theme assets and standalone JS/CSS modules
blocks/      Reusable theme editor blocks
config/      Theme settings schema and stored theme settings
frontend/    Vite entrypoints, authored scripts, and styles
layout/      Main theme layouts and alternate campaign layouts
locales/     Translation files
sections/    Theme sections, including custom Metalbird modules
snippets/    Shared Liquid partials
templates/   JSON and Liquid templates for storefront/page types
```

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Shopify CLI
- Access to a Shopify store/theme

### Install dependencies

```bash
npm install
```

### Authenticate with Shopify

```bash
shopify auth login
```

### Start local development

```bash
npm run dev
```

This runs Shopify Theme Dev alongside the Vite development server. If you need to target a specific store or pass Shopify CLI flags, append them to the command, for example:

```bash
npm run dev -- --store your-store.myshopify.com
```

### Build and push the theme

```bash
npm run deploy
```

### Log out of Shopify CLI

```bash
npm run logout
```

## Contributor Notes

- Frontend source lives in `frontend/`; generated Vite assets are written into `assets/`
- Main frontend entrypoints are `frontend/entrypoints/main.js` and `frontend/entrypoints/main.css`
- Most storefront customization is section-driven through the Shopify theme editor
- Several features depend on Shopify-side configuration such as products, collections, locales, theme settings, app embeds, and third-party app setup

## License

MIT
