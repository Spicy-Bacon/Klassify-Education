add_library(SchoolPlatformCore
  src/version.cpp
)

add_library(AISchoolPlatform::Core ALIAS SchoolPlatformCore)

target_include_directories(SchoolPlatformCore
  PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_compile_features(SchoolPlatformCore PUBLIC cxx_std_20)

if(BUILD_TESTING)
  add_executable(SchoolPlatformCoreTests
    tests/version_test.cpp
  )

  target_link_libraries(SchoolPlatformCoreTests
    PRIVATE
      AISchoolPlatform::Core
  )

  add_test(NAME SchoolPlatformCoreTests COMMAND SchoolPlatformCoreTests)
endif()
