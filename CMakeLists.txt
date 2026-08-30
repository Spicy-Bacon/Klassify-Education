cmake_minimum_required(VERSION 3.20)

project(
  KlassifyEducation
  VERSION 0.1.0
  DESCRIPTION "Foundation for the Klassify client ecosystem"
  LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(CTest)

add_subdirectory(core)

option(KLASSIFY_BUILD_DESKTOP "Build the Qt desktop application when Qt is available" ON)

if(KLASSIFY_BUILD_DESKTOP)
  add_subdirectory(apps/desktop)
endif()
