#!/bin/bash

#Gets the latest Master build
GetMasterBuild () {

    BUILD=$(curl -s 'https://api.travis-ci.org/repos/RackHD/'$1'/branches/master' | grep -o '{"branch":{"id":[0-9]*,' | grep -o '[0-9]' | tr -d '\n')

    echo $BUILD
}

# Get last child project build number
BUILD_NUM_DHCP=$(GetMasterBuild on-dhcp-proxy)
BUILD_NUM_TASKS=$(GetMasterBuild on-tasks)
BUILD_NUM_TFTP=$(GetMasterBuild on-tftp)
BUILD_NUM_SYSLOG=$(GetMasterBuild on-syslog)

# Restart last child project build
curl -X POST https://api.travis-ci.org/builds/$BUILD_NUM_DHCP/restart --header "Authorization: token "$AUTH_TOKEN
curl -X POST https://api.travis-ci.org/builds/$BUILD_NUM_TASKS/restart --header "Authorization: token "$AUTH_TOKEN
curl -X POST https://api.travis-ci.org/builds/$BUILD_NUM_TFTP/restart --header "Authorization: token "$AUTH_TOKEN
curl -X POST https://api.travis-ci.org/builds/$BUILD_NUM_SYSLOG/restart --header "Authorization: token "$AUTH_TOKEN

#Echo out what builds where restarted
echo Restarted on-dhcp-proxy Build = $BUILD_NUM_DHCP
echo Restarted on-tasks = $BUILD_NUM_TASKS
echo Restarted on-tftp Build = $BUILD_NUM_TFTP
echo Restarted on-syslog Build = $BUILD_NUM_SYSLOG


echo "Note - on-core restarts builds for on-dhcp-proxy, on-tftp, on-syslog, and on-tasks. When on-tasks succeeds, it restarts builds for on-taskgraph and on-http. "
