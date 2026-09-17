import { useEffect, useState } from "react";
import {
  getDeferredInstall,
  isIosDevice,
  isStandalone,
  promptInstall,
  subscribeInstall,
} from "@/lib/pwa/register";

export function PwaInstallCard() {
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    setIos(isIosDevice());
    setCanPrompt(Boolean(getDeferredInstall()));
    return subscribeInstall(() => {
      setCanPrompt(Boolean(getDeferredInstall()));
      setStandalone(isStandalone());
    });
  }, []);

  if (standalone) {
    return (
      <section className="rounded-xl bg-panel p-4 shadow-hairline">
        <h2 className="text-sm font-semibold">На екрані «Домівка»</h2>
        <p className="mt-2 text-sm leading-relaxed text-quiet">
          Застосунок уже відкрито як окремий вебзастосунок. Офлайн доступні оболонка й
          збережена стрічка. Нові повідомлення з Telegram приходять лише з інтернетом.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-panel p-4 shadow-hairline">
      <h2 className="text-sm font-semibold">Встановити на пристрій</h2>
      <p className="mt-2 text-sm leading-relaxed text-quiet">
        Працює як окремий додаток на iPhone і Android: без рядка браузера, з вирізом і
        жестами, у режимі standalone.
      </p>
      {canPrompt ? (
        <button
          type="button"
          disabled={busy}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-canvas transition-opacity duration-150 disabled:opacity-60"
          onClick={() => {
            setBusy(true);
            void promptInstall().finally(() => setBusy(false));
          }}
        >
          Встановити Пульс Києва
        </button>
      ) : ios ? (
        <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-quiet">
          <li>У Safari натисніть кнопку «Поділитися».</li>
          <li>Оберіть «На екран „Домівка“».</li>
          <li>Підтвердіть «Додати». Відкриється як окремий застосунок.</li>
        </ol>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-quiet">
          У Chrome для Android: меню браузера → «Встановити додаток» або «Додати на
          головний екран».
        </p>
      )}
    </section>
  );
}
