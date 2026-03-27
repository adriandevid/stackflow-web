#!/bin/sh

apk add apache2-utils && htpasswd -Bc -b /auth/htpasswd myuser denis12#!

set -e

case "$1" in
    *.yaml|*.yml) set -- registry serve "$@" ;;
    serve|garbage-collect|help|-*) set -- registry "$@" ;;
esac

exec "$@"