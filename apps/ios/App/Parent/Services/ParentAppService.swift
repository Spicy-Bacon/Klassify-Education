import Foundation

enum ParentAppError: Error, LocalizedError, Equatable {
    case notParent
    case parentNotFound
    case schoolNotFound
    case childNotLinked
    case announcementNotFound

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
        }
    }
}

final class ParentAppService {
    private let parentRepository: ParentRepository
    private let announcementRepository: ParentAnnouncementRepository
    private let now: () -> Date

    init(parentRepository: ParentRepository, announcementRepository: ParentAnnouncementRepository, now: @escaping () -> Date = Date.init) {
        self.parentRepository = parentRepository
        self.announcementRepository = announcementRepository
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
        return ParentHomeState(parent: parent, school: school, selectedChild: selectedChild, children: children, announcements: announcementRepository.publishedAnnouncements(for: session))
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

    private func requireParent(_ session: ParentSession) throws {
        guard session.role == .parentGuardian else { throw ParentAppError.notParent }
    }
}

enum DevelopmentParentComposition {
    static func createService() -> ParentAppService {
        let repository = DevelopmentParentRepository()
        return ParentAppService(parentRepository: repository, announcementRepository: repository)
    }
}
