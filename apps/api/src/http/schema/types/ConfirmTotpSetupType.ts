import { builder } from '@/http/schema/builder.js';
import type { ConfirmTotpSetupOutput } from '@/use-cases/user/IConfirmTotpSetupUseCase.js';

export const ConfirmTotpSetupResultRef =
  builder.objectRef<ConfirmTotpSetupOutput>('ConfirmTotpSetupResult');
ConfirmTotpSetupResultRef.implement({
  fields: (t) => ({
    backupCodes: t.exposeStringList('backupCodes'),
  }),
});
