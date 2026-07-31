export interface IDocumentTextExtractor {
  extract(buffer: Buffer, mimeType: string): Promise<string>;
}
