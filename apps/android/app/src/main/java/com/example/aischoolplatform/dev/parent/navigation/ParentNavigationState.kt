package com.example.aischoolplatform.dev.parent.navigation

enum class ParentTab {
    Home,
    Announcements,
    Children,
    Settings
}

data class ParentNavigationState(
    val selectedTab: ParentTab = ParentTab.Home,
    val selectedContextChildId: String? = null,
    val openedChildDetailId: String? = null,
    val openedAnnouncementId: String? = null
) {
    fun selectTab(tab: ParentTab): ParentNavigationState = copy(
        selectedTab = tab,
        openedChildDetailId = null,
        openedAnnouncementId = null
    )

    fun selectContextChild(childId: String): ParentNavigationState = copy(
        selectedContextChildId = childId
    )

    fun openChildDetail(childId: String): ParentNavigationState = copy(
        selectedTab = ParentTab.Children,
        openedChildDetailId = childId,
        openedAnnouncementId = null
    )

    fun closeChildDetail(): ParentNavigationState = copy(openedChildDetailId = null)

    fun openAnnouncement(announcementId: String): ParentNavigationState = copy(
        selectedTab = ParentTab.Announcements,
        openedAnnouncementId = announcementId,
        openedChildDetailId = null
    )

    fun closeAnnouncement(): ParentNavigationState = copy(openedAnnouncementId = null)
}
