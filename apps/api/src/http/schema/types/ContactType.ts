import { builder } from '#src/http/schema/builder.js';
import type { ContactDTO } from '#src/interface-adapters/mappers/ContactMapper.js';

export const ContactRef = builder.objectRef<ContactDTO>('Contact');
ContactRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    applicationId: t.exposeID('applicationId'),
    name: t.exposeString('name'),
    role: t.exposeString('role', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    phone: t.exposeString('phone', { nullable: true }),
    linkedinUrl: t.exposeString('linkedinUrl', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
    updatedAt: t.exposeString('updatedAt'),
  }),
});
