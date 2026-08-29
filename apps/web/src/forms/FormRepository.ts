import type { EntityId, FormDefinition, FormRecipient, FormSubmission } from '@ai-school-platform/contracts';
import type { FormSnapshot } from './formTypes';

export interface FormRepository {
  getSnapshot(): FormSnapshot;
  saveForm(form: FormDefinition): FormDefinition;
  saveRecipients(formId: EntityId, recipients: FormRecipient[]): FormRecipient[];
  saveRecipient(recipient: FormRecipient): FormRecipient;
  saveSubmission(submission: FormSubmission): FormSubmission;
  nextId(prefix: string): EntityId;
}