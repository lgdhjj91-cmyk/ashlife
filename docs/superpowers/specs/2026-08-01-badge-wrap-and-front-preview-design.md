# Badge Wrap Area and Front Preview Design

## Problem

The Badge Studio already renders and exports a 70 mm artwork circle for a 58 mm badge, but the editor currently shows only the 70 mm outer line and the 54 mm safe line. Without a visible 58 mm finished-face boundary, customers can mistake the full 70 mm circle for the front of the badge and do not understand which artwork wraps around the shell.

## Production Model

- **70 mm cut artwork:** the complete printed paper circle. The photo or background must reach this edge.
- **58 mm finished face:** the nominal front diameter of the completed badge.
- **54 mm safe content area:** faces, text, and other important details should remain within this guide.
- **58–70 mm wrap area:** a 6 mm radial band that bends around the shell and is crimped at the back. It is printed, but it is not expected to remain on the flat front.

The dimensions stay centralized in `badgeStudioConfig.js` and remain adjustable after a physical calibration print. Tecre's 2.25-inch guidance similarly distinguishes a larger cut line, a smaller live graphic area, and the bleed area that wraps around the edge; a Malaysian badge printer also instructs designers to extend backgrounds into bleed while keeping readable artwork in the safe/viewing area.

## Editor Design

The main editor remains the complete 70 mm artwork circle so customers can position the image through the full printable cut area. It gains three visible guides:

1. Pink solid outer cut line: **Cut edge · 70 mm**.
2. Teal solid inner line: **Finished front · 58 mm**.
3. White dashed line: **Safe content · 54 mm**.

The band between the 58 mm and 70 mm lines receives a subtle translucent overlay so it reads as a physical wrap zone without hiding the image. A short explanation says that the background must fill this band, while important faces and text stay inside the safe line.

A separate non-interactive **Finished badge front preview** shows the same transformed image clipped to the 58 mm face. This gives customers an immediate visual answer to “what will appear on the front?” The preview is editor-only and never becomes part of the print file.

## Print Behavior

The existing A4 export remains based on the complete 70 mm artwork circle and includes only the outer cut outline. The 58 mm front guide, safe guide, tint, labels, and finished preview never appear in exported PNG or PDF files.

## Responsive and Accessibility Behavior

- Desktop: the finished-front preview and explanation sit below the guide legend without competing with the main editing controls.
- Mobile: the preview remains compact and readable, with the legend wrapping into a vertical-friendly layout.
- Guide labels are available as text, not color alone.
- The editor's accessible label explains that the outer area wraps around the badge edge.

## Testing

- Unit-test the calculated insets for 70 mm cut, 58 mm front, and 54 mm safe diameters.
- Unit-test bilingual guide and preview copy.
- Verify the existing export still uses the 70 mm artwork diameter.
- Browser-test one uploaded/restored design on desktop and mobile, including the finished-front preview and all three guide labels.
- Check the browser console, full regression suite, lint, and GitHub Pages production build.

## Sources

- Tecre, “Explanation of a Graphic Layout for the Round Button Maker Machine”: https://www.tecre.com/sft629/button-making-supplies-round-layout-instructions.pdf
- University of Illinois Community Fab Lab, “2.25-inch Button Maker”: https://cucfablab.web.illinois.edu/lab-tool/2-25-button-maker/
- Tshirtprint2u Malaysia, “Button Badge Design Artwork”: https://www.tshirtprint2u.com.my/design-artwork-button-badge
