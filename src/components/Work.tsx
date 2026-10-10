import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MdArrowOutward, MdChevronLeft, MdChevronRight } from "react-icons/md";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { config } from "../config";
import ProjectImage from "./ProjectImage";
import "./styles/Work.css";

const projects = config.projects.slice(0, 5);
const RING_STEP = (Math.PI * 2) / projects.length;
const AUTOPLAY_DELAY = 5200;
const SCROLL_ROTATIONS = projects.length - 1;

gsap.registerPlugin(ScrollTrigger);

const wrapIndex = (index: number) => (index + projects.length) % projects.length;
const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest("a, button, [data-carousel-control]"));
const isExternalUrl = (url?: string) => Boolean(url && /^https?:\/\//i.test(url));

type ProjectWithRepository = (typeof projects)[number] & { github?: string };

const Work = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const rotation = useRef({ value: 0 });
  const manualRotation = useRef({ value: 0 });
  const scrollProgress = useRef({ value: 0 });
  const transitionRef = useRef<gsap.core.Tween | null>(null);
  const pausedRef = useRef(false);
  const transitioningRef = useRef(false);
  const resumeTimer = useRef<number>();
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const dragResetTimer = useRef<number>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const renderRing = useCallback((ringRotation: number) => {
    const isMobile = window.innerWidth <= 600;
    const radius = isMobile ? window.innerWidth * 0.31 : Math.min(window.innerWidth * 0.29, 480);
    const depth = isMobile ? 145 : Math.min(window.innerWidth * 0.18, 290);

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const angle = index * RING_STEP + ringRotation;
      const depthProgress = (Math.cos(angle) + 1) / 2;

      gsap.set(card, {
        xPercent: -50,
        yPercent: -50,
        x: Math.sin(angle) * radius,
        z: Math.cos(angle) * depth,
        rotationY: -Math.sin(angle) * 46,
        scale: 0.6 + depthProgress * 0.4,
        opacity: 0.16 + depthProgress * 0.84,
        filter: `blur(${(1 - depthProgress) * 3}px)`,
        zIndex: 100 + Math.round(depthProgress * 1000),
        pointerEvents: depthProgress >= 0.47 ? "auto" : "none",
        force3D: true,
      });
    });
  }, []);

  const getFrontIndex = useCallback((ringRotation: number) => {
    let frontIndex = 0;
    let closestDepth = -Infinity;
    projects.forEach((_, index) => {
      const depth = Math.cos(index * RING_STEP + ringRotation);
      if (depth > closestDepth) {
        closestDepth = depth;
        frontIndex = index;
      }
    });
    return frontIndex;
  }, []);

  const renderCombinedRotation = useCallback(() => {
    const combinedRotation = manualRotation.current.value - scrollProgress.current.value * RING_STEP * SCROLL_ROTATIONS;
    rotation.current.value = combinedRotation;
    renderRing(combinedRotation);

    const frontIndex = getFrontIndex(combinedRotation);
    if (frontIndex !== activeIndexRef.current) {
      activeIndexRef.current = frontIndex;
      setActiveIndex(frontIndex);
    }
  }, [getFrontIndex, renderRing]);

  const pauseAutoplay = useCallback(() => {
    pausedRef.current = true;
    window.clearTimeout(resumeTimer.current);
  }, []);

  const resumeAutoplay = useCallback((delay = 900) => {
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => { pausedRef.current = false; }, delay);
  }, []);

  const goToIndex = useCallback((nextIndex: number, isUserAction = false) => {
    const destination = wrapIndex(nextIndex);
    const scrollRotation = scrollProgress.current.value * RING_STEP * SCROLL_ROTATIONS;
    let targetManualRotation = -destination * RING_STEP + scrollRotation;
    targetManualRotation += Math.round((manualRotation.current.value - targetManualRotation) / (Math.PI * 2)) * Math.PI * 2;

    if (isUserAction) {
      pauseAutoplay();
      resumeAutoplay(1800);
    }

    activeIndexRef.current = destination;
    transitionRef.current?.kill();
    transitioningRef.current = true;
    setIsTransitioning(true);
    setActiveIndex(destination);

    transitionRef.current = gsap.to(manualRotation.current, {
      value: targetManualRotation,
      duration: 0.8,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: renderCombinedRotation,
      onComplete: () => {
        transitioningRef.current = false;
        transitionRef.current = null;
        setIsTransitioning(false);
      },
    });
  }, [pauseAutoplay, renderCombinedRotation, resumeAutoplay]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      transitionRef.current?.kill();
      cardRefs.current.forEach((card) => card && gsap.set(card, { clearProps: "all" }));
      return;
    }

    renderCombinedRotation();
    const handleResize = () => renderCombinedRotation();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [reducedMotion, renderCombinedRotation]);

  useEffect(() => {
    if (reducedMotion || window.innerWidth <= 768 || !sectionRef.current) return;

    const scrollTween = gsap.to(scrollProgress.current, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: () => `+=${Math.max(window.innerHeight * 2.2, 1500)}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: pauseAutoplay,
        onEnterBack: pauseAutoplay,
        onLeave: () => resumeAutoplay(1200),
        onLeaveBack: () => resumeAutoplay(1200),
      },
      onUpdate: renderCombinedRotation,
    });

    return () => {
      scrollTween.scrollTrigger?.kill();
      scrollTween.kill();
      scrollProgress.current.value = 0;
    };
  }, [pauseAutoplay, reducedMotion, renderCombinedRotation, resumeAutoplay]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      if (!pausedRef.current && !transitioningRef.current) {
        goToIndex(activeIndexRef.current + 1);
      }
    }, AUTOPLAY_DELAY);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(resumeTimer.current);
      window.clearTimeout(dragResetTimer.current);
      transitionRef.current?.kill();
    };
  }, [goToIndex, reducedMotion]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); goToIndex(activeIndexRef.current - 1, true); }
    if (event.key === "ArrowRight") { event.preventDefault(); goToIndex(activeIndexRef.current + 1, true); }
    if ((event.key === "Enter" || event.key === " ") && index !== activeIndex) {
      event.preventDefault();
      goToIndex(index, true);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(event.target)) return;
    dragStart.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;
    pauseAutoplay();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const deltaX = event.clientX - dragStart.current.x;
    const deltaY = event.clientY - dragStart.current.y;
    const wasDrag = Math.hypot(deltaX, deltaY) > 12;
    dragStart.current = null;

    if (wasDrag) {
      suppressClick.current = true;
      if (Math.abs(deltaX) > 36 && Math.abs(deltaX) > Math.abs(deltaY)) {
        goToIndex(activeIndexRef.current + (deltaX < 0 ? 1 : -1), true);
      } else {
        resumeAutoplay(1200);
      }
      window.clearTimeout(dragResetTimer.current);
      dragResetTimer.current = window.setTimeout(() => { suppressClick.current = false; }, 0);
    } else {
      resumeAutoplay(1200);
    }
  };

  return (
    <section className={`work-section ${reducedMotion ? "work-section--reduced" : ""}`} id="work" ref={sectionRef}>
      <div className="work-container section-container">
        <header className="work-heading">
          <div>
            <p className="work-eyebrow">Selected experiments</p>
            <h2>My <span>Work</span></h2>
          </div>
          <Link to="/myworks" className="work-all-link" data-cursor="disable">View all work <MdArrowOutward /></Link>
        </header>

        <div
          className={`project-carousel ${isTransitioning ? "is-transitioning" : ""}`}
          ref={stageRef}
          aria-roledescription="carousel"
          aria-label="Selected projects"
          onMouseEnter={pauseAutoplay}
          onMouseLeave={() => resumeAutoplay()}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { dragStart.current = null; resumeAutoplay(1200); }}
        >
          <div className="project-carousel__glow" aria-hidden="true" />
          <div className="project-carousel__stage">
            {projects.map((project, index) => {
              const isActive = index === activeIndex;
              const technologies = project.technologies.split(",").slice(0, 4);
              const githubLink = (project as ProjectWithRepository).github;
              const hasLiveDemo = isExternalUrl(project.link);
              const hasGithub = isExternalUrl(githubLink);

              return (
                <div
                  className={`project-card ${isActive ? "is-active" : ""}`}
                  key={project.id}
                  ref={(element) => { cardRefs.current[index] = element; }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${projects.length}: ${project.title}`}
                  aria-current={isActive ? "true" : undefined}
                  tabIndex={0}
                  onClick={(event) => {
                    if (!isInteractiveTarget(event.target) && !suppressClick.current && !isActive) goToIndex(index, true);
                  }}
                  onFocus={pauseAutoplay}
                  onBlur={() => resumeAutoplay()}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                >
                  <div className="project-card__image"><ProjectImage src={project.image} alt={`${project.title} preview`} /></div>
                  <div className="project-card__shade" />
                  <div className="project-card__content">
                    <p className="project-card__number">0{index + 1} / 0{projects.length}</p>
                    <h3>{project.title}</h3>
                    <p className="project-card__description">{project.description}</p>
                    <div className="project-card__tags" aria-label="Technologies">
                      {technologies.map((technology) => <span key={technology}>{technology.trim()}</span>)}
                    </div>
                    <div className="project-card__actions">
                      {hasGithub ? <a href={githubLink} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>GitHub <MdArrowOutward /></a> : <span>GitHub unavailable</span>}
                      {hasLiveDemo ? <a href={project.link} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>Live demo <MdArrowOutward /></a> : <span>Demo unavailable</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <nav className="project-carousel__controls" aria-label="Project carousel controls">
          <button type="button" data-carousel-control aria-label="Show previous project" onClick={() => goToIndex(activeIndexRef.current - 1, true)}><MdChevronLeft /></button>
          <p><span>{String(activeIndex + 1).padStart(2, "0")}</span> / {String(projects.length).padStart(2, "0")}</p>
          <button type="button" data-carousel-control aria-label="Show next project" onClick={() => goToIndex(activeIndexRef.current + 1, true)}><MdChevronRight /></button>
        </nav>
      </div>
    </section>
  );
};

export default Work;
