import { describe, it, expect } from 'vitest';
import { ApplicationMapper } from '#src/interface-adapters/mappers/ApplicationMapper.js';
import { makeApplication } from '#src/__tests__/helpers/mocks/jobs.js';

describe('ApplicationMapper', () => {
  const mapper = new ApplicationMapper();

  it('converts createdAt and updatedAt to ISO strings', () => {
    const createdAt = new Date('2024-06-15T10:00:00.000Z');
    const updatedAt = new Date('2024-07-01T12:30:00.000Z');
    const app = makeApplication({ createdAt, updatedAt });

    const dto = mapper.toDTO(app);

    expect(dto.createdAt).toBe('2024-06-15T10:00:00.000Z');
    expect(dto.updatedAt).toBe('2024-07-01T12:30:00.000Z');
  });

  it('converts a non-null appliedAt to an ISO string', () => {
    const appliedAt = new Date('2024-05-20T09:00:00.000Z');
    const app = makeApplication({ appliedAt });

    const dto = mapper.toDTO(app);

    expect(dto.appliedAt).toBe('2024-05-20T09:00:00.000Z');
  });

  it('maps null appliedAt to null', () => {
    const app = makeApplication({ appliedAt: null });

    const dto = mapper.toDTO(app);

    expect(dto.appliedAt).toBeNull();
  });

  it('passes all scalar fields through unchanged', () => {
    const app = makeApplication({
      id: 'app-xyz',
      userId: 'user-abc',
      company: 'Stripe',
      role: 'Backend Engineer',
      status: 'offered',
      jobUrl: 'https://stripe.com/jobs/1',
      location: 'Remote',
      salaryRange: '$150k–$200k',
      description: 'Work on payments.',
    });

    const dto = mapper.toDTO(app);

    expect(dto.id).toBe('app-xyz');
    expect(dto.userId).toBe('user-abc');
    expect(dto.company).toBe('Stripe');
    expect(dto.role).toBe('Backend Engineer');
    expect(dto.status).toBe('offered');
    expect(dto.jobUrl).toBe('https://stripe.com/jobs/1');
    expect(dto.location).toBe('Remote');
    expect(dto.salaryRange).toBe('$150k–$200k');
    expect(dto.description).toBe('Work on payments.');
  });

  it('preserves null optional fields', () => {
    const app = makeApplication({
      jobUrl: null,
      location: null,
      salaryRange: null,
      description: null,
    });

    const dto = mapper.toDTO(app);

    expect(dto.jobUrl).toBeNull();
    expect(dto.location).toBeNull();
    expect(dto.salaryRange).toBeNull();
    expect(dto.description).toBeNull();
  });
});
