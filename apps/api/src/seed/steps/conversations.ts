import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../../infrastructure/db/client.js';
import { conversation, message } from '../../infrastructure/db/schema.js';
import { conversations } from '../data/conversations.js';

const dayMs = 86_400_000;

export async function seedConversations(db: DrizzleDb, userId: string, now: Date): Promise<void> {
  for (const conv of conversations) {
    const conversationId = nanoid();
    const createdAt = new Date(now.getTime() - 5 * dayMs);

    await db.insert(conversation).values({
      id: conversationId,
      userId,
      title: conv.title,
      llmProvider: conv.llmProvider,
      llmModel: conv.llmModel,
      createdAt,
      updatedAt: createdAt,
    });
    console.log(`  Created conversation: "${conv.title}"`);

    for (let i = 0; i < conv.messages.length; i++) {
      const msg = conv.messages[i];
      const msgTime = new Date(createdAt.getTime() + i * 60_000);
      await db.insert(message).values({
        id: nanoid(),
        conversationId,
        role: msg.role,
        content: msg.content,
        createdAt: msgTime,
      });
    }
    console.log(`    Added ${conv.messages.length} messages`);
  }
}
