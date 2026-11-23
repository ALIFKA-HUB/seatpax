'use client';

import Image from 'next/image';
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type JSX,
} from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react';
import {
  Armchair,
  ArrowRight,
  Check,
  CreditCard,
  Scan,
  Ticket,
} from '@phosphor-icons/react';
import './booking-motion.css';

export type MotionKind = 'seat' | 'deck';

const SEATS = ['01', '02', '03', '04', '05', '06', '07', '08', '09'] as const;
const DEMO_SEATS = ['03', '05', '08'] as const;
const MINI_SEATS = ['01', '02', '03', '04', '05', '06'] as const;

const DECK_STEPS = [
  { id: 'seat', num: '01', label: 'Kursi' },
  { id: 'payment', num: '02', label: 'Pembayaran' },
  { id: 'ticket', num: '03', label: 'Tiket' },
] as const;

const SPRING_SEAT = {
  type: 'spring',
  stiffness: 280,
  damping: 25,
} as const;

const SPRING_SEAL = {
  type: 'spring',
  stiffness: 340,
  damping: 22,
} as const;

const SPRING_DECK = {
  type: 'spring',
  stiffness: 240,
  damping: 26,
} as const;

const NARROW_DECK_QUERY = '(max-width: 520px)';

function subscribeVisibility(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

function getVisibilitySnapshot(): boolean {
  return document.hidden;
}

function getVisibilityServerSnapshot(): boolean {
  return false;
}

function subscribeNarrowDeck(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const media = window.matchMedia(NARROW_DECK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getNarrowDeckSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(NARROW_DECK_QUERY).matches;
}

function getNarrowDeckServerSnapshot(): boolean {
  return false;
}

function useDocumentHidden(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    getVisibilitySnapshot,
    getVisibilityServerSnapshot,
  );
}

function useNarrowDeck(): boolean {
  return useSyncExternalStore(
    subscribeNarrowDeck,
    getNarrowDeckSnapshot,
    getNarrowDeckServerSnapshot,
  );
}

function Logo(): JSX.Element {
  return (
    <Image
      src="/brand/seatpax-horizontal.png"
      alt="Seatpax"
      width={110}
      height={29}
      sizes="110px"
    />
  );
}

interface SeatMapCardProps {
  selectedSeat: string;
  seatChipId?: string;
  reduceMotion: boolean;
  onSelectSeat: (seat: string) => void;
}

function SeatMapCard({
  selectedSeat,
  seatChipId,
  reduceMotion,
  onSelectSeat,
}: SeatMapCardProps): JSX.Element {
  return (
    <div className="lpm-map">
      <div className="lpm-map-heading">
        <strong>Pilih kursi</strong>
        <Armchair size={20} aria-hidden="true" />
      </div>
      <div className="lpm-front">
        <span>Depan</span>
        <span className="lpm-wheel" aria-hidden="true" />
      </div>
      <div className="lpm-seats" role="group" aria-label="Denah pilihan kursi kabin">
        {SEATS.map((seat) => {
          const isChosen = seat === selectedSeat;
          const useSharedChip = isChosen && Boolean(seatChipId) && !reduceMotion;
          return (
            <button
              key={seat}
              type="button"
              className={`lpm-seat-btn${isChosen ? ' is-chosen' : ''}${
                useSharedChip ? ' has-motion-chip' : ''
              }`}
              aria-pressed={isChosen}
              aria-label={`Pilih kursi ${seat}`}
              onClick={() => onSelectSeat(seat)}
            >
              {useSharedChip ? (
                <motion.span
                  layoutId={seatChipId}
                  className="lpm-seat-chip-bg"
                  transition={SPRING_SEAT}
                  aria-hidden="true"
                />
              ) : null}
              <span className="lpm-seat-num">{seat}</span>
            </button>
          );
        })}
      </div>
      <div className="lpm-map-legend">
        <span>Tersedia</span>
        <span>Pilihan Anda: {selectedSeat}</span>
      </div>
    </div>
  );
}

interface BoardingPassCardProps {
  selectedSeat: string;
  reduceMotion: boolean;
}

function BoardingPassCard({
  selectedSeat,
  reduceMotion,
}: BoardingPassCardProps): JSX.Element {
  return (
    <div className="lpm-ticket" aria-live="polite">
      <div className="lpm-ticket-shell">
        <div className="lpm-ticket-paper">
          <div className="lpm-ticket-content">
            <div className="lpm-ticket-brand">
              <Logo />
              <Ticket size={20} aria-hidden="true" />
            </div>
            <div className="lpm-ticket-seat">
              <div className="lpm-ticket-seat-meta">
                <span>Kursi pilihan</span>
                <strong>Siap dipesan</strong>
              </div>
              <div className="lpm-ticket-seat-chip">
                {reduceMotion ? (
                  <strong className="lpm-ticket-seat-num" data-part="destination">
                    {selectedSeat}
                  </strong>
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.strong
                      key={selectedSeat}
                      className="lpm-ticket-seat-num"
                      data-part="destination"
                      initial={{ opacity: 0, y: 10, scale: 0.78 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.78 }}
                      transition={SPRING_SEAT}
                    >
                      {selectedSeat}
                    </motion.strong>
                  </AnimatePresence>
                )}
              </div>
            </div>
            <div className="lpm-confirmed">
              <Check size={16} weight="bold" aria-hidden="true" />
              <span>Pembayaran dikonfirmasi</span>
            </div>
          </div>
        </div>
        <div className="lpm-stub">
          <Scan size={32} aria-hidden="true" />
          <div>
            <strong>Tiket siap dibuka.</strong>
            <span>Di Pesanan saya</span>
          </div>
        </div>
      </div>

      {reduceMotion ? (
        <span className="lpm-seal" aria-hidden="true">
          <Check size={20} weight="bold" />
        </span>
      ) : (
        <motion.span
          key={selectedSeat}
          className="lpm-seal"
          aria-hidden="true"
          initial={{ scale: 0.72, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_SEAL}
        >
          <Check size={20} weight="bold" />
        </motion.span>
      )}
    </div>
  );
}

function SeatShowcase(): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.35 });
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = prefersReducedMotion === true;
  const documentHidden = useDocumentHidden();
  const instanceId = useId();
  const seatChipId = `${instanceId}-seat-chip`;

  const [demoIndex, setDemoIndex] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState<string>(DEMO_SEATS[0]);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion || !isInView || documentHidden || userInteracted) {
      return;
    }

    const timer = window.setInterval(() => {
      setDemoIndex((prev) => {
        const next = (prev + 1) % DEMO_SEATS.length;
        setSelectedSeat(DEMO_SEATS[next]!);
        return next;
      });
    }, 2600);

    return () => window.clearInterval(timer);
  }, [shouldReduceMotion, isInView, documentHidden, userInteracted]);

  const handleSelectSeat = (seat: string) => {
    setUserInteracted(true);
    setSelectedSeat(seat);
  };

  return (
    <div className="lpm-root" data-kind="seat" ref={rootRef}>
      <div
        className="lpm-field lpm-seat-field"
        role="region"
        aria-label="Simulasi interaktif pemilihan kursi ke tiket digital Seatpax"
      >
        <LayoutGroup id={instanceId}>
          <div className="lpm-seat-pair" data-demo-step={demoIndex}>
            <SeatMapCard
              selectedSeat={selectedSeat}
              seatChipId={seatChipId}
              reduceMotion={shouldReduceMotion}
              onSelectSeat={handleSelectSeat}
            />

            <div className="lpm-seat-link" aria-hidden="true">
              {shouldReduceMotion ? (
                <span className="lpm-seat-link-pill">
                  <ArrowRight size={18} weight="bold" />
                </span>
              ) : (
                <motion.span
                  key={selectedSeat}
                  className="lpm-seat-link-pill"
                  initial={{ scale: 0.84, x: -3 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={SPRING_SEAT}
                >
                  <ArrowRight size={18} weight="bold" />
                </motion.span>
              )}
            </div>

            <BoardingPassCard
              selectedSeat={selectedSeat}
              reduceMotion={shouldReduceMotion}
            />
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}

function getDeckPose(cardIndex: number, activeIndex: number, narrow: boolean) {
  const offset = (cardIndex - activeIndex + 3) % 3;
  if (offset === 0) {
    return { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, zIndex: 3 };
  }
  if (offset === 1) {
    return {
      x: narrow ? 32 : 76,
      y: 8,
      scale: 0.9,
      rotate: 5,
      opacity: 0.92,
      zIndex: 2,
    };
  }
  return {
    x: narrow ? -32 : -76,
    y: 12,
    scale: 0.86,
    rotate: -5,
    opacity: 0.84,
    zIndex: 1,
  };
}

function DeckCardBody({
  stepId,
  isActive,
  reduceMotion,
}: {
  stepId: (typeof DECK_STEPS)[number]['id'];
  isActive: boolean;
  reduceMotion: boolean;
}): JSX.Element {
  if (stepId === 'seat') {
    return (
      <>
        <div className="lpm-card-heading">
          <Armchair size={20} aria-hidden="true" />
          <strong>Kursi pilihan</strong>
        </div>
        <div className="lpm-mini-seats" aria-hidden="true">
          {MINI_SEATS.map((seat) => (
            <span
              key={seat}
              className={`lpm-mini-seat${seat === '03' ? ' is-chosen' : ''}`}
            >
              {seat}
            </span>
          ))}
        </div>
        <div className="lpm-card-foot">
          <span>Kursi</span>
          <strong>03</strong>
        </div>
      </>
    );
  }

  if (stepId === 'payment') {
    return (
      <>
        <div className="lpm-card-heading">
          <CreditCard size={20} aria-hidden="true" />
          <strong>Pembayaran</strong>
        </div>
        <div className="lpm-confirm-symbol" aria-hidden="true">
          {reduceMotion ? (
            <span className="lpm-confirm-ring" />
          ) : (
            <motion.span
              className="lpm-confirm-ring"
              animate={
                isActive ? { scale: [0.9, 1.18], opacity: [0.65, 0] } : { opacity: 0 }
              }
              transition={
                isActive
                  ? { duration: 1.5, repeat: Infinity, ease: 'easeOut' }
                  : { duration: 0.2 }
              }
            />
          )}
          <span className="lpm-confirm-check">
            <Check size={28} weight="bold" />
          </span>
        </div>
        <strong className="lpm-card-title">Dikonfirmasi.</strong>
        <span className="lpm-card-subtitle">Tiket Anda disiapkan.</span>
      </>
    );
  }

  return (
    <>
      <div className="lpm-card-heading">
        <Logo />
        <Ticket size={20} aria-hidden="true" />
      </div>
      <span className="lpm-card-subhead">Tiket perjalanan</span>
      <strong className="lpm-card-number">03</strong>
      <span className="lpm-card-subtitle lpm-card-subtitle--left">Kursi Anda</span>
      <div className="lpm-perforation" aria-hidden="true" />
      <div className="lpm-card-bottom">
        <Scan size={30} aria-hidden="true" />
        <span>
          Siap dibuka
          <br />
          di Pesanan saya.
        </span>
      </div>
    </>
  );
}

function DeckShowcase(): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.3 });
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = prefersReducedMotion === true;
  const documentHidden = useDocumentHidden();
  const isNarrow = useNarrowDeck();

  const [activeIndex, setActiveIndex] = useState<0 | 1 | 2>(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [interactionTick, setInteractionTick] = useState(0);
  const paused = hovered || focused;

  useEffect(() => {
    if (shouldReduceMotion || !isInView || paused || documentHidden) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, 3600);

    return () => window.clearInterval(interval);
  }, [shouldReduceMotion, isInView, paused, documentHidden, interactionTick]);

  const handleSelectStep = (idx: 0 | 1 | 2) => {
    setActiveIndex(idx);
    setInteractionTick((t) => t + 1);
  };

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocused(false);
    }
  };

  return (
    <div className="lpm-root" data-kind="deck" ref={rootRef}>
      <div
        className="lpm-field lpm-deck-field"
        role="group"
        aria-label="Ilustrasi tiga langkah pemesanan. Berputar otomatis, pilih tab atau tekan kartu untuk berpindah langkah."
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={handleBlurCapture}
      >
        {shouldReduceMotion ? (
          <div className="lpm-deck lpm-deck--static">
            {DECK_STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`lpm-card lpm-card--${step.id}${
                  activeIndex === idx ? ' is-active' : ''
                }`}
              >
                <DeckCardBody
                  stepId={step.id}
                  isActive={activeIndex === idx}
                  reduceMotion
                />
                <button
                  type="button"
                  className="lpm-card-hit"
                  aria-label={`Langkah ${step.num}: ${step.label}`}
                  onClick={() => handleSelectStep(idx as 0 | 1 | 2)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="lpm-deck lpm-deck--animated">
            {DECK_STEPS.map((step, idx) => {
              const pose = getDeckPose(idx, activeIndex, isNarrow);
              const isActive = activeIndex === idx;
              return (
                <motion.div
                  key={step.id}
                  className={`lpm-card lpm-card--${step.id}${isActive ? ' is-active' : ''}`}
                  initial={false}
                  animate={{
                    x: pose.x,
                    y: pose.y,
                    scale: pose.scale,
                    rotate: pose.rotate,
                    opacity: pose.opacity,
                    zIndex: pose.zIndex,
                  }}
                  transition={SPRING_DECK}
                  style={{ zIndex: pose.zIndex }}
                >
                  <DeckCardBody
                    stepId={step.id}
                    isActive={isActive}
                    reduceMotion={false}
                  />
                  <button
                    type="button"
                    className="lpm-card-hit"
                    aria-label={`Kartu ${step.label}. Pilih untuk menampilkan langkah berikutnya.`}
                    onClick={() =>
                      handleSelectStep(((isActive ? activeIndex + 1 : idx) % 3) as 0 | 1 | 2)
                    }
                  />
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="lpm-step-tabs" role="group" aria-label="Pilih langkah pemesanan">
          {DECK_STEPS.map((step, idx) => {
            const active = activeIndex === idx;
            return (
              <button
                key={step.id}
                type="button"
                className={`lpm-step-tab${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => handleSelectStep(idx as 0 | 1 | 2)}
              >
                <span className="lpm-step-tab-num">{step.num}</span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Marketing illustration only. It never creates a hold, payment or ticket. */
export default function BookingMotion({ kind }: { kind: MotionKind }): JSX.Element {
  return kind === 'seat' ? <SeatShowcase /> : <DeckShowcase />;
}
