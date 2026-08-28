package com.example.aischoolplatform.dev.parent.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.ChildCare
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.example.aischoolplatform.dev.R
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.navigation.ParentNavigationState
import com.example.aischoolplatform.dev.parent.navigation.ParentTab
import com.example.aischoolplatform.dev.parent.service.ParentAppService
import com.example.aischoolplatform.dev.parent.ui.announcements.AnnouncementDetailScreen
import com.example.aischoolplatform.dev.parent.ui.announcements.AnnouncementsScreen
import com.example.aischoolplatform.dev.parent.ui.children.ChildDetailScreen
import com.example.aischoolplatform.dev.parent.ui.children.ChildrenScreen
import com.example.aischoolplatform.dev.parent.ui.home.ParentHomeScreen
import com.example.aischoolplatform.dev.parent.ui.settings.SettingsScreen

@Composable
fun ParentRootView(service: ParentAppService, session: ParentSession) {
    var navigationState by remember { mutableStateOf(ParentNavigationState()) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = navigationState.selectedTab == ParentTab.Home,
                    onClick = { navigationState = navigationState.selectTab(ParentTab.Home) },
                    icon = { Icon(Icons.Filled.Home, contentDescription = stringResource(R.string.tab_home)) },
                    label = { Text(stringResource(R.string.tab_home)) }
                )
                NavigationBarItem(
                    selected = navigationState.selectedTab == ParentTab.Announcements,
                    onClick = { navigationState = navigationState.selectTab(ParentTab.Announcements) },
                    icon = { Icon(Icons.Filled.Campaign, contentDescription = stringResource(R.string.tab_announcements)) },
                    label = { Text(stringResource(R.string.tab_announcements)) }
                )
                NavigationBarItem(
                    selected = navigationState.selectedTab == ParentTab.Children,
                    onClick = { navigationState = navigationState.selectTab(ParentTab.Children) },
                    icon = { Icon(Icons.Filled.ChildCare, contentDescription = stringResource(R.string.tab_children)) },
                    label = { Text(stringResource(R.string.tab_children)) }
                )
                NavigationBarItem(
                    selected = navigationState.selectedTab == ParentTab.Settings,
                    onClick = { navigationState = navigationState.selectTab(ParentTab.Settings) },
                    icon = { Icon(Icons.Filled.Settings, contentDescription = stringResource(R.string.tab_settings)) },
                    label = { Text(stringResource(R.string.tab_settings)) }
                )
            }
        }
    ) { innerPadding ->
        val modifier = Modifier.padding(innerPadding)
        when {
            navigationState.openedAnnouncementId != null -> AnnouncementDetailScreen(
                service = service,
                session = session,
                announcementId = navigationState.openedAnnouncementId!!,
                onBack = { navigationState = navigationState.closeAnnouncement() }
            )
            navigationState.openedChildDetailId != null && navigationState.selectedTab == ParentTab.Children -> ChildDetailScreen(
                service = service,
                session = session,
                childId = navigationState.openedChildDetailId!!,
                onBack = { navigationState = navigationState.closeChildDetail() },
                modifier = modifier
            )
            navigationState.selectedTab == ParentTab.Home -> ParentHomeScreen(
                service = service,
                session = session,
                selectedChildId = navigationState.selectedContextChildId,
                onSelectChild = { navigationState = navigationState.selectContextChild(it) },
                onOpenAnnouncements = { navigationState = navigationState.selectTab(ParentTab.Announcements) },
                onOpenAnnouncement = { navigationState = navigationState.openAnnouncement(it) },
                modifier = modifier
            )
            navigationState.selectedTab == ParentTab.Announcements -> AnnouncementsScreen(
                service = service,
                session = session,
                onOpenAnnouncement = { navigationState = navigationState.openAnnouncement(it) },
                modifier = modifier
            )
            navigationState.selectedTab == ParentTab.Children -> ChildrenScreen(
                service = service,
                session = session,
                onOpenChild = { navigationState = navigationState.openChildDetail(it) },
                modifier = modifier
            )
            navigationState.selectedTab == ParentTab.Settings -> SettingsScreen(
                service = service,
                session = session,
                modifier = modifier
            )
        }
    }
}
