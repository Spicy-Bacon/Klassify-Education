import Foundation

enum ParentRole: String {
    case parentGuardian = "parent_guardian"
    case student
    case teacher
}

struct ParentSession: Hashable {
    let userId: String
    let schoolId: String
    let role: ParentRole
    let isDevelopment: Bool
}

struct ParentProfile: Hashable {
    let id: String
    let displayName: String
    let email: String
    let schoolId: String
}

struct SchoolSummary: Hashable {
    let id: String
    let name: String
}

struct ChildSummary: Identifiable, Hashable {
    let studentId: String
    let displayName: String
    let studentNumber: String
    let yearGroup: String
    let className: String
    let schoolId: String

    var id: String { studentId }
}

struct ParentAnnouncement: Identifiable, Hashable {
    let id: String
    let title: String
    let body: String
    let authorDisplayName: String
    let publishedAt: String
    let audienceLabel: String
    let schoolId: String
    let recipientUserId: String
    let relatedStudentIds: Set<String>
    let readAt: String?
}

enum ParentFormStatus: String, Hashable {
    case outstanding
    case submitted
    case closed
}

enum ParentFormQuestionType: String, Hashable {
    case acknowledgement
    case consent
    case shortText
    case longText
    case singleChoice
}

struct ParentFormQuestion: Identifiable, Hashable {
    let id: String
    let label: String
    let type: ParentFormQuestionType
    let required: Bool
    let options: [String]
}

struct ParentFormAnswer: Hashable {
    let questionId: String
    let value: String
}

struct ParentFormTask: Identifiable, Hashable {
    let recipientId: String
    let formId: String
    let title: String
    let description: String
    let deadlineAt: String?
    let schoolId: String
    let recipientUserId: String
    let child: ChildSummary?
    let status: ParentFormStatus
    let questions: [ParentFormQuestion]
    let submittedAt: String?
    let submittedAnswers: [ParentFormAnswer]

    var id: String { recipientId }
}

struct ParentHomeState: Hashable {
    let parent: ParentProfile
    let school: SchoolSummary
    let selectedChild: ChildSummary?
    let children: [ChildSummary]
    let announcements: [ParentAnnouncement]
    let forms: [ParentFormTask]

    var unreadCount: Int {
        announcements.filter { $0.readAt == nil }.count
    }

    var outstandingFormCount: Int {
        forms.filter { $0.status == .outstanding }.count
    }
}

enum LanguagePreference: String, CaseIterable, Identifiable {
    case english = "en"
    case traditionalChinese = "zh-Hant"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .english:
            return "English"
        case .traditionalChinese:
            return "Traditional Chinese"
        }
    }
}