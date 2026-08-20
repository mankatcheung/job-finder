export interface EmptyTrashInput {
  userId: string;
}

export interface EmptyTrashResult {
  deleted: number;
  failed: number;
}

export interface IEmptyTrashUseCase {
  execute(input: EmptyTrashInput): Promise<EmptyTrashResult>;
}
