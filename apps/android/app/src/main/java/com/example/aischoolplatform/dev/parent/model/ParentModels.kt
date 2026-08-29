package com.example.aischoolplatform.dev.parent.model

enum class ParentRole(val value: String) {
    ParentGuardian("parent_guardian"),
    Student("student"),
    Teacher("teacher")
}

data class ParentSession(
    val userId: String,
    val schoolId: String,
    val role: ParentRole,
    val isDevelopment: Boolean
)

data class ParentProfile(
    val id: String,
    val displayName: String,
    val email: String,
    val schoolId: String
)

data class SchoolSummary(
    val id: String,
    val name: String
)

data class ChildSummary(
    val studentId: String,
    val displayName: String,
    val studentNumber: String,
    val yearGroup: String,
    val className: String,
    val schoolId: String
)

data class ParentAnnouncement(
    val id: String,
    val title: String,
    val body: String,
    val authorDisplayName: String,
    val publishedAt: String,
    val audienceLabel: String,
    val schoolId: String,
    val recipientUserId: String,
    val relatedStudentIds: Set<String>,
    val readAt: String? = null
)

enum class ParentFormStatus {
    Outstanding,
    Submitted,
    Closed
}

enum class ParentFormQuestionType {
    Acknowledgement,
    Consent,
    ShortText,
    LongText,
    SingleChoice
}

data class ParentFormQuestion(
    val id: String,
    val label: String,
    val type: ParentFormQuestionType,
    val required: Boolean,
    val options: List<String> = emptyList()
)

data class ParentFormAnswer(
    val questionId: String,
    val value: String
)

data class ParentFormTask(
    val recipientId: String,
    val formId: String,
    val title: String,
    val description: String,
    val deadlineAt: String?,
    val schoolId: String,
    val recipientUserId: String,
    val child: ChildSummary?,
    val status: ParentFormStatus,
    val questions: List<ParentFormQuestion>,
    val submittedAt: String? = null,
    val submittedAnswers: List<ParentFormAnswer> = emptyList()
)

data class ParentHomeState(
    val parent: ParentProfile,
    val school: SchoolSummary,
    val selectedChild: ChildSummary?,
    val children: List<ChildSummary>,
    val announcements: List<ParentAnnouncement>,
    val forms: List<ParentFormTask>
) {
    val unreadCount: Int = announcements.count { it.readAt == null }
    val outstandingFormCount: Int = forms.count { it.status == ParentFormStatus.Outstanding }
}

enum class LanguagePreference(val code: String, val label: String) {
    English("en", "English"),
    TraditionalChinese("zh-Hant", "Traditional Chinese")
}