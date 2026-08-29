package com.example.aischoolplatform.dev.parent.navigation

enum class ParentTab {
    Home,
    Announcements,
    Forms,
    Children,
    Settings
}

data class ParentNavigationState(
    val selectedTab: ParentTab = ParentTab.Home,
    val selectedContextChildId: String? = null,
    val openedChildDetailId: String? = null,
    val openedAnnouncementId: String? = null,
    val openedFormRecipientId: String? = null
) {
    fun selectTab(tab: ParentTab): ParentNavigationState = copy(
        selectedTab = tab,
        openedChildDetailId = null,
        openedAnnouncementId = null,
        openedFormRecipientId = null
    )

    fun selectContextChild(childId: String): ParentNavigationState = copy(
        selectedContextChildId = childId
    )

    fun openChildDetail(childId: String): ParentNavigationState = copy(
        selectedTab = ParentTab.Children,
        openedChildDetailId = childId,
        openedAnnouncementId = null,
        openedFormRecipientId = null
    )

    fun closeChildDetail(): ParentNavigationState = copy(openedChildDetailId = null)

    fun openAnnouncement(announcementId: String): ParentNavigationState = copy(
        selectedTab = ParentTab.Announcements,
        openedAnnouncementId = announcementId,
        openedChildDetailId = null,
        openedFormRecipientId = null
    )

    fun closeAnnouncement(): ParentNavigationState = copy(openedAnnouncementId = null)

    fun openForm(recipientId: String): ParentNavigationState = copy(
        selectedTab = ParentTab.Forms,
        openedFormRecipientId = recipientId,
        openedAnnouncementId = null,
        openedChildDetailId = null
    )

    fun closeForm(): ParentNavigationState = copy(openedFormRecipientId = null)
}