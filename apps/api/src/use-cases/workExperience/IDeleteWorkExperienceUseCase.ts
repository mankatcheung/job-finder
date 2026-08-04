export interface DeleteWorkExperienceInput {
  id: string;
  userId: string;
}
export interface IDeleteWorkExperienceUseCase {
  execute(input: DeleteWorkExperienceInput): Promise<void>;
}
