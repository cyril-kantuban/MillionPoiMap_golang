var geocoder;
var place;
var map;
var web_host = '192.168.0.186:9102';
var timeout = 1000;//延时等待时间
var noloc_ids = [];//处理堆栈

function append_log(text, color){
    if(!color){
        color = "black";
    }
    $('#d_content').prepend('<span style="color:' + color +'">' + text + '</span><br/>');
}

//获得编辑距离相似度
function levenshteinDistance(s,t){

    //用n表示s串的长度,m表示t串的长度。
    var n = s.length;
    var m = t.length;

    //如果n＝0，则返回m;如果m=0,则返回n。
    if(n===0) return m;
    if(m===0) return n;

    //创建一个矩阵包括0...m行和0...n列。
    var a = new Array(n+1);
    for(var i = 0;i <=n;i++){
        a[i] = new Array(m+1);
    }

    //初始化矩阵第一行为0...n，第一列为0....m。
    for(i=0;i<=n;i++){
        a[i][0]=i;
    }
    for(i = 1;i<=m;i++){
        a[0][i] = i;
    }

    //遍历s串和t串的每个字符
    for(i = 1;i<=n;i++){
        for(var j=1;j<=m;j++){
            var cost = 0;
            //如果s[ i ]等于t[ j ],则cost为0；否则，代价为1。
            if(s[i] != t[j]){
                cost = 1;
            }
            //将矩阵的d[ i, j ]项设为d[ i-1,j ]+1、d[i,j-1]+1和d[i-1,j-1]+cost的最小值
            a[i][j] = Math.min(a[i-1][j]+1,a[i][j-1]+1,a[i-1][j-1]+cost);
        }
    }
    //返回时将a[n][m]编辑距离转换为相似度，值范围为0.0-1.0
    return 1.0-(a[n][m]/Math.max(m,n));

}

function initialize() {
    //阻止自动刷新
    clearTimeout(auto_reload_handler);
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(40.730885,-73.997383);
    var mapOptions = {
      zoom: 8,
      center: latlng,
      mapTypeId: 'roadmap'
    };
    map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
    place = new google.maps.places.PlacesService(map);

    get_random_data();
}

function get_random_data() {
    $.ajax({
            type: "get",
            url: "http://" + web_host + "/poi/get_noloc_ids",
            dataType: "jsonp",
            async:　false,
            data:{
                length:100
            },
            success: function(data, textStatus){
                for(var i=0; i<data.length; i++){
                    noloc_ids.push(data[i]);
                }
                //noloc_ids.push(1100409);
                process_next_poi_geo();
            }
        });
}


function getLocation(poi_id, poi_path, poi_name, poi_back_name, in_china){
    var tmp_place = {
                        poi_id:poi_id,
                        poi_name:poi_name,
                        match_degree:0,
                        place:null
                    };
    var getDetails = function(results){
        var wait_process_num = results.length;

        for(var i=0;i<results.length;i++){
            var place = results[i];
            //console.log(place.reference);
            var tmp_match_degree = levenshteinDistance(poi_name,place.name);
            if(tmp_match_degree > tmp_place.match_degree){
                tmp_place.match_degree = tmp_match_degree;
                tmp_place.place = place;
            }
            //如果有备用名，使用备用名也进行匹配
            if(poi_back_name !== ""){
                tmp_match_degree = levenshteinDistance(poi_back_name,place.name);
                if(tmp_match_degree > tmp_place.match_degree){
                    tmp_place.match_degree = tmp_match_degree;
                    tmp_place.place = place;
                }
            }
            wait_process_num --;
            if(wait_process_num === 0){
                update_noloc_success(tmp_place.poi_id,
                    tmp_place.place.geometry.location.lng(), tmp_place.place.geometry.location.lat(),
                    tmp_place.match_degree, tmp_place.place.name, in_china);

                //console.log(tmp_place);
                //process_next_poi_geo();
            }
        }
    };
    var address = poi_path + " " + poi_name;
    var geo_func = function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            if (results[0]) {
                getDetails(results);
            } else {
                alert('zero');
                update_noloc_error(poi_id, in_china);
            }
        }else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS){
            update_noloc_error(poi_id, in_china);
        }else if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT){
            location.reload();
        }/*else if (status == google.maps.places.PlacesServiceStatus.REQUEST_DENIED){

        }else if (status == google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR){

        }else if (status == google.maps.places.PlacesServiceStatus.INVALID_REQUEST){

        }*/else{
            append_log("google map数据获取错误：" + status, "red");
            process_next_poi_geo();
        }
  };
  append_log("处理POI：" + poi_id + "，地址：" + address);
  place.textSearch({query:address}, geo_func);
}

//更新获取失败记录
function update_noloc_error(poi_id, in_china){
    $.ajax({
            type: "get",
            url: "http://" + web_host + "/poi/update_noloc/error",
            dataType: "jsonp",
            data:{
                'id': poi_id,
                'in_china': in_china
            },
            async:true,
            success: function(data, textStatus){
                if(data.error){
                    append_log("更新数据出错", "red");
                    process_next_poi_geo();
                }else{
                    append_log("更新成功:2", "blue");
                    process_next_poi_geo();
                }

            }
        });
}

//更新获取成功记录
function update_noloc_success(poi_id, lng, lat, match_degree, match_name, in_china){
    $.ajax({
            type: "get",
            url: "http://" + web_host + "/poi/update_noloc/success",
            dataType: "jsonp",
            data:{
                'id': poi_id,
                'lng': lng,
                'lat': lat,
                'match_degree': match_degree,
                'match_name': match_name,
                'in_china': in_china
            },
            async:true,
            success: function(data, textStatus){
                if(data.error){
                    append_log("更新数据出错", "red");
                    process_next_poi_geo();
                }else{
                    append_log("更新成功:1", "green");
                    process_next_poi_geo();
                }

            }
        });
}

function get_poi_info(poi_id){
    $.ajax({
            type: "get",
            url: "http://" + web_host + "/poi/" + poi_id + "/info",
            dataType: "jsonp",
            async:true,
            success: function(data, textStatus){
                if(data.error){
                    append_log("获取POI数据错误", "red");
                    process_next_poi_geo();
                }else{
                    getLocation(poi_id, data.tag_path, data.tag_name, data.tag_back_name Number(data.in_china));
                }

            }
        });
}

function process_next_poi_geo(){
    //阻止自动刷新
    clearTimeout(auto_reload_handler);
    if (noloc_ids.length > 0){
        append_log("剩余" + noloc_ids.length + "个POI待处理");
        noloc_id = noloc_ids.pop();
        setTimeout(function(){
            auto_reload_handler = setTimeout(function(){location.reload();},100000);
            get_poi_info(noloc_id);
        },timeout);
    }else{
        append_log("获取100个新POI进行处理");
        get_random_data();
    }
}

function loadScript() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    //script.src = "http://ditu.google.cn/maps/api/js?language=chinese&sensor=false&v=3.10&libraries=places&callback=initialize";
    script.src = "https://maps.googleapis.com/maps/api/js?sensor=false&v=3.10&libraries=places&callback=initialize";
    document.body.appendChild(script);
}

var auto_reload_handler = setTimeout(function(){location.reload();},20000);
window.onload = loadScript;
window.onerror = function(msg, file, line){
    location.reload();
};