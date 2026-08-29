package com.example.aischoolplatform.dev.parent.service

import android.content.Context
import com.example.aischoolplatform.dev.parent.data.DevelopmentParentRepository
import com.example.aischoolplatform.dev.parent.data.SharedPreferencesAppPreferenceRepository

object DevelopmentParentComposition {
    fun createService(context: Context): ParentAppService {
        val repository = DevelopmentParentRepository()
        val preferences = SharedPreferencesAppPreferenceRepository(context)
        return ParentAppService(repository, repository, preferences)
    }
}
