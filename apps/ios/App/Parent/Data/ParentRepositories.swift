import Foundation

protocol ParentRepository {
    func currentSession() -> ParentSession?
    func parentProfile(for session: ParentSession) -> ParentProfile?
    func linkedChildren(for session: ParentSession) -> [ChildSummary]
    func child(for session: ParentSession, studentId: String) -> ChildSummary?
    func school(for session: ParentSession) -> SchoolSummary?
}

protocol ParentAnnouncementRepository {
    func publishedAnnouncements(for session: ParentSession) -> [ParentAnnouncement]
    func announcement(for session: ParentSession, announcementId: String) -> ParentAnnouncement?
    func markRead(for session: ParentSession, announcementId: String, readAt: String) -> ParentAnnouncement?
}

protocol ParentFormRepository {
    func formTasks(for session: ParentSession) -> [ParentFormTask]
    func formTask(for session: ParentSession, recipientId: String) -> ParentFormTask?
    func submitForm(for session: ParentSession, recipientId: String, answers: [ParentFormAnswer], submittedAt: String) -> ParentFormTask?
}