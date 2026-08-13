import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../../infrastructure/db/client.js';
import { skill } from '../../infrastructure/db/schema.js';
import { skills } from '../data/skills.js';

export async function seedSkills(db: DrizzleDb, userId: string, now: Date): Promise<void> {
  for (const s of skills) {
    await db.insert(skill).values({
      id: nanoid(),
      userId,
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
      createdAt: now,
    });
    console.log(`  Created skill: ${s.name} (${s.proficiency})`);
  }
}
