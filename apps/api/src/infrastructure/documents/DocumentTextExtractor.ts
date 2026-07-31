import mammoth from 'mammoth';
import type { IDocumentTextExtractor } from '#src/use-cases/ports/IDocumentTextExtractor.js';
import { ERROR_CODES, MIME_TYPE } from '#src/constants.js';

const UNSUPPORTED_MESSAGE =
  "This file type isn't supported for text extraction — please paste your resume text instead.";

export class DocumentTextExtractor implements IDocumentTextExtractor {
  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case MIME_TYPE.PDF:
        return this.extractPdf(buffer);
      case MIME_TYPE.DOCX:
        return this.extractDocx(buffer);
      case MIME_TYPE.TEXT_PLAIN:
        return buffer.toString('utf8');
      default:
        throw Object.assign(new Error(UNSUPPORTED_MESSAGE), { code: ERROR_CODES.VALIDATION });
    }
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    // Lazy: pdf-parse pulls in pdfjs-dist, which eagerly tries to load the
    // native @napi-rs/canvas binary for PDF-rendering polyfills we never use
    // (this class only extracts text). Importing it here instead of at
    // module scope means that load only happens when a PDF is actually
    // extracted, not on every cold start via container.ts's eager import of
    // this whole class.
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}
