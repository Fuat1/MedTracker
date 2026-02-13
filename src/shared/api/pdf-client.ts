import RNHTMLtoPDF from 'react-native-html-to-pdf';

export interface PdfOptions {
  html: string;
  fileName: string;
  directory?: string; // default: Documents
}

export interface PdfResult {
  filePath: string;
}

export async function convertHtmlToPdf(options: PdfOptions): Promise<PdfResult> {
  const result = await RNHTMLtoPDF.convert({
    html: options.html,
    fileName: options.fileName,
    directory: options.directory ?? 'Documents',
    base64: false,
  });
  if (!result.filePath) {
    throw new Error('PDF generation failed: no filePath returned');
  }
  return { filePath: result.filePath };
}
