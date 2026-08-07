import { useEffect, useState } from "react";

export type DeviceTier = "mobile" | "tablet" | "desktop";

const MOBILE_MAX_WIDTH = 768;

function readTier(): DeviceTier {
  if (typeof window === "undefined") {
    return "desktop";
  }

  if (window.innerWidth < MOBILE_MAX_WIDTH) {
    return "mobile";
  }

  // Orientation, not width: a portrait iPad is a tablet at any pixel count,
  // the same device in landscape composes like a desktop.
  return window.innerHeight >= window.innerWidth ? "tablet" : "desktop";
}

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(readTier);

  useEffect(() => {
    const update = () => setTier(readTier());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return tier;
}
