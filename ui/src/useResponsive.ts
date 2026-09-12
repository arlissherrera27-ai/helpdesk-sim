import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

function getIsMobile(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    function handleResize() {
      setIsMobile(getIsMobile());
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    isMobile,
  };
}