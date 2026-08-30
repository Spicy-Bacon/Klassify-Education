add_library(KlassifyCore
  src/version.cpp
)

add_library(KlassifyEducation::Core ALIAS KlassifyCore)

target_include_directories(KlassifyCore
  PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_compile_features(KlassifyCore PUBLIC cxx_std_20)

if(BUILD_TESTING)
  add_executable(KlassifyCoreTests
    tests/version_test.cpp
  )

  target_link_libraries(KlassifyCoreTests
    PRIVATE
      KlassifyEducation::Core
  )

  add_test(NAME KlassifyCoreTests COMMAND KlassifyCoreTests)
endif()
