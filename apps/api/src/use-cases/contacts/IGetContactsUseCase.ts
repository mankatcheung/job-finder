import type { Contact } from '@/domain/contact/Contact.js';

export interface GetContactsInput {
  userId: string;
  applicationId: string;
}

export type GetContactsOutput = Contact[];

export interface IGetContactsUseCase {
  execute(input: GetContactsInput): Promise<GetContactsOutput>;
}
