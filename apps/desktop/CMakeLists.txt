find_package(Qt6 QUIET COMPONENTS Widgets)

if(Qt6_FOUND)
  set(AI_SCHOOL_PLATFORM_QT_PACKAGE Qt6)
else()
  find_package(Qt5 QUIET COMPONENTS Widgets)
  if(Qt5_FOUND)
    set(AI_SCHOOL_PLATFORM_QT_PACKAGE Qt5)
  endif()
endif()

if(AI_SCHOOL_PLATFORM_QT_PACKAGE)
  add_executable(ai_school_platform_desktop
    src/main.cpp
  )

  target_link_libraries(ai_school_platform_desktop
    PRIVATE
      AISchoolPlatform::Core
      ${AI_SCHOOL_PLATFORM_QT_PACKAGE}::Widgets
  )

  target_compile_features(ai_school_platform_desktop PRIVATE cxx_std_20)
else()
  message(STATUS "Qt Widgets was not found; skipping desktop application target.")
endif()
