export type Conversation = {
  id: string;
  userId: string;
  title: string | null;
  llmProvider: string | null;
  llmModel: string | null;
  createdAt: Date;
  updatedAt: Date;
};
