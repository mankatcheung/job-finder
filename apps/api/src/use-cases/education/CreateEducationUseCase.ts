import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type {
  ICreateEducationUseCase,
  CreateEducationInput,
  CreateEducationOutput,
} from '#src/use-cases/education/ICreateEducationUseCase.js';

interface Deps {
  educationRepository: IEducationRepository;
  generateId: () => string;
}

export class CreateEducationUseCase implements ICreateEducationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateEducationInput): Promise<CreateEducationOutput> {
    return this.deps.educationRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      institution: input.institution,
      degree: input.degree ?? null,
      field: input.field ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      description: input.description ?? null,
    });
  }
}
