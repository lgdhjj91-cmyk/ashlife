export const shouldIgnoreGameplayKey = (target) => {
  const tagName = target?.tagName;
  return (
    target?.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    tagName === 'BUTTON' ||
    tagName === 'A'
  );
};

const movementKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']);

export const shouldIgnoreDocumentGameplayKey = (target, gameMount, code) => {
  if (gameMount?.contains?.(target)) return true;
  if (target?.closest?.('[role="dialog"]')) return true;
  if (target?.tagName === 'BUTTON' && target.closest?.('.claw-page')) return false;
  if (!movementKeys.has(code)) return shouldIgnoreGameplayKey(target);

  const tagName = target?.tagName;
  return (
    target?.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  );
};
