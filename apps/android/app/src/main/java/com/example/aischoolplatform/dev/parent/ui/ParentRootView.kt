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
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.service.ParentAppService
import com.example.aischoolplatform.dev.parent.ui.announcements.AnnouncementDetailScreen
import com.example.aischoolplatform.dev.parent.ui.announcements.AnnouncementsScreen
import com.example.aischoolplatform.dev.parent.ui.children.ChildDetailScreen
import com.example.aischoolplatform.dev.parent.ui.children.ChildrenScreen
import com.example.aischoolplatform.dev.parent.ui.home.ParentHomeScreen
import com.example.aischoolplatform.dev.parent.ui.settings.SettingsScreen

private enum class ParentTab { Home, Announcements, Children, Settings }

@Composable
fun ParentRootView(service: ParentAppService, session: ParentSession) {
    var selectedTab by remember { mutableStateOf(ParentTab.Home) }
    var selectedChildId by remember { mutableStateOf<String?>(null) }
    var selectedAnnouncementId by remember { mutableStateOf<String?>(null) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == ParentTab.Home,
                    onClick = { selectedTab = ParentTab.Home },
                    icon = { Icon(Icons.Filled.Home, contentDescription = "Home") },
                    label = { Text("Home") }
                )
                NavigationBarItem(
                    selected = selectedTab == ParentTab.Announcements,
                    onClick = { selectedTab = ParentTab.Announcements },
                    icon = { Icon(Icons.Filled.Campaign, contentDescription = "Announcements") },
                    label = { Text("Announcements") }
                )
                NavigationBarItem(
                    selected = selectedTab == ParentTab.Children,
                    onClick = { selectedTab = ParentTab.Children },
                    icon = { Icon(Icons.Filled.ChildCare, contentDescription = "Children") },
                    label = { Text("Children") }
                )
                NavigationBarItem(
                    selected = selectedTab == ParentTab.Settings,
                    onClick = { selectedTab = ParentTab.Settings },
                    icon = { Icon(Icons.Filled.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") }
                )
            }
        }
    ) { innerPadding ->
        val modifier = Modifier.padding(innerPadding)
        when {
            selectedAnnouncementId != null -> AnnouncementDetailScreen(
                service = service,
                session = session,
                announcementId = selectedAnnouncementId!!,
                onBack = { selectedAnnouncementId = null }
            )
            selectedChildId != null && selectedTab == ParentTab.Children -> ChildDetailScreen(
                service = service,
                session = session,
                childId = selectedChildId!!,
                onBack = { selectedChildId = null },
                modifier = modifier
            )
            selectedTab == ParentTab.Home -> ParentHomeScreen(
                service = service,
                session = session,
                selectedChildId = selectedChildId,
                onSelectChild = { selectedChildId = it },
                onOpenAnnouncements = { selectedTab = ParentTab.Announcements },
                onOpenAnnouncement = { selectedAnnouncementId = it },
                modifier = modifier
            )
            selectedTab == ParentTab.Announcements -> AnnouncementsScreen(
                service = service,
                session = session,
                onOpenAnnouncement = { selectedAnnouncementId = it },
                modifier = modifier
            )
            selectedTab == ParentTab.Children -> ChildrenScreen(
                service = service,
                session = session,
                onOpenChild = { selectedChildId = it },
                modifier = modifier
            )
            selectedTab == ParentTab.Settings -> SettingsScreen(
                service = service,
                session = session,
                modifier = modifier
            )
        }
    }
}
