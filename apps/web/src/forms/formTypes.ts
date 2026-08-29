import type {
  FormAnswer,
  FormAudience,
  FormDefinition,
  FormQuestion,
  FormRecipient,
  FormStatus,
  FormSubmission,
  EntityId,
  ISODateTime,
  User,
} from '@ai-school-platform/contracts';

export interface FormDefinitionInput {
  schoolId: EntityId;
  title: string;
  description?: string;
  authorUserId: EntityId;
  deadlineAt?: ISODateTime;
  audience: FormAudience[];
  requiresChildContext: boolean;
  questions: FormQuestion[];
}

export interface FormDefinitionUpdateInput {
  title?: string;
  description?: string;
  deadlineAt?: ISODateTime;
  audience?: FormAudience[];
  requiresChildContext?: boolean;
  questions?: FormQuestion[];
}

export interface FormSnapshot {
  forms: FormDefinition[];
  recipients: FormRecipient[];
  submissions: FormSubmission[];
}

export interface ResolvedFormRecipient {
  userId: EntityId;
  studentId?: EntityId;
}

export interface FormRecipientResolution {
  recipients: ResolvedFormRecipient[];
  parentGuardianCount: number;
  studentCount: number;
  taskCount: number;
}

export interface FormSubmissionInput {
  recipientId: EntityId;
  submittedByUserId: EntityId;
  answers: FormAnswer[];
}

export interface FormListFilter {
  status?: FormStatus;
  audienceType?: FormAudience['type'];
  authorUserId?: EntityId;
  search?: string;
}

export interface FormResponseSummary {
  delivered: number;
  submitted: number;
  outstanding: number;
  completionRate: number;
}

export interface FormListItem {
  form: FormDefinition;
  author?: User;
  audienceLabel: string;
  responseSummary: FormResponseSummary;
}

export interface FormDetail extends FormListItem {
  recipients: FormRecipient[];
  submissions: FormSubmission[];
}

export interface ParentFormTask {
  form: FormDefinition;
  recipient: FormRecipient;
  submission?: FormSubmission;
  childLabel?: string;
  classLabel?: string;
}