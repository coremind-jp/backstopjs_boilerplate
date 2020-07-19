#!/bin/sh

if [ -d ./backstop_data ]; then
    rm -r ./backstop_data
fi

if [ -f ./backstop.json ]; then
    rm ./backstop.json
fi;

backstop init;
bsbl init;

bsbl sync;

bsbl reference;
backstop reference;

bsbl test;
backstop test;

jest ./test/template.test.js;