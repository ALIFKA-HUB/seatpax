import {
  axisVector,
  boxCorners,
  corners,
  cylinder,
  depthOf,
  dots,
  fitProjection,
  insetPlan,
  lineOnTop,
  planOutline,
  ring,
  sideSeam,
  slabOf,
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

const BASE_PLAN: Plan = { x: -116, y: -58, w: 224, d: 122, r: 10 };
const PODIUM_PLAN: Plan = { x: -80, y: -48, w: 74, d: 76, r: 8 };
const TOWER_PLAN: Plan = { x: -78, y: -48, w: 70, d: 18, r: 5 };
const DOCK_PLAN: Plan = { x: 24, y: -26, w: 68, d: 80, r: 9 };

const PHONE_START: Plan = { x: 34, y: -20, w: 48, d: 74, r: 7 };
const PHONE_Z0 = 23;
const PHONE_H = 5.5;
const PHONE_TRAVEL_3D: Point3 = [-99, 0, 21];

export function buildBoardingStandGeometry(): BoardingStandGeometry {
  const bounds = boxCorners({ x: -120, y: -62, w: 234, d: 130, r: 0 }, -10, 90);
  const P: Projection = fitProjection(bounds, VIEW_W, VIEW_H, {
    pad: 24,
    headroom: 8,
    azimuth: 46,
    elevation: 30,
  });

  const staticSolids: IsoSolid[] = [];
  const staticLines: IsoLine[] = [];
  const staticDots: IsoDot[] = [];

  const byDepth = <T,>(items: T[], pointOf: (item: T) => Point3): T[] =>
    [...items].sort((a, b) => depthOf(pointOf(a), P) - depthOf(pointOf(b), P));

  // ---------------------------------------------------------------------------
  // 1. BASE PLATFORM & SMARTPHONE STAGING DOCK (18 solids)
  // ---------------------------------------------------------------------------
  const feet = byDepth(corners(BASE_PLAN, 18), ([x, y]) => [x, y, -4]);
  feet.forEach(([fx, fy], idx) => {
    staticSolids.push({
      id: `foot-flange-${idx}`,
      paths: cylinder(fx, fy, 7, -8, 2.5, P, 24),
      tone: "lo",
      crease: "faint",
    });
    staticSolids.push({
      id: `foot-pad-${idx}`,
      paths: cylinder(fx, fy, 5.2, -5.5, 5.5, P, 24),
      tone: "mid",
      crease: "faint",
    });
  });

  staticSolids.push({
    id: "baseplate",
    paths: slabOf(BASE_PLAN, 0, 8, P, 8, 1.4),
    tone: "mid",
    crease: "lo",
    halo: true,
    inner: [
      { d: sideSeam(BASE_PLAN, 4, P, 8), tone: "faint" },
      { d: planOutline(insetPlan(BASE_PLAN, 5), 8, P, 8), tone: "faint" },
    ],
  });

  // Corner mounting bolts on baseplate surface
  const screwCorners = byDepth(corners(BASE_PLAN, 10), ([x, y]) => [x, y, 8]);
  screwCorners.forEach(([sx, sy]) => {
    if (sy < 0 && sx < 0) return;
    staticLines.push({ d: ring(sx, sy, 2, 8, P, 16), tone: "lo" });
    staticDots.push(...dots([[sx, sy, 8]], P, 0.55, "mid"));
  });

  // Rear-left power & network junction + braided cable entering podium back
  const junctionPlan: Plan = { x: -106, y: -44, w: 15, d: 14, r: 2.5 };
  staticSolids.push({
    id: "rear-junction-box",
    paths: slabOf(junctionPlan, 8, 6, P, 4, 0.6),
    tone: "mid",
    crease: "faint",
  });
  staticSolids.push({
    id: "rear-junction-gland",
    paths: cylinder(-98.5, -37, 2.6, 14, 2.5, P, 18),
    tone: "hi",
    crease: "faint",
  });
  const powerCable = wire(
    [-98.5, -37, 16.5],
    [-80, -37, 16.5],
    [[-90, -37, 16.5]],
    P,
    { tone: "mid", flow: true, dotSize: 1.1 },
  );
  staticLines.push(powerCable.line);
  staticDots.push(...powerCable.dots);

  // Right-side elevated smartphone staging cradle (Step 0 resting position)
  staticSolids.push({
    id: "phone-dock-plinth",
    paths: slabOf(DOCK_PLAN, 8, 10, P, 8, 1.0),
    tone: "hi",
    crease: "lo",
    inner: [{ d: planOutline(insetPlan(DOCK_PLAN, 4.5), 18, P, 8), tone: "faint" }],
  });
  staticSolids.push({
    id: "phone-dock-bumper-top",
    paths: slabOf({ x: 44, y: -22, w: 28, d: 4.5, r: 1.5 }, 18, 2.2, P, 4, 0.3),
    className: "iso-solid--blue",
    tone: "hi",
    crease: "faint",
  });
  staticSolids.push({
    id: "phone-dock-bumper-bottom",
    paths: slabOf({ x: 44, y: 45, w: 28, d: 4.5, r: 1.5 }, 18, 2.2, P, 4, 0.3),
    className: "iso-solid--blue",
    tone: "hi",
    crease: "faint",
  });

  // Floor 3-step progression rail connecting dock -> podium
  staticSolids.push({
    id: "step-track-bar",
    paths: slabOf({ x: -34, y: 42, w: 54, d: 8, r: 3 }, 8, 2, P, 4, 0.3),
    tone: "lo",
    crease: "faint",
  });
  // Sorted far-to-near along +x
  [
    { id: "step-pip-2", x: -29 },
    { id: "step-pip-1", x: -10 },
    { id: "step-pip-0", x: 9 },
  ].forEach(({ id, x }) => {
    staticSolids.push({
      id,
      paths: cylinder(x, 46, 2.4, 10, 1.4, P, 20),
      className: "iso-solid--blue",
      tone: "hi",
      crease: "faint",
    });
  });

  // ---------------------------------------------------------------------------
  // 2. DEEP NAVY QR BOARDING PODIUM & OPTICAL SCANNER DECK (13 solids)
  // ---------------------------------------------------------------------------
  staticSolids.push({
    id: "podium-skirt",
    paths: slabOf(PODIUM_PLAN, 8, 5, P, 8, 0.8),
    className: "iso-solid--blue",
    tone: "hi",
    crease: "faint",
  });

  const deckPlan = insetPlan(PODIUM_PLAN, 1.5);
  staticSolids.push({
    id: "podium-deck",
    paths: slabOf(deckPlan, 13, 17, P, 8, 1.2),
    className: "iso-solid--navy",
    tone: "hi",
    crease: "lo",
    inner: [{ d: sideSeam(deckPlan, 21.5, P, 8), tone: "faint" }],
  });

  // Engraved front badge plate on podium rim
  const labelPlan: Plan = { x: -70, y: 19, w: 38, d: 5.5, r: 1.5 };
  staticSolids.push({
    id: "podium-label-plate",
    paths: slabOf(labelPlan, 30, 0.9, P, 4),
    className: "iso-solid--blue",
    tone: "hi",
    crease: "none",
    inner: [
      {
        d: lineOnTop([labelPlan.x + 4, labelPlan.y + 2.8], [labelPlan.x + 28, labelPlan.y + 2.8], 30.9, P),
        tone: "hi",
        free: true,
      },
    ],
  });

  // Recessed reader frame + Glowing Optical QR Glass Window
  const bezelPlan: Plan = { x: -69, y: -23, w: 54, d: 39, r: 6 };
  staticSolids.push({
    id: "scanner-bezel",
    paths: slabOf(bezelPlan, 30, 1.4, P, 6, 0.4),
    className: "iso-solid--navy",
    tone: "hi",
    crease: "faint",
  });

  const glassPlan = insetPlan(bezelPlan, 3.5);
  staticSolids.push({
    id: "scanner-glass",
    paths: slabOf(glassPlan, 31.4, 1.2, P, 5),
    className: "iso-solid--glass",
    tone: "hi",
    crease: "faint",
    inner: [
      { d: planOutline(insetPlan(glassPlan, 3), 32.6, P, 4), tone: "hi" },
      // Scan crosshair lines touching the inner reticle outline edge
      {
        d: lineOnTop(
          [glassPlan.x + 3, glassPlan.y + glassPlan.d / 2],
          [glassPlan.x + glassPlan.w - 3, glassPlan.y + glassPlan.d / 2],
          32.6,
          P,
        ),
        tone: "mid",
        dashed: true,
      },
    ],
  });

  // Upright Podium Gate Tower at back (y: -48..-30, strictly behind moving phone y >= -20)
  staticSolids.push({
    id: "tower-column",
    paths: slabOf(TOWER_PLAN, 30, 44, P, 6, 1.0),
    className: "iso-solid--navy",
    tone: "hi",
    crease: "lo",
    inner: [{ d: sideSeam(TOWER_PLAN, 54, P, 6), tone: "faint" }],
  });

  staticSolids.push({
    id: "tower-blue-cap",
    paths: slabOf(insetPlan(TOWER_PLAN, 1), 74, 8, P, 5, 0.8),
    className: "iso-solid--blue",
    tone: "hi",
    crease: "lo",
  });

  staticSolids.push({
    id: "tower-top-crown",
    paths: slabOf(insetPlan(TOWER_PLAN, 4), 82, 3, P, 4, 0.5),
    className: "iso-solid--navy",
    tone: "hi",
    crease: "faint",
  });

  // Front status housing on upper tower (z: 56..72, well above phone in screen space)
  const displayPlan: Plan = { x: -70, y: -30.5, w: 54, d: 4.5, r: 1.5 };
  staticSolids.push({
    id: "tower-status-frame",
    paths: slabOf(displayPlan, 56, 15, P, 4, 0.5),
    className: "iso-solid--screen",
    tone: "hi",
    crease: "faint",
  });

  // 3 compact status pips + 1 main scanning beacon dome on the upper front display
  [-60, -52, -44].forEach((px, idx) => {
    staticSolids.push({
      id: `tower-pip-${idx}`,
      paths: slabOf({ x: px, y: -27, w: 4.5, d: 2.5, r: 0.8 }, 61, 4.5, P, 2),
      className: "iso-solid--blue",
      tone: "hi",
      crease: "faint",
    });
  });

  staticSolids.push({
    id: "scanner-led",
    paths: slabOf({ x: -35, y: -27, w: 14, d: 2.8, r: 1.2 }, 60, 7, P, 3, 0.4),
    className: "iso-solid--blue",
    tone: "hi",
    crease: "faint",
  });

  // ---------------------------------------------------------------------------
  // 3. MOVING PASSENGER SMARTPHONE WITH CRISP QR TICKET (21 solids)
  // ---------------------------------------------------------------------------
  const carriageSolids: IsoSolid[] = [];
  const carriageLines: IsoLine[] = [];
  const carriageDots: IsoDot[] = [];

  // Smartphone outer anodized navy body
  carriageSolids.push({
    id: "phone-chassis",
    paths: slabOf(PHONE_START, PHONE_Z0, PHONE_H, P, 8, 0.9),
    className: "iso-solid--navy",
    tone: "hi",
    crease: "lo",
    halo: true,
    inner: [{ d: sideSeam(PHONE_START, PHONE_Z0 + 2.8, P, 8), tone: "faint" }],
  });

  // Side volume & power buttons (rendered around chassis edges)
  carriageSolids.push({
    id: "phone-power-btn",
    paths: slabOf(
      { x: PHONE_START.x + PHONE_START.w - 0.8, y: PHONE_START.y + 18, w: 1.6, d: 11, r: 0.6 },
      PHONE_Z0 + 1.8,
      2.2,
      P,
      2,
    ),
    className: "iso-solid--blue",
    tone: "hi",
    crease: "none",
  });

  // Crisp bright white smartphone display
  const screenPlan = insetPlan(PHONE_START, 3.6);
  const screenZ = PHONE_Z0 + PHONE_H;
  const screenTop = screenZ + 0.55;
  carriageSolids.push({
    id: "phone-screen",
    paths: slabOf(screenPlan, screenZ, 0.55, P, 6),
    className: "iso-solid--screen",
    tone: "hi",
    crease: "faint",
  });

  // Top Seatpax Blue app header bar on phone screen
  const headerPlan: Plan = {
    x: screenPlan.x + 2.2,
    y: screenPlan.y + 2.4,
    w: screenPlan.w - 4.4,
    d: 8.5,
    r: 1.8,
  };
  carriageSolids.push({
    id: "phone-app-header",
    paths: slabOf(headerPlan, screenTop, 0.3, P, 4),
    className: "iso-solid--blue",
    tone: "hi",
    crease: "none",
  });

  // Crisp QR Code on screen (3 classic hollow corner finder squares + data modules)
  const qrX = screenPlan.x + 6;
  const qrY = screenPlan.y + 14.5;
  const qrSize = screenPlan.w - 12; // ~28.8
  const finderSize = 9.2;
  const finderPositions: Array<[string, number, number]> = [
    ["qr-finder-tl", qrX, qrY],
    ["qr-finder-tr", qrX + qrSize - finderSize, qrY],
    ["qr-finder-bl", qrX, qrY + qrSize - finderSize],
  ];

  // Sorted far-to-near via byDepth for clean painter's order
  byDepth(finderPositions, ([, fx, fy]) => [fx, fy, screenTop]).forEach(([id, fx, fy]) => {
    const outer: Plan = { x: fx, y: fy, w: finderSize, d: finderSize, r: 1.1 };
    const mid: Plan = insetPlan(outer, 1.8);
    const core: Plan = insetPlan(outer, 3.2);
    carriageSolids.push(
      {
        id: `${id}-outer`,
        paths: slabOf(outer, screenTop, 0.25, P, 3),
        className: "iso-solid--qr",
        tone: "hi",
        crease: "none",
      },
      {
        id: `${id}-cut`,
        paths: slabOf(mid, screenTop + 0.25, 0.15, P, 2),
        className: "iso-solid--screen",
        tone: "faint",
        crease: "none",
      },
      {
        id: `${id}-core`,
        paths: slabOf(core, screenTop + 0.4, 0.2, P, 2),
        className: "iso-solid--qr",
        tone: "hi",
        crease: "none",
      },
    );
  });

  // Crisp QR data payload squares filling center & bottom-right quadrant
  const modSize = 3.5;
  const qrModules: Array<[number, number]> = [
    [qrX + 12.6, qrY + 1.4],
    [qrX + 12.6, qrY + 7.4],
    [qrX + 1.8, qrY + 12.6],
    [qrX + 11.4, qrY + 12.6],
    [qrX + 18.2, qrY + 12.6],
    [qrX + 24.0, qrY + 12.6],
    [qrX + 12.6, qrY + 19.6],
    [qrX + 19.2, qrY + 18.8],
    [qrX + 24.0, qrY + 23.8],
  ];
  byDepth(qrModules, ([mx, my]) => [mx, my, screenTop]).forEach(([mx, my], idx) => {
    carriageSolids.push({
      id: `qr-mod-${idx}`,
      paths: slabOf({ x: mx, y: my, w: modSize, d: modSize, r: 0.4 }, screenTop, 0.25, P, 2),
      className: "iso-solid--qr",
      tone: "hi",
      crease: "none",
    });
  });

  // Bottom ticket confirmation badge & seat block below QR
  carriageSolids.push({
    id: "phone-ticket-bar",
    paths: slabOf(
      { x: qrX, y: qrY + qrSize + 5.5, w: qrSize, d: 9.5, r: 2.0 },
      screenTop,
      0.3,
      P,
      3,
    ),
    className: "iso-solid--blue",
    tone: "hi",
    crease: "none",
  });

  const [dx, dy] = axisVector(P, PHONE_TRAVEL_3D);

  return {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    partCount: staticSolids.length + carriageSolids.length,
    staticSolids,
    staticLines,
    staticDots,
    carriageSolids,
    carriageLines,
    carriageDots,
    carriageTravel: { dx, dy },
  };
}
