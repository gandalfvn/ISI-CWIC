#!/bin/bash
mongodump -d bwapp -c genjobsmgr
mongodump -d bwapp -c genstates
mongodump -d bwapp -c screencaps

