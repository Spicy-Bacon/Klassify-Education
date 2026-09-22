import type { StudentSummary } from '../../identity/identityTypes';

export function studentName(summary: StudentSummary) {
  return `${summary.student.preferredName ?? summary.student.firstName} ${summary.student.lastName}`;
}

export function formatValue(value: string) {
  return value.replaceAll('_', ' ');
}

export function stringField(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim();
}
