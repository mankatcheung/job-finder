import { builder } from '#src/http/schema/builder.js';
import type { ConfirmTotpSetupOutput } from '#src/use-cases/user/IConfirmTotpSetupUseCase.js';

export const ConfirmTotpSetupResultRef =
  builder.objectRef<ConfirmTotpSetupOutput>('ConfirmTotpSetupResult');
ConfirmTotpSetupResultRef.implement({
  fields: (t) => ({
    backupCodes: t.exposeStringList('backupCodes'),
  }),
});
