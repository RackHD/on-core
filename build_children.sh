#!/bin/bash

# Copyright 2015, EMC, Inc.

if [ "$AUTH_TOKEN" == "XXXXXXXX" ]; then
	echo "You have access!"
else
	echo "ACCESS DENIED"
fi


# Get last child project build number
BUILD_NUM_DHCP=$(curl -s 'https://api.travis-ci.org/repos/RackHD/on-dhcp-proxy/builds' | grep -o '^\[{"id":[0-9]*,' | grep -o '[0-9]' | tr -d '\n')
BUILD_NUM_HTTP=$(curl -s 'https://api.travis-ci.org/repos/RackHD/on-http/builds' | grep -o '^\[{"id":[0-9]*,' | grep -o '[0-9]' | tr -d '\n')
BUILD_NUM_TFP=$(curl -s 'https://api.travis-ci.org/repos/RackHD/on-core/builds' | grep -o '^\[{"id":[0-9]*,' | grep -o '[0-9]' | tr -d '\n')
BUILD_NUM_TASKS=$(curl -s 'https://api.travis-ci.org/repos/RackHD/on-core/builds' | grep -o '^\[{"id":[0-9]*,' | grep -o '[0-9]' | tr -d '\n')


# Restart last child project build
curl -X POST https://api.travis-ci.org/builds/$BUILD_NUM_DHCP/restart --header "Authorization: token "$AUTH_TOKEN
curl -X POST https://api.travis-ci.org/builds/$BUILD_NUM_HTTP/restart --header "Authorization: token "$AUTH_TOKEN
curl -X POST https://api.travis-ci.org/builds/$BUILD_NUM_TFTP/restart --header "Authorization: token "$AUTH_TOKEN
curl -X POST https://api.travis-ci.org/builds/$BUILD_NUM_TASKS/restart --header "Authorization: token "$AUTH_TOKEN


