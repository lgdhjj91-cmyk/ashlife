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
- Firebase Authentication with Anonymous and Email/Password enabled.
- Cloud Functions in `asia-southeast1` for Joy Coin wallet and voucher operations.
- Storage is configured, although QR/order images are currently stored as compressed base64 in the database.

Admin login no longer uses frontend username/password environment variables. Create the owner/admin account in Firebase Authentication, then sign in at `/admin`.

Recommended admin security:

- Use one dedicated admin email.
- Add an `admin: true` custom claim to that Firebase Auth user for stricter rules.
- Do not commit `.env.local`.
- Do not expose admin credentials in frontend code or README files.

### Joy Coin vouchers

The Playroom now gives every visitor a private Firebase guest wallet without forcing registration. A guest can redeem Joy Coins for a global voucher code, copy that code to another browser or device, and use it at checkout without signing in. Linking an optional email/password account keeps the same wallet on future signed-in devices.

Voucher tiers:

- 100 Joy Coins = RM1 off, minimum item subtotal RM10.
- 200 Joy Coins = RM2 off, minimum item subtotal RM15.
- 500 Joy Coins = RM5 off, minimum item subtotal RM20.

Only one Joy voucher can be used per order. Delivery is not discounted. Checkout automatically suggests the best eligible saved voucher, while the customer can keep it, choose another saved voucher, or enter a code manually. Pending orders reserve the voucher; confirmed/completed orders consume it; rejected/cancelled orders restore it.

Before production use:

1. In Firebase Console, enable **Authentication → Sign-in method → Anonymous**.
2. Enable **Email/Password** as well if customers should be able to keep their wallet through an optional account.
3. Install the function dependencies with `npm --prefix functions install`.
4. Deploy the server operations and database rules:

```bash
npx firebase-tools deploy --only functions,database --project YOUR_FIREBASE_PROJECT_ID
```

The frontend function region defaults to `asia-southeast1` and can be changed with `VITE_FIREBASE_FUNCTIONS_REGION`.

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

Set the `admin: true` custom claim on the owner account before using the admin dashboard. Do not use `auth != null` as an admin rule because ordinary visitors use anonymous Firebase identities for Joy Rewards.

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
