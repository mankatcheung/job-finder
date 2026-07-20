import type { ICreateInterviewRoundUseCase } from '@/use-cases/interviewRounds/ICreateInterviewRoundUseCase.js';
import type { IGetInterviewRoundsUseCase } from '@/use-cases/interviewRounds/IGetInterviewRoundsUseCase.js';
import type { IUpdateInterviewRoundUseCase } from '@/use-cases/interviewRounds/IUpdateInterviewRoundUseCase.js';
import type { IDeleteInterviewRoundUseCase } from '@/use-cases/interviewRounds/IDeleteInterviewRoundUseCase.js';
import type {
  InterviewRoundMapper,
  InterviewRoundDTO,
} from '@/interface-adapters/mappers/InterviewRoundMapper.js';
import type {
  InterviewRoundType,
  InterviewRoundOutcome,
} from '@/domain/interviewRound/InterviewRound.js';

interface Deps {
  createInterviewRoundUseCase: ICreateInterviewRoundUseCase;
  getInterviewRoundsUseCase: IGetInterviewRoundsUseCase;
  updateInterviewRoundUseCase: IUpdateInterviewRoundUseCase;
  deleteInterviewRoundUseCase: IDeleteInterviewRoundUseCase;
  interviewRoundMapper: InterviewRoundMapper;
}

interface CreateInput {
  applicationId: string;
  type?: InterviewRoundType;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  interviewerName?: string | null;
  notes?: string | null;
  outcome?: InterviewRoundOutcome;
}

interface UpdateInput {
  type?: InterviewRoundType;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  interviewerName?: string | null;
  notes?: string | null;
  outcome?: InterviewRoundOutcome;
}

export class InterviewRoundResolver {
  constructor(private readonly deps: Deps) {}

  async getInterviewRounds(userId: string, applicationId: string): Promise<InterviewRoundDTO[]> {
    const rounds = await this.deps.getInterviewRoundsUseCase.execute({ userId, applicationId });
    return rounds.map((r) => this.deps.interviewRoundMapper.toDTO(r));
  }

  async createInterviewRound(userId: string, input: CreateInput): Promise<InterviewRoundDTO> {
    const round = await this.deps.createInterviewRoundUseCase.execute({ userId, ...input });
    return this.deps.interviewRoundMapper.toDTO(round);
  }

  async updateInterviewRound(
    userId: string,
    roundId: string,
    input: UpdateInput,
  ): Promise<InterviewRoundDTO> {
    const round = await this.deps.updateInterviewRoundUseCase.execute({
      userId,
      roundId,
      ...input,
    });
    return this.deps.interviewRoundMapper.toDTO(round);
  }

  async deleteInterviewRound(userId: string, roundId: string): Promise<boolean> {
    await this.deps.deleteInterviewRoundUseCase.execute({ userId, roundId });
    return true;
  }
}
