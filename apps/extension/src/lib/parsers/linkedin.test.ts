import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseLinkedIn } from './linkedin';
import { linkedInSduiFixture } from './__fixtures__/linkedin-sdui.fixture';

describe('parseLinkedIn — SDUI layout (hashed classnames)', () => {
  beforeEach(() => {
    document.body.innerHTML = linkedInSduiFixture;
    vi.stubGlobal(
      'location',
      new URL('https://www.linkedin.com/jobs/search-results/?currentJobId=4444415532'),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('extracts role, company, and description via id/href/data-testid, ignoring hashed classes', () => {
    const result = parseLinkedIn();

    expect(result).not.toBeNull();
    expect(result?.role).toBe('Full Stack Engineer');
    expect(result?.company).toBe('Monument');
    expect(result?.jobUrl).toBe('https://www.linkedin.com/jobs/view/4444415532/');
    expect(result?.source).toBe('LinkedIn');
    expect(result?.description).toContain('About Monument');
  });

  it('also works from a standalone /jobs/view/<id>/ URL with no currentJobId query param', () => {
    vi.stubGlobal('location', new URL('https://www.linkedin.com/jobs/view/4444415532/'));

    const result = parseLinkedIn();

    expect(result?.role).toBe('Full Stack Engineer');
    expect(result?.company).toBe('Monument');
  });

  it('returns null when neither the SDUI nor legacy markup is present', () => {
    document.body.innerHTML = '<div>no job here</div>';
    vi.stubGlobal('location', new URL('https://www.linkedin.com/jobs/search-results/'));

    expect(parseLinkedIn()).toBeNull();
  });
});
