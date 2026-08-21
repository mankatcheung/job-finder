import { describe, it, expect, vi } from 'vitest';
import { GenerateResumeUseCase } from '#src/use-cases/resume/GenerateResumeUseCase.js';
import {
  makeApplicationRepository,
  makeApplication,
  makeLLMProvider,
  makeLLMProviderFactory,
  makeUserRepository,
  makeUser,
  makeRateLimiter,
  makeWorkExperienceRepository,
  makeEducationRepository,
  makeSkillRepository,
  makeWorkExperience,
  makeEducation,
  makeSkill,
  makeNoteRepository,
  makeNote,
} from '#src/__tests__/helpers/mocks.js';

const WORK = [
  makeWorkExperience({ company: 'Acme', title: 'Engineer' }),
  makeWorkExperience({ id: 'we-2', company: 'Globex', title: 'Senior Engineer' }),
];
const EDU = [makeEducation({ institution: 'State University', degree: 'BSc', field: 'CS' })];
const SKILLS = [
  makeSkill({ name: 'TypeScript', category: 'Languages' }),
  makeSkill({ id: 'sk-2', name: 'Postgres', category: 'Databases' }),
];

const VALID_RESUME = JSON.stringify({
  summary: 'Engineer with widget experience.',
  experience: [
    { company: 'Acme', title: 'Engineer', period: '2020 – 2022', bullets: ['Built widgets'] },
    {
      company: 'Globex',
      title: 'Senior Engineer',
      period: '2022 – Present',
      bullets: ['Led work'],
    },
  ],
  education: [{ institution: 'State University', qualification: 'BSc Computer Science' }],
  skills: [
    { category: 'Languages', items: ['TypeScript'] },
    { category: 'Databases', items: ['Postgres'] },
  ],
});

function makeUseCase(over?: {
  response?: string;
  work?: unknown[];
  edu?: unknown[];
  skills?: unknown[];
  notes?: unknown[];
}) {
  const llmProvider = makeLLMProvider(over?.response ?? VALID_RESUME);
  const deps = {
    llmProviderFactory: makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(llmProvider),
    }),
    applicationRepository: makeApplicationRepository({
      findById: vi
        .fn()
        .mockResolvedValue(makeApplication({ userId: 'user-1', company: 'Initech' })),
    }),
    userRepository: makeUserRepository({ findById: vi.fn().mockResolvedValue(makeUser()) }),
    workExperienceRepository: makeWorkExperienceRepository({
      findAllByUserId: vi.fn().mockResolvedValue(over?.work ?? WORK),
    }),
    educationRepository: makeEducationRepository({
      findAllByUserId: vi.fn().mockResolvedValue(over?.edu ?? EDU),
    }),
    skillRepository: makeSkillRepository({
      findAllByUserId: vi.fn().mockResolvedValue(over?.skills ?? SKILLS),
    }),
    generateResumeRateLimiter: makeRateLimiter(),
    noteRepository: makeNoteRepository({
      findAllByApplicationId: vi.fn().mockResolvedValue(over?.notes ?? []),
    }),
  };
  return { useCase: new GenerateResumeUseCase(deps), deps, llmProvider };
}

describe('GenerateResumeUseCase', () => {
  it('returns the structured resume the model produced', async () => {
    const ctx = makeUseCase();

    const resume = await ctx.useCase.execute({ userId: 'user-1', applicationId: 'app-1' });

    expect(resume.experience.map((e) => e.company)).toEqual(['Acme', 'Globex']);
    expect(resume.education[0].institution).toBe('State University');
    expect(resume.skills.flatMap((s) => s.items)).toContain('TypeScript');
  });

  it('sends education and skills to the model, not only work experience', async () => {
    const ctx = makeUseCase();

    await ctx.useCase.execute({ userId: 'user-1', applicationId: 'app-1' });

    const messages = vi.mocked(ctx.llmProvider.complete).mock.calls[0]![0];
    const prompt = messages[messages.length - 1]!.content;
    expect(prompt).toContain('State University');
    expect(prompt).toContain('TypeScript');
    expect(prompt).toContain('Acme');
  });

  it('refuses a resume naming an employer the user never entered', async () => {
    // The whole point. A resume asserts facts about employment history, so a
    // fabricated employer is actively harmful to send — louder failure is
    // better than a plausible document with an invented job in it.
    const ctx = makeUseCase({
      response: JSON.stringify({
        experience: [{ company: 'Never Worked Here Ltd', title: 'CTO', bullets: [] }],
        education: [],
        skills: [],
      }),
    });

    const err = await ctx.useCase
      .execute({ userId: 'user-1', applicationId: 'app-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_RESPONSE_INVALID');
  });

  it('refuses a resume naming an institution the user never entered', async () => {
    const ctx = makeUseCase({
      response: JSON.stringify({
        experience: [],
        education: [{ institution: 'Invented College' }],
        skills: [],
      }),
    });

    const err = await ctx.useCase
      .execute({ userId: 'user-1', applicationId: 'app-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_RESPONSE_INVALID');
  });

  it('accepts a case- and whitespace-insensitive match of a real employer', async () => {
    // Rewording is allowed; inventing is not. "  acme " is still Acme.
    const ctx = makeUseCase({
      response: JSON.stringify({
        experience: [{ company: '  acme ', title: 'Engineer', bullets: ['Built widgets'] }],
        education: [],
        skills: [],
      }),
    });

    await expect(
      ctx.useCase.execute({ userId: 'user-1', applicationId: 'app-1' }),
    ).resolves.toBeTruthy();
  });

  it('rejects a malformed response rather than storing it', async () => {
    const ctx = makeUseCase({ response: 'not json at all' });

    const err = await ctx.useCase
      .execute({ userId: 'user-1', applicationId: 'app-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_RESPONSE_INVALID');
  });

  it('refuses when the user has entered no background at all', async () => {
    // There is nothing truthful to build from, and asking the model anyway
    // invites it to invent an entire history.
    const ctx = makeUseCase({ work: [], edu: [], skills: [] });

    const err = await ctx.useCase
      .execute({ userId: 'user-1', applicationId: 'app-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect(ctx.llmProvider.complete).not.toHaveBeenCalled();
  });

  it('throws RATE_LIMITED when the limiter rejects', async () => {
    const ctx = makeUseCase();
    ctx.deps.generateResumeRateLimiter = makeRateLimiter({
      consume: vi.fn().mockResolvedValue(false),
    });
    const useCase = new GenerateResumeUseCase(ctx.deps);

    const err = await useCase.execute({ userId: 'user-1', applicationId: 'app-1' }).catch((e) => e);

    expect((err as { code: string }).code).toBe('RATE_LIMITED');
  });

  it("refuses someone else's application", async () => {
    const ctx = makeUseCase();
    ctx.deps.applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication({ userId: 'someone-else' })),
    });
    const useCase = new GenerateResumeUseCase(ctx.deps);

    const err = await useCase.execute({ userId: 'user-1', applicationId: 'app-1' }).catch((e) => e);

    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });

  it('throws AI_NOT_CONFIGURED when the user has no API key', async () => {
    const ctx = makeUseCase();
    ctx.deps.llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(null),
    });
    const useCase = new GenerateResumeUseCase(ctx.deps);

    const err = await useCase.execute({ userId: 'user-1', applicationId: 'app-1' }).catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_NOT_CONFIGURED');
  });
  it("includes the user's notes on the application (JEF-205)", async () => {
    const ctx = makeUseCase({ notes: [makeNote({ content: 'They emphasised Kubernetes' })] });

    await ctx.useCase.execute({ userId: 'user-1', applicationId: 'app-1' });

    const messages = vi.mocked(ctx.llmProvider.complete).mock.calls[0]![0];
    expect(messages[messages.length - 1]!.content).toContain('Kubernetes');
  });

  it('never puts the salary range in the prompt', async () => {
    const ctx = makeUseCase();
    ctx.deps.applicationRepository = makeApplicationRepository({
      findById: vi
        .fn()
        .mockResolvedValue(
          makeApplication({ userId: 'user-1', salaryRange: '£95,000 – £120,000' }),
        ),
    });
    const useCase = new GenerateResumeUseCase(ctx.deps);

    await useCase.execute({ userId: 'user-1', applicationId: 'app-1' });

    const messages = vi.mocked(ctx.llmProvider.complete).mock.calls[0]![0];
    expect(messages[messages.length - 1]!.content).not.toContain('95,000');
  });
});
