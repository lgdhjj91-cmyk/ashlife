# Badge Studio Discovery Design

## Goal

Make Badge Studio discoverable where customers shop for badges while keeping the Playroom hierarchy focused on actual games.

## Approved behavior

- The correct badge product size is 58 mm. Replace every 25 mm reference in the DIY badge product copy and information-card assets with 58 mm.
- Keep the existing Badge Studio route at `/play/badge-studio/`.
- Move the existing Badge Studio feature card to the bottom of the Playroom landing content, after the games and coming-soon cards.
- Present that final Playroom section as a customization tool, not another game.
- Add a dedicated Badge Studio callout inside the Custom Badge tab on `/diy`.
- The DIY callout should explain that customers can upload, adjust, arrange, and export their own badge designs.
- Provide a clear link labeled “Design Your 58 mm Badge” in English and equivalent Chinese copy.
- Preserve WhatsApp ordering as the alternative ordering path.

## Placement and visual treatment

The DIY callout sits in the badge product information column after the product description and before pricing. It reuses the page’s teal, gold, rounded-corner design language, with a compact illustration made from the existing badge product image and simple feature bullets. It must not appear for keychains, ornaments, or portrait frames.

The Playroom card keeps its current design, but its whole section moves below all playable and coming-soon game content. Its heading describes a creative customization tool so the game catalogue remains visually and semantically coherent.

## Responsive behavior

On desktop, the DIY callout uses a compact two-part layout with copy and a circular product preview. On mobile it stacks without horizontal overflow, keeps the primary link full-width, and leaves the WhatsApp action visible below the product details.

## Accessibility and routing

- Use a semantic `Link` for internal navigation.
- Keep visible focus states and descriptive link text.
- Reuse the existing GitHub Pages-safe route.
- Decorative imagery must not add redundant screen-reader content.

## Verification

- Confirm no `25mm` or `25 mm` product copy remains in `DIY.jsx`.
- Verify Badge Studio is the last feature section in the Playroom landing view.
- Verify the DIY callout appears only on the badge tab and navigates to `/play/badge-studio/`.
- Test desktop and mobile layouts.
- Run the full test suite, lint, and GitHub Pages production build.
