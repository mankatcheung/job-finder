import { builder } from '@/http/schema/builder.js';
import type { ApiTokenDTO } from '@/interface-adapters/mappers/ApiTokenMapper.js';

export const ApiTokenRef = builder.objectRef<ApiTokenDTO>('ApiToken');
ApiTokenRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    lastUsedAt: t.exposeString('lastUsedAt', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
  }),
});

export interface CreateApiTokenPayloadDTO {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export const CreateApiTokenPayloadRef =
  builder.objectRef<CreateApiTokenPayloadDTO>('CreateApiTokenPayload');
CreateApiTokenPayloadRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    token: t.exposeString('token'),
    createdAt: t.exposeString('createdAt'),
  }),
});
