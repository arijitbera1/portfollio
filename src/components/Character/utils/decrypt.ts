export const isWebCryptoAvailable = () => Boolean(globalThis.crypto?.subtle);

const getWebCrypto = () => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto is unavailable on this origin");
  }
  return subtle;
};

async function generateAESKey(password: string): Promise<CryptoKey> {
  const subtle = getWebCrypto();
  const passwordBuffer = new TextEncoder().encode(password);
  const hashedPassword = await subtle.digest("SHA-256", passwordBuffer);
  return subtle.importKey(
    "raw",
    hashedPassword.slice(0, 32),
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
}

export const decryptFile = async (
  url: string,
  password: string
): Promise<ArrayBuffer> => {
  const response = await fetch(url);
  logCharacterInfo("Encrypted model fetch completed", {
    url,
    status: response.status,
    ok: response.ok,
  });
  if (!response.ok) {
    throw new Error(`Asset request failed (${response.status} ${response.statusText}): ${url}`);
  }
  const encryptedData = await response.arrayBuffer();
  const iv = new Uint8Array(encryptedData.slice(0, 16));
  const data = encryptedData.slice(16);
  const key = await generateAESKey(password);
  return getWebCrypto().decrypt({ name: "AES-CBC", iv }, key, data);
};
import { logCharacterInfo } from "./assets";
