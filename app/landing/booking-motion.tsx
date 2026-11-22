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
  ArrowCounterClockwise,
  Check,
  CreditCard,
  Scan,
  Ticket,
} from '@phosphor-icons/react';
import './booking-motion.css';

export type MotionKind = 'seat' | 'deck';

const SEATS = ['01', '02', '03', '04', '05', '06', '07', '08', '09'] as const;
const MINI_SEATS = ['01', '02', '03', '04', '05', '06'] as const;

const DECK_STEPS = [
  { id: 'seat', num: '01', label: 'Kursi' },
  { id: 'payment', num: '02', label: 'Pembayaran' },
  { id: 'ticket', num: '03', label: 'Tiket' },
] as const;

const SPRING_SEAT = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
} as const;

const SPRING_SEAL = {
  type: 'spring',
  stiffness: 320,
  damping: 20,
  delay: 0.14,
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
  const media = window.matchMedia(NARROW_DECK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getNarrowDeckSnapshot(): boolean {
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
  onSelectSeat: (seat: string) => void;
}

function SeatMapCard({
  selectedSeat,
  seatChipId,
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
          return (
            <button
              key={seat}
              type="button"
              className={`lpm-seat-btn${isChosen ? ' is-chosen' : ''}`}
              aria-pressed={isChosen}
              aria-label={`Pilih kursi ${seat}`}
              onClick={() => onSelectSeat(seat)}
            >
              {isChosen && seatChipId ? (
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
  seatChipId?: string;
  reduceMotion: boolean;
  onReselect?: () => void;
}

function BoardingPassCard({
  selectedSeat,
  seatChipId,
  reduceMotion,
  onReselect,
}: BoardingPassCardProps): JSX.Element {
  return (
    <div className="lpm-ticket-wrap">
      <div className="lpm-ticket">
        <div className="lpm-ticket-paper">
          <div className="lpm-ticket-content">
            <div className="lpm-ticket-brand">
              <Logo />
              <Ticket size={20} aria-hidden="true" />
            </div>
            <div className="lpm-ticket-seat">
              <span>Kursi pilihan</span>
              {seatChipId ? (
                <motion.div
                  layoutId={seatChipId}
                  className="lpm-ticket-seat-chip"
                  transition={SPRING_SEAT}
                >
                  <strong className="lpm-ticket-seat-num" data-part="destination">
                    {selectedSeat}
                  </strong>
                </motion.div>
              ) : (
                <div className="lpm-ticket-seat-chip">
                  <strong className="lpm-ticket-seat-num" data-part="destination">
                    {selectedSeat}
                  </strong>
                </div>
              )}
            </div>
            <div className="lpm-confirmed">
              <Check size={16} weight="bold" aria-hidden="true" />
              <span>Pembayaran dikonfirmasi</span>
            </div>
          </div>
        </div>
        <div className="lpm-stub">
          <Scan size={34} aria-hidden="true" />
          <div>
            <strong>Tiket siap dibuka.</strong>
            <span>Di Pesanan saya</span>
          </div>
        </div>
        {reduceMotion ? (
          <span className="lpm-seal" aria-hidden="true">
            <Check size={22} weight="bold" />
          </span>
        ) : (
          <motion.span
            className="lpm-seal"
            aria-hidden="true"
            initial={{ scale: 0.55, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_SEAL}
          >
            <Check size={22} weight="bold" />
          </motion.span>
        )}
      </div>
      {onReselect ? (
        <button
          type="button"
          className="lpm-reselect-btn"
          onClick={onReselect}
        >
          <ArrowCounterClockwise size={15} weight="bold" aria-hidden="true" />
          <span>Pilih kursi lain</span>
        </button>
      ) : null}
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

  const [selectedSeat, setSelectedSeat] = useState<string>('03');
  const [phase, setPhase] = useState<'select' | 'ticket'>('select');
  const [userInteracted, setUserInteracted] = useState(false);
  const [autoPlayed, setAutoPlayed] = useState(false);
  const clickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      shouldReduceMotion ||
      !isInView ||
      documentHidden ||
      userInteracted ||
      autoPlayed ||
      phase !== 'select'
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setAutoPlayed(true);
      setPhase('ticket');
    }, 1250);

    return () => window.clearTimeout(timer);
  }, [
    shouldReduceMotion,
    isInView,
    documentHidden,
    userInteracted,
    autoPlayed,
    phase,
  ]);

  const handleSelectSeat = (seat: string) => {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setUserInteracted(true);
    setSelectedSeat(seat);

    if (shouldReduceMotion) {
      return;
    }

    // Let the spring chip land on the clicked seat briefly before morphing into the boarding pass.
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      setPhase('ticket');
    }, 220);
  };

  const handleReselect = () => {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setUserInteracted(true);
    setPhase('select');
  };

  return (
    <div className="lpm-root" data-kind="seat" ref={rootRef}>
      <div
        className="lpm-field lpm-seat-field"
        role="region"
        aria-label="Simulasi interaktif pemilihan kursi ke tiket digital Seatpax"
      >
        {shouldReduceMotion ? (
          <div className="lpm-seat-stage lpm-seat-stage--static">
            <SeatMapCard
              selectedSeat={selectedSeat}
              onSelectSeat={handleSelectSeat}
            />
            <BoardingPassCard
              selectedSeat={selectedSeat}
              reduceMotion
            />
          </div>
        ) : (
          <LayoutGroup id={instanceId}>
            <div className="lpm-seat-stage">
              <AnimatePresence mode="popLayout" initial={false}>
                {phase === 'select' ? (
                  <motion.div
                    key="select"
                    className="lpm-seat-pane"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                    transition={SPRING_SEAT}
                  >
                    <SeatMapCard
                      selectedSeat={selectedSeat}
                      seatChipId={seatChipId}
                      onSelectSeat={handleSelectSeat}
                    />
                    <div className="lpm-seat-preview-bar">
                      <span className="lpm-seat-preview-text">
                        <Ticket size={16} aria-hidden="true" />
                        <span>Kursi {selectedSeat} · Siap masuk tiket digital</span>
                      </span>
                      <button
                        type="button"
                        className="lpm-preview-ticket-btn"
                        onClick={() => {
                          setUserInteracted(true);
                          setPhase('ticket');
                        }}
                      >
                        Lihat tiket
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ticket"
                    className="lpm-seat-pane"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={SPRING_SEAT}
                  >
                    <BoardingPassCard
                      selectedSeat={selectedSeat}
                      seatChipId={seatChipId}
                      reduceMotion={false}
                      onReselect={handleReselect}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        )}
      </div>
    </div>
  );
}

function getCardPose(offset: number, isNarrow: boolean) {
  if (offset === 0) {
    return { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };
  }
  if (offset === 1) {
    return {
      x: isNarrow ? 32 : 76,
      y: 12,
      scale: 0.9,
      rotate: isNarrow ? 4 : 6,
      opacity: 0.94,
    };
  }
  return {
    x: isNarrow ? -32 : -76,
    y: 18,
    scale: 0.86,
    rotate: isNarrow ? -4 : -6,
    opacity: 0.88,
  };
}

function DeckCardContent({ index }: { index: 0 | 1 | 2 }): JSX.Element {
  if (index === 0) {
    return (
      <>
        <div className="lpm-card-heading">
          <Armchair size={20} aria-hidden="true" />
          <strong>01 · Kursi</strong>
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
          <span>Kursi pilihan</span>
          <strong>03</strong>
        </div>
      </>
    );
  }

  if (index === 1) {
    return (
      <>
        <div className="lpm-card-heading">
          <CreditCard size={20} aria-hidden="true" />
          <strong>02 · Pembayaran</strong>
        </div>
        <div className="lpm-confirm-symbol" aria-hidden="true">
          <span className="lpm-confirm-ring" />
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
      <span className="lpm-card-subtitle lpm-card-subtitle--left">
        Kursi Anda
      </span>
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
  const isInView = useInView(rootRef, { amount: 0.25 });
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = prefersReducedMotion === true;
  const documentHidden = useDocumentHidden();
  const isNarrow = useNarrowDeck();

  const [activeIndex, setActiveIndex] = useState<0 | 1 | 2>(0);
  const [paused, setPaused] = useState(false);
  const [cycleNonce, setCycleNonce] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion || !isInView || paused || documentHidden) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, 3600);

    return () => window.clearInterval(timer);
  }, [shouldReduceMotion, isInView, paused, documentHidden, cycleNonce]);

  const handleSelectStep = (idx: 0 | 1 | 2) => {
    setActiveIndex(idx);
    setCycleNonce((n) => n + 1);
  };

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setPaused(false);
    }
  };

  return (
    <div className="lpm-root" data-kind="deck" ref={rootRef}>
      <div
        className="lpm-field lpm-deck-field"
        role="group"
        aria-label="Alur tiga langkah pemesanan Seatpax: Kursi, Pembayaran, dan Tiket"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={handleBlurCapture}
      >
        {shouldReduceMotion ? (
          <div className="lpm-deck lpm-deck--static">
            {DECK_STEPS.map((step, idx) => {
              const stepIdx = idx as 0 | 1 | 2;
              const isActive = activeIndex === stepIdx;
              return (
                <div
                  key={step.id}
                  className={`lpm-card lpm-card--${step.id}${isActive ? ' is-active' : ''}`}
                >
                  <DeckCardContent index={stepIdx} />
                  <button
                    type="button"
                    className="lpm-card-hit"
                    aria-label={`Pilih langkah ${step.num} ${step.label}`}
                    aria-pressed={isActive}
                    onClick={() => handleSelectStep(stepIdx)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="lpm-deck lpm-deck--animated">
            {DECK_STEPS.map((step, idx) => {
              const stepIdx = idx as 0 | 1 | 2;
              const offset = (stepIdx - activeIndex + 3) % 3;
              const pose = getCardPose(offset, isNarrow);
              const isActive = offset === 0;
              return (
                <motion.div
                  key={step.id}
                  className={`lpm-card lpm-card--${step.id}${isActive ? ' is-active' : ''}`}
                  style={{ zIndex: 3 - offset }}
                  initial={false}
                  animate={pose}
                  transition={SPRING_DECK}
                >
                  <DeckCardContent index={stepIdx} />
                  <button
                    type="button"
                    className="lpm-card-hit"
                    aria-label={`Tampilkan kartu ${step.num} ${step.label}`}
                    aria-pressed={isActive}
                    onClick={() => handleSelectStep(stepIdx)}
                  />
                </motion.div>
              );
            })}
          </div>
        )}

        <div
          className="lpm-step-tabs"
          role="group"
          aria-label="Pilih langkah pemesanan"
        >
          {DECK_STEPS.map((step, idx) => {
            const stepIdx = idx as 0 | 1 | 2;
            const isActive = activeIndex === stepIdx;
            return (
              <button
                key={step.id}
                type="button"
                className={`lpm-step-tab${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => handleSelectStep(stepIdx)}
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
