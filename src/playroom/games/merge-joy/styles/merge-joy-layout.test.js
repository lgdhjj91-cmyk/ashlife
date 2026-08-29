import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./merge-joy.css', import.meta.url), 'utf8');

test('desktop layout keeps the board between both HUD rails and below the fixed header', () => {
  assert.match(css, /\.merge-rail-left\s*\{[^}]*grid-column:\s*1/s);
  assert.match(css, /\.merge-board-column\s*\{[^}]*grid-column:\s*2/s);
  assert.match(css, /\.merge-rail-right\s*\{[^}]*grid-column:\s*3/s);
  assert.match(css, /grid-template-columns:\s*minmax\(180px, 260px\) minmax\(360px, 560px\) minmax\(210px, 280px\)/);
  assert.match(css, /\.merge-page\s*\{[^}]*padding:\s*calc\(70px \+ 1rem\)/s);
  assert.match(css, /body\.merge-joy-active\s*>\s*div:not\(#root\)\s*\{[^}]*display:\s*none\s*!important/s);
});
