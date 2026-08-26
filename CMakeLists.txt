cmake_minimum_required(VERSION 3.20)

project(
  AISchoolPlatform
  VERSION 0.1.0
  DESCRIPTION "Foundation for the AI School Platform client ecosystem"
  LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(CTest)

add_subdirectory(core)

option(AI_SCHOOL_PLATFORM_BUILD_DESKTOP "Build the Qt desktop application when Qt is available" ON)

if(AI_SCHOOL_PLATFORM_BUILD_DESKTOP)
  add_subdirectory(apps/desktop)
endif()
