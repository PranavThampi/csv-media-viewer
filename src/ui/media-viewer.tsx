import React from "react";
import { useState, useEffect } from "react";

const fetchMediaType = async (url: string): Promise<"image" | "video"> => {
  const response = await fetch(url, { method: "GET"});
  const contentType = response.headers.get("content-type");
  if (contentType?.startsWith("image")) {
    return "image";
  } else if (contentType?.startsWith("video")) {
    return "video";
  } else {
    throw new Error("Unsupported media type");
  }
};

const MediaViewer: React.FC<{ mediaUrl: string }> = ({ mediaUrl }) => {
  const [mediaType, setMediaType] = useState<"image" | "video" | null>("image");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getMediaType = async () => {
      try {
        const type = await fetchMediaType(mediaUrl);
        setMediaType(type);
        setError(null);
      } catch (error) {
        console.error("Error fetching media type:", error);
        setError("Error fetching media type");
      }
    };

    getMediaType();
  }, [mediaUrl]);

    if (error) {
      return (
        <div className="object-contain">
          <img src="no-image.svg" alt="Error loading media" />
          <p>{error}</p>
        </div>
      );
    }

  if (!mediaType) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {mediaType === "image" ? (
        <img src={mediaUrl} alt="Media content" style={{ maxWidth: "100%" }} />
      ) : (
        <video controls style={{ maxWidth: "100%" }}>
          <source src={mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

export default MediaViewer;
