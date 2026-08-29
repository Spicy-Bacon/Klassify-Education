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

struct ParentHomeState: Hashable {
    let parent: ParentProfile
    let school: SchoolSummary
    let selectedChild: ChildSummary?
    let children: [ChildSummary]
    let announcements: [ParentAnnouncement]

    var unreadCount: Int {
        announcements.filter { $0.readAt == nil }.count
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
            return "繁體中文"
        }
    }
}
