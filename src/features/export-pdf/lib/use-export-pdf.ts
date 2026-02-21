import { useState, useCallback } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { computeReportStats } from './compute-report-stats';
import { generateBPChartSvg } from './generate-bp-chart-svg';
import { generateReportHtml } from './generate-report-html';
import { convertHtmlToPdf } from '../../../shared/api';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { calculateAge, formatHeight } from '../../../entities/user-profile';
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
  const [activeAction, setActiveAction] = useState<'share' | 'save' | null>(null);
  const isExporting = activeAction !== null;
  const { guideline, userName: storedUserName, dateOfBirth, gender, height: userHeight, heightUnit, weightUnit } = useSettingsStore();

  const buildPdf = useCallback(
    async (records: BPRecord[], options: ExportPdfOptions): Promise<string> => {
      const stats = computeReportStats(records, guideline);
      const chartSvg = generateBPChartSvg(records);
      const reportOptions: ReportOptions = {
        period: options.period,
        userName: options.userName ?? storedUserName ?? 'Patient',
        generatedDate: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        guidelineName: guideline.replace('_', '/').toUpperCase(),
        doctorNote: options.doctorNote,
        guideline,
        includePPMAP: options.includePPMAP ?? false,
        age: calculateAge(dateOfBirth),
        height: userHeight != null ? formatHeight(userHeight, heightUnit) : null,
        weightUnit,
        gender,
      };
      const html = generateReportHtml(records, stats, chartSvg, reportOptions);
      const fileName = `bp-report-${Date.now()}`;
      const { filePath } = await convertHtmlToPdf({ html, fileName });
      if (!filePath) {
        throw new Error('PDF generation failed: no file path returned');
      }
      return filePath;
    },
    [guideline, storedUserName, dateOfBirth, gender, userHeight, heightUnit, weightUnit],
  );

  const exportPdf = useCallback(
    (records: BPRecord[], options: ExportPdfOptions) => {
      if (records.length === 0) {
        Alert.alert(
          i18n.t('pages:analytics.report.noDataTitle'),
          i18n.t('pages:analytics.report.noDataMessage'),
        );
        return;
      }

      setActiveAction('share');

      requestIdleCallback(() => {
        const run = async () => {
          try {
            const filePath = await buildPdf(records, options);

            console.log('[useExportPdf] Generated PDF at:', filePath);

            // Platform-specific file handling due to Android FileProvider requirements
            if (Platform.OS === 'android') {
              await Share.open({
                url: filePath, // No file:// prefix on Android - library adds it
                type: 'application/pdf',
                failOnCancel: false,
              });
            } else {
              // iOS: Requires file:// URI scheme
              await Share.open({
                url: `file://${filePath}`,
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
            console.error('[useExportPdf] exportPdf error:', error);
          } finally {
            setActiveAction(null);
          }
        };
        run().catch(console.error);
      });
    },
    [buildPdf],
  );

  const downloadPdf = useCallback(
    (records: BPRecord[], options: ExportPdfOptions) => {
      if (records.length === 0) {
        Alert.alert(
          i18n.t('pages:analytics.report.noDataTitle'),
          i18n.t('pages:analytics.report.noDataMessage'),
        );
        return;
      }

      setActiveAction('save');

      requestIdleCallback(() => {
        const run = async () => {
          try {
            const filePath = await buildPdf(records, options);
            const fileName = filePath.split('/').pop() ?? 'bp-report.pdf';

            if (Platform.OS === 'android') {
              // Request WRITE_EXTERNAL_STORAGE only on API < 29 (Android 9 and below)
              if ((Platform.Version as number) < 29) {
                const granted = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                  Alert.alert(
                    i18n.t('pages:analytics.report.saveFailedTitle'),
                    i18n.t('pages:analytics.report.saveFailedMessage'),
                  );
                  return;
                }
              }

              // Copy from app-internal storage to public Downloads folder
              const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
              await RNFS.copyFile(filePath, destPath);
              // Trigger MediaStore indexing so the file appears in Downloads app immediately
              await RNFS.scanFile(destPath);
            }
            // iOS: file is already in app Documents directory (accessible via Files app) — no copy needed

            Alert.alert(
              i18n.t('pages:analytics.report.saveSuccessTitle'),
              i18n.t('pages:analytics.report.saveSuccessMessage', { fileName }),
            );
          } catch (error: any) {
            Alert.alert(
              i18n.t('pages:analytics.report.saveFailedTitle'),
              i18n.t('pages:analytics.report.saveFailedMessage'),
            );
            console.error('[useExportPdf] downloadPdf error:', error);
          } finally {
            setActiveAction(null);
          }
        };
        run().catch(console.error);
      });
    },
    [buildPdf],
  );

  return { exportPdf, downloadPdf, isExporting, activeAction };
}
