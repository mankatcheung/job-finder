export type MessageRole = 'user' | 'assistant';

export type Message = {
  id: string;
  userId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
};
