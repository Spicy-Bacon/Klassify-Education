package com.example.aischoolplatform.dev.parent.data

import com.example.aischoolplatform.dev.parent.model.ChildSummary
import com.example.aischoolplatform.dev.parent.model.ParentAnnouncement
import com.example.aischoolplatform.dev.parent.model.ParentProfile
import com.example.aischoolplatform.dev.parent.model.ParentRole
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.model.SchoolSummary

class DevelopmentParentRepository : ParentRepository, AnnouncementRepository {
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
            body = "Class 3A will visit the city museum next week. Forms will be available in a later release.",
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

    private fun withStoredReadState(announcement: ParentAnnouncement): ParentAnnouncement {
        val stored = readStates[announcement.id]
        return if (stored != null) announcement.copy(readAt = stored) else announcement
    }
}
