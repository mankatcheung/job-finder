import { describe, it, expect } from 'vitest';
import { providerHttpError, summarizeProviderBody } from '#src/infrastructure/llm/providerError.js';
import { LlmProviderError } from '#src/use-cases/errors/DomainError.js';
import { PROVIDER_ERROR_BODY_MAX_CHARS } from '#src/infrastructure/config/constants.js';

describe('providerHttpError', () => {
  it.each([
    [401, 'auth'],
    [403, 'auth'],
    [402, 'quota'],
    [429, 'rate_limited'],
    [400, 'bad_request'],
    [404, 'bad_request'],
    [500, 'unavailable'],
    [529, 'unavailable'],
  ])('classifies status %i as %s', (status, kind) => {
    const err = providerHttpError('Anthropic', status, '{}');
    expect(err).toBeInstanceOf(LlmProviderError);
    expect(err.kind).toBe(kind);
    expect(err.status).toBe(status);
    expect(err.code).toBe('AI_PROVIDER_ERROR');
  });

  it('keeps the label, status and a short excerpt in the message for logs', () => {
    const err = providerHttpError('LLM provider', 401, '{"error":"invalid key"}');
    expect(err.message).toBe('LLM provider error 401: {"error":"invalid key"}');
  });

  it('truncates a long body — a custom base URL can answer with a whole page', () => {
    const page = `<html>${'x'.repeat(5000)}</html>`;
    const err = providerHttpError('LLM provider', 502, page);
    expect(err.message.length).toBeLessThan(PROVIDER_ERROR_BODY_MAX_CHARS + 40);
    expect(err.message.endsWith('…')).toBe(true);
  });

  it('omits the colon when the body is empty', () => {
    expect(providerHttpError('Google AI', 503, '').message).toBe('Google AI error 503');
  });
});

describe('summarizeProviderBody', () => {
  it('collapses whitespace so a stack trace becomes one line', () => {
    expect(summarizeProviderBody('Error:\n   at foo\n\n   at bar')).toBe('Error: at foo at bar');
  });
});
