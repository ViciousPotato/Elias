#!/bin/bash
mkdir -p log
VCAP_APP_PORT=80 nohup coffee app.coffee &
