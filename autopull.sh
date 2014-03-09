#!/bin/bash
while true
do
    RESTART="yes"

    for l in `git pull github master`; do
        if [ l = "Already up-to-date." ]
        then
            RESTART="no"
        fi
    done

    if [ RESTART = "yes" ]
    then
        echo "Restarting app"
        killall node
        ./start.sh
    fi
    
    sleep 60
done
