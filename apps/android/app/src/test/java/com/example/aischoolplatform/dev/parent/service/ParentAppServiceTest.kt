package com.example.aischoolplatform.dev.parent.service

import com.example.aischoolplatform.dev.parent.data.DevelopmentParentRepository
import com.example.aischoolplatform.dev.parent.data.InMemoryAppPreferenceRepository
import com.example.aischoolplatform.dev.parent.model.ChildSummary
import com.example.aischoolplatform.dev.parent.model.LanguagePreference
import com.example.aischoolplatform.dev.parent.model.ParentAnnouncement
import com.example.aischoolplatform.dev.parent.model.ParentHomeState
import com.example.aischoolplatform.dev.parent.model.ParentRole
import com.example.aischoolplatform.dev.parent.model.ParentSession
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ParentAppServiceTest {
    private fun service(): ParentAppService {
        val repository = DevelopmentParentRepository()
        return ParentAppService(repository, repository, InMemoryAppPreferenceRepository()) { Instant.parse("2026-08-28T08:00:00Z") }
    }

    @Test
    fun parentOnlySeesLinkedChildren() {
        val service = service()
        val session = service.currentSession()!!

        val result = service.linkedChildren(session) as ParentAppResult.Success<List<ChildSummary>>

        assertEquals(listOf("student-chloe", "student-ethan"), result.value.map { it.studentId })
    }

    @Test
    fun multiChildRelationshipWorks() {
        val service = service()
        val session = service.currentSession()!!

        val result = service.homeState(session) as ParentAppResult.Success<ParentHomeState>

        assertEquals(2, result.value.children.size)
        assertEquals("student-chloe", result.value.selectedChild?.studentId)
    }

    @Test
    fun unrelatedChildIsUnavailable() {
        val service = service()
        val session = service.currentSession()!!

        val result = service.child(session, "student-unrelated")

        assertTrue(result is ParentAppResult.Failure)
    }

    @Test
    fun onlyDeliveredPublishedAnnouncementsAppear() {
        val service = service()
        val session = service.currentSession()!!

        val result = service.inbox(session) as ParentAppResult.Success<List<ParentAnnouncement>>
        val ids = result.value.map { it.id }

        assertTrue(ids.contains("ann-sports-day"))
        assertTrue(ids.contains("ann-museum-trip"))
        assertTrue(ids.contains("ann-school-holiday"))
        assertFalse(ids.contains("ann-unrelated-class"))
    }

    @Test
    fun crossSchoolAnnouncementDoesNotAppear() {
        val service = service()
        val session = service.currentSession()!!

        val result = service.inbox(session) as ParentAppResult.Success<List<ParentAnnouncement>>

        assertFalse(result.value.map { it.id }.contains("ann-cross-school"))
    }

    @Test
    fun markReadPersists() {
        val service = service()
        val session = service.currentSession()!!

        val first = service.announcement(session, "ann-sports-day") as ParentAppResult.Success<ParentAnnouncement>
        assertNull(first.value.readAt)

        val updated = service.markAnnouncementRead(session, "ann-sports-day") as ParentAppResult.Success<ParentAnnouncement>
        assertEquals("2026-08-28T08:00:00Z", updated.value.readAt)

        val reopened = service.announcement(session, "ann-sports-day") as ParentAppResult.Success<ParentAnnouncement>
        assertEquals("2026-08-28T08:00:00Z", reopened.value.readAt)
    }

    @Test
    fun nonParentSessionIsRejected() {
        val service = service()
        val session = ParentSession("user-student-chloe", "school-demo", ParentRole.Student, false)

        val result = service.homeState(session)

        assertTrue(result is ParentAppResult.Failure)
    }

    @Test
    fun languagePreferencePersistsThroughRepositoryBoundary() {
        val preferences = InMemoryAppPreferenceRepository()
        val repository = DevelopmentParentRepository()
        val service = ParentAppService(repository, repository, preferences)

        service.setLanguagePreference(LanguagePreference.TraditionalChinese)

        assertEquals(LanguagePreference.TraditionalChinese, service.languagePreference())
        assertEquals(LanguagePreference.TraditionalChinese, preferences.getLanguage())
    }
}
