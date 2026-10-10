/**
 * Resolves public assets against Vite's configured base path and the current
 * page origin. This keeps model requests on the host the visitor opened
 * (localhost, a LAN address, or a deployed domain).
 */
export const characterAssetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export const logCharacterError = (message: string, error?: unknown) => {
  if (import.meta.env.DEV) {
    console.error(`[Character3D] ${message}`, error);
  }
};

export const logCharacterInfo = (message: string, details?: unknown) => {
  if (import.meta.env.DEV) {
    console.info(`[Character3D] ${message}`, details);
  }
};
