import { useState } from "react";
import { MdArrowOutward } from "react-icons/md";
import { Link } from "react-router-dom";
import ProjectImage, { publicAssetUrl } from "./ProjectImage";

interface Props {
  image: string;
  alt?: string;
  video?: string;
  link?: string;
}

const WorkImage = (props: Props) => {
  const [isVideo, setIsVideo] = useState(false);
  const [video, setVideo] = useState("");
  const isExternalLink = Boolean(props.link && !props.link.startsWith("/"));

  const handleMouseEnter = async () => {
    if (props.video) {
      try {
        const response = await fetch(publicAssetUrl(props.video));
        if (!response.ok) throw new Error(`Video request failed (${response.status})`);
        const blobUrl = URL.createObjectURL(await response.blob());
        setVideo(blobUrl);
        setIsVideo(true);
      } catch (error) {
        if (import.meta.env.DEV) console.error("[Work] preview video failed", error);
      }
    }
  };

  const image = <ProjectImage src={props.image} alt={props.alt ?? "Project image"} />;

  return (
    <div className="work-image">
      {props.link ? (
        isExternalLink ? (
          <a
            className="work-image-in"
            href={props.link}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVideo(false)}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor={"disable"}
          >
            <div className="work-link">
              <MdArrowOutward />
            </div>
            {image}
            {isVideo && <video src={video} autoPlay muted playsInline loop></video>}
          </a>
        ) : (
          <Link
            className="work-image-in"
            to={props.link}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVideo(false)}
            data-cursor={"disable"}
          >
            <div className="work-link">
              <MdArrowOutward />
            </div>
            {image}
            {isVideo && <video src={video} autoPlay muted playsInline loop></video>}
          </Link>
        )
      ) : (
        <div
          className="work-image-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsVideo(false)}
          data-cursor={"disable"}
        >
          {image}
          {isVideo && <video src={video} autoPlay muted playsInline loop></video>}
        </div>
      )}
    </div>
  );
};

export default WorkImage;
