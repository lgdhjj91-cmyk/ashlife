# Homepage Shopping Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the long ASHLIFE homepage with a six-section shopping-first experience while preserving existing routes, product behaviour, brand assets and admin-configured focus products.

**Architecture:** Move homepage copy, category definitions and product-selection logic into a small pure module. Recompose `Home.jsx` around six focused sections and replace the page stylesheet with a responsive, brand-preserving layout. Keep `ProductCard`, context providers and existing external ordering links unchanged.

**Tech Stack:** React 19, React Router 7, Vite 5, native CSS, Lucide React, Node test runner

## Global Constraints

- Modify only the homepage implementation and its new focused content module.
- Preserve all routes, navigation labels, product detail behaviour, cart behaviour and other pages.
- Preserve `useProducts`, `useLanguage`, `useSiteContent` and admin-controlled `homeFocusProductIds`.
- Use the existing teal-led ASHLIFE palette, Quicksand headings, Nunito body type, brand photography and Lucide icon family.
- Render exactly six homepage content sections before the existing footer.
- Render exactly one product grid with four products.
- Keep the hero headline to two desktop lines and supporting copy to 20 words or fewer.
- Keep Playroom below product discovery and visually secondary to shopping.
- Use one soft card radius system, pill buttons and teal as the only action accent.
- Add no new third-party dependencies.
- Use no em-dash or en-dash characters in visible homepage copy.
- Preserve English and Chinese content paths.

---

## File Structure

- Create `src/pages/homeContent.js`: bilingual homepage copy, six category definitions and pure product-selection helpers.
- Create `src/pages/homeContent.test.js`: Node tests for product priority, deduplication, stock fallback and copy limits.
- Modify `src/pages/Home.jsx`: render the approved six-section shopping flow.
- Modify `src/pages/Home.css`: provide the complete desktop, tablet, mobile and reduced-motion presentation.

### Task 1: Homepage content and product selection

**Files:**
- Create: `src/pages/homeContent.test.js`
- Create: `src/pages/homeContent.js`

**Interfaces:**
- Consumes: product objects with `id`, `stock`, `variants`, `bestSeller`, `popular` or `featured`; configured focus product IDs; current language code.
- Produces: `HOME_CATEGORIES`, `getHomeCopy(language)` and `selectHomepageProducts(products, focusIds, limit)`.

- [ ] **Step 1: Write the failing product-priority test**

Create `src/pages/homeContent.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOME_CATEGORIES,
  getHomeCopy,
  selectHomepageProducts,
} from './homeContent.js';

test('homepage products prioritize configured products and remove duplicates', () => {
  const products = [
    { id: 'popular', popular: true, stock: 5 },
    { id: 'focus-two', stock: 2 },
    { id: 'focus-one', stock: 1 },
    { id: 'fallback', stock: 4 },
  ];

  const selected = selectHomepageProducts(
    products,
    ['focus-one', 'focus-two', 'focus-one'],
    4
  );

  assert.deepEqual(
    selected.map((product) => product.id),
    ['focus-one', 'focus-two', 'popular', 'fallback']
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test src/pages/homeContent.test.js
```

Expected: FAIL because `src/pages/homeContent.js` does not exist.

- [ ] **Step 3: Add failing fallback and content-contract tests**

Append:

```js
test('homepage products fall back to flagged, in-stock and remaining products', () => {
  const products = [
    { id: 'empty', stock: 0 },
    { id: 'variant-stock', variants: [{ stock: 0 }, { stock: 3 }] },
    { id: 'featured', featured: true, stock: 0 },
    { id: 'plain' },
  ];

  const selected = selectHomepageProducts(products, [], 4);

  assert.deepEqual(
    selected.map((product) => product.id),
    ['featured', 'variant-stock', 'empty', 'plain']
  );
});

test('homepage content stays concise and exposes six categories', () => {
  for (const language of ['en', 'zh']) {
    const content = getHomeCopy(language);
    assert.equal(content.hero.subtitle.trim().split(/\s+/).length <= 20, true);
    assert.equal(content.hero.primaryAction.length > 0, true);
    assert.equal(content.hero.secondaryAction.length > 0, true);
    assert.equal(content.ordering.points.length, 4);
  }

  assert.equal(HOME_CATEGORIES.length, 6);
});
```

The production changes these tests catch are incorrect priority ordering, duplicate products, loss of stock fallback, overlong hero copy or missing category and ordering content.

- [ ] **Step 4: Implement the pure content module**

Create `src/pages/homeContent.js` with:

```js
import {
  Cable,
  Gift,
  Home,
  Sparkles,
  Store,
  Utensils,
} from 'lucide-react';
import { normalizeVariants } from '../utils/productVariants.js';

export const HOME_CATEGORIES = [
  { key: 'home', icon: Home, labelEn: 'Home Essentials', labelZh: '家居实用', to: '/shop?category=Home%20Gadgets' },
  { key: 'cable', icon: Cable, labelEn: 'Cable Management', labelZh: '电线收纳', to: '/shop?search=cable' },
  { key: 'kitchen', icon: Utensils, labelEn: 'Kitchen Helpers', labelZh: '厨房小帮手', to: '/shop?category=Cleaning%20Tools' },
  { key: 'diy', icon: Sparkles, labelEn: 'DIY & Craft', labelZh: 'DIY 手作', to: '/shop?category=DIY%20Crafts' },
  { key: 'toys', icon: Store, labelEn: 'Toys', labelZh: '玩具小物', to: '/shop?search=toy' },
  { key: 'gifts', icon: Gift, labelEn: 'Gifts & Small Items', labelZh: '礼品小物', to: '/shop?category=Cute%20Accessories' },
];

const HOME_COPY = {
  en: {
    hero: {
      eyebrow: 'Ready stock in Malaysia',
      title: 'Useful little things for everyday life',
      subtitle: 'Shop practical home, work, kitchen and DIY finds, ready for delivery or pickup.',
      primaryAction: 'Shop Products',
      secondaryAction: 'View Shopee',
    },
    categories: { title: 'Shop by category' },
    products: {
      title: 'Popular now',
      description: 'Useful picks customers are browsing now.',
      action: 'View All Products',
    },
    ordering: {
      title: 'Easy ways to receive your order',
      description: 'Choose delivery, pickup or WhatsApp confirmation at checkout.',
      points: ['Ready stock in Malaysia', 'Pickup nearby', 'Delivery available', 'WhatsApp confirmation'],
    },
    playroom: {
      eyebrow: 'Play & Win',
      title: 'Take a quick play break',
      description: 'Match stickers, play the claw machine and collect cute rewards.',
      action: 'Start Playing',
    },
    closing: {
      title: 'Ready to find something useful?',
      primaryAction: 'Shop Products',
      secondaryAction: 'WhatsApp',
    },
  },
  zh: {
    hero: {
      eyebrow: '马来西亚现货',
      title: '为日常生活找到实用小物',
      subtitle: '选购家居、办公、厨房和 DIY 实用商品，可安排配送或自取。',
      primaryAction: '选购商品',
      secondaryAction: '查看 Shopee',
    },
    categories: { title: '按分类选购' },
    products: {
      title: '近期热门',
      description: '看看顾客最近关注的实用商品。',
      action: '查看全部商品',
    },
    ordering: {
      title: '轻松选择收货方式',
      description: '结账时可选择配送、自取或 WhatsApp 确认。',
      points: ['马来西亚现货', '附近自取', '可安排配送', 'WhatsApp 确认'],
    },
    playroom: {
      eyebrow: '玩游戏赢奖励',
      title: '来玩一个轻松小游戏',
      description: '配对贴纸、挑战抓娃娃机并收集可爱奖励。',
      action: '开始玩',
    },
    closing: {
      title: '准备寻找实用好物了吗？',
      primaryAction: '选购商品',
      secondaryAction: 'WhatsApp',
    },
  },
};

const hasStock = (product) => {
  const variants = normalizeVariants(product);
  if (variants.length > 0) {
    return variants.some((variant) => Number(variant.stock) > 0);
  }
  return Number(product.stock) > 0;
};

export const getHomeCopy = (language) => HOME_COPY[language] || HOME_COPY.en;

export const selectHomepageProducts = (products = [], focusIds = [], limit = 4) => {
  const configured = focusIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);
  const flagged = products.filter(
    (product) => product.bestSeller || product.popular || product.featured
  );
  const inStock = products.filter(hasStock);
  const seen = new Set();

  return [...configured, ...flagged, ...inStock, ...products]
    .filter((product) => {
      if (!product || seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    })
    .slice(0, limit);
};
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
node --test src/pages/homeContent.test.js
```

Expected: 3 tests pass with 0 failures.

- [ ] **Step 6: Run the full test suite**

Run:

```bash
npm test
```

Expected: all tests pass with 0 failures.

- [ ] **Step 7: Commit the content module**

```bash
git add src/pages/homeContent.js src/pages/homeContent.test.js
git commit -m "refactor: define focused homepage content"
```

### Task 2: Six-section homepage composition

**Files:**
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `HOME_CATEGORIES`, `getHomeCopy`, `selectHomepageProducts`, product and site-content contexts, existing Shopee and WhatsApp environment variables.
- Produces: one `.home-page` containing six direct child `section` elements in the approved order.

- [ ] **Step 1: Replace legacy imports and local content**

Remove lightbox state, portals, archive media data, duplicated copy objects and unused icons. Import:

```js
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Store,
  Truck,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import { useSiteContent } from '../context/SiteContentContext';
import {
  HOME_CATEGORIES,
  getHomeCopy,
  selectHomepageProducts,
} from './homeContent.js';
import './Home.css';
```

- [ ] **Step 2: Derive concise homepage data**

Inside `Home`, derive:

```js
const { products } = useProducts();
const { language } = useLanguage();
const { siteContent } = useSiteContent();
const text = getHomeCopy(language);
const popularProducts = selectHomepageProducts(
  products,
  siteContent.homeFocusProductIds,
  4
);
const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '601133046104';
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  'Hello ASHLIFE, I would like to ask about product availability.'
)}`;
const shopeeUrl = import.meta.env.VITE_SHOPEE_URL || 'https://shopee.com.my/ashleylife';
```

- [ ] **Step 3: Render the shopping hero and categories**

Render the first two direct child sections:

```jsx
<section className="home-hero">
  <div className="container home-hero-grid">
    <div className="home-hero-copy">
      <p className="home-eyebrow">{text.hero.eyebrow}</p>
      <h1>{text.hero.title}</h1>
      <p>{text.hero.subtitle}</p>
      <div className="home-actions">
        <Link className="btn btn-primary" to="/shop">
          {text.hero.primaryAction}
          <ArrowRight size={18} />
        </Link>
        <a className="btn btn-secondary" href={shopeeUrl} target="_blank" rel="noreferrer">
          <Store size={18} />
          {text.hero.secondaryAction}
        </a>
      </div>
    </div>
    <div className="home-hero-visual">
      <img src={asset('/brand/ashlife-hero-wide-v2.webp')} alt="ASHLIFE home, work and DIY essentials" />
    </div>
  </div>
</section>

<section className="container home-categories" aria-labelledby="home-categories-title">
  <h2 id="home-categories-title">{text.categories.title}</h2>
  <div className="home-category-grid">
    {HOME_CATEGORIES.map((category) => {
      const Icon = category.icon;
      return (
        <Link className="home-category-link" to={category.to} key={category.key}>
          <Icon size={22} strokeWidth={1.8} />
          <span>{language === 'zh' ? category.labelZh : category.labelEn}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      );
    })}
  </div>
</section>
```

- [ ] **Step 4: Render one popular-products section**

```jsx
<section className="container home-products" aria-labelledby="home-products-title">
  <div className="home-section-heading">
    <div>
      <h2 id="home-products-title">{text.products.title}</h2>
      <p>{text.products.description}</p>
    </div>
    <Link className="home-text-link" to="/shop">
      {text.products.action}
      <ArrowRight size={17} />
    </Link>
  </div>
  {popularProducts.length > 0 ? (
    <div className="home-product-grid">
      {popularProducts.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </div>
  ) : (
    <div className="home-products-empty">
      <PackageCheck size={24} />
      <p>Products are being updated. Browse the full catalogue for the latest items.</p>
      <Link to="/shop">{text.products.action}</Link>
    </div>
  )}
</section>
```

- [ ] **Step 5: Render ordering, Playroom and closing sections**

Use four semantic ordering items with `CheckCircle2`, `MapPin`, `Truck` and `MessageCircle`. Then render the compact Playroom feature and final closing CTA:

```jsx
<section className="home-ordering" aria-labelledby="home-ordering-title">
  <div className="container home-ordering-grid">
    <div>
      <h2 id="home-ordering-title">{text.ordering.title}</h2>
      <p>{text.ordering.description}</p>
    </div>
    <div className="home-ordering-points">
      {text.ordering.points.map((point, index) => {
        const Icon = [CheckCircle2, MapPin, Truck, MessageCircle][index];
        return (
          <div className="home-ordering-point" key={point}>
            <Icon size={20} strokeWidth={1.8} />
            <span>{point}</span>
          </div>
        );
      })}
    </div>
  </div>
</section>

<section className="container home-playroom" aria-labelledby="home-playroom-title">
  <img src={asset('/assets/game/playroom-mascot.webp')} alt="" aria-hidden="true" />
  <div>
    <p className="home-eyebrow">{text.playroom.eyebrow}</p>
    <h2 id="home-playroom-title">{text.playroom.title}</h2>
    <p>{text.playroom.description}</p>
  </div>
  <Link className="btn home-playroom-action" to="/play/">
    <Gamepad2 size={18} />
    {text.playroom.action}
  </Link>
</section>

<section className="home-closing" aria-labelledby="home-closing-title">
  <div className="container home-closing-inner">
    <h2 id="home-closing-title">{text.closing.title}</h2>
    <div className="home-actions">
      <Link className="btn home-closing-primary" to="/shop">
        {text.closing.primaryAction}
        <ArrowRight size={18} />
      </Link>
      <a className="btn home-closing-secondary" href={whatsappHref} target="_blank" rel="noreferrer">
        <MessageCircle size={18} />
        {text.closing.secondaryAction}
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 6: Run static checks**

Run:

```bash
npm run lint -- src/pages/Home.jsx src/pages/homeContent.js
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit the homepage composition**

```bash
git add src/pages/Home.jsx
git commit -m "feat: focus homepage on shopping"
```

### Task 3: Responsive visual system

**Files:**
- Modify: `src/pages/Home.css`

**Interfaces:**
- Consumes: class names rendered by `Home.jsx` and existing global colour, spacing, radius and shadow tokens.
- Produces: compact shopping presentation at desktop, tablet and mobile widths, with no horizontal overflow.

- [ ] **Step 1: Replace the legacy homepage stylesheet**

Replace `src/pages/Home.css` with rules covering only the new classes. Use:

- A white and cool-mint single-theme page.
- A 12px to 16px soft radius for visual containers.
- Pill buttons inherited from the global button system.
- A split hero with `min-height: min(700px, calc(100dvh - 80px))`.
- A six-column category row at wide widths.
- A four-column product row at wide widths.
- A two-column ordering strip.
- A three-column Playroom feature with mascot, copy and action.
- A high-contrast teal closing section.

Key layout declarations:

```css
.home-page {
  overflow: hidden;
  background: var(--background-color);
}

.home-hero {
  padding: 1rem 0 2.5rem;
}

.home-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  min-height: min(700px, calc(100dvh - 80px));
  align-items: center;
  gap: clamp(2rem, 5vw, 5rem);
}

.home-hero-visual {
  min-height: 520px;
  overflow: hidden;
  border-radius: 16px 0 0 16px;
  box-shadow: var(--shadow-md);
}

.home-category-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.home-product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.home-ordering-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
}

.home-playroom {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr) auto;
}
```

- [ ] **Step 2: Add explicit tablet and mobile fallbacks**

At `max-width: 900px`:

- Stack the hero with copy before image.
- Use three category columns.
- Use two product columns.
- Stack the ordering copy above its points.
- Keep Playroom mascot, copy and button readable.

At `max-width: 640px`:

- Use compact section padding.
- Keep the hero image at a stable 4:3 ratio.
- Use two category columns.
- Use one product column.
- Use a two-column ordering point grid.
- Stack Playroom into one column with a smaller mascot.
- Make closing actions full width.

- [ ] **Step 3: Add interaction and accessibility states**

Include:

```css
.home-category-link:focus-visible,
.home-text-link:focus-visible,
.home-playroom-action:focus-visible,
.home-closing a:focus-visible {
  outline: 3px solid rgba(22, 122, 114, 0.3);
  outline-offset: 3px;
}

.home-category-link:active,
.home-text-link:active,
.home-playroom-action:active,
.home-closing a:active {
  transform: translateY(1px);
}

@media (prefers-reduced-motion: reduce) {
  .home-page,
  .home-page * {
    scroll-behavior: auto;
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Run build and tests**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and the production build exits 0.

- [ ] **Step 5: Commit the responsive styling**

```bash
git add src/pages/Home.css
git commit -m "style: refine shopping-first homepage"
```

### Task 4: Browser verification and pre-flight audit

**Files:**
- Modify if needed: `src/pages/Home.jsx`
- Modify if needed: `src/pages/Home.css`
- Modify if needed: `src/pages/homeContent.js`

**Interfaces:**
- Consumes: the running Vite site.
- Produces: verified desktop, tablet and mobile screenshots plus measured content-density results.

- [ ] **Step 1: Start or detect the local site**

Use the Playwright browser workflow to detect the existing Vite server. If none exists, run:

```bash
npm run dev -- --host 127.0.0.1
```

- [ ] **Step 2: Verify desktop, tablet and mobile**

At 1440x900, 768x1024 and 390x844:

- Capture full-page screenshots.
- Confirm six homepage sections before the footer.
- Confirm one `h1`.
- Confirm one product grid and no more than four product cards.
- Confirm no horizontal overflow.
- Confirm hero actions are visible in the initial desktop viewport.
- Confirm Shop, category, product, Shopee, WhatsApp and Playroom targets are present.

- [ ] **Step 3: Measure the simplified page**

Use browser evaluation to record:

```js
({
  sectionCount: document.querySelectorAll('.home-page > section').length,
  headingCount: document.querySelectorAll('.home-page h1, .home-page h2, .home-page h3').length,
  paragraphCount: document.querySelectorAll('.home-page p').length,
  wordCount: (document.querySelector('.home-page').innerText.match(/\S+/g) || []).length,
  horizontalOverflow:
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
})
```

Expected:

- `sectionCount` is 6.
- `horizontalOverflow` is false at every viewport.
- Homepage word count is substantially below the previous 775-word baseline.
- Mobile document height is substantially below the previous 15,300px baseline.

- [ ] **Step 4: Run the design-taste pre-flight**

Check every visible homepage string and component against:

- No em-dash or en-dash characters.
- One teal action accent across the page.
- Soft container radius and pill-button rule is consistent.
- Hero has at most eyebrow, headline, subtext and actions.
- Hero subtext remains at or below 20 words.
- No duplicated CTA label for different intents.
- No more than two eyebrow labels across six sections.
- No repeated section layout family.
- No section numbering, scroll cue, decorative status dot or fake metric.
- Product, hero and Playroom visuals are real assets.
- Buttons meet contrast and one-line label requirements.
- Mobile layouts collapse explicitly.

- [ ] **Step 5: Run fresh final verification**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
git status --short
```

Expected: tests, lint, build and diff check exit 0. Git status contains only the intended homepage and plan changes.

- [ ] **Step 6: Commit any verification fixes**

If browser or pre-flight verification required fixes:

```bash
git add src/pages/Home.jsx src/pages/Home.css src/pages/homeContent.js src/pages/homeContent.test.js
git commit -m "fix: polish homepage responsive flow"
```
