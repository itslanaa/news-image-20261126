// draw.ts — original front-page renderer for "The World Today, 26 Nov 2026".
// Pure Node standard library: builds a 1024x1024 RGBA canvas in memory,
// draws a newspaper front page (masthead, stats strip, UTC ticker, 13 drawn
// hero scenes, 23 more stories, numbered world map, region bars, DATE CHECK),
// and returns deterministic PNG bytes (zlib deflate, no timestamps, no
// randomness). Written fresh for this entry; no image or code is copied in.
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- palette
const PAPER = 0xf6f1e3ff;
const INK = 0x16130eff;
const NAVY = 0x0e2a47ff;
const NAVY_SOFT = 0x1d4a73ff;
const RED = 0xb3271eff;
const TEAL = 0x0f6b5cff;
const GOLD = 0xc08a00ff;
const GREY = 0x6b645aff;
const RULE = 0xc9bfa6ff;
const OCEAN = 0xd9e4deff;
const LAND = 0xb9c4a8ff;
const LAND_EDGE = 0x5f6b4fff;
const WHITE = 0xffffffff;
const CREAM = 0xefe7d2ff;

// ------------------------------------------------------------------- font
// A compact 5x7 block capitals font, drawn from 7 rows of 5 bits each.
// Only capitals, digits and a small punctuation set are needed: every word
// on the page is set in capitals, which also reads as a newspaper voice.
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '=': ['00000', '00000', '01110', '00000', '01110', '00000', '00000'],
  '|': ['00100', '00100', '00100', '00100', '00100', '00100', '00100'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  '*': ['00000', '10101', '01110', '10101', '00000', '00000', '00000'],
};

// ------------------------------------------------------------------ canvas
export class Canvas {
  readonly w: number;
  readonly h: number;
  readonly px: Uint8Array;
  constructor(w: number, h: number, bg: number) {
    this.w = w;
    this.h = h;
    this.px = new Uint8Array(w * h * 4);
    this.fill(bg);
  }
  fill(c: number): void {
    const r = (c >> 24) & 255, g = (c >> 16) & 255, b = (c >> 8) & 255, a = c & 255;
    for (let i = 0; i < this.w * this.h; i++) {
      this.px[i * 4] = r; this.px[i * 4 + 1] = g; this.px[i * 4 + 2] = b; this.px[i * 4 + 3] = a;
    }
  }
  set(x: number, y: number, c: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.px[i] = (c >> 24) & 255; this.px[i + 1] = (c >> 16) & 255;
    this.px[i + 2] = (c >> 8) & 255; this.px[i + 3] = c & 255;
  }
  rect(x: number, y: number, w: number, h: number, c: number): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  outline(x: number, y: number, w: number, h: number, c: number, t = 1): void {
    this.rect(x, y, w, t, c); this.rect(x, y + h - t, w, t, c);
    this.rect(x, y, t, h, c); this.rect(x + w - t, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number, t = 1): void {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    for (let n = 0; n < 4000; n++) {
      this.rect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }
  circle(cx: number, cy: number, r: number, c: number): void {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) this.set(x, y, c);
      }
    }
  }
  ring(cx: number, cy: number, r: number, c: number, t = 1): void {
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      this.rect(Math.round(cx + Math.cos(rad) * r), Math.round(cy + Math.sin(rad) * r), t, t, c);
    }
  }
  // Filled triangle by scanline.
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number): void {
    this.poly([[x0, y0], [x1, y1], [x2, y2]], c);
  }
  // Filled polygon (even-odd scanline over integer points).
  poly(pts: number[][], c: number): void {
    let minY = 1e9, maxY = -1e9;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.ceil(minY); y <= maxY; y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.ceil(xs[k]); x <= xs[k + 1]; x++) this.set(x, y, c);
      }
    }
  }
  text(s: string, x: number, y: number, scale: number, c: number): number {
    let cx = x;
    for (const ch of s) {
      const g = FONT[ch] ?? FONT['?'];
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (g[r][col] === '1') this.rect(cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
      cx += 6 * scale;
    }
    return cx - x - scale;
  }
  textWidth(s: string, scale: number): number {
    return s.length * 6 * scale - scale;
  }
  wrap(s: string, maxW: number, scale: number): string[] {
    const words = s.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (this.textWidth(t, scale) <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }
}

// --------------------------------------------------------------------- png
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
export function toPng(cv: Canvas): Buffer {
  const raw = Buffer.alloc((cv.w * 4 + 1) * cv.h);
  for (let y = 0; y < cv.h; y++) {
    raw[y * (cv.w * 4 + 1)] = 0;
    Buffer.from(cv.px.buffer, y * cv.w * 4, cv.w * 4).copy(raw, y * (cv.w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0); ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------- page content
// Every story below was first reported on Thursday 26 November 2026 (UTC),
// checked against Reuters, AP, Observer Voice, Jagran Josh, C54, EUR Radio,
// SelfStudys, Devdiscourse and the Malta morning digest. Times are UTC.
// Source codes: R Reuters, A AP, O Observer Voice, J Jagran Josh,
// S SelfStudys, E EUR Radio, G C54, M Malta digest, N Inovatif, D Devdiscourse.
export interface Hero { n: number; head: string; badge: string; src: string; lon: number; lat: number; tint: number; }
export const HEROES: Hero[] = [
  { n: 1, head: 'KOREA HIKES RATES TO 3.25% AS CHIP BOOM FUELS GROWTH', badge: 'CONFIRMED', src: 'R', lon: 127, lat: 37.5, tint: 0xdfe8f2ff },
  { n: 2, head: 'ISRAELI STRIKE KILLS HAMAS SECURITY CHIEF IN GAZA', badge: 'REPORTED', src: 'O', lon: 34.5, lat: 31.5, tint: 0xf6dfd8ff },
  { n: 3, head: 'FUEL TANKER FIRE ON CAIRO RING ROAD KILLS 31', badge: 'CONFIRMED', src: 'G', lon: 31.2, lat: 30, tint: 0xf6e3d3ff },
  { n: 4, head: 'NORWAY COURT VOIDS DISPUTED OIL LICENCES', badge: 'CONFIRMED', src: 'G', lon: 10.7, lat: 59.9, tint: 0xddefe4ff },
  { n: 5, head: 'EU LEADERS OPEN SPECIAL SUMMIT IN BRUSSELS', badge: 'CONFIRMED', src: 'D', lon: 4.35, lat: 50.85, tint: 0xe2e0f0ff },
  { n: 6, head: 'GERMANY RAISES DEFENCE, CUTS AID AND UN FUNDS', badge: 'REPORTED', src: 'N', lon: 13.4, lat: 52.5, tint: 0xefe8d2ff },
  { n: 7, head: 'INDIA MARKS CONSTITUTION DAY AND 26/11 ANNIVERSARY', badge: 'CONFIRMED', src: 'S', lon: 72.8, lat: 19, tint: 0xf6e7d2ff },
  { n: 8, head: 'KENYA FREES LAST EBOLA PATIENT; DRC TOLL TOPS 5,300', badge: 'CONFIRMED', src: 'G', lon: 15.3, lat: -4.3, tint: 0xdff0e2ff },
  { n: 9, head: 'POLICE FREE 20 HOSTAGES AFTER 17-HOUR SUPERMARKET SIEGE', badge: 'CONFIRMED', src: 'J', lon: -75.5, lat: 10.4, tint: 0xe3eef6ff },
  { n: 10, head: 'CLOSE-UPS REVEAL CRATER ON ASTEROID HIT TO SAVE EARTH', badge: 'REPORTED', src: 'J', lon: 8.65, lat: 49.87, tint: 0xe8e8ecff },
  { n: 11, head: 'THANKSGIVING IN US AS NASDAQ SLIDES ON AI ROUT', badge: 'REPORTED', src: 'J', lon: -74, lat: 40.7, tint: 0xf2dfdfff },
  { n: 12, head: '1,220 PLAYERS REGISTER FOR IPL 2027 AUCTION', badge: 'REPORTED', src: 'S', lon: 74.1, lat: 15.3, tint: 0xe4f0dfff },
  { n: 13, head: 'HASINA SEEKS RETURN TO BANGLADESH ON 16 DECEMBER', badge: 'REPORTED', src: 'S', lon: 90.4, lat: 23.8, tint: 0xf0e3e8ff },
];
export interface Also { time: string; head: string; src: string; }
export const ALSO: Also[] = [
  { time: '00:30', head: 'TAIWAN SAYS US 15% TARIFF IS LOWEST TIER', src: 'O' },
  { time: '00:47', head: 'CHINA IN $50BN SMART-CITY DEAL WITH INDONESIA', src: 'M' },
  { time: '02:00', head: 'BRAZIL: MOSQUITOES CUT VIRAL INFECTIONS 68%', src: 'S' },
  { time: '01:57', head: 'EU REVISES UKRAINE ACCESSION PLAN', src: 'M' },
  { time: '01:57', head: 'TURKISH ARMY HELICOPTER CRASHES IN TRAINING', src: 'M' },
  { time: '01:57', head: 'PUIGDEMONT DECLARES 12 DEC RETURN TO SPAIN', src: 'M' },
  { time: '02:00', head: 'POLAND PLANS NO-FLY ZONE ON UKRAINE BORDER', src: 'N' },
  { time: '02:00', head: 'BLACKOUT HITS COLOMBIA AFTER GRID ATTACK', src: 'N' },
  { time: '02:00', head: 'SAUDI COALITION: CIVILIANS MUST LEAVE HODEIDAH', src: 'M' },
  { time: '02:00', head: 'FRENCH PREFECT SACKED OVER LEAKS TO LE PEN PARTY', src: 'M' },
  { time: '02:00', head: 'SERBIA ARRESTS INFORMER TV OWNER VUCICEVIC', src: 'M' },
  { time: '02:00', head: 'ZAMBIA BANS PROTESTS OVER TERM-LIMIT REMOVAL', src: 'M' },
  { time: '02:00', head: 'UN WARNS OF CRIMES RISK FOR STATELESS PEOPLE', src: 'M' },
  { time: '02:00', head: 'GHANA UNVEILS HERITAGE BANKNOTES', src: 'G' },
  { time: '02:00', head: 'KENYA SECURES 293,600 JOBS IN SAUDI ARABIA', src: 'G' },
  { time: '02:00', head: 'S AFRICA: PROTEST AT COURT AS RALLIES BARRED', src: 'G' },
  { time: '02:00', head: 'NIGERIA STARTS BUILDING NAVAL SHIPS', src: 'G' },
  { time: '02:00', head: 'INDIA GIVES NEPAL RS 15,000 CRORE PACKAGE', src: 'S' },
  { time: '02:00', head: 'BANGLADESH RAISES GARMENT WAGE 36%', src: 'S' },
  { time: '02:00', head: 'ABREGO GARCIA LEAVES US VOLUNTARILY FOR SPAIN', src: 'A' },
  { time: '02:00', head: 'NETANYAHU JUDGES URGE DROPPING GRAVEST CHARGES', src: 'J' },
  { time: '02:00', head: 'GUKESH DRAWS SINDAROV IN CHESS TITLE OPENER', src: 'J' },
  { time: '02:00', head: 'VAIBHAV SMASHES 204 OFF 53 BALLS, SIXES RECORD', src: 'S' },
];
export const REGIONS: [string, number][] = [
  ['EAST ASIA', 3], ['SOUTH ASIA', 5], ['MIDDLE EAST', 4], ['EUROPE', 9],
  ['AFRICA', 7], ['N AMERICA', 2], ['LATIN AMERICA', 3], ['SPORT + SCIENCE', 3],
];
export const TICKER = '00:06 NASDAQ SLIDES 4%  |  00:39 NORWAY VOIDS OIL LICENCES  |  01:00 KOREA HIKES TO 3.25%  |  01:17 EU COURT: CAGED ANIMALS  |  01:57 EU REVISES UKRAINE PLAN';
export const DATE_CHECK = [
  'LEFT OUT - NOT 26 NOV: RAS TANURA REFINERY ATTACK (25 NOV) - HORMUZ TANKERS MINED (25 NOV) - SHENZHOU-24 (25 NOV) -',
  'US TARIFF PLAN (25 NOV) - FED BEIGE BOOK (25 NOV) - F-15EX KADENA (25 NOV) - POUNDLAND (25 NOV) - MELANIA: 9 CHILDREN (25 NOV) -',
  'BENGHAZI SINKING (23 NOV) - XI PROBE (24 NOV) - VENEZUELA-SHELL $400M (24 NOV) - HUAWEI VERDICT (25 NOV)',
];
export const FOOTER = 'SRC: R REUTERS - A AP - O OBSERVER VOICE - J JAGRAN JOSH - S SELFSTUDYS - E EUR RADIO - G C54 - M MALTA DIGEST - N INOVATIF - D DEV DISCOURSE';

// ------------------------------------------------------------ drawn scenes
// Each hero gets one small original pictogram, drawn from rectangles,
// circles, lines and triangles inside a 48x48 box. No photographs.
function scene(cv: Canvas, n: number, x: number, y: number): void {
  const S = 48;
  cv.rect(x, y, S, S, HEROES[n - 1].tint);
  cv.outline(x, y, S, S, RULE, 1);
  const cx = x + 24, cy = y + 24;
  if (n === 1) { // bank + rising arrow (Korea rate hike)
    cv.tri(x + 6, y + 16, x + 24, y + 6, x + 42, y + 16, NAVY);
    cv.rect(x + 9, y + 17, 4, 20, NAVY); cv.rect(x + 22, y + 17, 4, 20, NAVY); cv.rect(x + 35, y + 17, 4, 20, NAVY);
    cv.rect(x + 6, y + 37, 36, 4, NAVY);
    cv.line(x + 8, y + 34, x + 40, y + 12, RED, 2);
    cv.tri(x + 40, y + 12, x + 32, y + 12, x + 40, y + 20, RED);
  } else if (n === 2) { // building + blast star (Gaza strike)
    cv.rect(x + 8, y + 14, 14, 26, NAVY); cv.rect(x + 26, y + 22, 12, 18, NAVY_SOFT);
    for (let i = 0; i < 3; i++) cv.rect(x + 11, y + 18 + i * 7, 3, 3, WHITE);
    cv.circle(cx + 6, cy - 12, 3, GOLD);
    for (let a = 0; a < 8; a++) {
      const r0 = (a * Math.PI) / 4;
      cv.line(cx + 6 + Math.round(Math.cos(r0) * 5), cy - 12 + Math.round(Math.sin(r0) * 5),
        cx + 6 + Math.round(Math.cos(r0) * 10), cy - 12 + Math.round(Math.sin(r0) * 10), RED, 1);
    }
  } else if (n === 3) { // tanker truck + flame (Cairo fire)
    cv.rect(x + 6, y + 20, 22, 12, RED); cv.rect(x + 28, y + 24, 10, 8, NAVY);
    cv.circle(x + 13, y + 35, 4, INK); cv.circle(x + 31, y + 35, 4, INK);
    cv.tri(cx, y + 4, cx - 6, y + 16, cx + 6, y + 16, GOLD);
    cv.tri(cx, y + 9, cx - 3, y + 16, cx + 3, y + 16, RED);
  } else if (n === 4) { // oil derrick crossed out (Norway licences void)
    cv.line(x + 10, y + 40, x + 20, y + 10, INK, 2); cv.line(x + 38, y + 40, x + 28, y + 10, INK, 2);
    cv.line(x + 14, y + 30, x + 34, y + 30, INK, 2); cv.line(x + 17, y + 20, x + 31, y + 20, INK, 2);
    cv.line(x + 6, y + 6, x + 42, y + 42, RED, 3); cv.line(x + 42, y + 6, x + 6, y + 42, RED, 3);
  } else if (n === 5) { // ring of stars + summit table (EU summit)
    for (let a = 0; a < 12; a++) {
      const r0 = (a * Math.PI) / 6;
      cv.circle(Math.round(cx + Math.cos(r0) * 14), Math.round(cy - 4 + Math.sin(r0) * 12), 2, GOLD);
    }
    cv.rect(x + 12, y + 34, 24, 4, NAVY);
    cv.rect(x + 14, y + 38, 3, 5, NAVY); cv.rect(x + 31, y + 38, 3, 5, NAVY);
  } else if (n === 6) { // rising bars + flag stripes (Germany budget)
    cv.rect(x + 8, y + 28, 7, 12, INK); cv.rect(x + 20, y + 20, 7, 20, RED); cv.rect(x + 32, y + 12, 7, 28, GOLD);
    cv.rect(x + 6, y + 40, 36, 2, NAVY);
    cv.line(x + 6, y + 10, x + 42, y + 6, TEAL, 2);
  } else if (n === 7) { // dome + tricolour (India Constitution Day)
    cv.rect(x + 6, y + 12, 36, 6, 0xe67e22ff); cv.rect(x + 6, y + 18, 36, 6, WHITE); cv.rect(x + 6, y + 24, 36, 6, 0x138808ff);
    cv.ring(cx, cy - 3, 4, NAVY, 1);
    cv.rect(x + 10, y + 32, 28, 3, NAVY); cv.rect(x + 14, y + 35, 20, 6, NAVY_SOFT);
  } else if (n === 8) { // virus + medical cross (Ebola)
    cv.circle(cx, cy, 10, TEAL);
    for (let a = 0; a < 8; a++) {
      const r0 = (a * Math.PI) / 4;
      cv.line(cx + Math.round(Math.cos(r0) * 10), cy + Math.round(Math.sin(r0) * 10),
        cx + Math.round(Math.cos(r0) * 15), cy + Math.round(Math.sin(r0) * 15), TEAL, 2);
    }
    cv.rect(cx - 6, cy - 2, 12, 4, WHITE); cv.rect(cx - 2, cy - 6, 4, 12, WHITE);
  } else if (n === 9) { // shop awning + shield check (Colombia rescue)
    for (let i = 0; i < 4; i++) cv.rect(x + 6 + i * 9, y + 10, 9, 6, i % 2 ? RED : WHITE);
    cv.rect(x + 6, y + 16, 36, 3, NAVY); cv.rect(x + 8, y + 19, 32, 18, NAVY_SOFT);
    cv.rect(x + 18, y + 26, 12, 11, PAPER);
    cv.poly([[cx + 6, y + 26], [cx + 20, y + 26], [cx + 20, y + 35], [cx + 13, y + 42], [cx + 6, y + 35]], TEAL);
    cv.line(cx + 9, y + 33, cx + 12, y + 37, WHITE, 2); cv.line(cx + 12, y + 37, cx + 18, y + 29, WHITE, 2);
  } else if (n === 10) { // asteroid + spacecraft (Hera)
    cv.poly([[x + 8, y + 14], [x + 18, y + 8], [x + 28, y + 12], [x + 30, y + 22], [x + 22, y + 30], [x + 12, y + 28], [x + 6, y + 20]], 0x8a8f98ff);
    cv.circle(x + 16, y + 18, 2, INK); cv.circle(x + 24, y + 22, 2, INK);
    cv.rect(x + 28, y + 34, 12, 6, NAVY); cv.rect(x + 40, y + 36, 8, 2, GOLD); cv.rect(x + 20, y + 36, 8, 2, GOLD);
    cv.line(x + 28, y + 30, x + 35, y + 34, RED, 1);
  } else if (n === 11) { // falling market chart (Thanksgiving + Nasdaq)
    cv.line(x + 6, y + 40, x + 42, y + 40, INK, 1); cv.line(x + 6, y + 40, x + 6, y + 8, INK, 1);
    cv.line(x + 8, y + 14, x + 16, y + 20, RED, 2); cv.line(x + 16, y + 20, x + 24, y + 16, RED, 2);
    cv.line(x + 24, y + 16, x + 32, y + 30, RED, 2); cv.line(x + 32, y + 30, x + 40, y + 36, RED, 2);
    cv.tri(x + 40, y + 36, x + 34, y + 34, x + 40, y + 42, RED);
    cv.circle(x + 12, y + 10, 3, GOLD);
  } else if (n === 12) { // bat, ball, stumps (IPL auction)
    cv.line(x + 14, y + 10, x + 26, y + 34, 0x8b5a2bff, 3);
    cv.rect(x + 22, y + 32, 8, 10, 0x8b5a2bff);
    cv.circle(x + 36, y + 12, 5, RED);
    cv.rect(x + 34, y + 30, 2, 12, GOLD); cv.rect(x + 38, y + 30, 2, 12, GOLD); cv.rect(x + 42, y + 30, 2, 12, GOLD);
  } else { // plane + Bangladesh flag (Hasina return)
    cv.rect(x + 6, y + 10, 36, 14, 0x006a4eff); cv.circle(cx + 4, cy - 7, 7, RED);
    cv.poly([[x + 10, y + 30], [x + 38, y + 30], [x + 30, y + 38], [x + 16, y + 38]], NAVY);
    cv.line(x + 12, y + 30, x + 6, y + 36, NAVY, 2); cv.line(x + 36, y + 30, x + 42, y + 36, NAVY, 2);
  }
}

// -------------------------------------------------------------- world map
// Coarse continent outlines (lon/lat), drawn equirectangular. Deliberately
// rough: at this size the shapes read as a world map, and the numbered pins
// are the point, not coastline precision.
const CONTINENTS: number[][][] = [
  [[-168, 66], [-140, 70], [-125, 72], [-110, 73], [-95, 80], [-85, 70], [-75, 62], [-65, 60], [-55, 52], [-60, 47], [-70, 42], [-75, 35], [-80, 32], [-85, 29], [-90, 21], [-95, 19], [-100, 23], [-105, 28], [-110, 30], [-115, 32], [-120, 38], [-125, 48], [-135, 58], [-155, 60], [-165, 60]],
  [[-80, 10], [-75, 12], [-70, 12], [-60, 8], [-52, 5], [-50, 0], [-40, -5], [-35, -8], [-38, -15], [-40, -22], [-48, -28], [-55, -35], [-60, -40], [-65, -45], [-70, -50], [-73, -55], [-72, -45], [-72, -35], [-70, -25], [-75, -18], [-80, -8], [-81, 0], [-80, 7]],
  [[-10, 36], [-9, 43], [-2, 48], [-4, 50], [0, 51], [3, 53], [8, 57], [10, 59], [18, 56], [21, 55], [24, 58], [28, 60], [30, 62], [32, 70], [40, 68], [45, 68], [40, 60], [35, 55], [30, 50], [28, 45], [23, 40], [19, 42], [12, 44], [8, 44], [3, 43], [0, 40], [-2, 37], [-6, 36]],
  [[-6, 35], [0, 36], [10, 37], [11, 34], [20, 32], [30, 31], [33, 27], [35, 23], [37, 18], [40, 15], [43, 11], [48, 11], [51, 10], [44, 2], [40, -5], [40, -12], [35, -20], [32, -26], [28, -33], [20, -35], [17, -32], [14, -25], [12, -18], [13, -12], [9, -2], [9, 4], [4, 6], [-2, 5], [-8, 5], [-13, 8], [-17, 12], [-16, 20], [-15, 27], [-10, 31]],
  [[30, 36], [33, 31], [36, 36], [40, 38], [44, 39], [48, 30], [50, 29], [54, 26], [57, 25], [60, 25], [62, 25], [66, 25], [70, 20], [72, 20], [76, 15], [77, 8], [80, 7], [80, 13], [85, 19], [88, 22], [91, 22], [92, 16], [95, 16], [98, 10], [100, 8], [103, 2], [104, 2], [107, 10], [109, 15], [108, 18], [106, 20], [105, 21], [108, 22], [110, 20], [114, 22], [117, 23], [120, 25], [122, 28], [122, 32], [120, 35], [122, 38], [126, 40], [128, 38], [130, 42], [132, 43], [135, 44], [138, 46], [141, 50], [142, 55], [140, 60], [142, 65], [150, 60], [158, 58], [160, 55], [162, 60], [170, 66], [178, 65], [178, 62], [170, 60], [162, 58], [158, 52], [150, 45], [142, 42], [140, 38], [138, 35], [135, 33], [132, 33], [130, 31], [127, 34], [126, 36], [124, 39], [122, 40], [120, 38]],
  [[113, -22], [114, -30], [115, -33], [118, -35], [124, -33], [129, -32], [132, -32], [135, -35], [138, -35], [140, -38], [145, -38], [150, -37], [153, -32], [153, -27], [150, -23], [146, -19], [142, -15], [142, -11], [137, -12], [135, -15], [132, -12], [130, -13], [126, -14], [122, -17], [118, -20], [113, -22]],
  [[167, -45], [170, -43], [173, -41], [175, -38], [177, -38], [174, -41], [170, -44], [167, -46]],
];

// ------------------------------------------------------------------ render
export function renderFrontPage(): Buffer {
  const W = 1024, H = 1024, M = 22;
  const cv = new Canvas(W, H, PAPER);
  cv.outline(8, 8, W - 16, H - 16, INK, 2);

  // Masthead.
  const title = 'THE WORLD TODAY';
  cv.text(title, Math.round((W - cv.textWidth(title, 6)) / 2), 18, 6, NAVY);
  const sub = 'THURSDAY 26 NOVEMBER 2026';
  cv.text(sub, Math.round((W - cv.textWidth(sub, 3)) / 2), 66, 3, INK);
  cv.rect(M, 92, W - 2 * M, 2, INK);
  cv.rect(M, 96, W - 2 * M, 1, INK);

  // Stats strip.
  cv.rect(M, 102, W - 2 * M, 28, NAVY);
  const stats = '36 STORIES  |  13 DRAWN SCENES  |  8 REGIONS  |  ALL FIRST REPORTED 26 NOV 2026';
  cv.text(stats, Math.round((W - cv.textWidth(stats, 2)) / 2), 108, 2, WHITE);

  // UTC ticker.
  cv.rect(M, 134, W - 2 * M, 18, CREAM);
  cv.outline(M, 134, W - 2 * M, 18, RULE, 1);
  cv.text('UTC', M + 6, 137, 1, RED);
  cv.text(TICKER, M + 30, 137, 1, INK);

  // Heroes heading.
  cv.text('THE 13 BIG STORIES', M, 158, 3, INK);
  const note = 'EACH SCENE DRAWN FOR THIS PAGE - BADGE SHOWS HOW SURE THE REPORT IS';
  cv.text(note, W - M - cv.textWidth(note, 1), 165, 1, GREY);

  // Heroes grid: 2 columns x 7 rows. Last cell holds an editor note.
  const colW = 484, rowH = 56, gapX = 12, gapY = 5;
  const gx = M, gy = 180;
  HEROES.forEach((h, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (colW + gapX), y = gy + row * (rowH + gapY);
    cv.rect(x, y, colW, rowH, WHITE);
    cv.outline(x, y, colW, rowH, RULE, 1);
    // Number badge.
    cv.circle(x + 17, y + 17, 15, NAVY);
    const num = String(h.n);
    cv.text(num, x + 17 - Math.round(cv.textWidth(num, 2) / 2), y + 10, 2, WHITE);
    // Drawn scene.
    scene(cv, h.n, x + 36, y + 4);
    // Headline, two lines. Keep the right edge clear for the source tag.
    const lines = cv.wrap(h.head, colW - 118, 2);
    cv.text(lines[0] ?? '', x + 92, y + 7, 2, INK);
    if (lines[1]) cv.text(lines[1], x + 92, y + 24, 2, INK);
    // Certainty badge + source.
    const bc = h.badge === 'CONFIRMED' ? TEAL : NAVY_SOFT;
    const bw = cv.textWidth(h.badge, 1) + 10;
    cv.rect(x + 92, y + 41, bw, 11, bc);
    cv.text(h.badge, x + 97, y + 43, 1, WHITE);
    cv.text('(' + h.src + ')', x + colW - 24, y + 43, 1, GREY);
  });
  // Editor note in the 14th cell.
  {
    const x = gx + colW + gapX, y = gy + 6 * (rowH + gapY);
    cv.rect(x, y, colW, rowH, CREAM);
    cv.outline(x, y, colW, rowH, RULE, 1);
    cv.text('HOW TO READ THIS PAGE', x + 10, y + 7, 1, RED);
    const n1 = 'EVERY STORY ABOVE WAS FIRST REPORTED ON THURSDAY 26 NOVEMBER 2026.';
    const n2 = 'SCENES ARE ORIGINAL DRAWINGS - NO PHOTOGRAPHS. PINS MATCH THE NUMBERS.';
    cv.text(n1, x + 10, y + 21, 1, INK);
    cv.text(n2, x + 10, y + 33, 1, INK);
  }

  // ALSO ON heading + list (2 columns x 12 rows).
  cv.text('ALSO ON - 23 MORE STORIES, 26 NOVEMBER', M, 606, 2, INK);
  const ay = 628, aRowH = 18;
  ALSO.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * (colW + gapX), y = ay + row * aRowH;
    cv.text(a.time, x, y, 1, RED);
    const headW = colW - 62;
    let head = a.head;
    while (cv.textWidth(head, 1) > headW && head.length > 4) head = head.slice(0, -1);
    cv.text(head, x + 34, y, 1, INK);
    cv.text('(' + a.src + ')', x + colW - 20, y, 1, GREY);
  });
  // 24th cell: a stamp.
  {
    const x = M + colW + gapX, y = ay + 11 * aRowH;
    cv.rect(x, y, colW, 16, NAVY);
    cv.text('36 STORIES - ALL DATED 26 NOV 2026', x + 10, y + 4, 1, WHITE);
  }

  // Map row: numbered world map (left) + region bars (right).
  const mapY = 848, mapH = 96;
  const mapX = M, mapW = 640;
  cv.rect(mapX, mapY, mapW, mapH, OCEAN);
  cv.outline(mapX, mapY, mapW, mapH, RULE, 1);
  cv.text('WHERE IT HAPPENED - PIN NUMBERS MATCH THE 13 BIG STORIES', mapX + 6, mapY + 4, 1, NAVY);
  const mx0 = mapX + 8, my0 = mapY + 14, mw = mapW - 16, mh = mapH - 20;
  const px = (lon: number) => mx0 + ((lon + 170) / 360) * mw;
  const py = (lat: number) => my0 + ((75 - lat) / 130) * mh;
  for (const cont of CONTINENTS) {
    cv.poly(cont.map(([lo, la]) => [Math.round(px(lo)), Math.round(py(la))]), LAND);
    for (let i = 0; i < cont.length; i++) {
      const a = cont[i], b = cont[(i + 1) % cont.length];
      cv.line(Math.round(px(a[0])), Math.round(py(a[1])), Math.round(px(b[0])), Math.round(py(b[1])), LAND_EDGE, 1);
    }
  }
  // Pins: small display offsets (with a leader line) where true positions
  // would collide at this scale — Brussels/Berlin/Darmstadt, Gaza/Cairo,
  // Mumbai/Goa. The leader line keeps each pin tied to its true spot.
  const OFF: Record<number, [number, number]> = {
    2: [-11, -8], 3: [9, 7], 5: [0, -10], 7: [-9, -7], 10: [0, 10], 12: [11, 8],
  };
  for (const h of HEROES) {
    const tx = Math.round(px(h.lon)), ty = Math.round(py(h.lat));
    const off = OFF[h.n] ?? [0, 0];
    const cxp = tx + off[0], cyp = ty + off[1];
    if (off[0] || off[1]) cv.line(tx, ty, cxp, cyp, RED, 1);
    cv.circle(cxp, cyp, 8, RED);
    cv.ring(cxp, cyp, 8, WHITE, 1);
    const num = String(h.n);
    cv.text(num, cxp - Math.round(cv.textWidth(num, 1) / 2), cyp - 3, 1, WHITE);
  }
  // Region bars.
  const barX = mapX + mapW + 12, barW = W - M - barX;
  cv.text('STORIES BY REGION', barX, mapY + 2, 1, INK);
  REGIONS.forEach(([name, count], i) => {
    const y = mapY + 16 + i * 10;
    cv.text(name, barX, y, 1, INK);
    const bwMax = 110;
    cv.rect(barX + 118, y + 1, Math.round((count / 9) * bwMax), 5, NAVY_SOFT);
    cv.text(String(count), barX + 118 + bwMax + 6, y, 1, INK);
  });

  // DATE CHECK box.
  const dcY = 950;
  cv.rect(M, dcY, W - 2 * M, 50, CREAM);
  cv.outline(M, dcY, W - 2 * M, 50, RED, 1);
  cv.text('DATE CHECK - WHAT WE LEFT OUT ON PURPOSE', M + 8, dcY + 5, 1, RED);
  DATE_CHECK.forEach((ln, i) => cv.text(ln, M + 8, dcY + 17 + i * 10, 1, INK));

  // Footer: source legend.
  cv.text(FOOTER, M, 1006, 1, GREY);

  return toPng(cv);
}
