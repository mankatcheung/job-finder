export interface Education {
  id: string;
  userId: string;
  institution: string;
  degree: string | null;
  field: string | null;
  startDate: Date;
  endDate: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
