import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailsRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const cursor = cursorRef.current!;
    const trails = trailsRef.current!;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };
    const trailPositions = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));
    let lastMoveTime = 0;
    let frameId = 0;
    const interactiveSelector =
      "a, button, input, textarea, select, [role='button'], [tabindex]:not([tabindex='-1']), .clickable, .project-card, .tech-card, .work-image, .techstack-item";

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target;
      const interactive = target instanceof Element && target.closest(interactiveSelector);

      cursor.classList.toggle("cursor-hidden", Boolean(interactive));
      trails.classList.toggle("cursor-hidden", Boolean(interactive));

      if (interactive) return;

      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
      lastMoveTime = performance.now();
    };

    const loop = (time: number) => {
      const delay = 6;
      cursorPos.x += (mousePos.x - cursorPos.x) / delay;
      cursorPos.y += (mousePos.y - cursorPos.y) / delay;
      gsap.to(cursor, { x: cursorPos.x, y: cursorPos.y, duration: 0.1 });

      const fade = Math.max(0, 1 - (time - lastMoveTime) / 500);
      trailPositions.forEach((position, index) => {
        const target = index === 0 ? mousePos : trailPositions[index - 1];
        const follow = 0.24 - index * 0.035;
        position.x += (target.x - position.x) * follow;
        position.y += (target.y - position.y) * follow;

        const trail = trailRefs.current[index];
        if (!trail) return;

        trail.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`;
        trail.style.opacity = `${fade * (0.3 - index * 0.05)}`;
      });

      frameId = requestAnimationFrame(loop);
    };

    document.addEventListener("mousemove", handleMouseMove);
    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      <div className="cursor-trails" ref={trailsRef} aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="cursor-trail"
            key={index}
            ref={(element) => {
              trailRefs.current[index] = element;
            }}
          />
        ))}
      </div>
      <div className="cursor-main" ref={cursorRef}></div>
    </>
  );
};

export default Cursor;
