import {
  axisVector,
  boxCorners,
  corners,
  cylinder,
  depthOf,
  dotGrid,
  dots,
  fine,
  fitProjection,
  insetPlan,
  knurl,
  lineOnTop,
  planOutline,
  ring,
  sideArc,
  sideSeam,
  slabOf,
  topTicks,
  wire,
  type IsoDot,
  type IsoLine,
  type IsoSolid,
  type Plan,
  type Point3,
  type Projection,
} from "./iso-kit";

export type PrepStepIndex = 0 | 1 | 2;

export interface BoardingStandGeometry {
  viewBox: string;
  partCount: number;
  staticSolids: IsoSolid[];
  staticLines: IsoLine[];
  staticDots: IsoDot[];
  carriageSolids: IsoSolid[];
  carriageLines: IsoLine[];
  carriageDots: IsoDot[];
  carriageTravel: { dx: number; dy: number };
}

const VIEW_W = 600;
const VIEW_H = 380;

const BASE_PLAN: Plan = { x: -136, y: -70, w: 272, d: 140, r: 8 };
const GUIDE_BED_PLAN: Plan = { x: -112, y: -19, w: 224, d: 38, r: 2.5 };
const LABEL_PLAN: Plan = { x: -124, y: 42, w: 58, d: 18, r: 2 };
const RULER_PLAN: Plan = { x: -58, y: 44, w: 170, d: 12, r: 1.5 };

const CARRIAGE_REST_X = -80;
const CARRIAGE_TRAVEL_X = 170;

export function buildBoardingStandGeometry(): BoardingStandGeometry {
  const bounds = boxCorners({ x: -140, y: -74, w: 280, d: 148, r: 0 }, -18, 60);
  const P: Projection = fitProjection(bounds, VIEW_W, VIEW_H, {
    pad: 26,
    headroom: 10,
    azimuth: 52,
    elevation: 30,
  });

  const staticSolids: IsoSolid[] = [];
  const staticLines: IsoLine[] = [];
  const staticDots: IsoDot[] = [];

  const byDepth = <T,>(items: T[], pointOf: (item: T) => Point3): T[] =>
    [...items].sort((a, b) => depthOf(pointOf(a), P) - depthOf(pointOf(b), P));

  // ---------------------------------------------------------------------------
  // 1. BASE GROUP (19 solids)
  // ---------------------------------------------------------------------------
  const feet = byDepth(corners(BASE_PLAN, 22), ([x, y]) => [x, y, -15]);
  feet.forEach(([fx, fy], idx) => {
    staticSolids.push({
      id: `foot-flange-${idx}`,
      paths: cylinder(fx, fy, 7.2, -17, 1.8, P, 28),
      tone: "lo",
      crease: "faint",
    });
    staticSolids.push({
      id: `foot-pad-${idx}`,
      paths: cylinder(fx, fy, 5.4, -15.2, 3.2, P, 28),
      tone: "mid",
      crease: "faint",
    });
  });

  staticSolids.push({
    id: "baseplate",
    paths: slabOf(BASE_PLAN, -12, 12, P, 8, 1.6),
    tone: "lo",
    crease: "faint",
    halo: true,
    inner: [
      { d: sideSeam(BASE_PLAN, -6, P, 8), tone: "faint" },
      { d: planOutline(insetPlan(BASE_PLAN, 5), 0, P, 8), tone: "faint" },
    ],
  });

  // Rear-right junction box sits on baseplate clear of bridge (x: 97..113, y: -56..-42)
  const junctionPlan: Plan = { x: 97, y: -56, w: 16, d: 14, r: 2 };
  staticSolids.push({
    id: "rear-junction-box",
    paths: slabOf(junctionPlan, 0, 7, P, 4, 0.6),
    tone: "lo",
    crease: "faint",
  });
  staticSolids.push({
    id: "rear-junction-gland",
    paths: cylinder(105, -49, 2.8, 7, 2.5, P, 20),
    tone: "mid",
    crease: "faint",
  });
  staticDots.push(...dots([[100, -53, 7], [110, -45, 7]], P, 0.5, "mid"));

  // Baseplate surface parts sorted far-to-near
  const screwCorners = byDepth(corners(BASE_PLAN, 11), ([x, y]) => [x, y, 0]);
  screwCorners.forEach(([sx, sy], idx) => {
    if (sy < 0) {
      staticSolids.push({
        id: `base-screw-${idx}`,
        paths: cylinder(sx, sy, 2.5, 0, 0.8, P, 18),
        tone: "mid",
        crease: "none",
      });
      staticLines.push({ d: ring(sx, sy, 3.6, 0, P, 18), tone: "lo" });
      staticDots.push(...dots([[sx, sy, 0.8]], P, 0.55, "hi"));
    }
  });

  staticSolids.push({
    id: "guide-bed",
    paths: slabOf(GUIDE_BED_PLAN, 0, 1.0, P, 4, 0.2),
    tone: "lo",
    crease: "faint",
    inner: [{ d: planOutline(insetPlan(GUIDE_BED_PLAN, 3), 1.0, P, 4), tone: "faint" }],
  });

  // Step calibration index pips aligned to carriage centers (-66.4, +1.6, +76.4)
  const stepPositions = [-66.4, 1.6, 76.4];
  stepPositions.forEach((sx, idx) => {
    staticSolids.push({
      id: `ruler-step-pip-${idx}`,
      paths: slabOf({ x: sx - 2, y: 41, w: 4, d: 3, r: 0.6 }, 0, 0.8, P, 2),
      tone: "mid",
      crease: "none",
    });
  });

  const rulerTicks = topTicks(
    RULER_PLAN.x + 8,
    RULER_PLAN.x + RULER_PLAN.w - 8,
    10,
    5,
    RULER_PLAN.y,
    0.8,
    [2.8, 5.2],
    P,
    "x",
  );
  staticSolids.push({
    id: "ruler-strip",
    paths: slabOf(RULER_PLAN, 0, 0.8, P, 3),
    tone: "lo",
    crease: "none",
    inner: [
      { d: rulerTicks.minor, tone: "lo" },
      { d: rulerTicks.major, tone: "mid" },
    ],
  });

  staticSolids.push({
    id: "label-plate",
    paths: slabOf(LABEL_PLAN, 0, 1.0, P, 4),
    tone: "lo",
    crease: "faint",
    inner: [
      { d: planOutline(insetPlan(LABEL_PLAN, 1.8), 1.0, P, 4), tone: "faint" },
      { d: lineOnTop([LABEL_PLAN.x + 7, LABEL_PLAN.y + 5.5], [LABEL_PLAN.x + 42, LABEL_PLAN.y + 5.5], 1.0, P), tone: "mid", free: true },
      { d: lineOnTop([LABEL_PLAN.x + 7, LABEL_PLAN.y + 9.0], [LABEL_PLAN.x + 34, LABEL_PLAN.y + 9.0], 1.0, P), tone: "lo", free: true },
      { d: lineOnTop([LABEL_PLAN.x + 7, LABEL_PLAN.y + 12.5], [LABEL_PLAN.x + 25, LABEL_PLAN.y + 12.5], 1.0, P), tone: "lo", free: true },
    ],
  });
  staticDots.push(
    ...dots(
      [
        [LABEL_PLAN.x + 3.8, LABEL_PLAN.y + 9, 1.0],
        [LABEL_PLAN.x + LABEL_PLAN.w - 3.8, LABEL_PLAN.y + 9, 1.0],
      ],
      P,
      0.5,
      "mid",
    ),
  );

  screwCorners.forEach(([sx, sy], idx) => {
    if (sy >= 0) {
      staticSolids.push({
        id: `base-screw-${idx}`,
        paths: cylinder(sx, sy, 2.5, 0, 0.8, P, 18),
        tone: "mid",
        crease: "none",
      });
      staticLines.push({ d: ring(sx, sy, 3.6, 0, P, 18), tone: "lo" });
      staticDots.push(...dots([[sx, sy, 0.8]], P, 0.55, "hi"));
    }
  });

  // ---------------------------------------------------------------------------
  // 2. FAR STRUCTURE: Left end-stop, rails, left/back clamps, back pillar
  // ---------------------------------------------------------------------------
  staticSolids.push({
    id: "end-stop-left",
    paths: slabOf({ x: -120, y: -31, w: 6, d: 62, r: 1.5 }, 0, 8.5, P, 3, 0.5),
    tone: "mid",
    crease: "faint",
  });
  staticDots.push(...dots([[-117, -25, 8.5], [-117, 25, 8.5]], P, 0.5, "hi"));

  staticSolids.push({
    id: "rail-back",
    paths: slabOf({ x: -114, y: -28, w: 228, d: 6, r: 1.2 }, 0, 4.5, P, 3, 0.4),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "rail-clamp-back-left",
    paths: slabOf({ x: -114, y: -29, w: 6, d: 8, r: 1 }, 4.5, 2.0, P, 3),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "rail-clamp-back-right",
    paths: slabOf({ x: 108, y: -29, w: 6, d: 8, r: 1 }, 4.5, 2.0, P, 3),
    tone: "mid",
    crease: "faint",
  });

  staticSolids.push({
    id: "rail-front",
    paths: slabOf({ x: -114, y: 22, w: 228, d: 6, r: 1.2 }, 0, 4.5, P, 3, 0.4),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "rail-clamp-front-left",
    paths: slabOf({ x: -114, y: 21, w: 6, d: 8, r: 1 }, 4.5, 2.0, P, 3),
    tone: "mid",
    crease: "faint",
  });

  // Back scanner pillar (y = -42..-30)
  staticSolids.push({
    id: "pillar-back-flange",
    paths: slabOf({ x: 68, y: -42, w: 18, d: 12, r: 2 }, 0, 3.0, P, 4, 0.4),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "pillar-back-collar",
    paths: slabOf({ x: 70, y: -41, w: 14, d: 10, r: 1.8 }, 3.0, 4.0, P, 4),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "pillar-back-column",
    paths: slabOf({ x: 72, y: -40, w: 10, d: 8, r: 1.5 }, 7.0, 27.0, P, 4),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "pillar-back-bracket",
    paths: slabOf({ x: 70, y: -41, w: 14, d: 10, r: 1.8 }, 34.0, 4.0, P, 4),
    tone: "mid",
    crease: "faint",
  });

  // ---------------------------------------------------------------------------
  // 4. MOVING CARRIAGE & BOARDING PASS (21 solids, built at x = CARRIAGE_REST_X)
  // ---------------------------------------------------------------------------
  const carriageSolids: IsoSolid[] = [];
  const carriageLines: IsoLine[] = [];
  const carriageDots: IsoDot[] = [];
  const cx = CARRIAGE_REST_X;

  // 4 lower linear bearings resting on rails (z = 4.5..6.5)
  const bearingPositions: Array<[string, number, number]> = [
    ["back-left", cx - 22, -28],
    ["back-right", cx + 12, -28],
    ["front-left", cx - 22, 22],
    ["front-right", cx + 12, 22],
  ];
  bearingPositions.forEach(([tag, bx, by]) => {
    carriageSolids.push({
      id: `carriage-bearing-${tag}`,
      paths: slabOf({ x: bx, y: by, w: 10, d: 6, r: 1 }, 4.5, 2.0, P, 3),
      tone: "mid",
      crease: "faint",
    });
  });

  // Main carriage sled (z = 6.5..11.5)
  const sledPlan: Plan = { x: cx - 26, y: -29, w: 52, d: 58, r: 3 };
  carriageSolids.push({
    id: "carriage-sled",
    paths: slabOf(sledPlan, 6.5, 5.0, P, 5, 0.7),
    tone: "mid",
    crease: "faint",
  });

  // Pull handle on left (-x) edge of sled (never collides with pillars)
  carriageSolids.push({
    id: "carriage-handle-neck",
    paths: slabOf({ x: cx - 29, y: -6, w: 3, d: 12, r: 0.8 }, 7.5, 3.0, P, 3),
    tone: "mid",
    crease: "faint",
  });
  carriageSolids.push({
    id: "carriage-handle-bar",
    paths: slabOf({ x: cx - 32.5, y: -11, w: 3.5, d: 22, r: 1.2 }, 7.2, 3.6, P, 3),
    tone: "hi",
    crease: "lo",
  });

  // Back top bearing caps (y < 0)
  carriageSolids.push({
    id: "carriage-cap-back-left",
    paths: slabOf({ x: cx - 23, y: -28, w: 10, d: 7, r: 1.2 }, 11.5, 1.8, P, 3),
    tone: "mid",
    crease: "faint",
  });
  carriageSolids.push({
    id: "carriage-cap-back-right",
    paths: slabOf({ x: cx + 13, y: -28, w: 10, d: 7, r: 1.2 }, 11.5, 1.8, P, 3),
    tone: "mid",
    crease: "faint",
  });

  // Card registration back-stop rail
  carriageSolids.push({
    id: "card-back-stop",
    paths: slabOf({ x: cx - 21, y: -18, w: 43, d: 3, r: 0.8 }, 11.5, 3.0, P, 3),
    tone: "mid",
    crease: "faint",
  });

  // Physical Seatpax Boarding Pass (main ticket + perforated stub)
  const ticketPlan: Plan = { x: cx - 19, y: -14, w: 28, d: 28, r: 1.5 };
  const stubPlan: Plan = { x: cx + 10, y: -14, w: 11, d: 28, r: 1.5 };

  carriageSolids.push({
    id: "boarding-pass-body",
    paths: slabOf(ticketPlan, 11.5, 2.0, P, 4, 0.3),
    tone: "hi",
    crease: "lo",
    inner: [{ d: planOutline(insetPlan(ticketPlan, 1.5), 13.5, P, 4), tone: "faint" }],
  });

  carriageSolids.push({
    id: "boarding-pass-stub",
    paths: slabOf(stubPlan, 11.5, 2.0, P, 4, 0.3),
    tone: "hi",
    crease: "lo",
    inner: [
      { d: planOutline(insetPlan(stubPlan, 1.5), 13.5, P, 4), tone: "faint" },
      { d: lineOnTop([cx + 13, -7], [cx + 18, -7], 13.5, P), tone: "mid", free: true },
      { d: lineOnTop([cx + 13, -3], [cx + 17, -3], 13.5, P), tone: "lo", free: true },
      { d: lineOnTop([cx + 13, 3], [cx + 18, 3], 13.5, P), tone: "mid", free: true },
    ],
  });

  // QR code raised finder & data blocks sorted by depth (on top of ticket at z = 13.5)
  const qrBlocks: Array<{ id: string; plan: Plan }> = [
    { id: "qr-finder-tl", plan: { x: cx - 10, y: -8, w: 4.4, d: 4.4, r: 0.5 } },
    { id: "qr-finder-tr", plan: { x: cx + 1, y: -8, w: 4.4, d: 4.4, r: 0.5 } },
    { id: "qr-data-mid", plan: { x: cx - 4.2, y: -2.2, w: 3.0, d: 3.0, r: 0.4 } },
    { id: "qr-finder-bl", plan: { x: cx - 10, y: 3, w: 4.4, d: 4.4, r: 0.5 } },
    { id: "qr-data-br1", plan: { x: cx + 1.5, y: 3.2, w: 2.6, d: 2.6, r: 0.4 } },
    { id: "qr-data-br2", plan: { x: cx - 3.8, y: 4.5, w: 2.6, d: 2.6, r: 0.4 } },
  ];
  byDepth(qrBlocks, (item) => [item.plan.x + item.plan.w / 2, item.plan.y + item.plan.d / 2, 13.8]).forEach((block) => {
    carriageSolids.push({
      id: block.id,
      paths: slabOf(block.plan, 13.5, 0.7, P, 2),
      tone: "hi",
      crease: "lo",
    });
  });

  // Card clamp bar holding left edge of ticket (x = cx - 19..cx - 14)
  carriageSolids.push({
    id: "card-clamp-bar",
    paths: slabOf({ x: cx - 19, y: -14, w: 5, d: 28, r: 1 }, 13.5, 2.0, P, 3, 0.3),
    tone: "hi",
    crease: "lo",
  });

  // Front top bearing caps (y > 0)
  carriageSolids.push({
    id: "carriage-cap-front-left",
    paths: slabOf({ x: cx - 23, y: 21, w: 10, d: 7, r: 1.2 }, 11.5, 1.8, P, 3),
    tone: "mid",
    crease: "faint",
  });
  carriageSolids.push({
    id: "carriage-cap-front-right",
    paths: slabOf({ x: cx + 13, y: 21, w: 10, d: 7, r: 1.2 }, 11.5, 1.8, P, 3),
    tone: "mid",
    crease: "faint",
  });

  // Carriage dots: bearing cap screws, clamp rivets, QR dot matrix, perforation seam dots
  carriageDots.push(
    ...dots(
      [
        [cx - 18, -24.5, 13.3],
        [cx + 18, -24.5, 13.3],
        [cx - 18, 24.5, 13.3],
        [cx + 18, 24.5, 13.3],
        [cx - 16.5, -10, 15.5],
        [cx - 16.5, 10, 15.5],
      ],
      P,
      0.5,
      "hi",
    ),
    ...dotGrid(cx - 4.2, -7.2, 3, 2, 2.1, 13.5, P, 0.42, "mid"),
    ...dotGrid(cx + 9.5, -11, 1, 8, 3.1, 13.5, P, 0.4, "mid"),
  );

  // ---------------------------------------------------------------------------
  // 2b. NEAR STRUCTURE: Right front clamp, right end-stop, front pillar
  // ---------------------------------------------------------------------------
  staticSolids.push({
    id: "rail-clamp-front-right",
    paths: slabOf({ x: 108, y: 21, w: 6, d: 8, r: 1 }, 4.5, 2.0, P, 3),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "end-stop-right",
    paths: slabOf({ x: 114, y: -31, w: 6, d: 62, r: 1.5 }, 0, 8.5, P, 3, 0.5),
    tone: "mid",
    crease: "faint",
  });
  staticDots.push(...dots([[117, -25, 8.5], [117, 25, 8.5]], P, 0.5, "hi"));

  // Front scanner pillar (y = 30..42)
  staticSolids.push({
    id: "pillar-front-flange",
    paths: slabOf({ x: 68, y: 30, w: 18, d: 12, r: 2 }, 0, 3.0, P, 4, 0.4),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "pillar-front-collar",
    paths: slabOf({ x: 70, y: 31, w: 14, d: 10, r: 1.8 }, 3.0, 4.0, P, 4),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "pillar-front-column",
    paths: slabOf({ x: 72, y: 32, w: 10, d: 8, r: 1.5 }, 7.0, 27.0, P, 4),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "pillar-front-bracket",
    paths: slabOf({ x: 70, y: 31, w: 14, d: 10, r: 1.8 }, 34.0, 4.0, P, 4),
    tone: "mid",
    crease: "faint",
  });

  // ---------------------------------------------------------------------------
  // 3. OPTICAL QR MECHANISM & BRIDGE CROSSBAR (drawn above carriage & pillars)
  // ---------------------------------------------------------------------------
  const glassPlan: Plan = { x: 70, y: -8, w: 14, d: 16, r: 1.5 };
  staticSolids.push({
    id: "scanner-glass",
    paths: slabOf(glassPlan, 27.2, 0.8, P, 3),
    tone: "lo",
    crease: "none",
    flat: true,
    inner: [{ d: planOutline(insetPlan(glassPlan, 1.8), 28.0, P, 3), tone: "faint" }],
  });
  staticSolids.push({
    id: "scanner-bezel",
    paths: slabOf({ x: 67, y: -11, w: 20, d: 22, r: 2 }, 28.0, 2.0, P, 4, 0.3),
    tone: "hi",
    crease: "lo",
  });
  staticSolids.push({
    id: "lens-housing",
    paths: cylinder(77, 0, 9.5, 30.0, 4.0, P, 32, 0.4),
    tone: "hi",
    crease: "lo",
    inner: [{ d: sideArc(77, 0, 9.5, 32.0, P, 24), tone: "faint" }],
  });
  staticSolids.push({
    id: "lens-collar",
    paths: slabOf({ x: 68, y: -14, w: 18, d: 28, r: 2.5 }, 34.0, 4.0, P, 4),
    tone: "mid",
    crease: "faint",
  });

  const crossbarPlan: Plan = { x: 64, y: -44, w: 26, d: 88, r: 3 };
  staticSolids.push({
    id: "bridge-crossbar",
    paths: slabOf(crossbarPlan, 38.0, 8.0, P, 5, 1.0),
    tone: "mid",
    crease: "faint",
    inner: [{ d: sideSeam(crossbarPlan, 42.0, P, 5), tone: "faint" }],
  });
  staticSolids.push({
    id: "bridge-cable-gland",
    paths: slabOf({ x: 90, y: -40, w: 2.8, d: 8, r: 0.9 }, 40.0, 4.0, P, 3),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "side-sensor-port",
    paths: slabOf({ x: 61, y: -4, w: 3, d: 8, r: 1 }, 40.0, 4.0, P, 3),
    tone: "hi",
    crease: "lo",
  });
  staticSolids.push({
    id: "bridge-spine",
    paths: slabOf({ x: 69, y: -40, w: 16, d: 80, r: 2 }, 46.0, 3.0, P, 4, 0.4),
    tone: "mid",
    crease: "faint",
  });

  staticSolids.push({
    id: "bridge-cap-back",
    paths: cylinder(77, -36, 4.2, 49.0, 2.0, P, 24),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "optical-turret",
    paths: slabOf({ x: 66, y: -16, w: 22, d: 32, r: 3 }, 49.0, 5.0, P, 4, 0.8),
    tone: "hi",
    crease: "lo",
    inner: [{ d: sideSeam({ x: 66, y: -16, w: 22, d: 32, r: 3 }, 51.5, P, 4), tone: "faint" }],
  });
  staticSolids.push({
    id: "focus-dial",
    paths: cylinder(77, 0, 7.5, 54.0, 3.2, P, 32, 0.4),
    tone: "hi",
    crease: "lo",
    inner: [
      { d: knurl(77, 0, 7.5, 54.0, 57.2, 32, P, 0.35), tone: "lo" },
      { d: ring(77, 0, 1.8, 57.2, P, 20), tone: "lo" },
      { d: lineOnTop([77 + 1.8, 0], [77 + 7.2, 0], 57.2, P), tone: "hi" },
    ],
  });

  // Status indicator LED mounted on the front shoulder of bridge crossbar
  staticSolids.push({
    id: "scanner-led-bezel",
    paths: cylinder(71, 22, 3.4, 46.0, 1.6, P, 24),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "scanner-led",
    paths: cylinder(71, 22, 2.1, 47.6, 2.4, P, 24),
    tone: "hi",
    crease: "lo",
    className: "iso-led",
  });

  staticSolids.push({
    id: "bridge-cap-front",
    paths: cylinder(77, 36, 4.2, 49.0, 2.0, P, 24),
    tone: "mid",
    crease: "faint",
  });
  staticDots.push(...dots([[77, -36, 51], [77, 36, 51]], P, 0.55, "hi"));

  // Rear braided cable routed cleanly from visible bridge gland to junction gland
  const powerWire = wire(
    [105, -49, 9.5],
    [92.8, -36, 42.0],
    [
      [105, -49, 36.0],
      [98, -36, 42.0],
    ],
    P,
    { tone: "mid", dotSize: 1.1 },
  );
  const signalWire = wire(
    [105, -49, 9.5],
    [92.8, -36, 42.0],
    [
      [105, -49, 36.0],
      [98, -36, 42.0],
    ],
    P,
    { tone: "lo", flow: true, dotSize: 0.9 },
  );
  staticLines.push(powerWire.line, signalWire.line);
  staticDots.push(...powerWire.dots);

  const [dx, dy] = axisVector(P, [CARRIAGE_TRAVEL_X, 0, 0]);
  const partCount = staticSolids.length + carriageSolids.length;

  return {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    partCount,
    staticSolids,
    staticLines,
    staticDots,
    carriageSolids,
    carriageLines,
    carriageDots,
    carriageTravel: { dx: fine(dx), dy: fine(dy) },
  };
}
