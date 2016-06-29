#!/bin/bash
mkdir log
VCAP_APP_PORT=8080 nodejs app.js &
