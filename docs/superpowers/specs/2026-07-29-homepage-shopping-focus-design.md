# Homepage Shopping Focus Design

**Date:** 2026-07-29  
**Status:** Approved for implementation

## Objective

Turn the ASHLIFE homepage into a concise shopping entry point. Customers should understand what the store sells, reach useful categories, see popular products and choose an ordering channel without reading the company story first.

The About page remains the main introduction and brand-story destination.

## Current State

The homepage currently contains 14 sections, about 775 visible words and 68 links or buttons. It repeats product showcases, ordering explanations, trust messages and brand-history content. At a 390px viewport, the page is approximately 15,300px tall.

The existing brand language is playful and practical:

- Teal is the primary shopping accent.
- Pink and yellow are supporting brand colours.
- Rounded controls and Quicksand headings give the site a friendly character.
- Existing product, lifestyle and Playroom imagery provide sufficient visual identity.

## Design Direction

Reading this as a brand-preserving ecommerce redesign for Malaysian shoppers, with a playful but practical retail language.

- `DESIGN_VARIANCE: 6`
- `MOTION_INTENSITY: 3`
- `VISUAL_DENSITY: 5`

The homepage will use the existing React and CSS foundation. No new design system or third-party dependency is required.

## Homepage Structure

### 1. Shopping hero

Use the existing lifestyle hero image in a compact split composition.

- Short headline: “Useful little things for everyday life”
- Supporting sentence limited to 20 words
- Primary action: “Shop Products”
- Secondary action: “View Shopee”
- No trust badge row, ordering explanation or extra promotional copy inside the hero

The hero and its primary actions must fit within the initial desktop viewport.

### 2. Shop by category

Show six compact category links using the existing category destinations and icon family.

- Home Essentials
- Cable Management
- Kitchen Helpers
- DIY & Craft
- Toys
- Gifts & Small Items

The category treatment should scan quickly on desktop and become a compact two-column grid or horizontal browsing row on mobile.

### 3. Popular now

Show four popular or configured focus products using the existing product data and `ProductCard` behaviour.

- Preserve price, stock, variants and add-to-cart behaviour.
- Use the existing homepage focus-product settings as the first source.
- Fall back to flagged or in-stock products.
- Include one “View All Products” action.
- Do not render a second product grid elsewhere on the homepage.

### 4. Ordering reassurance

Combine the current trust badges, pickup banner and WhatsApp ordering explanation into one compact section.

Communicate only these facts:

- Ready stock in Malaysia
- Pickup around Seri Kembangan or Serdang
- Delivery is available
- WhatsApp confirmation is available

Use short labels and one optional sentence. Do not present a three-step ordering tutorial.

### 5. Playroom feature

Keep the Playroom as one compact, colourful horizontal feature near the bottom of the page.

- It remains visually secondary to shopping.
- It contains one short description and one “Start Playing” action.
- It must not appear between the hero and product discovery.

### 6. Final shopping action

End with one concise action section before the existing footer.

- Short closing line
- “Shop Products” action
- “WhatsApp” action
- No repeated location, Shopee or ordering paragraphs

## Content Removed From the Homepage

The implementation will remove:

- The trust-badge row below the hero
- The long introduction band
- The large store-location banner
- The WhatsApp ordering tutorial
- The “Shopee essentials” and “Creative shop roots” story panels
- The archive and inspiration gallery
- The “How ASHLIFE helps” section
- Duplicate focus, popular and featured product grids
- The separate contact and ordering section

Brand history and creative roots remain available on the About page. Full product breadth remains available on the Shop page.

## Data and Behaviour

- Preserve `useProducts`, `useLanguage` and `useSiteContent`.
- Preserve admin-controlled `homeFocusProductIds`.
- Preserve product card cart and variant behaviour.
- Preserve the existing Shopee and WhatsApp environment configuration.
- Preserve the image lightbox only if a homepage image still requires it. Remove it if no retained section uses it.
- Preserve all routes, navigation labels, analytics-sensitive actions and other pages.
- Maintain English and Chinese content paths.

## Responsive Design

- Desktop uses a compact split hero, six category links and a four-product row.
- Tablet layouts collapse cleanly without horizontal overflow.
- Mobile uses a single-column hero, compact categories and one product per row.
- The Playroom feature stacks its copy and action on narrow screens.
- The page should be substantially shorter than the current 15,300px mobile layout.

## Accessibility and Performance

- Maintain visible keyboard focus states.
- Keep button labels on one line.
- Retain meaningful image alt text.
- Keep heading order logical with one `h1`.
- Ensure teal buttons and supporting text meet WCAG AA contrast.
- Honour reduced-motion preferences for the existing page entrance animation.
- Use lazy loading for below-the-fold imagery.
- Avoid new large dependencies and unnecessary animation.

## Verification

Implementation is complete when:

1. The production build succeeds.
2. The homepage has six focused content sections before the footer.
3. Only one product grid is rendered.
4. Desktop, tablet and mobile layouts have no horizontal overflow.
5. The initial desktop viewport contains the hero headline and both actions.
6. Product links, category links, Shop, Shopee, WhatsApp and Playroom actions work.
7. Existing routes and non-homepage pages are unchanged.
8. Visible copy is concise, grammatically clear and free of repeated ordering explanations.

