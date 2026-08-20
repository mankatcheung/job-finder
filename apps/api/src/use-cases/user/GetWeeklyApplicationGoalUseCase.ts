import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { getWeeklyApplicationGoalStats } from './weeklyApplicationGoal.js';
import type {
  IGetWeeklyApplicationGoalUseCase,
  WeeklyApplicationGoalStats,
} from './IGetWeeklyApplicationGoalUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  applicationRepository: IApplicationRepository;
}

export class GetWeeklyApplicationGoalUseCase implements IGetWeeklyApplicationGoalUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<WeeklyApplicationGoalStats> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const applications = await this.deps.applicationRepository.findAllByUserId(userId);
    return getWeeklyApplicationGoalStats(applications, user.weeklyApplicationGoal);
  }
}
