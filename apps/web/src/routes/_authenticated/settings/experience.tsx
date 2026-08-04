import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  BriefcaseIcon,
  GraduationCapIcon,
  WrenchIcon,
} from 'lucide-react';
import { gqlClient } from '#/graphql/client';
import { inputCls, labelCls } from './-components/shared';

export const Route = createFileRoute('/_authenticated/settings/experience')({
  component: SettingsExperiencePage,
});

// ── Queries ──────────────────────────────────────────────────────────────

const WORK_EXPERIENCES_QUERY = `
  query WorkExperiences {
    workExperiences {
      id
      company
      title
      location
      startDate
      endDate
      description
      createdAt
      updatedAt
    }
  }
`;

const EDUCATIONS_QUERY = `
  query Educations {
    educations {
      id
      institution
      degree
      field
      startDate
      endDate
      description
      createdAt
      updatedAt
    }
  }
`;

const SKILLS_QUERY = `
  query Skills {
    skills {
      id
      name
      category
      proficiency
      createdAt
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────

const CREATE_WORK_EXPERIENCE = `
  mutation CreateWorkExperience($input: CreateWorkExperienceInput!) {
    createWorkExperience(input: $input) {
      id
      company
      title
      location
      startDate
      endDate
      description
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_WORK_EXPERIENCE = `
  mutation UpdateWorkExperience($id: ID!, $input: UpdateWorkExperienceInput!) {
    updateWorkExperience(id: $id, input: $input) {
      id
      company
      title
      location
      startDate
      endDate
      description
      createdAt
      updatedAt
    }
  }
`;

const DELETE_WORK_EXPERIENCE = `
  mutation DeleteWorkExperience($id: ID!) {
    deleteWorkExperience(id: $id)
  }
`;

const CREATE_EDUCATION = `
  mutation CreateEducation($input: CreateEducationInput!) {
    createEducation(input: $input) {
      id
      institution
      degree
      field
      startDate
      endDate
      description
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_EDUCATION = `
  mutation UpdateEducation($id: ID!, $input: UpdateEducationInput!) {
    updateEducation(id: $id, input: $input) {
      id
      institution
      degree
      field
      startDate
      endDate
      description
      createdAt
      updatedAt
    }
  }
`;

const DELETE_EDUCATION = `
  mutation DeleteEducation($id: ID!) {
    deleteEducation(id: $id)
  }
`;

const CREATE_SKILL = `
  mutation CreateSkill($input: CreateSkillInput!) {
    createSkill(input: $input) {
      id
      name
      category
      proficiency
      createdAt
    }
  }
`;

const UPDATE_SKILL = `
  mutation UpdateSkill($id: ID!, $input: UpdateSkillInput!) {
    updateSkill(id: $id, input: $input) {
      id
      name
      category
      proficiency
      createdAt
    }
  }
`;

const DELETE_SKILL = `
  mutation DeleteSkill($id: ID!) {
    deleteSkill(id: $id)
  }
`;

// ── Schemas ──────────────────────────────────────────────────────────────

const workExperienceSchema = z.object({
  company: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  institution: z.string().min(1, 'Required'),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

const skillSchema = z.object({
  name: z.string().min(1, 'Required'),
  category: z.string().optional(),
  proficiency: z.string().optional(),
});

type WorkExperienceForm = z.infer<typeof workExperienceSchema>;
type EducationForm = z.infer<typeof educationSchema>;
type SkillForm = z.infer<typeof skillSchema>;

// ── Types ────────────────────────────────────────────────────────────────

type WorkExperience = {
  id: string;
  company: string;
  title: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type Education = {
  id: string;
  institution: string;
  degree: string | null;
  field: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type Skill = {
  id: string;
  name: string;
  category: string | null;
  proficiency: string | null;
  createdAt: string;
};

// ── Component ────────────────────────────────────────────────────────────

function SettingsExperiencePage() {
  const qc = useQueryClient();

  // Queries
  const { data: weData } = useQuery({
    queryKey: ['workExperiences'],
    queryFn: () => gqlClient.request<{ workExperiences: WorkExperience[] }>(WORK_EXPERIENCES_QUERY),
  });
  const { data: eduData } = useQuery({
    queryKey: ['educations'],
    queryFn: () => gqlClient.request<{ educations: Education[] }>(EDUCATIONS_QUERY),
  });
  const { data: skillData } = useQuery({
    queryKey: ['skills'],
    queryFn: () => gqlClient.request<{ skills: Skill[] }>(SKILLS_QUERY),
  });

  const workExperiences = weData?.workExperiences ?? [];
  const educations = eduData?.educations ?? [];
  const skills = skillData?.skills ?? [];

  // ── Work Experience ──
  const [weEditing, setWeEditing] = useState<WorkExperience | null>(null);
  const [weFormOpen, setWeFormOpen] = useState(false);
  const weForm = useForm<WorkExperienceForm>({
    resolver: zodResolver(workExperienceSchema),
    values: weEditing
      ? {
          company: weEditing.company,
          title: weEditing.title,
          location: weEditing.location ?? '',
          startDate: weEditing.startDate.slice(0, 10),
          endDate: weEditing.endDate?.slice(0, 10) ?? '',
          description: weEditing.description ?? '',
        }
      : { company: '', title: '', location: '', startDate: '', endDate: '', description: '' },
  });

  const createWe = useMutation({
    mutationFn: (data: WorkExperienceForm) =>
      gqlClient.request(CREATE_WORK_EXPERIENCE, {
        input: {
          ...data,
          location: data.location || undefined,
          endDate: data.endDate || undefined,
          description: data.description || undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workExperiences'] });
      setWeFormOpen(false);
      weForm.reset();
    },
  });

  const updateWe = useMutation({
    mutationFn: (data: WorkExperienceForm) =>
      gqlClient.request(UPDATE_WORK_EXPERIENCE, {
        id: weEditing!.id,
        input: {
          ...data,
          location: data.location || undefined,
          endDate: data.endDate || undefined,
          description: data.description || undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workExperiences'] });
      setWeFormOpen(false);
      setWeEditing(null);
      weForm.reset();
    },
  });

  const deleteWe = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_WORK_EXPERIENCE, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workExperiences'] }),
  });

  // ── Education ──
  const [eduEditing, setEduEditing] = useState<Education | null>(null);
  const [eduFormOpen, setEduFormOpen] = useState(false);
  const eduForm = useForm<EducationForm>({
    resolver: zodResolver(educationSchema),
    values: eduEditing
      ? {
          institution: eduEditing.institution,
          degree: eduEditing.degree ?? '',
          field: eduEditing.field ?? '',
          startDate: eduEditing.startDate.slice(0, 10),
          endDate: eduEditing.endDate?.slice(0, 10) ?? '',
          description: eduEditing.description ?? '',
        }
      : { institution: '', degree: '', field: '', startDate: '', endDate: '', description: '' },
  });

  const createEdu = useMutation({
    mutationFn: (data: EducationForm) =>
      gqlClient.request(CREATE_EDUCATION, {
        input: {
          ...data,
          degree: data.degree || undefined,
          field: data.field || undefined,
          endDate: data.endDate || undefined,
          description: data.description || undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['educations'] });
      setEduFormOpen(false);
      eduForm.reset();
    },
  });

  const updateEdu = useMutation({
    mutationFn: (data: EducationForm) =>
      gqlClient.request(UPDATE_EDUCATION, {
        id: eduEditing!.id,
        input: {
          ...data,
          degree: data.degree || undefined,
          field: data.field || undefined,
          endDate: data.endDate || undefined,
          description: data.description || undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['educations'] });
      setEduFormOpen(false);
      setEduEditing(null);
      eduForm.reset();
    },
  });

  const deleteEdu = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_EDUCATION, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['educations'] }),
  });

  // ── Skills ──
  const [skillEditing, setSkillEditing] = useState<Skill | null>(null);
  const [skillFormOpen, setSkillFormOpen] = useState(false);
  const skillForm = useForm<SkillForm>({
    resolver: zodResolver(skillSchema),
    values: skillEditing
      ? {
          name: skillEditing.name,
          category: skillEditing.category ?? '',
          proficiency: skillEditing.proficiency ?? '',
        }
      : { name: '', category: '', proficiency: '' },
  });

  const createSkill = useMutation({
    mutationFn: (data: SkillForm) =>
      gqlClient.request(CREATE_SKILL, {
        input: {
          ...data,
          category: data.category || undefined,
          proficiency: data.proficiency || undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      setSkillFormOpen(false);
      skillForm.reset();
    },
  });

  const updateSkill = useMutation({
    mutationFn: (data: SkillForm) =>
      gqlClient.request(UPDATE_SKILL, {
        id: skillEditing!.id,
        input: {
          ...data,
          category: data.category || undefined,
          proficiency: data.proficiency || undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      setSkillFormOpen(false);
      setSkillEditing(null);
      skillForm.reset();
    },
  });

  const deleteSkill = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_SKILL, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });

  return (
    <div className="space-y-10">
      {/* ── Work Experience ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BriefcaseIcon size={18} /> Work Experience
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your professional background for AI-generated content.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setWeEditing(null);
              setWeFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
          >
            <PlusIcon size={14} /> <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {workExperiences.length === 0 && !weFormOpen && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No work experiences added yet.</p>
        )}

        {workExperiences.map((we) => (
          <div
            key={we.id}
            className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {we.title} at {we.company}
              </p>
              {we.location && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{we.location}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {we.startDate.slice(0, 10)} – {we.endDate ? we.endDate.slice(0, 10) : 'Present'}
              </p>
              {we.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {we.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setWeEditing(we);
                  setWeFormOpen(true);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Edit"
              >
                <PencilIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => deleteWe.mutate(we.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                aria-label="Delete"
              >
                <Trash2Icon size={14} />
              </button>
            </div>
          </div>
        ))}

        {weFormOpen && (
          <form
            onSubmit={weForm.handleSubmit((data) =>
              weEditing ? updateWe.mutate(data) : createWe.mutate(data),
            )}
            className="space-y-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Company *</label>
                <input
                  {...weForm.register('company')}
                  className={inputCls}
                  placeholder="Acme Corp"
                />
                {weForm.formState.errors.company && (
                  <p className="mt-1 text-xs text-red-600">
                    {weForm.formState.errors.company.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Title *</label>
                <input
                  {...weForm.register('title')}
                  className={inputCls}
                  placeholder="Software Engineer"
                />
                {weForm.formState.errors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {weForm.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input
                  {...weForm.register('location')}
                  className={inputCls}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div>
                <label className={labelCls}>Start Date *</label>
                <input type="date" {...weForm.register('startDate')} className={inputCls} />
                {weForm.formState.errors.startDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {weForm.formState.errors.startDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input type="date" {...weForm.register('endDate')} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                {...weForm.register('description')}
                className={inputCls}
                rows={3}
                placeholder="Key responsibilities and achievements..."
              />
            </div>
            {weForm.formState.errors.root?.message && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {weForm.formState.errors.root.message}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={weForm.formState.isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {weForm.formState.isSubmitting ? 'Saving…' : weEditing ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeFormOpen(false);
                  setWeEditing(null);
                  weForm.reset();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Education ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <GraduationCapIcon size={18} /> Education
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Academic background for AI-generated content.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEduEditing(null);
              setEduFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
          >
            <PlusIcon size={14} /> <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {educations.length === 0 && !eduFormOpen && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No education entries added yet.
          </p>
        )}

        {educations.map((edu) => (
          <div
            key={edu.id}
            className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {edu.institution}
                {edu.degree && ` — ${edu.degree}`}
                {edu.field && ` in ${edu.field}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {edu.startDate.slice(0, 10)} – {edu.endDate ? edu.endDate.slice(0, 10) : 'Present'}
              </p>
              {edu.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {edu.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEduEditing(edu);
                  setEduFormOpen(true);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Edit"
              >
                <PencilIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => deleteEdu.mutate(edu.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                aria-label="Delete"
              >
                <Trash2Icon size={14} />
              </button>
            </div>
          </div>
        ))}

        {eduFormOpen && (
          <form
            onSubmit={eduForm.handleSubmit((data) =>
              eduEditing ? updateEdu.mutate(data) : createEdu.mutate(data),
            )}
            className="space-y-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Institution *</label>
                <input
                  {...eduForm.register('institution')}
                  className={inputCls}
                  placeholder="MIT"
                />
                {eduForm.formState.errors.institution && (
                  <p className="mt-1 text-xs text-red-600">
                    {eduForm.formState.errors.institution.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Degree</label>
                <input {...eduForm.register('degree')} className={inputCls} placeholder="B.S." />
              </div>
              <div>
                <label className={labelCls}>Field</label>
                <input
                  {...eduForm.register('field')}
                  className={inputCls}
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <label className={labelCls}>Start Date *</label>
                <input type="date" {...eduForm.register('startDate')} className={inputCls} />
                {eduForm.formState.errors.startDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {eduForm.formState.errors.startDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input type="date" {...eduForm.register('endDate')} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                {...eduForm.register('description')}
                className={inputCls}
                rows={3}
                placeholder="Notable coursework, activities..."
              />
            </div>
            {eduForm.formState.errors.root?.message && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {eduForm.formState.errors.root.message}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={eduForm.formState.isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {eduForm.formState.isSubmitting ? 'Saving…' : eduEditing ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEduFormOpen(false);
                  setEduEditing(null);
                  eduForm.reset();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Skills ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <WrenchIcon size={18} /> Skills
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Technical and soft skills for AI-generated content.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSkillEditing(null);
              setSkillFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
          >
            <PlusIcon size={14} /> <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {skills.length === 0 && !skillFormOpen && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No skills added yet.</p>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <span className="text-gray-900 dark:text-gray-100">{skill.name}</span>
                {skill.proficiency && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    · {skill.proficiency}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSkillEditing(skill);
                    setSkillFormOpen(true);
                  }}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Edit"
                >
                  <PencilIcon size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteSkill.mutate(skill.id)}
                  className="p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete"
                >
                  <Trash2Icon size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {skillFormOpen && (
          <form
            onSubmit={skillForm.handleSubmit((data) =>
              skillEditing ? updateSkill.mutate(data) : createSkill.mutate(data),
            )}
            className="space-y-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Skill *</label>
                <input
                  {...skillForm.register('name')}
                  className={inputCls}
                  placeholder="TypeScript"
                />
                {skillForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {skillForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <input
                  {...skillForm.register('category')}
                  className={inputCls}
                  placeholder="Language"
                />
              </div>
              <div>
                <label className={labelCls}>Proficiency</label>
                <select {...skillForm.register('proficiency')} className={inputCls}>
                  <option value="">Select…</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            {skillForm.formState.errors.root?.message && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {skillForm.formState.errors.root.message}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={skillForm.formState.isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {skillForm.formState.isSubmitting ? 'Saving…' : skillEditing ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSkillFormOpen(false);
                  setSkillEditing(null);
                  skillForm.reset();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
