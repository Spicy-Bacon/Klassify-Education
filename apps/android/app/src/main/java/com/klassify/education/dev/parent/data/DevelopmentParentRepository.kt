package com.klassify.education.dev.parent.data

import com.klassify.education.dev.parent.model.ChildSummary
import com.klassify.education.dev.parent.model.ParentAnnouncement
import com.klassify.education.dev.parent.model.ParentFormAnswer
import com.klassify.education.dev.parent.model.ParentFormQuestion
import com.klassify.education.dev.parent.model.ParentFormQuestionType
import com.klassify.education.dev.parent.model.ParentFormStatus
import com.klassify.education.dev.parent.model.ParentFormTask
import com.klassify.education.dev.parent.model.ParentProfile
import com.klassify.education.dev.parent.model.ParentRole
import com.klassify.education.dev.parent.model.ParentSession
import com.klassify.education.dev.parent.model.SchoolSummary

class DevelopmentParentRepository : ParentRepository, AnnouncementRepository, FormRepository {
    private val demoSchool = SchoolSummary("school-demo", "Demo School")
    private val otherSchool = SchoolSummary("school-other", "Other Demo School")

    private val session = ParentSession(
        userId = "user-parent-amy",
        schoolId = demoSchool.id,
        role = ParentRole.ParentGuardian,
        isDevelopment = true
    )

    private val parent = ParentProfile(
        id = "user-parent-amy",
        displayName = "Amy Wong",
        email = "amy.wong@example.test",
        schoolId = demoSchool.id
    )

    private val children = listOf(
        ChildSummary("student-chloe", "Chloe Wong", "STU-3001", "Year 3", "3A", demoSchool.id),
        ChildSummary("student-ethan", "Ethan Wong", "STU-1004", "Year 1", "1B", demoSchool.id),
        ChildSummary("student-unrelated", "Jordan Lee", "STU-3009", "Year 3", "3B", demoSchool.id),
        ChildSummary("student-other-school", "Casey Chan", "EXT-2001", "Year 2", "2A", otherSchool.id)
    )

    private val linkedStudentIds = setOf("student-chloe", "student-ethan")
    private val readStates = mutableMapOf<String, String?>()
    private val submittedForms = mutableMapOf<String, SubmittedForm>()

    private val announcements = listOf(
        ParentAnnouncement(
            id = "ann-sports-day",
            title = "Sports Day Reminder",
            body = "Please check the arrangements for Sports Day and help your child bring a water bottle.",
            authorDisplayName = "Ms. Taylor",
            publishedAt = "2026-08-27T09:00:00Z",
            audienceLabel = "Class 3A parents",
            schoolId = demoSchool.id,
            recipientUserId = parent.id,
            relatedStudentIds = setOf("student-chloe")
        ),
        ParentAnnouncement(
            id = "ann-museum-trip",
            title = "Museum Trip Information",
            body = "Class 3A will visit the city museum next week. Forms are now available in the Forms tab.",
            authorDisplayName = "Ms. Taylor",
            publishedAt = "2026-08-25T08:30:00Z",
            audienceLabel = "Class 3A parents",
            schoolId = demoSchool.id,
            recipientUserId = parent.id,
            relatedStudentIds = setOf("student-chloe"),
            readAt = "2026-08-25T12:00:00Z"
        ),
        ParentAnnouncement(
            id = "ann-school-holiday",
            title = "School Holiday Notice",
            body = "School will be closed for the public holiday.",
            authorDisplayName = "Demo Principal",
            publishedAt = "2026-08-24T10:00:00Z",
            audienceLabel = "All parents",
            schoolId = demoSchool.id,
            recipientUserId = parent.id,
            relatedStudentIds = linkedStudentIds
        ),
        ParentAnnouncement(
            id = "ann-unrelated-class",
            title = "Class 3B Reading Note",
            body = "This should not appear for Amy because she is not linked to Class 3B students.",
            authorDisplayName = "Mr. Rivera",
            publishedAt = "2026-08-26T07:30:00Z",
            audienceLabel = "Class 3B parents",
            schoolId = demoSchool.id,
            recipientUserId = "user-parent-unrelated",
            relatedStudentIds = setOf("student-unrelated")
        ),
        ParentAnnouncement(
            id = "ann-cross-school",
            title = "Other School Notice",
            body = "This should not cross the school boundary.",
            authorDisplayName = "Other Principal",
            publishedAt = "2026-08-26T07:30:00Z",
            audienceLabel = "All parents",
            schoolId = otherSchool.id,
            recipientUserId = parent.id,
            relatedStudentIds = setOf("student-other-school")
        )
    )

    private val formFixtures = listOf(
        ParentFormTask(
            recipientId = "form-recipient-museum-amy-chloe",
            formId = "form-museum-trip-consent",
            title = "Museum Trip Consent",
            description = "Please confirm whether Chloe may attend the Class 3A museum trip.",
            deadlineAt = "2026-09-12T15:00:00Z",
            schoolId = demoSchool.id,
            recipientUserId = parent.id,
            child = childById("student-chloe"),
            status = ParentFormStatus.Outstanding,
            questions = listOf(
                ParentFormQuestion(
                    id = "question-museum-consent",
                    label = "I give permission for my child to attend the museum trip.",
                    type = ParentFormQuestionType.Consent,
                    required = true
                ),
                ParentFormQuestion(
                    id = "question-museum-note",
                    label = "Optional pickup note",
                    type = ParentFormQuestionType.ShortText,
                    required = false
                )
            )
        ),
        ParentFormTask(
            recipientId = "form-recipient-contact-amy",
            formId = "form-emergency-contact-confirmation",
            title = "Emergency Contact Confirmation",
            description = "Confirm that your family contact information should be reviewed.",
            deadlineAt = null,
            schoolId = demoSchool.id,
            recipientUserId = parent.id,
            child = null,
            status = ParentFormStatus.Outstanding,
            questions = listOf(
                ParentFormQuestion(
                    id = "question-contact-ack",
                    label = "I acknowledge that I should review my family contact details.",
                    type = ParentFormQuestionType.Acknowledgement,
                    required = true
                )
            )
        ),
        ParentFormTask(
            recipientId = "form-recipient-feedback-amy-ethan",
            formId = "form-communication-feedback",
            title = "Communication Feedback",
            description = "Short development survey for school communication feedback.",
            deadlineAt = "2026-09-20T15:00:00Z",
            schoolId = demoSchool.id,
            recipientUserId = parent.id,
            child = childById("student-ethan"),
            status = ParentFormStatus.Submitted,
            submittedAt = "2026-08-28T09:30:00Z",
            submittedAnswers = listOf(ParentFormAnswer("question-feedback-rating", "Mostly clear")),
            questions = listOf(
                ParentFormQuestion(
                    id = "question-feedback-rating",
                    label = "How clear are school communications?",
                    type = ParentFormQuestionType.SingleChoice,
                    required = true,
                    options = listOf("Clear", "Mostly clear", "Needs improvement")
                )
            )
        ),
        ParentFormTask(
            recipientId = "form-recipient-unrelated-student",
            formId = "form-unrelated-student",
            title = "Unrelated Student Form",
            description = "This should not appear because Amy is not linked to this student.",
            deadlineAt = null,
            schoolId = demoSchool.id,
            recipientUserId = parent.id,
            child = childById("student-unrelated"),
            status = ParentFormStatus.Outstanding,
            questions = emptyList()
        ),
        ParentFormTask(
            recipientId = "form-recipient-cross-school",
            formId = "form-cross-school",
            title = "Cross School Form",
            description = "This should not cross the school boundary.",
            deadlineAt = null,
            schoolId = otherSchool.id,
            recipientUserId = parent.id,
            child = childById("student-other-school"),
            status = ParentFormStatus.Outstanding,
            questions = emptyList()
        )
    )

    override fun currentSession(): ParentSession = session

    override fun parentProfile(session: ParentSession): ParentProfile? =
        parent.takeIf { session.userId == it.id && session.schoolId == it.schoolId }

    override fun linkedChildren(session: ParentSession): List<ChildSummary> =
        children.filter { it.schoolId == session.schoolId && it.studentId in linkedStudentIds }

    override fun child(session: ParentSession, studentId: String): ChildSummary? =
        linkedChildren(session).firstOrNull { it.studentId == studentId }

    override fun school(session: ParentSession): SchoolSummary? =
        demoSchool.takeIf { it.id == session.schoolId }

    override fun publishedAnnouncements(session: ParentSession): List<ParentAnnouncement> =
        announcements
            .filter { it.schoolId == session.schoolId }
            .filter { it.recipientUserId == session.userId }
            .filter { announcement -> announcement.relatedStudentIds.any { it in linkedStudentIds } }
            .map { withStoredReadState(it) }
            .sortedByDescending { it.publishedAt }

    override fun announcement(session: ParentSession, announcementId: String): ParentAnnouncement? =
        publishedAnnouncements(session).firstOrNull { it.id == announcementId }

    override fun markRead(session: ParentSession, announcementId: String, readAt: String): ParentAnnouncement? {
        val existing = announcement(session, announcementId) ?: return null
        if (existing.readAt == null) {
            readStates[announcementId] = readAt
        }
        return announcement(session, announcementId)
    }

    override fun formTasks(session: ParentSession): List<ParentFormTask> =
        formFixtures
            .filter { it.schoolId == session.schoolId }
            .filter { it.recipientUserId == session.userId }
            .filter { task -> task.child == null || task.child.studentId in linkedStudentIds }
            .map { withStoredSubmission(it) }
            .sortedWith(compareBy<ParentFormTask> { it.status != ParentFormStatus.Outstanding }.thenBy { it.deadlineAt ?: "" })

    override fun formTask(session: ParentSession, recipientId: String): ParentFormTask? =
        formTasks(session).firstOrNull { it.recipientId == recipientId }

    override fun submitForm(
        session: ParentSession,
        recipientId: String,
        answers: List<ParentFormAnswer>,
        submittedAt: String
    ): ParentFormTask? {
        val existing = formTask(session, recipientId) ?: return null
        if (existing.status != ParentFormStatus.Outstanding) return null
        submittedForms[recipientId] = SubmittedForm(submittedAt, answers)
        return formTask(session, recipientId)
    }

    private fun withStoredReadState(announcement: ParentAnnouncement): ParentAnnouncement {
        val stored = readStates[announcement.id]
        return if (stored != null) announcement.copy(readAt = stored) else announcement
    }

    private fun withStoredSubmission(task: ParentFormTask): ParentFormTask {
        val stored = submittedForms[task.recipientId]
        if (stored != null) {
            return task.copy(
                status = ParentFormStatus.Submitted,
                submittedAt = stored.submittedAt,
                submittedAnswers = stored.answers
            )
        }
        return task
    }

    private fun childById(studentId: String): ChildSummary? =
        children.firstOrNull { it.studentId == studentId }

    private data class SubmittedForm(
        val submittedAt: String,
        val answers: List<ParentFormAnswer>
    )
}
