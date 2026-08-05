export interface PdfRenderData {
  title: string;
  contentJson: string;
}

export interface IPdfRenderer {
  render(data: PdfRenderData): Promise<Buffer>;
}
