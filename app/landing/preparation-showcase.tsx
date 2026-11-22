"use client";

import * as React from "react";
import Link from "next/link";
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

/** Synchronizes the 3 pre-boarding preparation steps with the isometric Boarding Stand figure. */
export default function PreparationShowcase(): React.JSX.Element {
  const [activeStep, setActiveStep] = React.useState<PrepStepIndex>(0);
  const baseId = React.useId();

  return (
    <section className="lp-experience" aria-labelledby="experience-title">
      <div className="lp-experience-copy">
        <h2 id="experience-title">Sebelum berangkat, semua sudah siap.</h2>
        <p>Periksa detail perjalanan Anda. Berangkat pun jadi lebih tenang.</p>

        <div
          className="lp-preparation-guide"
          role="group"
          aria-label="Panduan persiapan keberangkatan"
        >
          {PREP_STEPS.map(({ index, title, description, Icon }) => {
            const isActive = activeStep === index;
            const triggerId = `${baseId}-step-${index}-trigger`;
            const panelId = `${baseId}-step-${index}-panel`;

            return (
              <div
                key={index}
                className={`lp-prep-item${isActive ? " is-active" : ""}`}
                data-active={isActive ? "true" : undefined}
              >
                <button
                  type="button"
                  id={triggerId}
                  className="lp-prep-trigger"
                  aria-expanded={isActive}
                  aria-controls={panelId}
                  onClick={() => setActiveStep(index)}
                >
                  <Icon
                    size={20}
                    weight={isActive ? "fill" : "regular"}
                    aria-hidden="true"
                  />
                  <span className="lp-prep-title">{title}</span>
                  <span className="lp-prep-indicator" aria-hidden="true">
                    {isActive ? "−" : "+"}
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="lp-prep-panel"
                  data-active={isActive ? "true" : undefined}
                >
                  <p>{description}</p>
                </div>
              </div>
            );
          })}
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

      <div className="lp-experience-figure">
        <BoardingStandFigure activeStep={activeStep} onSelectStep={setActiveStep} />
      </div>
    </section>
  );
}
