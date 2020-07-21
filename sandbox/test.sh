#!/bin/sh

if [ -d ./backstop_data ]; then
    rm -r ./backstop_data
fi

if [ -f ./backstop.json ]; then
    rm ./backstop.json
fi;

backstop init;

bsbl init;

cp -rf $(cd $(dirname $0); pwd)/test_scenario/boilerplate $(cd $(dirname $0); pwd)/backstop_data

bsbl sync;

bsbl test;

jest;
