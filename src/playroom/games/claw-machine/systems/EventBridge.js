export const createEventBridge = (initialHandler) => {
  let handler = initialHandler;
  return {
    emit: (...args) => handler?.(...args),
    update: (nextHandler) => {
      handler = nextHandler;
    },
  };
};
