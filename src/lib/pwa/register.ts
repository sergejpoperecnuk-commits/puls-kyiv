type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const g = globalThis as typeof globalThis & {
  __pulseDeferredInstall__?: BeforeInstall | null;
  __pulseInstallListeners__?: Set<() => void>;
  __pulsePwaRegistered__?: boolean;
};

function listeners() {
  g.__pulseInstallListeners__ ??= new Set();
  return g.__pulseInstallListeners__;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .catch(() => {
      /* ignore failed SW in unsupported previews */
    });
}

export function registerPulsePwa(): void {
  if (typeof window === "undefined") return;
  if (g.__pulsePwaRegistered__) return;
  g.__pulsePwaRegistered__ = true;

  if (document.readyState === "complete") {
    registerServiceWorker();
  } else {
    window.addEventListener("load", registerServiceWorker, { once: true });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    g.__pulseDeferredInstall__ = event as BeforeInstall;
    for (const listener of listeners()) listener();
  });
  window.addEventListener("appinstalled", () => {
    g.__pulseDeferredInstall__ = null;
    for (const listener of listeners()) listener();
  });
}

export function getDeferredInstall(): BeforeInstall | null {
  return g.__pulseDeferredInstall__ ?? null;
}

export function subscribeInstall(listener: () => void): () => void {
  listeners().add(listener);
  return () => listeners().delete(listener);
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const deferred = g.__pulseDeferredInstall__;
  if (!deferred) return "unavailable";
  await deferred.prompt();
  const choice = await deferred.userChoice;
  g.__pulseDeferredInstall__ = null;
  for (const listener of listeners()) listener();
  return choice.outcome === "accepted" ? "accepted" : "dismissed";
}
