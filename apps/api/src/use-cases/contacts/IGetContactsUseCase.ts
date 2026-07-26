import type { Contact } from '#src/domain/contact/Contact.js';

export interface GetContactsInput {
  userId: string;
  applicationId: string;
}

export type GetContactsOutput = Contact[];

export interface IGetContactsUseCase {
  execute(input: GetContactsInput): Promise<GetContactsOutput>;
}
