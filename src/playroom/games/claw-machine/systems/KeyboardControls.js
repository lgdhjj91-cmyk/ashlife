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

export const shouldIgnoreDocumentGameplayKey = (target, gameMount) =>
  shouldIgnoreGameplayKey(target) || Boolean(gameMount?.contains?.(target));
