#!/bin/bash
export MONGO_URL=mongodb://localhost:27017/bwapp
nohup meteor --production --port 4000 &