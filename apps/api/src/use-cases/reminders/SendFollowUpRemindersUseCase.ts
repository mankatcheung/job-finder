import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IEmailService } from '#src/use-cases/ports/IEmailService.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  userRepository: IUserRepository;
  emailService: IEmailService;
}

export class SendFollowUpRemindersUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(): Promise<void> {
    const apps = await this.deps.applicationRepository.findDueForReminder();
    for (const app of apps) {
      const user = await this.deps.userRepository.findById(app.userId);
      if (!user || !user.followUpRemindersEnabled) continue;
      try {
        await this.deps.emailService.sendFollowUpReminder(
          user.email,
          app.company,
          app.role,
          app.followUpAt!,
        );
        await this.deps.applicationRepository.updateReminderSentAt(app.id, new Date());
      } catch {
        // continue — one failure shouldn't block the rest
      }
    }
  }
}
