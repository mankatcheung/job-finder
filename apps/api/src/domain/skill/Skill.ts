export interface Skill {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  proficiency: string | null;
  createdAt: Date;
}
