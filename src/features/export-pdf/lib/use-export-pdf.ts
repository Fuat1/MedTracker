import { useState, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import { computeReportStats } from './compute-report-stats';
import { generateBPChartSvg } from './generate-bp-chart-svg';
import { generateReportHtml } from './generate-report-html';
import { convertHtmlToPdf } from '../../../shared/api';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import i18n from '../../../shared/lib/i18n';
import type { BPRecord } from '../../../shared/api/bp-repository';
import type { ReportOptions } from './generate-report-html';

export interface ExportPdfOptions {
  period: string;
  userName?: string;
  doctorNote?: string;
}

export function useExportPdf() {
  const [isExporting, setIsExporting] = useState(false);
  const { guideline } = useSettingsStore();

  const exportPdf = useCallback(
    async (records: BPRecord[], options: ExportPdfOptions) => {
      if (records.length === 0) {
        Alert.alert(
          i18n.t('pages:analytics.report.noDataTitle'),
          i18n.t('pages:analytics.report.noDataMessage'),
        );
        return;
      }

      setIsExporting(true);
      try {
        const stats = computeReportStats(records, guideline);
        const chartSvg = generateBPChartSvg(records);
        const reportOptions: ReportOptions = {
          period: options.period,
          userName: options.userName ?? 'Patient',
          generatedDate: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          guidelineName: guideline.replace('_', '/').toUpperCase(),
          doctorNote: options.doctorNote,
          guideline,
        };

        const html = generateReportHtml(records, stats, chartSvg, reportOptions);
        const fileName = `bp-report-${Date.now()}`;
        const { filePath } = await convertHtmlToPdf({ html, fileName });

        await Linking.openURL(`file://${filePath}`);
      } catch (error) {
        Alert.alert(
          i18n.t('pages:analytics.report.exportFailedTitle'),
          i18n.t('pages:analytics.report.exportFailedMessage'),
        );
        console.error('[useExportPdf]', error);
      } finally {
        setIsExporting(false);
      }
    },
    [guideline],
  );

  return { exportPdf, isExporting };
}
