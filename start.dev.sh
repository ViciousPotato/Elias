#!/bin/bash
mkdir log
VCAP_APP_PORT=8080 nohup coffee app.coffee &
