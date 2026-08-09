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
    // Lazy: keeps this PDF-parsing dependency out of the eager import graph
    // triggered by container.ts's cold-start load of this whole class —
    // only pulled in when a PDF is actually extracted.
    //
    // Markdown, not plain text: a flat-text dump loses resume structure
    // (section headings, bullet lists) that both the resume-match-score and
    // cover-letter prompts rely on to make sense of the content — pdf2md
    // reconstructs that structure from font/layout cues instead of just
    // concatenating text runs.
    const { default: pdf2md } = await import('@opendocsg/pdf2md');
    return pdf2md(new Uint8Array(buffer));
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}
