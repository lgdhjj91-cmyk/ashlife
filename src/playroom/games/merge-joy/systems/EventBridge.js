export const createEventBridge = (handler) => {
  let currentHandler = handler;
  return {
    update(nextHandler) {
      currentHandler = nextHandler;
    },
    emit(type, detail) {
      currentHandler?.(type, detail);
    },
  };
};
