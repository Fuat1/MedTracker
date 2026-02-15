jest.mock('../../../shared/lib/i18n', () => {
  // Load actual English JSON to keep tests assertions unchanged
  const medical = require('../../../shared/config/locales/en/medical.json');
  const pages = require('../../../shared/config/locales/en/pages.json');

  function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return typeof current === 'string' ? current : undefined;
  }

  return {
    __esModule: true,
    default: {
      t: (key: string, opts?: Record<string, unknown>) => {
        const [ns, ...rest] = key.split(':');
        const path = rest.join(':');
        const sources: Record<string, Record<string, unknown>> = { medical, pages };
        let val = getNestedValue(sources[ns] ?? {}, path) ?? key;
        if (opts) {
          Object.entries(opts).forEach(([k, v]) => {
            val = val.replace(`{{${k}}}`, String(v));
          });
        }
        return val;
      },
    },
  };
});

import { generateReportHtml } from '../lib/generate-report-html';
import type { BPRecord } from '../../../shared/api/bp-repository';
import type { ReportStats } from '../lib/compute-report-stats';

const stubStats: ReportStats = {
  total: 5,
  avgSystolic: 128,
  avgDiastolic: 82,
  avgPulse: 72,
  avgPP: 46,
  avgMAP: 97,
  minSystolic: 115,
  maxSystolic: 145,
  minDiastolic: 70,
  maxDiastolic: 95,
  categoryBreakdown: [
    { key: 'normal', label: 'Normal', range: '<120/<80', count: 3, percent: 60, color: '#22c55e' },
    { key: 'stage_1', label: 'Stage 1', range: '130-139', count: 2, percent: 40, color: '#f97316' },
  ],
};

const stubRecords: BPRecord[] = [
  {
    id: '1',
    systolic: 128,
    diastolic: 82,
    pulse: 72,
    timestamp: Math.floor(Date.now() / 1000),
    timezoneOffset: 0,
    location: 'left_arm',
    posture: 'sitting',
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    isSynced: false,
  },
];

const stubOptions = {
  period: 'Last 30 days',
  userName: 'Alex',
  generatedDate: 'February 13, 2026',
  guidelineName: 'AHA/ACC 2025',
};

describe('generateReportHtml', () => {
  it('returns a string containing DOCTYPE html', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('includes patient name in output', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).toContain('Alex');
  });

  it('includes stats values', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).toContain('128');
    expect(html).toContain('82');
    expect(html).toContain('5');
  });

  it('includes category breakdown', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).toContain('Normal');
    expect(html).toContain('60%');
  });

  it('includes doctor note when provided', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', {
      ...stubOptions,
      doctorNote: 'On lisinopril',
    });
    expect(html).toContain('On lisinopril');
  });

  it('does NOT include Patient Notes section when doctorNote is empty', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).not.toContain('Patient Notes');
  });

  it('includes medical disclaimer in footer', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).toContain('informational purposes only');
    expect(html).toContain('not a substitute for professional medical advice');
    expect(html).toContain('Consult your healthcare provider');
  });

  it('escapes HTML in user-provided userName to prevent XSS', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', {
      ...stubOptions,
      userName: '<script>alert("xss")</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes HTML in doctorNote to prevent XSS', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', {
      ...stubOptions,
      doctorNote: '<img onerror="alert(1)" src=x>',
    });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('escapes HTML in record notes to prevent XSS', () => {
    const xssRecords = [{
      ...stubRecords[0],
      notes: '"><script>alert(1)</script>',
    }];
    const html = generateReportHtml(xssRecords, stubStats, '<svg></svg>', stubOptions);
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('includes PP/MAP columns when includePPMAP is true', () => {
    const html = generateReportHtml(stubRecords, stubStats, '<svg></svg>', {
      ...stubOptions,
      includePPMAP: true,
    });
    expect(html).toContain('PP');
    expect(html).toContain('MAP');
  });
});
