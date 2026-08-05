export interface DeleteEducationInput {
  id: string;
  userId: string;
}
export interface IDeleteEducationUseCase {
  execute(input: DeleteEducationInput): Promise<void>;
}
