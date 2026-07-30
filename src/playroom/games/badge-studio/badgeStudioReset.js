export async function clearBadgeStudioProject({
  designs,
  clearDraft,
  revokeObjectUrl,
}) {
  await clearDraft();
  designs.forEach((design) => {
    if (design.imageUrl?.startsWith('blob:')) {
      revokeObjectUrl(design.imageUrl);
    }
  });
}
