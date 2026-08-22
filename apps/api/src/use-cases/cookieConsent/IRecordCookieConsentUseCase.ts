export interface RecordCookieConsentInput {
  analyticsAccepted: boolean;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface IRecordCookieConsentUseCase {
  execute(input: RecordCookieConsentInput): Promise<void>;
}
