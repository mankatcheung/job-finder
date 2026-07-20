export interface IEmailService {
  sendFollowUpReminder(
    to: string,
    company: string,
    role: string,
    followUpAt: Date,
  ): Promise<void>;
}
