import { useEffect, useState } from "react";

interface ProjectImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const publicAssetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const ProjectImage = ({ src, alt, className }: ProjectImageProps) => {
  const [imageUrl, setImageUrl] = useState(() => publicAssetUrl(src));
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const url = publicAssetUrl(src);
    setImageUrl(url);
    setUsingFallback(false);
    if (import.meta.env.DEV) console.info("[Work] image loading", url);
  }, [src]);

  const handleLoad = () => {
    if (import.meta.env.DEV) console.info("[Work] image loaded", imageUrl);
  };

  const handleError = () => {
    if (usingFallback) {
      if (import.meta.env.DEV) console.error("[Work] fallback image failed", imageUrl);
      return;
    }

    if (import.meta.env.DEV) console.error("[Work] image failed", imageUrl);
    setUsingFallback(true);
    setImageUrl(publicAssetUrl("/images/placeholder.webp"));
  };

  return <img src={imageUrl} alt={alt} className={className} decoding="async" onLoad={handleLoad} onError={handleError} />;
};

export default ProjectImage;
