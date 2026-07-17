export interface DeleteApplicationInput {
  userId: string;
  applicationId: string;
}

export interface IDeleteApplicationUseCase {
  execute(input: DeleteApplicationInput): Promise<void>;
}
