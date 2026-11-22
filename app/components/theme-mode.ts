export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'seatpax.ops-mode';
export const THEME_CHANGE_EVENT = 'seatpax-theme-change';

type ViewTransitionLike = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike;
};

/** Parses persisted or dataset mode values into a strict light/dark union. */
export function parseThemeMode(raw: unknown): ThemeMode | null {
  return raw === 'dark' || raw === 'light' ? raw : null;
}

/** Toggles between light and dark modes. */
export function nextThemeMode(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

/**
 * Computes the circular reveal origin and furthest-corner radius from click
 * coordinates, falling back to the toggle button center for keyboard activation.
 */
export function computeRevealOrigin(
  buttonRect?: { left: number; top: number; width: number; height: number } | null,
  point?: { clientX: number; clientY: number } | null,
  viewport: { width: number; height: number } = { width: 1280, height: 800 },
): { x: number; y: number; radius: number } {
  const hasPointerCoords =
    point != null &&
    Number.isFinite(point.clientX) &&
    Number.isFinite(point.clientY) &&
    (point.clientX !== 0 || point.clientY !== 0);

  const x = hasPointerCoords
    ? point.clientX
    : buttonRect
      ? buttonRect.left + buttonRect.width / 2
      : viewport.width / 2;

  const y = hasPointerCoords
    ? point.clientY
    : buttonRect
      ? buttonRect.top + buttonRect.height / 2
      : viewport.height / 2;

  const radius = Math.hypot(
    Math.max(x, viewport.width - x),
    Math.max(y, viewport.height - y),
  );

  return { x, y, radius };
}

/** Reads the active theme preference on the client, defaulting cleanly to light. */
export function readClientThemeMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  const fromDataset = parseThemeMode(document.documentElement.dataset.mode);
  if (fromDataset) return fromDataset;
  try {
    return parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY)) ?? 'light';
  } catch {
    return 'light';
  }
}

function writeThemeMode(mode: ThemeMode) {
  document.documentElement.dataset.mode = mode;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {}
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/**
 * Applies a theme switch using an expanding circular View Transition centered on
 * the toggle button when supported and motion is permitted.
 */
export async function applyThemeTransition({
  target,
  button,
  point,
  wrapSync,
  onSyncCommit,
}: {
  target: ThemeMode;
  button: HTMLElement | null;
  point?: { clientX: number; clientY: number } | null;
  wrapSync?: (fn: () => void) => void;
  onSyncCommit: (mode: ThemeMode) => void;
}) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const doc = document as DocumentWithViewTransition;
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  if (reducedMotion || typeof doc.startViewTransition !== 'function') {
    onSyncCommit(target);
    writeThemeMode(target);
    return;
  }

  const { x, y, radius } = computeRevealOrigin(
    button?.getBoundingClientRect() ?? null,
    point,
    { width: window.innerWidth, height: window.innerHeight },
  );

  root.dataset.themeTransition = 'expand';
  const runSync = wrapSync ?? (fn => fn());
  const transition = doc.startViewTransition(() => {
    runSync(() => {
      onSyncCommit(target);
      writeThemeMode(target);
    });
  });

  try {
    await transition.ready;
    root.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
      },
      {
        duration: 540,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    );
    await transition.finished;
  } catch {
    writeThemeMode(target);
  } finally {
    delete root.dataset.themeTransition;
  }
}
