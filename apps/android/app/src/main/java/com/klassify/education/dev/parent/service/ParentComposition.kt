package com.klassify.education.dev.parent.service

import android.content.Context
import com.klassify.education.dev.parent.data.DevelopmentParentRepository
import com.klassify.education.dev.parent.data.SharedPreferencesAppPreferenceRepository

object DevelopmentParentComposition {
    fun createService(context: Context): ParentAppService {
        val repository = DevelopmentParentRepository()
        val preferences = SharedPreferencesAppPreferenceRepository(context)
        return ParentAppService(repository, repository, repository, preferences)
    }
}
