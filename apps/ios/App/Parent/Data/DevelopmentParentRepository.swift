import Foundation

final class DevelopmentParentRepository: ParentRepository, ParentAnnouncementRepository {
    private let demoSchool = SchoolSummary(id: "school-demo", name: "Demo School")
    private let otherSchool = SchoolSummary(id: "school-other", name: "Other Demo School")

    private let session = ParentSession(
        userId: "user-parent-amy",
        schoolId: "school-demo",
        role: .parentGuardian,
        isDevelopment: true
    )

    private let parent = ParentProfile(
        id: "user-parent-amy",
        displayName: "Amy Wong",
        email: "amy.wong@example.test",
        schoolId: "school-demo"
    )

    private let children: [ChildSummary]
    private let linkedStudentIds: Set<String> = ["student-chloe", "student-ethan"]
    private var readStates: [String: String] = [:]

    private let announcements: [ParentAnnouncement]

    init() {
        children = [
            ChildSummary(studentId: "student-chloe", displayName: "Chloe Wong", studentNumber: "STU-3001", yearGroup: "Year 3", className: "3A", schoolId: demoSchool.id),
            ChildSummary(studentId: "student-ethan", displayName: "Ethan Wong", studentNumber: "STU-1004", yearGroup: "Year 1", className: "1B", schoolId: demoSchool.id),
            ChildSummary(studentId: "student-unrelated", displayName: "Jordan Lee", studentNumber: "STU-3009", yearGroup: "Year 3", className: "3B", schoolId: demoSchool.id),
            ChildSummary(studentId: "student-other-school", displayName: "Casey Chan", studentNumber: "EXT-2001", yearGroup: "Year 2", className: "2A", schoolId: otherSchool.id)
        ]

        announcements = [
            ParentAnnouncement(id: "ann-sports-day", title: "Sports Day Reminder", body: "Please check the arrangements for Sports Day and help your child bring a water bottle.", authorDisplayName: "Ms. Taylor", publishedAt: "2026-08-27T09:00:00Z", audienceLabel: "Class 3A parents", schoolId: demoSchool.id, recipientUserId: parent.id, relatedStudentIds: ["student-chloe"], readAt: nil),
            ParentAnnouncement(id: "ann-museum-trip", title: "Museum Trip Information", body: "Class 3A will visit the city museum next week. Forms will be available in a later release.", authorDisplayName: "Ms. Taylor", publishedAt: "2026-08-25T08:30:00Z", audienceLabel: "Class 3A parents", schoolId: demoSchool.id, recipientUserId: parent.id, relatedStudentIds: ["student-chloe"], readAt: "2026-08-25T12:00:00Z"),
            ParentAnnouncement(id: "ann-school-holiday", title: "School Holiday Notice", body: "School will be closed for the public holiday.", authorDisplayName: "Demo Principal", publishedAt: "2026-08-24T10:00:00Z", audienceLabel: "All parents", schoolId: demoSchool.id, recipientUserId: parent.id, relatedStudentIds: linkedStudentIds, readAt: nil),
            ParentAnnouncement(id: "ann-unrelated-class", title: "Class 3B Reading Note", body: "This should not appear for Amy because she is not linked to Class 3B students.", authorDisplayName: "Mr. Rivera", publishedAt: "2026-08-26T07:30:00Z", audienceLabel: "Class 3B parents", schoolId: demoSchool.id, recipientUserId: "user-parent-unrelated", relatedStudentIds: ["student-unrelated"], readAt: nil),
            ParentAnnouncement(id: "ann-cross-school", title: "Other School Notice", body: "This should not cross the school boundary.", authorDisplayName: "Other Principal", publishedAt: "2026-08-26T07:30:00Z", audienceLabel: "All parents", schoolId: otherSchool.id, recipientUserId: parent.id, relatedStudentIds: ["student-other-school"], readAt: nil)
        ]
    }

    func currentSession() -> ParentSession? {
        session
    }

    func parentProfile(for session: ParentSession) -> ParentProfile? {
        guard session.userId == parent.id, session.schoolId == parent.schoolId else { return nil }
        return parent
    }

    func linkedChildren(for session: ParentSession) -> [ChildSummary] {
        children.filter { $0.schoolId == session.schoolId && linkedStudentIds.contains($0.studentId) }
    }

    func child(for session: ParentSession, studentId: String) -> ChildSummary? {
        linkedChildren(for: session).first { $0.studentId == studentId }
    }

    func school(for session: ParentSession) -> SchoolSummary? {
        session.schoolId == demoSchool.id ? demoSchool : nil
    }

    func publishedAnnouncements(for session: ParentSession) -> [ParentAnnouncement] {
        announcements
            .filter { $0.schoolId == session.schoolId }
            .filter { $0.recipientUserId == session.userId }
            .filter { !$0.relatedStudentIds.isDisjoint(with: linkedStudentIds) }
            .map(withStoredReadState)
            .sorted { $0.publishedAt > $1.publishedAt }
    }

    func announcement(for session: ParentSession, announcementId: String) -> ParentAnnouncement? {
        publishedAnnouncements(for: session).first { $0.id == announcementId }
    }

    func markRead(for session: ParentSession, announcementId: String, readAt: String) -> ParentAnnouncement? {
        guard let existing = announcement(for: session, announcementId: announcementId) else { return nil }
        if existing.readAt == nil {
            readStates[announcementId] = readAt
        }
        return announcement(for: session, announcementId: announcementId)
    }

    private func withStoredReadState(_ announcement: ParentAnnouncement) -> ParentAnnouncement {
        guard let storedReadAt = readStates[announcement.id] else { return announcement }
        return ParentAnnouncement(
            id: announcement.id,
            title: announcement.title,
            body: announcement.body,
            authorDisplayName: announcement.authorDisplayName,
            publishedAt: announcement.publishedAt,
            audienceLabel: announcement.audienceLabel,
            schoolId: announcement.schoolId,
            recipientUserId: announcement.recipientUserId,
            relatedStudentIds: announcement.relatedStudentIds,
            readAt: storedReadAt
        )
    }
}
