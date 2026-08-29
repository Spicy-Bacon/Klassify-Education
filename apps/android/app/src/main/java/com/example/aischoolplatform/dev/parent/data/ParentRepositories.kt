package com.example.aischoolplatform.dev.parent.data

import com.example.aischoolplatform.dev.parent.model.ChildSummary
import com.example.aischoolplatform.dev.parent.model.ParentAnnouncement
import com.example.aischoolplatform.dev.parent.model.ParentProfile
import com.example.aischoolplatform.dev.parent.model.ParentSession
import com.example.aischoolplatform.dev.parent.model.SchoolSummary

interface ParentRepository {
    fun currentSession(): ParentSession?
    fun parentProfile(session: ParentSession): ParentProfile?
    fun linkedChildren(session: ParentSession): List<ChildSummary>
    fun child(session: ParentSession, studentId: String): ChildSummary?
    fun school(session: ParentSession): SchoolSummary?
}

interface AnnouncementRepository {
    fun publishedAnnouncements(session: ParentSession): List<ParentAnnouncement>
    fun announcement(session: ParentSession, announcementId: String): ParentAnnouncement?
    fun markRead(session: ParentSession, announcementId: String, readAt: String): ParentAnnouncement?
}
