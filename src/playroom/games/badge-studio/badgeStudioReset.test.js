import assert from 'node:assert/strict';
import test from 'node:test';

let clearBadgeStudioProject;

try {
  ({ clearBadgeStudioProject } = await import('./badgeStudioReset.js'));
} catch {
  clearBadgeStudioProject = undefined;
}

test('clears the saved draft before revoking local badge image URLs', async () => {
  const events = [];
  const designs = [
    { imageUrl: 'blob:badge-one' },
    { imageUrl: 'https://example.com/remote-image.png' },
    { imageUrl: 'blob:badge-two' },
  ];

  await clearBadgeStudioProject?.({
    designs,
    clearDraft: async () => events.push('draft-cleared'),
    revokeObjectUrl: (url) => events.push(`revoked:${url}`),
  });

  assert.deepEqual(events, [
    'draft-cleared',
    'revoked:blob:badge-one',
    'revoked:blob:badge-two',
  ]);
});

test('preserves image URLs when clearing the saved draft fails', async () => {
  const revokedUrls = [];

  await assert.rejects(
    async () =>
      clearBadgeStudioProject?.({
        designs: [{ imageUrl: 'blob:badge-one' }],
        clearDraft: async () => {
          throw new Error('IndexedDB blocked');
        },
        revokeObjectUrl: (url) => revokedUrls.push(url),
      }),
    /IndexedDB blocked/
  );

  assert.deepEqual(revokedUrls, []);
});
