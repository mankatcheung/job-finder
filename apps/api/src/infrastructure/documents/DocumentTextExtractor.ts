import { PDFParse } from 'pdf-parse';
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
