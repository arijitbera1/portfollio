import { PropsWithChildren, useLayoutEffect, useRef } from "react";
import "./styles/Landing.css";
import { config } from "../config";
import { startHeroTextAnimation } from "./utils/initialFX";

const Landing = ({ children }: PropsWithChildren) => {
  const landingRef = useRef<HTMLDivElement>(null);
  const nameParts = config.developer.fullName.split(" ");
  const firstName = nameParts[0] || config.developer.name;
  const lastName = nameParts.slice(1).join(" ") || "";

  useLayoutEffect(() => {
    const landing = landingRef.current;
    if (!landing) return;

    if (import.meta.env.DEV) console.info("[TextAnimation] mounted");
    const cleanup = startHeroTextAnimation(landing);
    if (import.meta.env.DEV) console.info("[TextAnimation] animation started");

    return () => {
      cleanup();
    };
  }, []);

  return (
    <>
      <div className="landing-section" id="landingDiv" ref={landingRef}>
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              {firstName.toUpperCase()}
              {' '}
              <br />
              {lastName && <span>{lastName.toUpperCase()}</span>}
            </h1>
          </div>
          <div className="landing-info">
            <h3>An</h3>
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">CSE Student</div>
            </h2>
            <h2>
              <div className="landing-h2-info">Aspiring Android Developer</div>
            </h2>
          </div>
          {/* Mobile photo - shows only on mobile when 3D character is hidden */}
          <div className="mobile-photo">
            <img
              src="/images/mypicnbg.png"
              alt="Arijit Bera"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
