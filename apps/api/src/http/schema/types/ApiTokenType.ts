import { builder } from '#src/http/schema/builder.js';
import type { ApiTokenDTO } from '#src/interface-adapters/mappers/ApiTokenMapper.js';

export const ApiTokenRef = builder.objectRef<ApiTokenDTO>('ApiToken');
ApiTokenRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    scope: t.exposeString('scope'),
    lastUsedAt: t.exposeString('lastUsedAt', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
  }),
});

export interface CreateApiTokenPayloadDTO {
  id: string;
  name: string;
  token: string;
  scope: string;
  createdAt: string;
}

export const CreateApiTokenPayloadRef =
  builder.objectRef<CreateApiTokenPayloadDTO>('CreateApiTokenPayload');
CreateApiTokenPayloadRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    token: t.exposeString('token'),
    scope: t.exposeString('scope'),
    createdAt: t.exposeString('createdAt'),
  }),
});
