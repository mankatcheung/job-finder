import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../../infrastructure/db/client.js';
import { workExperience } from '../../infrastructure/db/schema.js';
import { workExperiences } from '../data/workExperiences.js';

export async function seedWorkExperiences(db: DrizzleDb, userId: string, now: Date): Promise<void> {
  for (const we of workExperiences) {
    await db.insert(workExperience).values({
      id: nanoid(),
      userId,
      company: we.company,
      title: we.title,
      location: we.location,
      startDate: we.startDate,
      endDate: we.endDate,
      description: we.description,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  Created work experience: ${we.title} at ${we.company}`);
  }
}
