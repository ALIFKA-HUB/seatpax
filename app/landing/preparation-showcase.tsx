"use client";

import * as React from "react";
import Link from "next/link";
import { useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Clock, MapPin, Ticket } from "@phosphor-icons/react";
import BoardingStandFigure, { type PrepStepIndex } from "./iso/boarding-stand-figure";

const PREP_STEPS = [
  {
    index: 0 as PrepStepIndex,
    title: "Tahu harus naik di mana",
    description:
      "Temukan titik naik dan turun pada detail perjalanan. Pastikan lokasi keberangkatan sudah sesuai.",
    Icon: MapPin,
  },
  {
    index: 1 as PrepStepIndex,
    title: "Waktunya sudah sesuai",
    description:
      "Periksa tanggal, jam keberangkatan, armada, dan kelas layanan sebelum berangkat.",
    Icon: Clock,
  },
  {
    index: 2 as PrepStepIndex,
    title: "Tiket tinggal ditunjukkan",
    description:
      "Setelah pembayaran dikonfirmasi, buka tiket dan QR melalui Pesanan saya.",
    Icon: Ticket,
  },
] as const;

const AUTO_STEP_MS = 2800;
const BOOST_WINDOW_MS = 450;

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function getVisibilitySnapshot(): boolean {
  return document.hidden;
}

function getVisibilityServerSnapshot(): boolean {
  return false;
}

/** Synchronizes the 3 pre-boarding preparation steps with the isometric QR Boarding Gate figure. */
export default function PreparationShowcase(): React.JSX.Element {
  const sectionRef = React.useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.3 });
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = prefersReducedMotion === true;
  const documentHidden = React.useSyncExternalStore(
    subscribeVisibility,
    getVisibilitySnapshot,
    getVisibilityServerSnapshot,
  );

  const [activeStep, setActiveStep] = React.useState<PrepStepIndex>(0);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [accelerated, setAccelerated] = React.useState(false);
  const [interactionTick, setInteractionTick] = React.useState(0);
  const boostTimerRef = React.useRef<number | null>(null);

  const paused = hovered || focused;

  React.useEffect(() => {
    return () => {
      if (boostTimerRef.current !== null) {
        window.clearTimeout(boostTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (shouldReduceMotion || !isInView || paused || documentHidden) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveStep((prev) => ((prev + 1) % PREP_STEPS.length) as PrepStepIndex);
    }, AUTO_STEP_MS);

    return () => window.clearInterval(timer);
  }, [shouldReduceMotion, isInView, paused, documentHidden, interactionTick]);

  const handleTriggerStep = React.useCallback(
    (step: PrepStepIndex) => {
      setActiveStep(step);
      setInteractionTick((tick) => tick + 1);

      if (shouldReduceMotion) {
        return;
      }

      setAccelerated(true);
      if (boostTimerRef.current !== null) {
        window.clearTimeout(boostTimerRef.current);
      }
      boostTimerRef.current = window.setTimeout(() => {
        boostTimerRef.current = null;
        setAccelerated(false);
      }, BOOST_WINDOW_MS);
    },
    [shouldReduceMotion],
  );

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocused(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="lp-experience"
      aria-labelledby="experience-title"
    >
      <div className="lp-experience-head">
        <div className="lp-section-title">
          <h2 id="experience-title">Sebelum berangkat, semua sudah siap.</h2>
          <p>Periksa detail perjalanan Anda. Berangkat pun jadi lebih tenang.</p>
        </div>

        <Link
          className="lp-button lp-cta-accent lp-preparation-cta"
          href="/tickets"
        >
          Buka pesanan saya
          <span className="lp-button-arrow">
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        </Link>
      </div>

      <div
        className="lp-experience-body"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setHovered(false);
        }}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={handleBlurCapture}
      >
        <div
          className="lp-preparation-guide"
          role="group"
          aria-label="Panduan persiapan keberangkatan"
        >
          {PREP_STEPS.map(({ index, title, description, Icon }) => {
            const isActive = activeStep === index;
            const stepNum = String(index + 1).padStart(2, "0");

            return (
              <div
                key={index}
                className={`lp-prep-item${isActive ? " is-active" : ""}`}
                data-active={isActive ? "true" : undefined}
              >
                <button
                  type="button"
                  className="lp-prep-trigger"
                  aria-pressed={isActive}
                  onClick={() => handleTriggerStep(index)}
                >
                  <Icon
                    size={20}
                    weight={isActive ? "fill" : "regular"}
                    aria-hidden="true"
                  />
                  <span className="lp-prep-title">{title}</span>
                  <span className="lp-prep-indicator" aria-hidden="true">
                    {stepNum}
                  </span>
                </button>
                <div
                  className="lp-prep-panel"
                  data-active={isActive ? "true" : undefined}
                >
                  <p>{description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lp-experience-figure">
          <BoardingStandFigure
            activeStep={activeStep}
            accelerated={accelerated}
            onSelectStep={handleTriggerStep}
          />
        </div>
      </div>
    </section>
  );
}
