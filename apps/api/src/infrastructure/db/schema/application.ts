import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';
import { user } from './user.js';

export const jobApplication = sqliteTable(
  'JobApplication',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    company: text('company').notNull(),
    role: text('role').notNull(),
    status: text('status').notNull().default('draft'),
    jobUrl: text('jobUrl'),
    location: text('location'),
    salaryRange: text('salaryRange'),
    description: text('description'),
    appliedAt: integer('appliedAt', { mode: 'timestamp_ms' }),
    starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
    source: text('source'),
    followUpAt: integer('followUpAt', { mode: 'timestamp_ms' }),
    reminderSentAt: integer('reminderSentAt', { mode: 'timestamp_ms' }),
    /**
     * Rank within its kanban column, ascending. Scoped to (userId, status) —
     * a card moving to another column is renumbered there, and the gap it
     * leaves behind is harmless because only relative order is read.
     *
     * The default of 0 is what makes this column free to add: the board sorts
     * on `boardPosition ASC, createdAt DESC, id DESC`, so before anything is
     * ever dragged every row ties at 0 and falls through to exactly the order
     * the board showed before this column existed. No backfill, and a newly
     * created application still sorts to the top of its column for the same
     * reason.
     */
    boardPosition: integer('boardPosition').notNull().default(0),
    /**
     * In Trash since. Null for a live application.
     *
     * The only soft delete in this schema — everything else is a hard delete,
     * and the children below stay untouched while this is set: they are hidden
     * because their parent is, not because anything happened to them, which is
     * what makes restore a single UPDATE.
     */
    deletedAt: integer('deletedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('JobApplication_userId_idx').on(table.userId),
    index('JobApplication_userId_status_idx').on(table.userId, table.status),
    // Every list query filters on it, and the purge job scans by it.
    index('JobApplication_deletedAt_idx').on(table.deletedAt),
  ],
);

export const applicationTag = sqliteTable(
  'ApplicationTag',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (table) => [
    uniqueIndex('ApplicationTag_applicationId_name_key').on(table.applicationId, table.name),
    index('ApplicationTag_applicationId_idx').on(table.applicationId),
  ],
);

export const activityLog = sqliteTable(
  'ActivityLog',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    actorId: text('actorId').notNull(),
    eventType: text('eventType').notNull(),
    payload: text('payload').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('ActivityLog_applicationId_idx').on(table.applicationId)],
);

export const interviewRound = sqliteTable(
  'InterviewRound',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    type: text('type').notNull().default('other'),
    scheduledAt: integer('scheduledAt', { mode: 'timestamp_ms' }),
    completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
    interviewerName: text('interviewerName'),
    notes: text('notes'),
    outcome: text('outcome').notNull().default('pending'),
    pushNotificationSentAt: integer('pushNotificationSentAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('InterviewRound_applicationId_idx').on(table.applicationId)],
);

export const note = sqliteTable(
  'Note',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('Note_applicationId_idx').on(table.applicationId)],
);

export const document = sqliteTable(
  'Document',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    mimeType: text('mimeType').notNull(),
    sizeBytes: integer('sizeBytes').notNull(),
    storageKey: text('storageKey').notNull().unique(),
    documentType: text('documentType').notNull().default('other'),
    version: text('version'),
    sourceDraftId: text('sourceDraftId').references((): AnySQLiteColumn => documentDraft.id, {
      onDelete: 'set null',
    }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('Document_applicationId_idx').on(table.applicationId)],
);

export const offer = sqliteTable(
  'Offer',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    baseSalary: integer('baseSalary').notNull(),
    bonus: integer('bonus'),
    equity: text('equity'),
    benefits: text('benefits'),
    costOfLivingAdjustment: integer('costOfLivingAdjustment'),
    currency: text('currency').notNull().default('USD'),
    period: text('period').notNull().default('yearly'),
    notes: text('notes'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('Offer_applicationId_idx').on(table.applicationId)],
);

export const documentDraft = sqliteTable(
  'DocumentDraft',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['cover_letter', 'resume'] }).notNull(),
    title: text('title').notNull(),
    contentJson: text('contentJson').notNull().default('{}'),
    plainText: text('plainText').notNull().default(''),
    sourceDocumentId: text('sourceDocumentId').references(() => document.id, {
      onDelete: 'set null',
    }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('DocumentDraft_applicationId_idx').on(table.applicationId),
    index('DocumentDraft_sourceDocumentId_idx').on(table.sourceDocumentId),
  ],
);

export const contact = sqliteTable(
  'Contact',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    role: text('role'),
    email: text('email'),
    phone: text('phone'),
    linkedinUrl: text('linkedinUrl'),
    notes: text('notes'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('Contact_applicationId_idx').on(table.applicationId)],
);
