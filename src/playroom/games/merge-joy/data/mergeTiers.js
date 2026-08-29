const baseUrl = import.meta.env?.BASE_URL || '/';
const pieceAsset = (filename) => `${baseUrl}assets/playroom/merge-joy/pieces/${filename}`;

export const mergeTiers = [
  { tier: 1, name: 'Star Charm', filename: '01-star-charm.webp', diameter: 34, shape: 'circle', score: 10 },
  { tier: 2, name: 'Heart Keychain', filename: '02-heart-keychain.webp', diameter: 43, shape: 'circle', score: 20 },
  { tier: 3, name: 'Kawaii Bow', filename: '03-kawaii-bow.webp', diameter: 54, shape: 'wide', score: 40 },
  { tier: 4, name: 'Cream Glue', filename: '04-cream-glue.webp', diameter: 65, shape: 'tall', score: 80 },
  { tier: 5, name: 'Washi Tape', filename: '05-washi-tape.webp', diameter: 77, shape: 'wide', score: 150 },
  { tier: 6, name: 'Bunny Notebook', filename: '06-bunny-notebook.webp', diameter: 90, shape: 'square', score: 250 },
  { tier: 7, name: 'Kawaii Pencil Case', filename: '07-kawaii-pencil-case.webp', diameter: 104, shape: 'wide', score: 400 },
  { tier: 8, name: 'Chick Plush', filename: '08-chick-plush.webp', diameter: 120, shape: 'circle', score: 650 },
  { tier: 9, name: 'Bunny Plush', filename: '09-bunny-plush.webp', diameter: 138, shape: 'tall', score: 1000 },
  { tier: 10, name: 'Mystery Gift Box', filename: '10-mystery-gift-box.webp', diameter: 157, shape: 'square', score: 2000 },
  { tier: 11, name: 'Golden Ashlife Bunny', filename: '11-golden-ashlife-bunny.webp', diameter: 176, shape: 'tall', score: 0 },
].map((tier) => ({ ...tier, image: pieceAsset(tier.filename), textureKey: `merge-piece-${tier.tier}` }));

export const mergeTierByNumber = new Map(mergeTiers.map((tier) => [tier.tier, tier]));
export const getMergeTier = (tier) => mergeTierByNumber.get(Number(tier));
export const MAX_MERGE_TIER = mergeTiers.length;
