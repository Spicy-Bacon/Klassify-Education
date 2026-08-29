package com.klassify.education.dev.parent.data

import android.content.Context
import com.klassify.education.dev.parent.model.LanguagePreference

interface AppPreferenceRepository {
    fun getLanguage(): LanguagePreference
    fun setLanguage(preference: LanguagePreference)
}

class SharedPreferencesAppPreferenceRepository(context: Context) : AppPreferenceRepository {
    private val preferences = context.getSharedPreferences("parent_app_preferences", Context.MODE_PRIVATE)

    override fun getLanguage(): LanguagePreference {
        val storedCode = preferences.getString(KEY_LANGUAGE, null)
        return LanguagePreference.entries.firstOrNull { it.code == storedCode } ?: LanguagePreference.English
    }

    override fun setLanguage(preference: LanguagePreference) {
        preferences.edit().putString(KEY_LANGUAGE, preference.code).apply()
    }

    private companion object {
        const val KEY_LANGUAGE = "language"
    }
}
