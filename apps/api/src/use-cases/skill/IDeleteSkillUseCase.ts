export interface DeleteSkillInput {
  id: string;
  userId: string;
}
export interface IDeleteSkillUseCase {
  execute(input: DeleteSkillInput): Promise<void>;
}
