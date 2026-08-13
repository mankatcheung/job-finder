import { nanoid } from 'nanoid';
import type { DrizzleDb } from '../../infrastructure/db/client.js';
import { education } from '../../infrastructure/db/schema.js';
import { educations } from '../data/educations.js';

export async function seedEducations(db: DrizzleDb, userId: string, now: Date): Promise<void> {
  for (const edu of educations) {
    await db.insert(education).values({
      id: nanoid(),
      userId,
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate,
      description: edu.description,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  Created education: ${edu.degree} in ${edu.field} at ${edu.institution}`);
  }
}
