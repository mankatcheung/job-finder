import { builder } from '@/http/schema/builder.js';
import type { TotpSetup } from '@/use-cases/user/IGenerateTotpSecretUseCase.js';

export const TotpSetupRef = builder.objectRef<TotpSetup>('TotpSetup');
TotpSetupRef.implement({
  fields: (t) => ({
    secret: t.exposeString('secret'),
    otpauthUrl: t.exposeString('otpauthUrl'),
    qrCodeDataUrl: t.exposeString('qrCodeDataUrl'),
  }),
});
