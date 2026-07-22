export interface User {
  id: string;
  email: string;
  passwordHash: string;
  totpSecret: string | null;
  totpEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
