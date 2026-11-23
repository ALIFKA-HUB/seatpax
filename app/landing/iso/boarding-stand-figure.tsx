"use client";

import * as React from "react";
import {
  buildBoardingStandGeometry,
  type PrepStepIndex,
} from "./boarding-stand-geometry";
import { fine, type IsoDot, type IsoLine, type IsoSolid } from "./iso-kit";
import "./iso.css";

export type { PrepStepIndex } from "./boarding-stand-geometry";

const GEOMETRY = buildBoardingStandGeometry();

const STEP_TARGETS: Record<PrepStepIndex, number> = {
  0: 0,
  1: 0.48,
  2: 1,
};

const STEP_READOUTS: Record<PrepStepIndex, string> = {
  0: "STEP 01 · TITIK NAIK",
  1: "STEP 02 · 08:00 WIB",
  2: "STEP 03 · PINDAI QR",
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

function carriageTransform(t: number): string {
  const tx = fine(t * GEOMETRY.carriageTravel.dx);
  const ty = fine(t * GEOMETRY.carriageTravel.dy);
  return `translate(${tx} ${ty})`;
}

function renderLine(line: IsoLine, key: string | number) {
  if (!line.d) return null;
  return (
    <path
      key={key}
      className={line.className ? `iso-line ${line.className}` : "iso-line"}
      data-tone={line.tone ?? "lo"}
      data-dotted={line.dotted ? "" : undefined}
      data-dashed={line.dashed ? "" : undefined}
      data-flow={line.flow ? "" : undefined}
      data-free={line.free === true ? "" : line.free || undefined}
      d={line.d}
    />
  );
}

function renderDots(items: IsoDot[], keyPrefix: string) {
  if (!items.length) return null;
  return items.map((dot, index) => (
    <g
      key={`${keyPrefix}-${index}`}
      className="iso-dots"
      data-tone={dot.tone ?? "mid"}
    >
      <circle
        cx={dot.cx}
        cy={dot.cy}
        r={dot.r ?? 0.5}
        fillOpacity={
          dot.alpha !== undefined && dot.alpha < 1 ? Math.max(0, dot.alpha) : undefined
        }
        data-pulse={dot.pulse ? "" : undefined}
      />
    </g>
  ));
}

function renderSolid(solid: IsoSolid, litOverride?: boolean) {
  const isLit = litOverride ?? solid.lit ?? false;
  const { paths } = solid;
  const tone = solid.tone ?? "hi";
  const crease = solid.crease ?? "faint";

  return (
    <g
      key={solid.id}
      className={solid.className ? `iso-solid ${solid.className}` : "iso-solid"}
      data-lit={isLit ? "" : undefined}
      data-seamless={paths.seamless ? "" : undefined}
    >
      {solid.halo ? <path className="iso-halo" d={paths.fill} /> : null}
      <path className="iso-fill" d={paths.fill} />
      {solid.flat
        ? null
        : paths.shades.map((d, shade) =>
            d ? (
              <path key={shade} className="iso-shade" data-shade={shade} d={d} />
            ) : null,
          )}
      {solid.flat ? null : <path className="iso-top" d={paths.top} />}
      {crease !== "none" && paths.crease ? (
        <path className="iso-line iso-crease" data-tone={crease} d={paths.crease} />
      ) : null}
      {crease !== "none" && paths.bevel ? (
        <path className="iso-line iso-bevel" data-tone={crease} d={paths.bevel} />
      ) : null}
      {solid.inner?.map((line, index) => renderLine(line, `${solid.id}-in-${index}`))}
      <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
    </g>
  );
}

export interface BoardingStandFigureProps {
  activeStep: PrepStepIndex;
  onSelectStep?: (step: PrepStepIndex) => void;
}

export default function BoardingStandFigure({
  activeStep,
  onSelectStep,
}: BoardingStandFigureProps) {
  const plateRef = React.useRef<HTMLButtonElement>(null);
  const carriageRef = React.useRef<SVGGElement>(null);

  const [initialT] = React.useState<number>(() => STEP_TARGETS[activeStep]);
  const currentTRef = React.useRef<number>(initialT);
  const [inView, setInView] = React.useState(false);

  const reducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  React.useEffect(() => {
    const node = plateRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        setInView(Boolean(entry?.isIntersecting));
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const targetT = STEP_TARGETS[activeStep];
    const carriageEl = carriageRef.current;
    if (!carriageEl) return;

    if (reducedMotion) {
      currentTRef.current = targetT;
      carriageEl.setAttribute("transform", carriageTransform(targetT));
      return;
    }

    if (!inView) return;

    let rafId = 0;
    let lastTime = 0;

    const tick = (now: number) => {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
      lastTime = now;

      const current = currentTRef.current;
      const next = current + (targetT - current) * (1 - Math.exp(-dt / 0.16));

      if (Math.abs(targetT - next) < 0.001) {
        currentTRef.current = targetT;
        carriageEl.setAttribute("transform", carriageTransform(targetT));
        rafId = 0;
        return;
      }

      currentTRef.current = next;
      carriageEl.setAttribute("transform", carriageTransform(next));
      rafId = requestAnimationFrame(tick);
    };

    if (Math.abs(targetT - currentTRef.current) >= 0.001) {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [activeStep, inView, reducedMotion]);

  const handleCycle = React.useCallback(() => {
    const next = ((activeStep + 1) % 3) as PrepStepIndex;
    onSelectStep?.(next);
  }, [activeStep, onSelectStep]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        onSelectStep?.(((activeStep + 1) % 3) as PrepStepIndex);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        onSelectStep?.(((activeStep + 2) % 3) as PrepStepIndex);
      }
    },
    [activeStep, onSelectStep],
  );

  const solidLitState = (id: string): boolean | undefined => {
    if (id === "scanner-led" || id === "scanner-glass") {
      return activeStep === 2;
    }
    if (id === `step-pip-${activeStep}` || id === `tower-pip-${activeStep}`) {
      return true;
    }
    return undefined;
  };

  return (
    <figure className="iso-figure">
      <button
        ref={plateRef}
        type="button"
        className="iso-plate"
        data-theme="light"
        data-step={activeStep}
        onClick={handleCycle}
        onKeyDown={handleKeyDown}
        aria-label={`QR Boarding Gate, ${STEP_READOUTS[activeStep]}. Klik untuk pindah langkah.`}
      >
        <span className="iso-plate-corners" aria-hidden="true">
          <span className="iso-plate-corner" data-corner="fig">
            Fig 01
          </span>
          <span className="iso-plate-corner" data-corner="title">
            QR Boarding Gate
          </span>
          <span className="iso-plate-corner" data-corner="hint">
            Pilih langkah atau klik figur
          </span>
          <span className="iso-plate-corner" data-corner="readout" data-readout="">
            {STEP_READOUTS[activeStep]}
          </span>
        </span>

        <span className="iso-stage" data-inview={inView ? "" : undefined}>
          <svg
            className="iso-svg"
            viewBox={GEOMETRY.viewBox}
            aria-hidden="true"
            focusable="false"
          >
            {GEOMETRY.staticSolids.map((solid) =>
              renderSolid(solid, solidLitState(solid.id)),
            )}

            {GEOMETRY.staticLines.map((line, idx) =>
              renderLine(line, `static-line-${idx}`),
            )}
            {renderDots(GEOMETRY.staticDots, "static-dot")}

            <g
              ref={carriageRef}
              className="iso-carriage"
              transform={carriageTransform(initialT)}
            >
              {GEOMETRY.carriageSolids.map((solid) => renderSolid(solid))}
              {GEOMETRY.carriageLines.map((line, idx) =>
                renderLine(line, `carriage-line-${idx}`),
              )}
              {renderDots(GEOMETRY.carriageDots, "carriage-dot")}
            </g>
          </svg>
        </span>
      </button>
    </figure>
  );
}
