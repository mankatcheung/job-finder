export interface DeleteInterviewRoundInput {
  userId: string;
  roundId: string;
}

export interface IDeleteInterviewRoundUseCase {
  execute(input: DeleteInterviewRoundInput): Promise<void>;
}
