import type {
  IJobPostingSourceResolver,
  JobPostingSource,
} from '#src/use-cases/ports/IJobPostingSourceResolver.js';

export class FetchJobPostingSourceResolver implements IJobPostingSourceResolver {
  async resolve(source: JobPostingSource): Promise<string> {
    if (source.text?.trim()) return source.text.trim();

    if (source.url?.trim()) {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrakwynBot/1.0)' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);
      const html = await response.text();
      return this.stripHtml(html);
    }

    throw new Error('Either text or url must be provided');
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
}
