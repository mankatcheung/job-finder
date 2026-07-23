export type LoginEvent = {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};
