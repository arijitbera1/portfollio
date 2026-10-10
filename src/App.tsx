import { lazy, Suspense, type ComponentType } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./App.css";
import AskArijitAI from "./components/AskArijitAI";
import Cursor from "./components/Cursor";
import MainContainer from "./components/MainContainer";

const lazyWithDevLogging = <T extends ComponentType<object>>(
  importer: () => Promise<{ default: T }>,
  name: string
) => lazy(() => importer().catch((error) => {
  if (import.meta.env.DEV) {
    console.error(`[Portfolio] Failed to dynamically import ${name}`, error);
  }
  throw error;
}));

const CharacterModel = lazyWithDevLogging(() => import("./components/Character"), "CharacterModel");
const MyWorks = lazyWithDevLogging(() => import("./pages/MyWorks"), "MyWorks");

import { LoadingProvider } from "./context/LoadingProvider";

const App = () => {
  return (
    <BrowserRouter>
      <Cursor />
      <div className="portfolio-content">
        <Routes>
          <Route
            path="/"
            element={
              <LoadingProvider>
                <MainContainer>
                  <Suspense>
                    <CharacterModel />
                  </Suspense>
                </MainContainer>
              </LoadingProvider>
            }
          />

          <Route
            path="/myworks"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <MyWorks />
              </Suspense>
            }
          />
        </Routes>
      </div>
      <AskArijitAI />

      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
};

export default App;
