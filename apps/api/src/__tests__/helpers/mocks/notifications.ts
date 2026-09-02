/**
 * Test doubles for the notifications domain.
 *
 * One of the per-domain modules split out of the former 816-line
 * `helpers/mocks.ts` (JEF-254), which held all 68 factories together and was
 * imported by 157 test files.
 */

import { vi } from 'vitest';
import type { ICreateNotificationUseCase } from '#src/use-cases/notifications/ICreateNotificationUseCase.js';
import type { INotificationRepository } from '#src/use-cases/ports/INotificationRepository.js';
import type { Notification } from '#src/domain/notification/Notification.js';

export const makeNotificationRepository = (
  overrides?: Partial<INotificationRepository>,
): INotificationRepository => ({
  create: vi.fn(),
  findPageByUserId: vi.fn().mockResolvedValue({ items: [], hasNextPage: false }),
  markManyReadForUser: vi.fn().mockResolvedValue(0),
  countUnreadForUser: vi.fn().mockResolvedValue(0),
  ...overrides,
});

export const makeCreateNotificationUseCase = (
  overrides?: Partial<ICreateNotificationUseCase>,
): ICreateNotificationUseCase => ({
  execute: vi.fn().mockImplementation((input) => Promise.resolve(makeNotification(input))),
  ...overrides,
});

export const makeNotification = (overrides?: Partial<Notification>): Notification => ({
  id: 'notification-1',
  userId: 'user-1',
  type: 'interview_reminder',
  title: 'Upcoming interview: Acme Corp',
  body: 'Software Engineer — phone interview tomorrow at 10:00 AM',
  url: '/applications/app-1',
  readAt: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});
