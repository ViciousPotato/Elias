#!/bin/bash

# Assume you have cloned this repository

# Instal mongodb
# sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
# echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
# sudo apt-get update
# apt-get install mongodb-10gen=2.2.3
sudo apt-get install mongodb

# Install nodejs
# sudo add-apt-repository ppa:chris-lea/node.js
# sudo apt-get update
sudo apt-get install python-software-properties python g++ make nodejs graphicsmagick npm pandoc texlive

# Install coffee globally
sudo npm install -g coffee-script

# Maybe we need to support installing without clone first

# git clone https://github.com/ViciousPotato/Elias.git

npm install
