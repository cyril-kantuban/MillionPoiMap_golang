package main

import (
	rtreego "ctrip.com/common/rtreego"
)

//import (common "ctrip.com/common")
import (
	//"log"
	"net/http"
	//"fmt"
	"github.com/martini-contrib/render"
	"strconv"
	"strings"
)

import (
	geohash "ctrip.com/common/geohash"
)


type RetNode struct {
	//Zoom    int     `json:"zoom"`
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
	//PoiId   int32   `json:"tid"`
	Path    string `json:"pid"`
	PoiName string `json:"name"`
	Total   int32  `json:"total"`
}


func configHandler(w http.ResponseWriter, r *http.Request, render render.Render) {
	r.ParseForm()

	//fmt.Printf("%v,%v", r.Form.Get("lat"), r.Form.Get("lng"))
	w.Header().Add("Access-Control-Allow-Origin", "*")
	log_e := r.Form.Get("log")

	if log_e == "true" {
		log_enabled = true
		render.JSON(200, map[string]interface{}{"result": "set log_enabled: true"})
	} else {
		log_enabled = false
		render.JSON(200, map[string]interface{}{"result": "set log_enabled: false"})
	}

}

func infoHandler(w http.ResponseWriter, r *http.Request, render render.Render){
	r.ParseForm()

	w.Header().Add("Access-Control-Allow-Origin", "*")
	points := strings.Split(r.Form.Get("points"), ",")
	zoom, _ := strconv.Atoi(r.Form.Get("zoom"))

	//fmt.Println(points, zoom)

	if zoom < 1 {
        zoom = 1
    }

    ret := make([]int32, 0)

	for p:=0; p<len(points); p=p+2 {
		lng, _ := strconv.ParseFloat(points[p], 0)
		lat, _ := strconv.ParseFloat(points[p+1], 0)
		
		//根据经纬度及zoom得到地图范围区间
		geoHash := GetCoordsByLatlng(rtreego.Point{lng, lat}, MAX_ZOOM-zoom)
		
		rect, _ := rtreego.NewRect(rtreego.Point{geohash.DecodeBase4(geoHash).SouthWest().Lng(),geohash.DecodeBase4(geoHash).SouthWest().Lat()}, []float64{geohash.DecodeBase4(geoHash).NorthEast().Lng() - geohash.DecodeBase4(geoHash).SouthWest().Lng(), geohash.DecodeBase4(geoHash).NorthEast().Lat() - geohash.DecodeBase4(geoHash).SouthWest().Lat()})
		objs := rmap[MAX_ZOOM-zoom].SearchIntersect(rect)

		for _, obj := range objs {
			rtree_node := obj.(*PoiNode)
			poi_node := rmap_d[rtree_node.Zoom][rtree_node.Key]

			ret = append(ret, poi_node.PoiId)
			//最多返回100个poiID
			if(len(ret) >= 200){
				render.JSON(200, ret)
				return				
			}
		}
	}

	render.JSON(200, ret)
}


func zoomHandler(w http.ResponseWriter, r *http.Request, render render.Render){
	r.ParseForm()

	w.Header().Add("Access-Control-Allow-Origin", "*")
	points := strings.Split(r.Form.Get("points"), ",")
	zoom, _ := strconv.Atoi(r.Form.Get("zoom"))

	//fmt.Println(points, zoom)

	if zoom < 1 {
        zoom = 1
    }

    if zoom > MAX_ZOOM {
        zoom = MAX_ZOOM
    }
    result := 0

    for i:=1; i < MAX_ZOOM-zoom; i++ {
    	lng := 0.0
    	lat := 0.0
    	min_size := 1
    	for p:=0; p<len(points); p=p+2 {
    		lng_tmp, _ := strconv.ParseFloat(points[p], 0)
    		lat_tmp, _ := strconv.ParseFloat(points[p+1], 0)
    		//if lng != 0 || lat != 0 {}
    		lng = lng_tmp
    		lat = lat_tmp

    		//fmt.Println(lng,lat)
    		//根据经纬度及zoom得到地图范围区间
    		geoHash := GetCoordsByLatlng(rtreego.Point{lng, lat}, MAX_ZOOM-zoom)
			//fmt.Println(geohash.DecodeBase4(geoHash).SouthWest())
			//fmt.Println(geohash.DecodeBase4(geoHash).NorthEast())
			
			rect, _ := rtreego.NewRect(rtreego.Point{geohash.DecodeBase4(geoHash).SouthWest().Lng(),geohash.DecodeBase4(geoHash).SouthWest().Lat()}, []float64{geohash.DecodeBase4(geoHash).NorthEast().Lng() - geohash.DecodeBase4(geoHash).SouthWest().Lng(), geohash.DecodeBase4(geoHash).NorthEast().Lat() - geohash.DecodeBase4(geoHash).SouthWest().Lat()})
			objs := rmap[MAX_ZOOM-zoom-i].SearchIntersect(rect)

			result = len(objs)

    		//fmt.Println(MAX_ZOOM-zoom-i,rect,i, result)
    		
    		if result > min_size {
    			render.JSON(200, map[string]interface{}{"data": zoom + i})
    			return
    		}
    	}
    }
    render.JSON(200, map[string]interface{}{"data": int(zoom)})
}

func mapHandler(w http.ResponseWriter, r *http.Request, render render.Render) {
	r.ParseForm()

	//fmt.Printf("%v,%v", r.Form.Get("lat"), r.Form.Get("lng"))
	w.Header().Add("Access-Control-Allow-Origin", "*")
	lat1, _ := strconv.ParseFloat(r.Form.Get("lat1"), 0)
	lng1, _ := strconv.ParseFloat(r.Form.Get("lng1"), 0)
	lat2, _ := strconv.ParseFloat(r.Form.Get("lat2"), 0)
	lng2, _ := strconv.ParseFloat(r.Form.Get("lng2"), 0)

	zoom, _ := strconv.Atoi(r.Form.Get("zoom"))

	if zoom < 1 {
		zoom = 1
	}
	if zoom > MAX_ZOOM {
		zoom = MAX_ZOOM
	}

	var needAppend bool = false
	if lng2 < lng1 {
		lng2 = 180
		needAppend = true
	}

	//point := rtreego.Point{121.5, 38.5}
	point := rtreego.Point{lng1, lat1}
	rect, _ := rtreego.NewRect(point, []float64{lng2 - lng1, lat2 - lat1})
	objs := rmap[MAX_ZOOM-zoom].SearchIntersect(rect)

	ret := make([]map[string]interface{}, 0)
	for _, obj := range objs {
		rtree_node := obj.(*PoiNode)
		poi_node := rmap_d[rtree_node.Zoom][rtree_node.Key]

		if zoom == MAX_ZOOM {
			ret = append(ret, map[string]interface{}{"lat": poi_node.Location[1], "lng": poi_node.Location[0], "tid": poi_node.PoiId, "pid": poi_node.Path, "name": poi_node.PoiName})
		} else {
			ret = append(ret, map[string]interface{}{"lat": poi_node.Location[1], "lng": poi_node.Location[0], "tid": poi_node.PoiId, "pid": poi_node.Path, "name": poi_node.PoiName, "total": poi_node.Total})
		}
	}

	if needAppend {
		lng1 = -180
		lng2, _ = strconv.ParseFloat(r.Form.Get("lng2"), 0)
		rect, _ = rtreego.NewRect(point, []float64{lng2 - lng1, lat2 - lat1})
		objs = rmap[MAX_ZOOM-zoom].SearchIntersect(rect)

		for _, obj := range objs {
			rtree_node := obj.(*PoiNode)
			poi_node := rmap_d[rtree_node.Zoom][rtree_node.Key]

			if zoom == MAX_ZOOM {
				ret = append(ret, map[string]interface{}{"lat": poi_node.Location[1], "lng": poi_node.Location[0], "tid": poi_node.PoiId, "pid": poi_node.Path, "name": poi_node.PoiName})
			} else {
				ret = append(ret, map[string]interface{}{"lat": poi_node.Location[1], "lng": poi_node.Location[0], "tid": poi_node.PoiId, "pid": poi_node.Path, "name": poi_node.PoiName, "total": poi_node.Total})
			}
		}
	}

	render.JSON(200, map[string]interface{}{"data": ret})

	//render.JSON(200, map[string]interface{}{"hello": "world"})

}
