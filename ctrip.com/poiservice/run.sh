#!/bin/sh
#重启服务
echo ">> stop service…"
ps -ef | grep poiservice| grep -v grep | awk '{print $2}' | xargs kill -9
sleep 1
echo ">> start service…"

go build
mv poiservice ../../../bin/
../../../bin/poiservice

