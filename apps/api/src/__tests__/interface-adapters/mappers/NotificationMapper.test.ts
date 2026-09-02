import { describe, it, expect } from 'vitest';
import { NotificationMapper } from '#src/interface-adapters/mappers/NotificationMapper.js';
import { makeNotification } from '#src/__tests__/helpers/mocks/notifications.js';

describe('NotificationMapper', () => {
  const mapper = new NotificationMapper();

  it('converts createdAt to an ISO string', () => {
    const notification = makeNotification({ createdAt: new Date('2024-01-01T00:00:00.000Z') });

    const dto = mapper.toDTO(notification);

    expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('maps a null readAt to read: false', () => {
    const dto = mapper.toDTO(makeNotification({ readAt: null }));
    expect(dto.read).toBe(false);
  });

  it('maps a non-null readAt to read: true', () => {
    const dto = mapper.toDTO(makeNotification({ readAt: new Date('2024-01-02T00:00:00.000Z') }));
    expect(dto.read).toBe(true);
  });

  it('does not include readAt on the DTO', () => {
    const dto = mapper.toDTO(makeNotification());
    expect(dto).not.toHaveProperty('readAt');
  });

  it('passes id, type, title, body and url through unchanged', () => {
    const notification = makeNotification({
      id: 'n-xyz',
      type: 'security_alert',
      title: 'New sign-in detected',
      body: 'A new device just signed in.',
      url: '/settings/security',
    });

    const dto = mapper.toDTO(notification);

    expect(dto.id).toBe('n-xyz');
    expect(dto.type).toBe('security_alert');
    expect(dto.title).toBe('New sign-in detected');
    expect(dto.body).toBe('A new device just signed in.');
    expect(dto.url).toBe('/settings/security');
  });

  it('maps a null url through as null', () => {
    const dto = mapper.toDTO(makeNotification({ url: null }));
    expect(dto.url).toBeNull();
  });
});
