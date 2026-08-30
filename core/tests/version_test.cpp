#include "klassify/core/version.hpp"

#include <cassert>
#include <string>

int main()
{
    const std::string current_version = klassify::core::version();
    assert(!current_version.empty());
    assert(current_version == "0.1.0-dev");
    return 0;
}
