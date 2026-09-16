package com.klassify.education.dev.parent.data

import com.klassify.education.dev.parent.model.ChildSummary
import com.klassify.education.dev.parent.model.ParentAnnouncement
import com.klassify.education.dev.parent.model.ParentFormAnswer
import com.klassify.education.dev.parent.model.ParentFormTask
import com.klassify.education.dev.parent.model.ParentProfile
import com.klassify.education.dev.parent.model.ParentSession
import com.klassify.education.dev.parent.model.SchoolSummary

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

interface FormRepository {
    fun formTasks(session: ParentSession): List<ParentFormTask>
    fun formTask(session: ParentSession, recipientId: String): ParentFormTask?
    fun submitForm(session: ParentSession, recipientId: String, answers: List<ParentFormAnswer>, submittedAt: String): ParentFormTask?
}