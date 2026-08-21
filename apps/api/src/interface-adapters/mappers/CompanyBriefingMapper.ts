import type { CompanyBriefing } from '#src/domain/companyBriefing/CompanyBriefing.js';

export interface CompanyBriefingDTO {
  id: string;
  applicationId: string;
  content: string;
  generatedAt: string;
}

export class CompanyBriefingMapper {
  toDTO(briefing: CompanyBriefing): CompanyBriefingDTO {
    return {
      id: briefing.id,
      applicationId: briefing.applicationId,
      content: briefing.content,
      generatedAt: briefing.generatedAt.toISOString(),
    };
  }
}
