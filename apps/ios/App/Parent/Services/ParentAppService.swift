import Foundation

enum ParentAppError: Error, LocalizedError, Equatable {
    case notParent
    case parentNotFound
    case schoolNotFound
    case childNotLinked
    case announcementNotFound
    case formNotFound
    case formNotSubmittable
    case formDeadlinePassed
    case requiredFormAnswersMissing
    case consentNotAccepted

    var errorDescription: String? {
        switch self {
        case .notParent:
            return "Parent access is not available for this user."
        case .parentNotFound:
            return "Parent profile was not found."
        case .schoolNotFound:
            return "School was not found."
        case .childNotLinked:
            return "That child is not linked to this parent account."
        case .announcementNotFound:
            return "Announcement was not found for this parent account."
        case .formNotFound:
            return "Form was not found for this parent account."
        case .formNotSubmittable:
            return "This form cannot be submitted."
        case .formDeadlinePassed:
            return "The deadline for this form has passed."
        case .requiredFormAnswersMissing:
            return "Required form questions must be answered."
        case .consentNotAccepted:
            return "Consent and acknowledgement questions must be explicitly accepted."
        }
    }
}

final class ParentAppService {
    private let parentRepository: ParentRepository
    private let announcementRepository: ParentAnnouncementRepository
    private let formRepository: ParentFormRepository
    private let now: () -> Date

    init(
        parentRepository: ParentRepository,
        announcementRepository: ParentAnnouncementRepository,
        formRepository: ParentFormRepository,
        now: @escaping () -> Date = Date.init
    ) {
        self.parentRepository = parentRepository
        self.announcementRepository = announcementRepository
        self.formRepository = formRepository
        self.now = now
    }

    func currentSession() -> ParentSession? {
        parentRepository.currentSession()
    }

    func homeState(session: ParentSession, selectedChildId: String? = nil) throws -> ParentHomeState {
        try requireParent(session)
        guard let parent = parentRepository.parentProfile(for: session) else { throw ParentAppError.parentNotFound }
        guard let school = parentRepository.school(for: session) else { throw ParentAppError.schoolNotFound }
        let children = parentRepository.linkedChildren(for: session)
        let selectedChild = try selectedChildId.map { id in
            guard let child = parentRepository.child(for: session, studentId: id) else { throw ParentAppError.childNotLinked }
            return child
        } ?? children.first
        return ParentHomeState(
            parent: parent,
            school: school,
            selectedChild: selectedChild,
            children: children,
            announcements: announcementRepository.publishedAnnouncements(for: session),
            forms: formRepository.formTasks(for: session)
        )
    }

    func linkedChildren(session: ParentSession) throws -> [ChildSummary] {
        try requireParent(session)
        return parentRepository.linkedChildren(for: session)
    }

    func child(session: ParentSession, studentId: String) throws -> ChildSummary {
        try requireParent(session)
        guard let child = parentRepository.child(for: session, studentId: studentId) else { throw ParentAppError.childNotLinked }
        return child
    }

    func inbox(session: ParentSession) throws -> [ParentAnnouncement] {
        try requireParent(session)
        return announcementRepository.publishedAnnouncements(for: session)
    }

    func announcement(session: ParentSession, announcementId: String) throws -> ParentAnnouncement {
        try requireParent(session)
        guard let announcement = announcementRepository.announcement(for: session, announcementId: announcementId) else { throw ParentAppError.announcementNotFound }
        return announcement
    }

    func markAnnouncementRead(session: ParentSession, announcementId: String) throws -> ParentAnnouncement {
        try requireParent(session)
        let timestamp = ISO8601DateFormatter().string(from: now())
        guard let announcement = announcementRepository.markRead(for: session, announcementId: announcementId, readAt: timestamp) else { throw ParentAppError.announcementNotFound }
        return announcement
    }

    func forms(session: ParentSession) throws -> [ParentFormTask] {
        try requireParent(session)
        return formRepository.formTasks(for: session)
    }

    func form(session: ParentSession, recipientId: String) throws -> ParentFormTask {
        try requireParent(session)
        guard let task = formRepository.formTask(for: session, recipientId: recipientId) else { throw ParentAppError.formNotFound }
        return task
    }

    func submitForm(session: ParentSession, recipientId: String, answers: [ParentFormAnswer]) throws -> ParentFormTask {
        try requireParent(session)
        let task = try form(session: session, recipientId: recipientId)
        guard task.status == .outstanding else { throw ParentAppError.formNotSubmittable }
        guard !deadlineHasPassed(task.deadlineAt) else { throw ParentAppError.formDeadlinePassed }
        try validateAnswers(task: task, answers: answers)
        let timestamp = ISO8601DateFormatter().string(from: now())
        guard let updated = formRepository.submitForm(for: session, recipientId: recipientId, answers: answers, submittedAt: timestamp) else { throw ParentAppError.formNotSubmittable }
        return updated
    }

    private func deadlineHasPassed(_ deadlineAt: String?) -> Bool {
        guard let deadlineAt, let deadline = ISO8601DateFormatter().date(from: deadlineAt) else { return deadlineAt != nil }
        return deadline <= now()
    }

    private func validateAnswers(task: ParentFormTask, answers: [ParentFormAnswer]) throws {
        let answersByQuestion = Dictionary(uniqueKeysWithValues: answers.map { ($0.questionId, $0.value.trimmingCharacters(in: .whitespacesAndNewlines)) })
        for question in task.questions where question.required {
            guard let answer = answersByQuestion[question.id], !answer.isEmpty else { throw ParentAppError.requiredFormAnswersMissing }
            if [.acknowledgement, .consent].contains(question.type), answer != "true" {
                throw ParentAppError.consentNotAccepted
            }
        }
    }

    private func requireParent(_ session: ParentSession) throws {
        guard session.role == .parentGuardian else { throw ParentAppError.notParent }
    }
}

enum DevelopmentParentComposition {
    static func createService() -> ParentAppService {
        let repository = DevelopmentParentRepository()
        return ParentAppService(parentRepository: repository, announcementRepository: repository, formRepository: repository)
    }
}