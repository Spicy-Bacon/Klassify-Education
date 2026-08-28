package com.example.aischoolplatform.dev.parent.service

import com.example.aischoolplatform.dev.parent.data.DevelopmentParentRepository

object DevelopmentParentComposition {
    fun createService(): ParentAppService {
        val repository = DevelopmentParentRepository()
        return ParentAppService(repository, repository)
    }
}
