# ASHLIFE Website

React + Vite storefront for ASHLIFE Malaysia. The site supports EN/CN content, product catalogue browsing, cart, checkout, WhatsApp ordering, Shopee links, DIY/custom pages, and a Firebase-backed admin/order workflow.

## Run Locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill Firebase, WhatsApp, Shopee and base-path values.

## Build

```bash
npm run build
```

Useful launch builds:

```bash
npm run build:github
npm run build:domain
```

## GitHub Pages Vs Custom Domain

The default Vite base path is `/ashlife/`, which is correct for a GitHub Pages project URL like:

```text
https://username.github.io/ashlife/
```

For the main custom domain, build with `base: '/'`:

```bash
npm run build:domain
```

You can also set:

```env
VITE_BASE_PATH=/
```

Use `/ashlife/` only for the GitHub Pages project URL. Use `/` for the final main domain so assets and React routes resolve from the domain root.

## Deploy To GitHub Pages

1. Build with `npm run build:github` for the project URL, or `npm run build:domain` after the custom domain is connected.
2. Deploy the `dist` folder.
3. Keep `public/404.html` for GitHub Pages SPA route fallback.
4. After custom domain launch, update `public/sitemap.xml`, `public/robots.txt`, and `index.html` canonical/OG URLs if the final domain is not `https://ashlife.my/`.

## Firebase Setup

Required Firebase services:

- Realtime Database for `products`, `orders`, and `settings`.
- Firebase Authentication with Email/Password enabled for admin login.
- Storage is configured, although QR/order images are currently stored as compressed base64 in the database.

Admin login no longer uses frontend username/password environment variables. Create the owner/admin account in Firebase Authentication, then sign in at `/admin`.

Recommended admin security:

- Use one dedicated admin email.
- Add an `admin: true` custom claim to that Firebase Auth user for stricter rules.
- Do not commit `.env.local`.
- Do not expose admin credentials in frontend code or README files.

## Product Data Structure

Products can come from Firebase `products` and fall back to `public/data/products.json`.

Common fields:

```json
{
  "id": "hook-loop-cable-tie-roll",
  "name": "Hook & Loop Cable Tie Roll",
  "name_zh": "魔术贴电线扎带卷",
  "description": "Reusable cable tie roll...",
  "description_zh": "可重复使用...",
  "category": "Home Gadgets",
  "category_zh": "家居小物",
  "sku": "optional-sku",
  "price": 9.9,
  "stock": 12,
  "image": "/brand/shopee/cable-tie.webp",
  "images": ["/brand/shopee/cable-tie.webp"],
  "bestSeller": true,
  "variants": [
    {
      "id": "black",
      "name": "Black",
      "name_zh": "黑色",
      "price": 5.9,
      "stock": 10,
      "image": "/brand/shopee/webcam-cover.webp"
    }
  ]
}
```

If `stock` is missing, the storefront treats it as “confirm before order” instead of blocking the product. The ready-stock filter only includes products with explicit positive stock.

## Admin And Security Notes

- The public header does not show an Admin link.
- `/admin` still exists for manual owner access.
- Admin login uses Firebase Authentication.
- Public visitors should be able to read product/catalogue data and create checkout orders only.
- Admin users should manage products, orders, payment QR settings, and site content.
- Checkout orders are manually verified; stock is not deducted by public frontend writes.

Example Realtime Database rules are in `firebase.database.rules.json`. For production, prefer custom claims:

```json
"isAdmin": "auth != null && auth.token.admin === true"
```

If custom claims are not set yet, temporarily use `auth != null` for admin-only write sections while you finish setup, then tighten it before launch.

## SEO Checklist

- `index.html` has title, description, canonical, favicon, Open Graph, and Twitter card tags.
- `public/robots.txt` points to the sitemap.
- `public/sitemap.xml` includes homepage, shop, about, DIY, and product routes.
- Update the domain URLs if the production domain differs from `https://ashlife.my/`.
- Test the social preview with Facebook Sharing Debugger, WhatsApp preview, and Twitter/X card validator.
- Use real product images and descriptive alt text.

## Useful Environment Variables

```env
VITE_WHATSAPP_NUMBER=601133046104
VITE_SHOPEE_URL=https://shopee.com.my/ashleylife
VITE_SITE_URL=https://ashlife.my
VITE_BASE_PATH=/ashlife/
```

Switch `VITE_BASE_PATH=/` for the custom domain build.
