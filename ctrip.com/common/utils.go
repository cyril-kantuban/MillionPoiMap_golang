package common

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"ctrip.com/common/rtreego"
	"net/http"
	"sort"
	"time"
)

type PoiNode struct {
	Location rtreego.Point
	Zoom int32
	Key string
	//PoiId  int32
	//PoiName string
	//wormhole chan int
}

var tol = 0.000000001

func (s *PoiNode) Bounds() *rtreego.Rect {
	// define the bounds of s to be a rectangle centered at s.location
	// with side lengths 2 * tol:
	return s.Location.ToRect(tol)
}

type List []int32
type TupleList [][]int32

// List Sort Interface, Methods required by sort.Interface.
func (s List) Len() int {
	return len(s)
}
func (s List) Less(i, j int) bool {
	return s[i] < s[j]
}
func (s List) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

// TupleList Sort, Methods required by sort.Interface.
func (s TupleList) Len() int {
	return len(s)
}
func (s TupleList) Less(i, j int) bool {
	return s[i][1] < s[j][1]
}
func (s TupleList) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func SortSet(list List) (ret List) {
	sort.Sort(list)
	var last_val int32
	for _, val := range list {
		if val != last_val {
			ret = append(ret, val)
			last_val = val
		}
	}

	return
}

func Set(list []int32) (result []int32) {

	seen := map[int32]int32{}
	for _, val := range list {
		if _, ok := seen[val]; !ok {
			result = append(result, val)
			seen[val] = val
		}
	}
	return

}

/* 两个集合取并集 */
func SetOr(s1 []int32, s2 []int32) []int32 {
	r := make([]int32, len(s1)+len(s2))
	index, i, j := 0, 0, 0
	for {
		f1 := i < len(s1)
		f2 := j < len(s2)
		if f1 && f2 {
			x, y := s1[i], s2[j]
			switch {
			case x == y:
				r[index] = x
				index++
				i++
				j++
			case x < y:
				r[index] = x
				index++
				i++
			default:
				r[index] = y
				index++
				j++
			}
		} else if f1 {
			for _, v := range s1[i:] {
				r[index] = v
				index++
			}
			break
		} else {
			for _, v := range s2[j:] {
				r[index] = v
				index++
			}
			break
		}
	}
	return r[:index]
}

/* 两个集合取交集 */
func SetAnd(s1 []int32, s2 []int32) []int32 {
	size := len(s1)
	if size < len(s2) {
		size = len(s2)
	}
	r := make([]int32, size)
	index, i, j := 0, 0, 0
	for {
		if i >= len(s1) || j >= len(s2) {
			break
		}
		x, y := s1[i], s2[j]
		switch {
		case x == y:
			r[index] = x
			index++
			i++
			j++
		case x < y:
			i++
		default:
			j++
		}
	}
	return r[:index]
}

/* 结果集排序 */
func SortResult(data TupleList) TupleList {
	sort.Sort(data)
	return data
}

func GetDayByTime(date time.Time) int32 {
	return int32(date.Sub(time.Date(1900, 1, 1, 0, 0, 0, 0, time.UTC)).Hours() / 24)
}

func GetTimeByDay(day int32) time.Time {
	return time.Date(1900, 1, 1, 0, 0, 0, 0, time.UTC).AddDate(0, 0, int(day))
}

func HttpGet(url string) string {
	client := &http.Client{}

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Connection", "close")
	req.Header.Set("Accept", "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Charset", "utf-8")
	//req.Header.Set("Accept-Encoding", "gzip,deflate,sdch")
	req.Header.Set("Accept-Language", "zh-CN,zh;")
	req.Header.Set("Cache-Control", "max-age=0")
	req.Header.Set("Connection", "keep-alive")
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}

	if resp.StatusCode == 200 {
		body, _ := ioutil.ReadAll(resp.Body)
		bodystr := string(body)

		return bodystr
	}
	return ""
}

func FromJson(json_str string) map[string]interface{} {
	var r interface{}
	err := json.Unmarshal([]byte(json_str), &r)
	if err != nil {
		return nil
	}

	json, ok := r.(map[string]interface{})
	if ok {
		return json
	} else {
		return nil
	}
}
