import { TextSplitter } from "../../utils/textSplitter";
import gsap from "gsap";
import { lenis } from "../Navbar";

export function initialFX() {
  document.body.style.overflowY = "auto";
  if (lenis) {
    lenis.start();
  }
  gsap.to("body", {
    backgroundColor: "#0b080c",
    duration: 0.5,
    delay: 1,
  });

  gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      delay: 0.1,
    }
  );
}

export function startHeroTextAnimation(scope: ParentNode) {
  const selectors = [".landing-info h3", ".landing-intro h2", ".landing-intro h1"];
  const elements = selectors.flatMap((selector) => Array.from(scope.querySelectorAll(selector)));
  const landingText = new TextSplitter(elements, {
    type: "chars,lines",
    linesClass: "split-line",
  });
  const heroTextAnimation = gsap.fromTo(
    landingText.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );

  const textProps = { type: "chars,lines", linesClass: "split-h2" };

  const landingText2 = new TextSplitter(
    Array.from(scope.querySelectorAll(".landing-h2-info")),
    textProps
  );
  const subtitleAnimation = gsap.fromTo(
    landingText2.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );

  const roleAnimation = gsap.fromTo(
    Array.from(scope.querySelectorAll(".landing-info-h2")),
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      y: 0,
      delay: 0.8,
      onComplete: () => {
        if (import.meta.env.DEV) console.info("[TextAnimation] animation completed");
      },
    }
  );
  const landingText3 = new TextSplitter(
    Array.from(scope.querySelectorAll(".landing-h2-info-1")),
    textProps
  );
  const landingText4 = new TextSplitter(
    Array.from(scope.querySelectorAll(".landing-h2-1")),
    textProps
  );
  const landingText5 = new TextSplitter(
    Array.from(scope.querySelectorAll(".landing-h2-2")),
    textProps
  );

  const subtitleLoop = LoopText(landingText2, landingText3);
  const roleLoop = LoopText(landingText4, landingText5);

  return () => {
    heroTextAnimation.kill();
    subtitleAnimation.kill();
    roleAnimation.kill();
    subtitleLoop.kill();
    roleLoop.kill();
    landingText.revert();
    landingText2.revert();
    landingText3.revert();
    landingText4.revert();
    landingText5.revert();
  };
}

function LoopText(Text1: TextSplitter, Text2: TextSplitter) {
  var tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
  const delay = 4;
  const delay2 = delay * 2 + 1;

  return tl.fromTo(
    Text2.chars,
    { opacity: 0, y: 80 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power3.inOut",
      y: 0,
      stagger: 0.1,
      delay: delay,
    },
    0
  )
    .fromTo(
      Text1.chars,
      { y: 80 },
      {
        duration: 1.2,
        ease: "power3.inOut",
        y: 0,
        stagger: 0.1,
        delay: delay2,
      },
      1
    )
    .fromTo(
      Text1.chars,
      { y: 0 },
      {
        y: -80,
        duration: 1.2,
        ease: "power3.inOut",
        stagger: 0.1,
        delay: delay,
      },
      0
    )
    .to(
      Text2.chars,
      {
        y: -80,
        duration: 1.2,
        ease: "power3.inOut",
        stagger: 0.1,
        delay: delay2,
      },
      1
    );
}
