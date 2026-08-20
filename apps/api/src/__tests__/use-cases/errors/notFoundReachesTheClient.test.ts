import { describe, expect, it, vi } from 'vitest';
import { GraphQLError } from 'graphql';
import { formatError } from '#src/http/errors/formatError.js';
import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import { UpdateSkillUseCase } from '#src/use-cases/skill/UpdateSkillUseCase.js';
import { DeleteSkillUseCase } from '#src/use-cases/skill/DeleteSkillUseCase.js';
import { UpdateEducationUseCase } from '#src/use-cases/education/UpdateEducationUseCase.js';
import { DeleteEducationUseCase } from '#src/use-cases/education/DeleteEducationUseCase.js';
import { UpdateWorkExperienceUseCase } from '#src/use-cases/workExperience/UpdateWorkExperienceUseCase.js';
import { DeleteWorkExperienceUseCase } from '#src/use-cases/workExperience/DeleteWorkExperienceUseCase.js';
import { ERROR_CODES } from '#src/constants.js';

/** What the client actually receives, once the error crosses the boundary. */
function throughTheBoundary(error: unknown): { code?: unknown; message: string } {
  const formatted = formatError(
    new GraphQLError((error as Error).message, { originalError: error as Error }),
  );
  return { code: formatted.extensions?.code, message: formatted.message };
}

describe('a missing row reaches the client as NOT_FOUND', () => {
  const missing = { findById: vi.fn().mockResolvedValue(null) };
  const notOurs = { findById: vi.fn().mockResolvedValue({ id: 'x', userId: 'someone-else' }) };

  const cases = [
    [
      'UpdateSkill',
      () => new UpdateSkillUseCase({ skillRepository: missing as never }),
      { id: 'x', userId: 'user-1', name: 'n' },
      'Skill not found',
    ],
    [
      'DeleteSkill',
      () => new DeleteSkillUseCase({ skillRepository: notOurs as never }),
      { id: 'x', userId: 'user-1' },
      'Skill not found',
    ],
    [
      'UpdateEducation',
      () => new UpdateEducationUseCase({ educationRepository: missing as never }),
      { id: 'x', userId: 'user-1' },
      'Education not found',
    ],
    [
      'DeleteEducation',
      () => new DeleteEducationUseCase({ educationRepository: notOurs as never }),
      { id: 'x', userId: 'user-1' },
      'Education not found',
    ],
    [
      'UpdateWorkExperience',
      () => new UpdateWorkExperienceUseCase({ workExperienceRepository: missing as never }),
      { id: 'x', userId: 'user-1' },
      'Work experience not found',
    ],
    [
      'DeleteWorkExperience',
      () => new DeleteWorkExperienceUseCase({ workExperienceRepository: notOurs as never }),
      { id: 'x', userId: 'user-1' },
      'Work experience not found',
    ],
  ] as const;

  it.each(cases)('%s', async (_name, make, input, message) => {
    const error = await (make().execute as (i: unknown) => Promise<unknown>)(input).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(NotFoundError);

    // The regression this guards: these used to throw a plain Error, which
    // carries no code, so formatError could only call it an internal failure.
    // The user asked to edit a row that was not theirs and got "Internal
    // server error" and a 500, while the server logged it as a real fault.
    const seen = throughTheBoundary(error);
    expect(seen.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(seen.code).not.toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(seen.message).toBe(message);
  });
});

describe('DomainError', () => {
  it('carries a code and no HTTP status', () => {
    const error = new NotFoundError('Skill');

    expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
    // The whole point of the split: a use case has no opinion about HTTP.
    expect((error as unknown as { statusCode?: number }).statusCode).toBeUndefined();
    expect(error.message).toBe('Skill not found');
  });

  it('does not double up when handed a whole sentence', () => {
    expect(new NotFoundError('Skill not found').message).toBe('Skill not found');
  });
});
