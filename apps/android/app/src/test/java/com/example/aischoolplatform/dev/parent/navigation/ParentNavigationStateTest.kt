package com.example.aischoolplatform.dev.parent.navigation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ParentNavigationStateTest {
    @Test
    fun selectingChildContextDoesNotOpenChildDetail() {
        val state = ParentNavigationState().selectContextChild("student-chloe")

        assertEquals("student-chloe", state.selectedContextChildId)
        assertNull(state.openedChildDetailId)
    }

    @Test
    fun switchingTabsClearsAnnouncementDetail() {
        val state = ParentNavigationState()
            .openAnnouncement("ann-sports-day")
            .selectTab(ParentTab.Children)

        assertEquals(ParentTab.Children, state.selectedTab)
        assertNull(state.openedAnnouncementId)
    }

    @Test
    fun openingChildDetailDoesNotReplaceSelectedChildContext() {
        val state = ParentNavigationState()
            .selectContextChild("student-chloe")
            .openChildDetail("student-ethan")

        assertEquals("student-chloe", state.selectedContextChildId)
        assertEquals("student-ethan", state.openedChildDetailId)
    }
    @Test
    fun openingFormDetailClearsOtherDetails() {
        val state = ParentNavigationState()
            .openAnnouncement("ann-sports-day")
            .openForm("form-recipient-museum-amy-chloe")

        assertEquals(ParentTab.Forms, state.selectedTab)
        assertEquals("form-recipient-museum-amy-chloe", state.openedFormRecipientId)
        assertNull(state.openedAnnouncementId)
        assertNull(state.openedChildDetailId)
    }
}
