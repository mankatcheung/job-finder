import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp, type TestApp } from './helpers/buildTestApp.js';
import { ENV, LLM_PROVIDER_MODE } from '#src/constants.js';

describe('fake LLM completions route — LLM_PROVIDER_MODE=fake', () => {
  let testApp: TestApp;
  const originalMode = process.env[ENV.LLM_PROVIDER_MODE];

  beforeAll(async () => {
    process.env[ENV.LLM_PROVIDER_MODE] = LLM_PROVIDER_MODE.FAKE;
    testApp = await buildTestApp();
  }, 30_000);

  afterAll(async () => {
    if (originalMode === undefined) delete process.env[ENV.LLM_PROVIDER_MODE];
    else process.env[ENV.LLM_PROVIDER_MODE] = originalMode;
    await testApp.cleanup();
  });

  it('replies with plain text and no tool calls when the request carries tools (chat)', async () => {
    const res = await testApp.app.inject({
      method: 'POST',
      url: '/llm-test/fake/chat/completions',
      payload: {
        model: 'fake-model',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 100,
        tools: [{ type: 'function', function: { name: 'list_applications' } }],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.choices[0].message.content).toBe('Fake assistant reply for e2e testing.');
    expect(body.choices[0].message.tool_calls).toEqual([]);
  });

  it('replies with the canned resume JSON when the request carries no tools (complete)', async () => {
    const res = await testApp.app.inject({
      method: 'POST',
      url: '/llm-test/fake/chat/completions',
      payload: {
        model: 'fake-model',
        messages: [{ role: 'user', content: 'tailor this resume' }],
        max_tokens: 2048,
      },
    });

    expect(res.statusCode).toBe(200);
    const content = JSON.parse(res.json().choices[0].message.content);
    expect(content.experience[0]).toMatchObject({ company: 'Acme Corp', title: 'Senior Engineer' });
    expect(content.education[0]).toMatchObject({ institution: 'State University' });
  });
});
