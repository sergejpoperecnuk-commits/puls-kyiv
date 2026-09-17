import { useEffect, useState } from "react";

export function useOnline(): boolean {
  // Always start `true` so SSR and the first client paint match. The effect
  // then follows the real navigator.onLine without a hydration mismatch.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}
