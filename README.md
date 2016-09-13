# MillionPoiMap_golang
此源代码目录中的文件及文件夹放置于gohome目录下的src中，如下例所示

gohome

    ├──bin

    ├──pkg

    └──src

        ├──ctrip.com

        └──github.com
    
    
golang安装1.5以上版本即可

进入src/ctrip.com/poiservice目录后执行bash run.sh命令启动服务

启动后服务地址为http://localhost:8088


前端聚合执行demo为src/ctrip.com/poiservice/前端聚合/examples/sppeed_test_example.html

后端聚合执行demo为src/ctrip.com/poiservice/后端聚合/map.html(需先启动服务)

其它如选择标记POI坐标或地图上画多边形的工具位于src/ctrip.com/poiservice/地图相关工具


如在运行后端聚合demo时想用图片显示效果，请将ktb_map.js中

self.LOAD_IMG = false;  改为 self.LOAD_IMG = true;

