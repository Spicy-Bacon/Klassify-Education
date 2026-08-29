find_package(Qt6 QUIET COMPONENTS Widgets)

if(Qt6_FOUND)
  set(KLASSIFY_QT_PACKAGE Qt6)
else()
  find_package(Qt5 QUIET COMPONENTS Widgets)
  if(Qt5_FOUND)
    set(KLASSIFY_QT_PACKAGE Qt5)
  endif()
endif()

if(KLASSIFY_QT_PACKAGE)
  add_executable(klassify_education_desktop
    src/main.cpp
  )

  target_link_libraries(klassify_education_desktop
    PRIVATE
      KlassifyEducation::Core
      ${KLASSIFY_QT_PACKAGE}::Widgets
  )

  target_compile_features(klassify_education_desktop PRIVATE cxx_std_20)
else()
  message(STATUS "Qt Widgets was not found; skipping desktop application target.")
endif()
