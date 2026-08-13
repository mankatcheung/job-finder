import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { user } from './user.js';

export const workExperience = sqliteTable(
  'WorkExperience',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    company: text('company').notNull(),
    title: text('title').notNull(),
    location: text('location'),
    startDate: integer('startDate', { mode: 'timestamp_ms' }).notNull(),
    endDate: integer('endDate', { mode: 'timestamp_ms' }),
    description: text('description'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('WorkExperience_userId_idx').on(table.userId)],
);

export const education = sqliteTable(
  'Education',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    institution: text('institution').notNull(),
    degree: text('degree'),
    field: text('field'),
    startDate: integer('startDate', { mode: 'timestamp_ms' }).notNull(),
    endDate: integer('endDate', { mode: 'timestamp_ms' }),
    description: text('description'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('Education_userId_idx').on(table.userId)],
);

export const skill = sqliteTable(
  'Skill',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category'),
    proficiency: text('proficiency'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('Skill_userId_idx').on(table.userId)],
);
