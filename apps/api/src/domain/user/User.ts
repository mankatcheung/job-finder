export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  timezone: string | null;
  targetRole: string | null;
  createdAt: Date;
  updatedAt: Date;
}
