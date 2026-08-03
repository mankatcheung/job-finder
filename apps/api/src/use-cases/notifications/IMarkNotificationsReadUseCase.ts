export interface MarkNotificationsReadInput {
  userId: string;
  ids: string[];
  isRead: boolean;
}

export interface IMarkNotificationsReadUseCase {
  execute(input: MarkNotificationsReadInput): Promise<void>;
}
