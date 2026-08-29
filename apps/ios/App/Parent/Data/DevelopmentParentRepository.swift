import Foundation

final class DevelopmentParentRepository: ParentRepository, ParentAnnouncementRepository, ParentFormRepository {
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
    private var submittedForms: [String: SubmittedForm] = [:]

    private let announcements: [ParentAnnouncement]
    private let formFixtures: [ParentFormTask]

    init() {
        children = [
            ChildSummary(studentId: "student-chloe", displayName: "Chloe Wong", studentNumber: "STU-3001", yearGroup: "Year 3", className: "3A", schoolId: demoSchool.id),
            ChildSummary(studentId: "student-ethan", displayName: "Ethan Wong", studentNumber: "STU-1004", yearGroup: "Year 1", className: "1B", schoolId: demoSchool.id),
            ChildSummary(studentId: "student-unrelated", displayName: "Jordan Lee", studentNumber: "STU-3009", yearGroup: "Year 3", className: "3B", schoolId: demoSchool.id),
            ChildSummary(studentId: "student-other-school", displayName: "Casey Chan", studentNumber: "EXT-2001", yearGroup: "Year 2", className: "2A", schoolId: otherSchool.id)
        ]

        announcements = [
            ParentAnnouncement(id: "ann-sports-day", title: "Sports Day Reminder", body: "Please check the arrangements for Sports Day and help your child bring a water bottle.", authorDisplayName: "Ms. Taylor", publishedAt: "2026-08-27T09:00:00Z", audienceLabel: "Class 3A parents", schoolId: demoSchool.id, recipientUserId: parent.id, relatedStudentIds: ["student-chloe"], readAt: nil),
            ParentAnnouncement(id: "ann-museum-trip", title: "Museum Trip Information", body: "Class 3A will visit the city museum next week. Forms are now available in the Forms tab.", authorDisplayName: "Ms. Taylor", publishedAt: "2026-08-25T08:30:00Z", audienceLabel: "Class 3A parents", schoolId: demoSchool.id, recipientUserId: parent.id, relatedStudentIds: ["student-chloe"], readAt: "2026-08-25T12:00:00Z"),
            ParentAnnouncement(id: "ann-school-holiday", title: "School Holiday Notice", body: "School will be closed for the public holiday.", authorDisplayName: "Demo Principal", publishedAt: "2026-08-24T10:00:00Z", audienceLabel: "All parents", schoolId: demoSchool.id, recipientUserId: parent.id, relatedStudentIds: linkedStudentIds, readAt: nil),
            ParentAnnouncement(id: "ann-unrelated-class", title: "Class 3B Reading Note", body: "This should not appear for Amy because she is not linked to Class 3B students.", authorDisplayName: "Mr. Rivera", publishedAt: "2026-08-26T07:30:00Z", audienceLabel: "Class 3B parents", schoolId: demoSchool.id, recipientUserId: "user-parent-unrelated", relatedStudentIds: ["student-unrelated"], readAt: nil),
            ParentAnnouncement(id: "ann-cross-school", title: "Other School Notice", body: "This should not cross the school boundary.", authorDisplayName: "Other Principal", publishedAt: "2026-08-26T07:30:00Z", audienceLabel: "All parents", schoolId: otherSchool.id, recipientUserId: parent.id, relatedStudentIds: ["student-other-school"], readAt: nil)
        ]

        formFixtures = [
            ParentFormTask(
                recipientId: "form-recipient-museum-amy-chloe",
                formId: "form-museum-trip-consent",
                title: "Museum Trip Consent",
                description: "Please confirm whether Chloe may attend the Class 3A museum trip.",
                deadlineAt: "2026-09-12T15:00:00Z",
                schoolId: demoSchool.id,
                recipientUserId: parent.id,
                child: children.first { $0.studentId == "student-chloe" },
                status: .outstanding,
                questions: [
                    ParentFormQuestion(id: "question-museum-consent", label: "I give permission for my child to attend the museum trip.", type: .consent, required: true, options: []),
                    ParentFormQuestion(id: "question-museum-note", label: "Optional pickup note", type: .shortText, required: false, options: [])
                ],
                submittedAt: nil,
                submittedAnswers: []
            ),
            ParentFormTask(
                recipientId: "form-recipient-contact-amy",
                formId: "form-emergency-contact-confirmation",
                title: "Emergency Contact Confirmation",
                description: "Confirm that your family contact information should be reviewed.",
                deadlineAt: nil,
                schoolId: demoSchool.id,
                recipientUserId: parent.id,
                child: nil,
                status: .outstanding,
                questions: [
                    ParentFormQuestion(id: "question-contact-ack", label: "I acknowledge that I should review my family contact details.", type: .acknowledgement, required: true, options: [])
                ],
                submittedAt: nil,
                submittedAnswers: []
            ),
            ParentFormTask(
                recipientId: "form-recipient-feedback-amy-ethan",
                formId: "form-communication-feedback",
                title: "Communication Feedback",
                description: "Short development survey for school communication feedback.",
                deadlineAt: "2026-09-20T15:00:00Z",
                schoolId: demoSchool.id,
                recipientUserId: parent.id,
                child: children.first { $0.studentId == "student-ethan" },
                status: .submitted,
                questions: [
                    ParentFormQuestion(id: "question-feedback-rating", label: "How clear are school communications?", type: .singleChoice, required: true, options: ["Clear", "Mostly clear", "Needs improvement"])
                ],
                submittedAt: "2026-08-28T09:30:00Z",
                submittedAnswers: [ParentFormAnswer(questionId: "question-feedback-rating", value: "Mostly clear")]
            ),
            ParentFormTask(
                recipientId: "form-recipient-unrelated-student",
                formId: "form-unrelated-student",
                title: "Unrelated Student Form",
                description: "This should not appear because Amy is not linked to this student.",
                deadlineAt: nil,
                schoolId: demoSchool.id,
                recipientUserId: parent.id,
                child: children.first { $0.studentId == "student-unrelated" },
                status: .outstanding,
                questions: [],
                submittedAt: nil,
                submittedAnswers: []
            ),
            ParentFormTask(
                recipientId: "form-recipient-cross-school",
                formId: "form-cross-school",
                title: "Cross School Form",
                description: "This should not cross the school boundary.",
                deadlineAt: nil,
                schoolId: otherSchool.id,
                recipientUserId: parent.id,
                child: children.first { $0.studentId == "student-other-school" },
                status: .outstanding,
                questions: [],
                submittedAt: nil,
                submittedAnswers: []
            )
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

    func formTasks(for session: ParentSession) -> [ParentFormTask] {
        formFixtures
            .filter { $0.schoolId == session.schoolId }
            .filter { $0.recipientUserId == session.userId }
            .filter { task in task.child == nil || linkedStudentIds.contains(task.child!.studentId) }
            .map(withStoredSubmission)
            .sorted { lhs, rhs in
                if (lhs.status == .outstanding) != (rhs.status == .outstanding) {
                    return lhs.status == .outstanding
                }
                return (lhs.deadlineAt ?? "") < (rhs.deadlineAt ?? "")
            }
    }

    func formTask(for session: ParentSession, recipientId: String) -> ParentFormTask? {
        formTasks(for: session).first { $0.recipientId == recipientId }
    }

    func submitForm(for session: ParentSession, recipientId: String, answers: [ParentFormAnswer], submittedAt: String) -> ParentFormTask? {
        guard let existing = formTask(for: session, recipientId: recipientId), existing.status == .outstanding else { return nil }
        submittedForms[recipientId] = SubmittedForm(submittedAt: submittedAt, answers: answers)
        return formTask(for: session, recipientId: recipientId)
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

    private func withStoredSubmission(_ task: ParentFormTask) -> ParentFormTask {
        guard let storedSubmission = submittedForms[task.recipientId] else { return task }
        return ParentFormTask(
            recipientId: task.recipientId,
            formId: task.formId,
            title: task.title,
            description: task.description,
            deadlineAt: task.deadlineAt,
            schoolId: task.schoolId,
            recipientUserId: task.recipientUserId,
            child: task.child,
            status: .submitted,
            questions: task.questions,
            submittedAt: storedSubmission.submittedAt,
            submittedAnswers: storedSubmission.answers
        )
    }

    private struct SubmittedForm {
        let submittedAt: String
        let answers: [ParentFormAnswer]
    }
}