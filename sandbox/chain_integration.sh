#!/bin/sh

if [ -d ./backstop_data ]; then
    rm -r ./backstop_data
fi

if [ -f ./backstop.json ]; then
    rm ./backstop.json
fi;

node ./integration_example.js init;

node ./integration_example.js sync;

node ./integration_example.js reference;

node ./integration_example.js test;

jest ./test/template.test.js;