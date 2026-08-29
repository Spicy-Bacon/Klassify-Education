package com.example.aischoolplatform.dev.parent.service

import com.example.aischoolplatform.dev.parent.data.AnnouncementRepository
import com.example.aischoolplatform.dev.parent.data.AppPreferenceRepository
import com.example.aischoolplatform.dev.parent.data.FormRepository
import com.example.aischoolplatform.dev.parent.data.ParentRepository
import com.example.aischoolplatform.dev.parent.model.ChildSummary
import com.example.aischoolplatform.dev.parent.model.LanguagePreference
import com.example.aischoolplatform.dev.parent.model.ParentAnnouncement
import com.example.aischoolplatform.dev.parent.model.ParentFormAnswer
import com.example.aischoolplatform.dev.parent.model.ParentFormQuestionType
import com.example.aischoolplatform.dev.parent.model.ParentFormStatus
import com.example.aischoolplatform.dev.parent.model.ParentFormTask
import com.example.aischoolplatform.dev.parent.model.ParentHomeState
import com.example.aischoolplatform.dev.parent.model.ParentRole
import com.example.aischoolplatform.dev.parent.model.ParentSession
import java.time.Instant

sealed class ParentAppResult<out T> {
    data class Success<T>(val value: T) : ParentAppResult<T>()
    data class Failure(val message: String) : ParentAppResult<Nothing>()
}

class ParentAppService(
    private val parentRepository: ParentRepository,
    private val announcementRepository: AnnouncementRepository,
    private val formRepository: FormRepository,
    private val appPreferenceRepository: AppPreferenceRepository,
    private val now: () -> Instant = { Instant.now() }
) {
    fun currentSession(): ParentSession? = parentRepository.currentSession()

    fun homeState(session: ParentSession, selectedChildId: String? = null): ParentAppResult<ParentHomeState> {
        if (!isParentSession(session)) return ParentAppResult.Failure("Parent access is not available for this user.")
        val parent = parentRepository.parentProfile(session) ?: return ParentAppResult.Failure("Parent profile was not found.")
        val school = parentRepository.school(session) ?: return ParentAppResult.Failure("School was not found.")
        val children = parentRepository.linkedChildren(session)
        val selectedChild = selectedChildId?.let { parentRepository.child(session, it) } ?: children.firstOrNull()
        if (selectedChildId != null && selectedChild == null) return ParentAppResult.Failure("That child is not linked to this parent account.")
        return ParentAppResult.Success(
            ParentHomeState(
                parent = parent,
                school = school,
                selectedChild = selectedChild,
                children = children,
                announcements = announcementRepository.publishedAnnouncements(session),
                forms = formRepository.formTasks(session)
            )
        )
    }

    fun linkedChildren(session: ParentSession): ParentAppResult<List<ChildSummary>> {
        if (!isParentSession(session)) return ParentAppResult.Failure("Parent access is not available for this user.")
        return ParentAppResult.Success(parentRepository.linkedChildren(session))
    }

    fun child(session: ParentSession, studentId: String): ParentAppResult<ChildSummary> {
        if (!isParentSession(session)) return ParentAppResult.Failure("Parent access is not available for this user.")
        val child = parentRepository.child(session, studentId)
            ?: return ParentAppResult.Failure("That child is not linked to this parent account.")
        return ParentAppResult.Success(child)
    }

    fun inbox(session: ParentSession): ParentAppResult<List<ParentAnnouncement>> {
        if (!isParentSession(session)) return ParentAppResult.Failure("Parent access is not available for this user.")
        return ParentAppResult.Success(announcementRepository.publishedAnnouncements(session))
    }

    fun announcement(session: ParentSession, announcementId: String): ParentAppResult<ParentAnnouncement> {
        if (!isParentSession(session)) return ParentAppResult.Failure("Parent access is not available for this user.")
        val announcement = announcementRepository.announcement(session, announcementId)
            ?: return ParentAppResult.Failure("Announcement was not found for this parent account.")
        return ParentAppResult.Success(announcement)
    }

    fun markAnnouncementRead(session: ParentSession, announcementId: String): ParentAppResult<ParentAnnouncement> {
        if (!isParentSession(session)) return ParentAppResult.Failure("Parent access is not available for this user.")
        val updated = announcementRepository.markRead(session, announcementId, now().toString())
            ?: return ParentAppResult.Failure("Announcement was not found for this parent account.")
        return ParentAppResult.Success(updated)
    }

    fun forms(session: ParentSession): ParentAppResult<List<ParentFormTask>> {
        if (!isParentSession(session)) return ParentAppResult.Failure("Parent access is not available for this user.")
        return ParentAppResult.Success(formRepository.formTasks(session))
    }

    fun form(session: ParentSession, recipientId: String): ParentAppResult<ParentFormTask> {
        if (!isParentSession(session)) return ParentAppResult.Failure("Parent access is not available for this user.")
        val form = formRepository.formTask(session, recipientId)
            ?: return ParentAppResult.Failure("Form was not found for this parent account.")
        return ParentAppResult.Success(form)
    }

    fun submitForm(
        session: ParentSession,
        recipientId: String,
        answers: List<ParentFormAnswer>
    ): ParentAppResult<ParentFormTask> {
        if (!isParentSession(session)) return ParentAppResult.Failure("Parent access is not available for this user.")
        val form = formRepository.formTask(session, recipientId)
            ?: return ParentAppResult.Failure("Form was not found for this parent account.")
        if (form.status != ParentFormStatus.Outstanding) return ParentAppResult.Failure("This form cannot be submitted.")
        if (deadlineHasPassed(form.deadlineAt)) return ParentAppResult.Failure("The deadline for this form has passed.")
        val validation = validateAnswers(form, answers)
        if (validation != null) return ParentAppResult.Failure(validation)
        val updated = formRepository.submitForm(session, recipientId, answers, now().toString())
            ?: return ParentAppResult.Failure("This form could not be submitted.")
        return ParentAppResult.Success(updated)
    }

    fun languagePreference(): LanguagePreference = appPreferenceRepository.getLanguage()

    fun setLanguagePreference(preference: LanguagePreference): LanguagePreference {
        appPreferenceRepository.setLanguage(preference)
        return appPreferenceRepository.getLanguage()
    }

    private fun deadlineHasPassed(deadlineAt: String?): Boolean =
        deadlineAt?.let { runCatching { !Instant.parse(it).isAfter(now()) }.getOrDefault(true) } ?: false

    private fun validateAnswers(form: ParentFormTask, answers: List<ParentFormAnswer>): String? {
        val answersByQuestion = answers.associateBy { it.questionId }
        form.questions.filter { it.required }.forEach { question ->
            val answer = answersByQuestion[question.id]?.value?.trim()
            if (answer.isNullOrEmpty()) return "Required form questions must be answered."
            if ((question.type == ParentFormQuestionType.Acknowledgement || question.type == ParentFormQuestionType.Consent) && answer != "true") {
                return "Consent and acknowledgement questions must be explicitly accepted."
            }
        }
        return null
    }

    private fun isParentSession(session: ParentSession): Boolean =
        session.role == ParentRole.ParentGuardian
}