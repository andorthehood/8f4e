#!/bin/zsh

if command -v deno &> /dev/null
then
    cd src
    deno run --allow-env --allow-net --allow-read devserver/deno.js
    exit
fi