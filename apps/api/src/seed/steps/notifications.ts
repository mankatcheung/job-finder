import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../../infrastructure/db/client.js';
import { notification } from '../../infrastructure/db/schema.js';
import { notifications } from '../data/notifications.js';

export async function seedNotifications(db: DrizzleDb, userId: string): Promise<void> {
  for (const n of notifications) {
    await db.insert(notification).values({
      id: nanoid(),
      userId,
      type: n.type,
      title: n.title,
      body: n.body,
      url: n.url,
      readAt: n.readAt,
      createdAt: n.createdAt,
    });
    console.log(`  Created notification: "${n.title}"`);
  }
}
