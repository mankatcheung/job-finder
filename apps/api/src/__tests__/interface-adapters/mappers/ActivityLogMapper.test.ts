import { describe, it, expect } from 'vitest';
import { ActivityLogMapper } from '#src/interface-adapters/mappers/ActivityLogMapper.js';
import type { ActivityLog } from '#src/domain/activityLog/ActivityLog.js';

describe('ActivityLogMapper', () => {
  const mapper = new ActivityLogMapper();

  const log: ActivityLog = {
    id: 'log-1',
    applicationId: 'app-1',
    actorId: 'user-1',
    eventType: 'status_changed',
    payload: JSON.stringify({ from: 'draft', to: 'applied' }),
    createdAt: new Date('2024-03-01T08:00:00.000Z'),
  };

  it('converts createdAt to an ISO string', () => {
    const dto = mapper.toDTO(log);
    expect(dto.createdAt).toBe('2024-03-01T08:00:00.000Z');
  });

  it('passes scalar fields through unchanged', () => {
    const dto = mapper.toDTO(log);

    expect(dto.id).toBe('log-1');
    expect(dto.applicationId).toBe('app-1');
    expect(dto.actorId).toBe('user-1');
    expect(dto.eventType).toBe('status_changed');
    expect(dto.payload).toBe(log.payload);
  });
});
