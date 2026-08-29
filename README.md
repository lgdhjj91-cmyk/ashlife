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
- Cloud Firestore Standard for Joy Coin wallets and one-time vouchers.
- Storage is configured, although QR/order images are currently stored as compressed base64 in the database.

Admin login no longer uses frontend username/password environment variables or custom claims. Create an Email/Password user in Firebase Authentication, then sign in at `/admin`. Anonymous Joy Rewards users cannot access the admin dashboard.

Recommended admin security:

- Keep only trusted non-anonymous accounts in Firebase Authentication.
- Delete or disable access for any account that should no longer manage the site.
- Do not commit `.env.local`.
- Do not expose admin credentials in frontend code or README files.

Security tradeoff: every non-anonymous Firebase user can manage products, orders, payment settings, and site content. This includes customers who link a Joy Rewards guest wallet to an email/password account. Use custom claims or a separate allowlist if customer accounts are enabled and should not receive admin access.

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
3. Create the project's single **Cloud Firestore Standard** database in the Singapore region (`asia-southeast1`). The Standard database works on the Firebase Spark plan; do not select Enterprise edition.
4. Deploy Firestore rules and indexes without deploying Cloud Functions:

```bash
npx firebase-tools deploy --only firestore --project ashlife-6da65
```

Spark's free Firestore quota is sufficient for normal small-store use, but usage should still be monitored in Firebase Console. Game reward claims are created by the browser, so a determined user can manufacture coin claims; voucher codes, coin deductions, ownership, and one-time status transitions are constrained by `firestore.rules`.

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

Realtime Database rules are in `firebase.database.rules.json`. Firestore rules are in `firestore.rules`. Realtime Database rules allow any non-anonymous authenticated user to manage admin data, while Firestore keeps each Joy wallet private and permits authenticated voucher-code checks.

This intentionally removes the custom-claim requirement. If customers can create or link accounts, restore a custom claim or use an explicit UID allowlist before production because those accounts otherwise receive the same database permissions as the owner.

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
