import { useEffect, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingContext";
import Marquee from "react-fast-marquee";
import { initialFX } from "./utils/initialFX";

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading } = useLoading();

  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (percent < 100) return;

    // Keep 100% visible before the existing completion animation begins.
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    const completeTimer = setTimeout(() => {
      setLoaded(true);

      exitTimer = setTimeout(() => {
        setIsLoaded(true);
      }, 600);
    }, 400);

    return () => {
      clearTimeout(completeTimer);
      if (exitTimer !== undefined) clearTimeout(exitTimer);
    };
  }, [percent]);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;

    setClicked(true);
    exitTimer = setTimeout(() => {
      if (cancelled) return;
      try {
        initialFX();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[Loader] completion animation failed", error);
        }
      }
      setIsLoading(false);
    }, 900);

    return () => {
      cancelled = true;
      if (exitTimer !== undefined) clearTimeout(exitTimer);
    };
  }, [isLoaded, setIsLoading]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <div className="loading-header">
        <a href="/#" className="loader-title" data-cursor="disable">
          Arijit Bera
        </a>

        <div className={`loaderGame ${clicked && "loader-out"}`}>
          <div className="loaderGame-container">
            <div className="loaderGame-in">
              {[...Array(27)].map((_, index) => (
                <div className="loaderGame-line" key={index}></div>
              ))}
            </div>

            <div className="loaderGame-ball"></div>
          </div>
        </div>
      </div>

      <div className="loading-screen">
        <div className="loading-marquee">
          <Marquee>
            <span>&nbsp; CSE Student &nbsp;</span>
            <span>&nbsp; Android Developer &nbsp;</span>
          </Marquee>
        </div>

        <div
          className={`loading-wrap ${clicked ? "loading-clicked" : ""}`}
          onMouseMove={handleMouseMove}
        >
          <div className="loading-hover"></div>

          <div
            className={`loading-button ${
              loaded ? "loading-complete" : ""
            }`}
          >
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{Math.min(percent, 100)}%</span>
                </div>
              </div>

              <div className="loading-box"></div>
            </div>

            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;
