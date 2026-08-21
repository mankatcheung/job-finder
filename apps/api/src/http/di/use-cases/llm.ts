import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { ParseJobDescriptionUseCase } from '#src/use-cases/jobDescription/ParseJobDescriptionUseCase.js';
import { GenerateCoverLetterUseCase } from '#src/use-cases/coverLetter/GenerateCoverLetterUseCase.js';
import { GenerateCompanyBriefingUseCase } from '#src/use-cases/companyBriefing/GenerateCompanyBriefingUseCase.js';
import { GetCompanyBriefingUseCase } from '#src/use-cases/companyBriefing/GetCompanyBriefingUseCase.js';

import type { Cradle } from '../types.js';

export const llm = {
  parseJobDescriptionUseCase: asClass(ParseJobDescriptionUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  generateCoverLetterUseCase: asClass(GenerateCoverLetterUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  getCompanyBriefingUseCase: asClass(GetCompanyBriefingUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  generateCompanyBriefingUseCase: asClass(GenerateCompanyBriefingUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
