import { useState, useCallback } from 'react';
import { Alert, Platform, InteractionManager } from 'react-native';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
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
  includePPMAP?: boolean;
}

export function useExportPdf() {
  const [isExporting, setIsExporting] = useState(false);
  const { guideline } = useSettingsStore();

  const exportPdf = useCallback(
    (records: BPRecord[], options: ExportPdfOptions) => {
      if (records.length === 0) {
        Alert.alert(
          i18n.t('pages:analytics.report.noDataTitle'),
          i18n.t('pages:analytics.report.noDataMessage'),
        );
        return;
      }

      setIsExporting(true);

      // Defer heavy PDF generation until animations/transitions complete
      InteractionManager.runAfterInteractions(async () => {
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
            includePPMAP: options.includePPMAP ?? false,
          };

          const html = generateReportHtml(records, stats, chartSvg, reportOptions);
          const fileName = `bp-report-${Date.now()}`;
          const { filePath } = await convertHtmlToPdf({ html, fileName });

          if (!filePath) {
            throw new Error('PDF generation failed: no file path returned');
          }

          console.log('[useExportPdf] Generated PDF at:', filePath);

          // Platform-specific file handling due to Android FileProvider requirements
          if (Platform.OS === 'android') {
            // Android: Share with absolute path (react-native-share handles FileProvider internally)
            console.log('[useExportPdf] Sharing on Android with path:', filePath);
            await Share.open({
              url: filePath, // No file:// prefix on Android - library adds it
              type: 'application/pdf',
              failOnCancel: false,
            });
          } else {
            // iOS: Requires file:// URI scheme
            const fileUri = `file://${filePath}`;
            console.log('[useExportPdf] Sharing on iOS:', fileUri);
            await Share.open({
              url: fileUri,
              type: 'application/pdf',
              failOnCancel: false,
            });
          }
        } catch (error: any) {
          // User dismissed share dialog - this is not an error
          if (error?.message?.includes('User did not share')) {
            return;
          }

          Alert.alert(
            i18n.t('pages:analytics.report.exportFailedTitle'),
            i18n.t('pages:analytics.report.exportFailedMessage'),
          );
          console.error('[useExportPdf]', error);
        } finally {
          setIsExporting(false);
        }
      });
    },
    [guideline],
  );

  return { exportPdf, isExporting };
}
