package main

import (
	rtreego "ctrip.com/common/rtreego"
)

type PoiDataNode struct {
	Id       int
	Location rtreego.Point `json:"loc"`
	PoiId    int32         `json:"id"`
	PoiName  string        `json:"name"`
	Path     string        `json:"path"`
	Total    int32         `json:"total"`
	//wormhole chan int
}

type PoiNode struct {
	Location rtreego.Point
	Zoom int
	Key string
}

var tol = 0.000000001

func (s *PoiNode) Bounds() *rtreego.Rect {
	// define the bounds of s to be a rectangle centered at s.location
	// with side lengths 2 * tol:
	return s.Location.ToRect(tol)
}
