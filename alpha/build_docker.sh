#!/bin/bash -ex

if [ "${VERIFY_DEP}" == "true" ]; then
    COMMIT=$(cat $(ls ../manifest-artifactory/manifest*.json) | jq -r .oncore.commit)
    git config --add remote.origin.fetch +refs/pull/*/head:refs/remotes/origin/pull/*
    git fetch
    git checkout $COMMIT
fi
ls
cp -rf * ../build
