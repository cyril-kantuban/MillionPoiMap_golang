package main


import (
	geohash "ctrip.com/common/geohash"
)

import (
	"net/http"
	//"ctrip.com/poiservice"
	"github.com/go-martini/martini"
	"runtime"
	//"log"
	"fmt"
	"github.com/martini-contrib/render"
	"time"
)

var log_enabled bool = false

func init() {
	fmt.Println("NumCPU:", runtime.NumCPU())
	fmt.Println("GOMAXPROCS:", runtime.GOMAXPROCS(-1))
	runtime.GOMAXPROCS(runtime.NumCPU()) //设置cpu的核的数量，从而实现高并发

}

func main() {
	//fmt.Println(geohash.EncodeWithPrecision(33.146876,121.123422,22))
	//fmt.Println(geohash.EncodeWithPrecision(33.146876,121.123422,9))
	//fmt.Println(geohash.Decode(geohash.EncodeWithPrecision(33.146876,121.123422,8)).NorthEast())
	
	//fmt.Println(geohash.EncodeBase4WithPrecision(33.146876,121.123422,22))
	fmt.Println(geohash.EncodeBase4WithPrecision(33.146876,121.123422,20))
	fmt.Println(geohash.DecodeBase4(geohash.EncodeBase4WithPrecision(33.146876,121.123422,20)).NorthEast())
	
	//fmt.Println(geohash.DecodeBase4(geohash.EncodeBase4WithPrecision(33.146876,121.123422,8)))

	//异步加载数据
	go Reindex()

	m := MyClassic()
	m.Get(`/map`, func(w http.ResponseWriter, r *http.Request, render render.Render) {
		if log_enabled == true {
			k := time.Now()
			mapHandler(w, r, render)
			fmt.Println("query duration:", time.Now().Sub(k))	
		} else {
			mapHandler(w, r, render)
		}
	})

	m.Get(`/map/zoom`, func(w http.ResponseWriter, r *http.Request, render render.Render) {
		if log_enabled == true {
			k := time.Now()
			zoomHandler(w, r, render)
			fmt.Println("zoom duration:", time.Now().Sub(k))	
		} else {
			zoomHandler(w, r, render)
		}
	})

	m.Get(`/map/info`, func(w http.ResponseWriter, r *http.Request, render render.Render) {
		if log_enabled == true {
			k := time.Now()
			infoHandler(w, r, render)
			fmt.Println("info duration:", time.Now().Sub(k))	
		} else {
			infoHandler(w, r, render)
		}
	})


	m.Get(`/map/config`, func(w http.ResponseWriter, r *http.Request, render render.Render) {
		configHandler(w, r, render)
	})

/*
	m.Get(`/map`, func(r render.Render) {
		r.HTML(200, "map", "map")
	})
*/
	m.Get(`/`, func(r render.Render) {
		r.HTML(200, "hello", "world")
	})

	m.RunOnAddr(":8088")
}

//自定义处理类
func MyClassic() *martini.ClassicMartini {
	r := martini.NewRouter()
	m := martini.New() //
	//m.Use(martini.Logger()) // 启用日志
	m.Use(martini.Recovery())       // 捕获 panic
	m.Use(martini.Static("public")) // 静态文件
	m.Use(render.Renderer(render.Options{
		Charset:    "UTF-8",
		Directory:  "template/html",
		Extensions: []string{".tpl", ".html"},
	}))
	m.Action(r.Handle) // 最后一个其实是执行了默认的路由机制
	return &martini.ClassicMartini{m, r}
}
