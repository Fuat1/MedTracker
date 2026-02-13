import { generateBPChartSvg } from '../lib/generate-bp-chart-svg';
import type { BPRecord } from '../../../shared/api/bp-repository';

const makeRecord = (sys: number, dia: number, ts: number): BPRecord => ({
  id: `${ts}`,
  systolic: sys,
  diastolic: dia,
  pulse: null,
  timestamp: ts,
  timezoneOffset: 0,
  location: 'left_arm',
  posture: 'sitting',
  notes: null,
  createdAt: ts,
  updatedAt: ts,
  isSynced: false,
});

const DAY = 86400;
const NOW = Math.floor(Date.now() / 1000);

describe('generateBPChartSvg', () => {
  it('returns a non-empty SVG string', () => {
    const records = [makeRecord(120, 80, NOW - DAY), makeRecord(130, 85, NOW)];
    const svg = generateBPChartSvg(records);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('returns empty-state SVG for no records', () => {
    const svg = generateBPChartSvg([]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('No data');
  });

  it('includes both systolic and diastolic data-series markers', () => {
    const records = [makeRecord(120, 80, NOW - DAY), makeRecord(130, 85, NOW)];
    const svg = generateBPChartSvg(records);
    expect(svg).toContain('data-series="systolic"');
    expect(svg).toContain('data-series="diastolic"');
  });

  it('includes zone background rects', () => {
    const records = [makeRecord(120, 80, NOW)];
    const svg = generateBPChartSvg(records);
    // Three zone backgrounds: normal, elevated, high
    expect(svg.match(/<rect/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
