// Character readiness is reported through LoadingContext. This preserves the
// Scene completion callbacks without allowing model work to gate the app shell.
export const setProgress = () => ({
  loaded: () => Promise.resolve(100),
  failed: () => Promise.resolve(100),
  clear: () => {},
});
