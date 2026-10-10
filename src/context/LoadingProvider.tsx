import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Loading from "../components/Loading";
import { LoadingContext, type CharacterLoaderState } from "./LoadingContext";
import { initialFX } from "../components/utils/initialFX";

const SHELL_PROGRESS_DURATION_MS = 280;

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(() => {
    // Skip loading on mobile
    if (window.innerWidth <= 768) return false;
    return true;
  });
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [loaderState, setLoaderState] = useState<CharacterLoaderState>("loading");
  const progressFrame = useRef<number>();
  const finishLoading = useCallback((state: Exclude<CharacterLoaderState, "loading">) => {
    setLoaderState((currentState) => currentState === "loading" ? state : currentState);
    if (import.meta.env.DEV) {
      console.info("[Loader] final state", state);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) return;

    let startTime: number | undefined;
    const advanceShellProgress = (time: number) => {
      startTime ??= time;
      const progress = Math.min((time - startTime) / SHELL_PROGRESS_DURATION_MS, 1);
      setDisplayedProgress(Math.round(progress * 100));
      if (progress < 1) {
        progressFrame.current = window.requestAnimationFrame(advanceShellProgress);
      }
    };

    progressFrame.current = window.requestAnimationFrame(advanceShellProgress);
    return () => {
      if (progressFrame.current !== undefined) {
        window.cancelAnimationFrame(progressFrame.current);
      }
    };
  }, [isLoading]);

  const value = {
    isLoading,
    loaderState,
    setIsLoading,
    finishLoading,
  };
  useEffect(() => {
    // Auto-start animations on mobile since there's no 3D model
    if (window.innerWidth <= 768) {
      const timeoutId = window.setTimeout(initialFX, 100);
      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  return (
    <LoadingContext.Provider value={value}>
      {isLoading && <Loading percent={displayedProgress} />}
      <main className="main-body">{children}</main>
    </LoadingContext.Provider>
  );
};

// Preserve the original public API for existing consumers and Vite's HMR
// boundary. The definitions live in LoadingContext to keep this component file
// component-focused.
export { LoadingContext, useLoading } from "./LoadingContext";
