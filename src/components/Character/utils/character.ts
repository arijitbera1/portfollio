import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile, isWebCryptoAvailable } from "./decrypt";
import { characterAssetUrl, logCharacterError, logCharacterInfo } from "./assets";

export type CharacterLoadSource = "encrypted" | "fallback";

export interface CharacterLoadResult {
  gltf: GLTF;
  source: CharacterLoadSource;
}

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(characterAssetUrl("draco/"));
  loader.setDRACOLoader(dracoLoader);

  const loadGltf = (url: string) => new Promise<GLTF>((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });

  const prepareCharacter = async (gltf: GLTF) => {
    const character = gltf.scene;
    await renderer.compileAsync(character, camera, scene);
    character.traverse((child: any) => {
      if (child.isMesh) {
        const mesh = child as THREE.Mesh;
        child.castShadow = false;
        child.receiveShadow = false;
        mesh.frustumCulled = true;
        if (mesh.material && !Array.isArray(mesh.material)) {
          (mesh.material as THREE.ShaderMaterial).precision = "mediump";
        }
      }
    });
    setCharTimeline(character, camera);
    setAllTimeline();
    character.getObjectByName("footR")?.position.setY(3.36);
    character.getObjectByName("footL")?.position.setY(3.36);
  };

  const loadEncryptedCharacter = async () => {
    const modelUrl = characterAssetUrl("models/character.enc");
    let encryptedBlob: ArrayBuffer;
    try {
      encryptedBlob = await decryptFile(modelUrl, "Character3D#@");
    } catch (error) {
      logCharacterError("Encrypted model decryption failed", error);
      throw error;
    }
    logCharacterInfo("Encrypted model fetched and decrypted");
    const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));
    try {
      return await loadGltf(blobUrl);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };

  const loadCharacter = async (): Promise<CharacterLoadResult> => {
    const canDecrypt = isWebCryptoAvailable();
    logCharacterInfo("Character loading started", {
      isSecureContext: window.isSecureContext,
      cryptoSubtleAvailable: canDecrypt,
    });

    try {
      const source: CharacterLoadSource = canDecrypt ? "encrypted" : "fallback";
      const gltf = canDecrypt
        ? await loadEncryptedCharacter()
        : await loadGltf(characterAssetUrl("models/character.glb"));

      if (source === "fallback") {
        logCharacterInfo("Web Crypto unavailable; using local non-encrypted character fallback");
      }
      await prepareCharacter(gltf);
      return { gltf, source };
    } catch (error) {
      logCharacterError("Character model loading failed", error);
      throw error;
    } finally {
      dracoLoader.dispose();
    }
  };

  return { loadCharacter };
};

export default setCharacter;
