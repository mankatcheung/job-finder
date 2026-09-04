import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  CREATE_EDUCATION_MUTATION,
  CREATE_SKILL_MUTATION,
  CREATE_WORK_EXPERIENCE_MUTATION,
  DELETE_EDUCATION_MUTATION,
  DELETE_SKILL_MUTATION,
  DELETE_WORK_EXPERIENCE_MUTATION,
  EDUCATIONS_QUERY,
  SKILLS_QUERY,
  UPDATE_EDUCATION_MUTATION,
  UPDATE_WORK_EXPERIENCE_MUTATION,
  WORK_EXPERIENCES_QUERY,
} from '../graphql/operations';
import type {
  CreateEducationInput,
  CreateSkillInput,
  CreateWorkExperienceInput,
  Education,
  Skill,
  WorkExperience,
} from '../types';

export const workExperiencesQueryKey = ['workExperiences'] as const;
export const educationsQueryKey = ['educations'] as const;
export const skillsQueryKey = ['skills'] as const;

export function useWorkExperiences() {
  return useQuery({
    queryKey: workExperiencesQueryKey,
    queryFn: () =>
      gqlRequest<{ workExperiences: WorkExperience[] }>(WORK_EXPERIENCES_QUERY).then(
        (d) => d.workExperiences,
      ),
  });
}

export function useCreateWorkExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkExperienceInput) =>
      gqlRequest(CREATE_WORK_EXPERIENCE_MUTATION, { input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: workExperiencesQueryKey }),
  });
}

export function useUpdateWorkExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateWorkExperienceInput }) =>
      gqlRequest(UPDATE_WORK_EXPERIENCE_MUTATION, { id, input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: workExperiencesQueryKey }),
  });
}

export function useDeleteWorkExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlRequest(DELETE_WORK_EXPERIENCE_MUTATION, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: workExperiencesQueryKey }),
  });
}

export function useEducations() {
  return useQuery({
    queryKey: educationsQueryKey,
    queryFn: () =>
      gqlRequest<{ educations: Education[] }>(EDUCATIONS_QUERY).then((d) => d.educations),
  });
}

export function useCreateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEducationInput) => gqlRequest(CREATE_EDUCATION_MUTATION, { input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: educationsQueryKey }),
  });
}

export function useUpdateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateEducationInput }) =>
      gqlRequest(UPDATE_EDUCATION_MUTATION, { id, input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: educationsQueryKey }),
  });
}

export function useDeleteEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlRequest(DELETE_EDUCATION_MUTATION, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: educationsQueryKey }),
  });
}

export function useSkills() {
  return useQuery({
    queryKey: skillsQueryKey,
    queryFn: () => gqlRequest<{ skills: Skill[] }>(SKILLS_QUERY).then((d) => d.skills),
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSkillInput) => gqlRequest(CREATE_SKILL_MUTATION, { input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: skillsQueryKey }),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlRequest(DELETE_SKILL_MUTATION, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: skillsQueryKey }),
  });
}
