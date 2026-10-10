import { createContext, useContext } from "react";

export type CharacterLoaderState = "loading" | "ready" | "fallback" | "error";

export interface LoadingContextValue {
  isLoading: boolean;
  loaderState: CharacterLoaderState;
  setIsLoading: (state: boolean) => void;
  finishLoading: (state: Exclude<CharacterLoaderState, "loading">) => void;
}

export const LoadingContext = createContext<LoadingContextValue | null>(null);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
