package main

import (
	rtreego "ctrip.com/common/rtreego"
)

import (
	geohash "ctrip.com/common/geohash"
)
//import (common "ctrip.com/common")
import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
	//"encoding/gob"
	"time"
)

//var rtree *rtreego.Rtree //lat,lng   -> POI索引

var MAX_ZOOM int = 18
var MAX_BASE4 int = 20

var max_ids = make([]int, 18)

//var max_id int32 = 0
var rmap_d = make([]map[string]PoiDataNode, 18)
var rmap = make([]*rtreego.Rtree, 18)


func ReBuildAll() {
	//创建18级区块索引
	for zoom := MAX_ZOOM - 1; zoom >= 0; zoom-- {
		rmap_d[zoom] = make(map[string]PoiDataNode)
	}
}

//获取经纬度指定缩放层级时的区域
func GetCoordsByLatlng(latlng rtreego.Point, zoom int) string {
	return geohash.EncodeBase4WithPrecision(latlng[1], latlng[0], MAX_BASE4-zoom)
}

func AddPoi(latlng rtreego.Point, tagId int32, poiName string) {
	//只用做内存计算
	
	for zoom := MAX_ZOOM - 1; zoom >= 0; zoom-- {
		if zoom == 0 {
			poiNode := PoiDataNode{
				Location: latlng,
				Id:       max_ids[zoom],
				PoiId:    tagId,
				PoiName:  poiName,
				Path:	  GetCoordsByLatlng(latlng, zoom),
				Total:    0,
			}
			rmap_d[zoom][latlng.String()] = poiNode
		} else {
			coords := GetCoordsByLatlng(latlng, zoom)
			
			//判断当前层级聚合区域内是否已经有点存在，如果有，更新之前的点重新计算聚合
			_, exists := rmap_d[zoom][coords]

			if !exists {

				poiNode := PoiDataNode{
					Location: latlng,
					Id:       max_ids[zoom],
					PoiId:    tagId,//0,
					PoiName:  poiName,
					Path:	  GetCoordsByLatlng(latlng, zoom),
					Total:    1,
				}

				rmap_d[zoom][coords] = poiNode
			} else {
				v := rmap_d[zoom][coords]
				v.Total++
				rmap_d[zoom][coords] = v
			}
		}
	}

}

func Reindex() {
	//耗时计算
	k := time.Now()

	ReBuildAll()

	inputFile, inputError := os.Open("million_poi.dat") //变量指向os.Open打开的文件时生成的文件句柄
	//inputFile, inputError := os.Open("scenic_spot_poi.dat") 
	
	
	if inputError != nil {
		fmt.Printf("An error occurred on opening the inputfile\n")
		return
	}
	defer inputFile.Close()

	inputReader := bufio.NewReader(inputFile)
	lineCounter := 0
	for {
		inputString, readerError := inputReader.ReadString('\n')
		if readerError == io.EOF {
			break
		}

		columns := strings.Split(strings.TrimRight(inputString, "\n"), "\t")

		lat, _ := strconv.ParseFloat(columns[2], 0)
		lng, _ := strconv.ParseFloat(columns[3], 0)

		//if lng < -180 || lng > 180 || lat < -90 || lat > 90 {
		//	continue
		//}
		//第一象限00((2055行)
		//if lng < -180 || lng > 0 || lat < -90 || lat > 0 {
		//	continue
		//}

		//第二象限01(13905行)
		//if lng < -180 || lng > 0 || lat < 0 || lat > 90 {
		//	continue
		//}

		//第三象限10(8325行)
		//if lng < 0 || lng > 180 || lat < -90 || lat > 0 {
		//	continue
		//}

		//第四象限11(1550000行)
		//if lng < 0 || lng > 180 || lat < 0 || lat > 90 {
		//	continue
		//}


		poiid, _ := strconv.ParseInt(columns[0], 10, 0)

		p := rtreego.Point{lng, lat}

		AddPoi(p, int32(poiid), columns[1])

		lineCounter++
		if lineCounter%10000 == 0 {
			fmt.Printf("%d\n", lineCounter)
		}
		//fmt.Printf("size:%d,depth:%d\n",rtree.Size(),rtree.Depth())
	}
	fmt.Println("finish")

	
	//批量写入数据
	for zoom := MAX_ZOOM - 1; zoom >= 0; zoom-- {
		rmap[zoom] = rtreego.NewTree(2, 0, 15)
		for k, v := range rmap_d[zoom] {
			rmap[zoom].Insert( &PoiNode {
					Location: v.Location,
					Zoom: zoom,
					Key: k,
				})
		}
		fmt.Printf("zoom:%d,size:%d,depth:%d\n", zoom, rmap[zoom].Length(), rmap[zoom].Depth())
		
	}
	fmt.Println(time.Now().Sub(k))
	

}
