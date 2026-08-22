import type { ICookieConsentRepository } from '#src/use-cases/ports/ICookieConsentRepository.js';
import type {
  IRecordCookieConsentUseCase,
  RecordCookieConsentInput,
} from '#src/use-cases/cookieConsent/IRecordCookieConsentUseCase.js';

interface Deps {
  cookieConsentRepository: ICookieConsentRepository;
  generateId: () => string;
}

export class RecordCookieConsentUseCase implements IRecordCookieConsentUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RecordCookieConsentInput): Promise<void> {
    await this.deps.cookieConsentRepository.create({
      id: this.deps.generateId(),
      analyticsAccepted: input.analyticsAccepted,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
