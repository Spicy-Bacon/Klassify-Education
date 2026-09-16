import {
  DomainErrorCode,
  FormQuestionType,
  type DomainResult,
  type FormAnswer,
  type FormAnswerValue,
  type FormQuestion,
} from '@klassify/contracts';

const choiceQuestionTypes = new Set<FormQuestionType>([
  FormQuestionType.SingleChoice,
  FormQuestionType.MultipleChoice,
]);

const booleanQuestionTypes = new Set<FormQuestionType>([
  FormQuestionType.Checkbox,
  FormQuestionType.Acknowledgement,
  FormQuestionType.Consent,
]);

export function validateQuestions(questions: FormQuestion[]): DomainResult<true> {
  const seenIds = new Set<string>();

  for (const question of questions) {
    if (!question.id.trim()) {
      return failure(DomainErrorCode.ValidationError, 'Question ID is required.');
    }

    if (seenIds.has(question.id)) {
      return failure(DomainErrorCode.ValidationError, 'Question IDs must be unique.');
    }
    seenIds.add(question.id);

    if (!question.label.trim()) {
      return failure(DomainErrorCode.ValidationError, 'Question label is required.');
    }

    if (choiceQuestionTypes.has(question.type) && (!question.options || question.options.length === 0)) {
      return failure(DomainErrorCode.ValidationError, 'Choice questions require at least one option.');
    }

    if (!choiceQuestionTypes.has(question.type) && question.options && question.options.length > 0) {
      return failure(DomainErrorCode.ValidationError, 'Only choice questions may define options.');
    }

    if (question.options) {
      const optionIds = new Set<string>();
      for (const option of question.options) {
        if (!option.id.trim() || !option.label.trim()) {
          return failure(DomainErrorCode.ValidationError, 'Choice options require IDs and labels.');
        }
        if (optionIds.has(option.id)) {
          return failure(DomainErrorCode.ValidationError, 'Choice option IDs must be unique per question.');
        }
        optionIds.add(option.id);
      }
    }
  }

  return { ok: true, value: true };
}

export function validateAnswers(questions: FormQuestion[], answers: FormAnswer[]): DomainResult<true> {
  const answersByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));

  for (const answer of answers) {
    const question = questions.find((candidate) => candidate.id === answer.questionId);
    if (!question) {
      return failure(DomainErrorCode.ValidationError, 'Answer references an unknown question.');
    }

    const validation = validateAnswerValue(question, answer.value);
    if (!validation.ok) {
      return validation;
    }
  }

  for (const question of questions) {
    if (!question.required) {
      continue;
    }

    const answer = answersByQuestion.get(question.id);
    if (!answer || isEmptyAnswer(question, answer.value)) {
      return failure(DomainErrorCode.ValidationError, `Required question missing: ${question.label}`);
    }
  }

  return { ok: true, value: true };
}

export function validateAnswerValue(question: FormQuestion, answer: FormAnswerValue): DomainResult<true> {
  if ([FormQuestionType.ShortText, FormQuestionType.LongText].includes(question.type)) {
    return answer.type === 'text'
      ? { ok: true, value: true }
      : failure(DomainErrorCode.ValidationError, 'Text questions require text answers.');
  }

  if (question.type === FormQuestionType.Date) {
    if (answer.type !== 'date' || Number.isNaN(Date.parse(answer.value))) {
      return failure(DomainErrorCode.ValidationError, 'Date questions require a valid ISO date answer.');
    }
    return { ok: true, value: true };
  }

  if (question.type === FormQuestionType.SingleChoice) {
    if (answer.type !== 'selected_option') {
      return failure(DomainErrorCode.ValidationError, 'Single-choice questions require one selected option.');
    }
    return question.options?.some((option) => option.id === answer.optionId)
      ? { ok: true, value: true }
      : failure(DomainErrorCode.ValidationError, 'Selected option is not valid for this question.');
  }

  if (question.type === FormQuestionType.MultipleChoice) {
    if (answer.type !== 'selected_options') {
      return failure(DomainErrorCode.ValidationError, 'Multiple-choice questions require selected options.');
    }

    const validOptionIds = new Set(question.options?.map((option) => option.id) ?? []);
    const valid = answer.optionIds.length > 0 && answer.optionIds.every((optionId) => validOptionIds.has(optionId));
    return valid
      ? { ok: true, value: true }
      : failure(DomainErrorCode.ValidationError, 'Selected options are not valid for this question.');
  }

  if (booleanQuestionTypes.has(question.type)) {
    return answer.type === 'boolean'
      ? { ok: true, value: true }
      : failure(DomainErrorCode.ValidationError, 'Checkbox, acknowledgement and consent questions require boolean answers.');
  }

  return failure(DomainErrorCode.ValidationError, 'Unsupported question type.');
}

function isEmptyAnswer(question: FormQuestion, answer: FormAnswerValue): boolean {
  if (answer.type === 'text') {
    return answer.value.trim().length === 0;
  }

  if (answer.type === 'selected_options') {
    return answer.optionIds.length === 0;
  }

  if (answer.type === 'boolean') {
    return [FormQuestionType.Acknowledgement, FormQuestionType.Consent].includes(question.type) && answer.value !== true;
  }

  return false;
}

function failure<T = never>(code: DomainErrorCode, message: string): DomainResult<T> {
  return { ok: false, error: { code, message } };
}