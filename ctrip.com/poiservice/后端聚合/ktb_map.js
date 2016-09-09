(function($){

var ktb_map = function(config){
    this.init(config);
};

window.ktb_map = ktb_map;

var MAX_ZOOM = 18;

ktb_map._default = {
    map_id: 'map-canvas',
    type: '',
    id: 0,
    params: '',
    bounds: [-180, -90, 180, 90],
    enable_smart_scrollwheel: true,
    enable_scrollwheel: true,
    enable_zoomControl: true,
    enable_mapTypeControl: true,
    enable_draggable: true,
    enable_info_box: true,
    info_box_click_auto_zoom: true,
    onMapClick: function(){},
    onPOIClick: function(){},
    onInfoboxClick: function(/*zoom, points, params*/){},
    onAutoZoomClick: function(/*zoom, points, params*/){}
};

$.extend(ktb_map.prototype, {
    init: function(config){
        var self = this;
        config = $.extend({}, ktb_map._default, config);

        self.map_id = config.map_id;
        self.type = config.type;
        self.id = config.id;
        self.params = config.params;
        self.bounds = config.bounds;
        self.onInfoboxClick = config.onInfoboxClick;
        self.onAutoZoomClick = config.onAutoZoomClick;
        self.onMapClick = config.onMapClick;
        self.onPOIClick = config.onPOIClick;

        self.enable_info_box = config.enable_info_box;
        self.info_box_click_auto_zoom = config.info_box_click_auto_zoom;
        self.map_options = {scrollwheel:config.enable_scrollwheel,
            zoomControl:config.enable_zoomControl,
            mapTypeControl:config.enable_mapTypeControl,
            draggable:config.enable_draggable
        };
        self.enable_smart_scrollwheel = config.enable_smart_scrollwheel;

        self.markersArray = new $.Hashtable();
        self.gmap = null;
        //self.GROUP_UNIT_SIZE = 0.000045;

        self.GROUP_UNIT_SIZE = 0.000045;
        self.LOAD_DELAY_MS = 20;
        self.LOAD_IMG = true;
        self.infoboxArray = new $.Hashtable();
        self.info_box = null;
        self.last_zoom = 0;
        self.last_bounds = null;
        self.origin_zoom = 0;
        self.location_pid = '';

        self.removeInfobox_handle = null;
        self.scrollwheel_handle = null;

        self.init_map();
    },
    remove_infobox: function(fadeOut){
        if (this.info_box){
            if(fadeOut && fadeOut === true){
                this.info_box.removeFadeOut();
            }else{
                this.info_box.remove();
            }
            this.info_box = null;
        }
    },
    poi_location: function(tid){
        var self = this;
        //自动缩放
        $.ajax({
            url:"/j/" + self.type + "/map/location",
            type:"get",
            cache:false,
            data:{
                key:self.id,
                zoom: self.last_zoom,
                //points: lng + ',' + lat,
                tid: tid,
                params: self.params
            },
            error:function(){
                //alert(data);
            },
            success:function(data){
                if(data){
                    if(!data.error){
                        var point = new google.maps.LatLng(data.lat,data.lng);
                        self.location_pid = data.pid;
                        if(point.toString() === self.gmap.getCenter().toString() &&
                            data.zoom+2 === self.gmap.getZoom()){
                            self.reload_data();
                        }else{
                            self.gmap.setCenter(point);
                            self.gmap.setZoom(data.zoom+2);
                        }
                    }
                }
            }
        });
    },
    auto_zoom: function(marker){
        var self = this;
        //自动缩放
        $.ajax({
            //url:"/j/" + self.type + "/map/zoom",
            url:"http://localhost:8088/map/zoom",
            type:"get",
            cache:false,
            data:{
                key:self.id,
                zoom: self.last_zoom,
                points: marker.getPoints(),
                params: self.params
            },
            error:function(){
                //alert(data);
            },
            success:function(data){
                self.gmap.setCenter(marker.position);
                self.gmap.setZoom(data.data+2);

                if(self.onAutoZoomClick) {
                    self.onAutoZoomClick(self.last_zoom, marker.getPoints(), self.params);
                }
            }
        });
    },
    add_infobox_events: function(){
        var self = this;
        var remove_infobox_FadeOut = function(){
            self.remove_infobox(true);
        };

        var InfoBoxHover = function() {
            if(self.removeInfobox_handle){
                clearTimeout(self.removeInfobox_handle);
                self.removeInfobox_handle = null;
            }
        };

        var InfoBoxLeave = function() {
            if(self.removeInfobox_handle){
                clearTimeout(self.removeInfobox_handle);
                self.removeInfobox_handle = null;
            }
            self.removeInfobox_handle = setTimeout(remove_infobox_FadeOut, 200);
            //remove_infobox_FadeOut();
        };

        var InfoBoxPOIClick = function(e){
            var marker = this.marker;
            if(this.poi_total > 1){
                if(marker){
                   self.auto_zoom(marker);
                }
            }else if(this.poi_total === 1){
                window.open(this.poi_url);
            }
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
        };

        var InfoBoxClick = function(e){
            var marker = this.marker;
            if(marker){
                if (marker.getTotal() > 1){
                    if(self.info_box_click_auto_zoom){
                        self.auto_zoom(marker);
                    }
                }else{
                    if(this.poi_url != ''){
                        window.open(this.poi_url);
                    }
                    self.gmap.panTo(marker.position);
                }
                if(self.onInfoboxClick) {
                    self.onInfoboxClick(this.poi_url);
                }
            }
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
        };

        google.maps.event.addListener(self.info_box, "click", InfoBoxClick);
        google.maps.event.addListener(self.info_box, "poi_click", InfoBoxPOIClick);
        google.maps.event.addListener(self.info_box, "hover", InfoBoxHover);
        google.maps.event.addListener(self.info_box, "leave", InfoBoxLeave);

    },
    remove_all_infobox: function(){
        var self = this;
        if(self.infoboxArray){
            $(self.infoboxArray.getKeys()).each(function(i,key){
                var item = self.infoboxArray.get(key);
                if (item) {
                    item.setMap(null);
                    item.remove();
                    self.infoboxArray.remove(key);
                }
            });
        }
        self.info_box = null;
    },
    add_infobox: function(marker, panToMarker){
        var self = this;
        if(!self.enable_info_box){
            return;
        }

        if(this.removeInfobox_handle){
            clearTimeout(this.removeInfobox_handle);
            this.removeInfobox_handle = null;
        }

        if(this.info_box){
            if(this.info_box.marker.pid === marker.pid){
                return;
            }
            this.remove_all_infobox();
            //this.remove_infobox();
        }

        var left = marker.getProjection().fromLatLngToDivPixel(this.last_bounds.getNorthEast()).x;
        var right = marker.getProjection().fromLatLngToDivPixel(this.last_bounds.getSouthWest()).x;

        var center = (left + right) / 2;
        var left_side = false;
        if(marker.getProjection().fromLatLngToDivPixel(marker.position).x > center){
            left_side = true;
        }

        this.info_box = new poiinfobox({
                position : marker.position,
                marker : marker,
                left_side : left_side,
                map : this.gmap
        });
        self.infoboxArray.add(marker.pid, this.info_box);


        self.add_infobox_events(this.info_box);


        if(panToMarker) {
            this.gmap.panTo(marker.position);
        }

        var img='';
        self.info_box.setData({
                                pic:'',
                                pin_total:marker.total,
                                poi_name:marker.poi_name,
                                poi_url:''
                            });

        $.ajax({
            url:"http://localhost:8088/map/info",
            //url:"/j/" + self.type + "/map/info",
            type:"get",
            cache:false,
            data:{
                key:self.id,
                zoom:self.last_zoom,
                points:marker.getPoints(),
                params: self.params
            },
            error:function(){
              //alert(data);
            },
            success:function(data){
                async.map(data, self.getGSImage, function(err, result){    
                    $(result).each(function(i){

                        var item = result[i];
                        
                        $(item.getKeys()).each(function(i,key){
                            img = item.get(key);
                            
                        });
                    });
                        
                    async.map([marker.tid], self.getGSPOIInfo, function(err, purl){
                        
                        if(self.info_box){
                            self.info_box.setData({
                                pic:img,
                                pin_total:marker.total,
                                poi_name:marker.poi_name,
                                poi_url:purl[0]
                            });
                        }
                    }); 
                    
                    
                });


                
            }
        });
        
    },
    add_marker_events: function(marker){
        var self = this;

        var remove_infobox_FadeOut = function(){
            //self.remove_infobox(true);
            self.remove_all_infobox();
        };

        var POIHover = function(e) {
            //debugger;
            self.add_infobox(this, false);
            if(e){
                e.cancelBubble = true;
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
            }
        };

        var POIClick = function(e) {
            if (isMobile.any()){
                self.add_infobox(this, true);
            }else{
                if (this.getTotal() > 1){
                    self.auto_zoom(this);
                }else{
                    self.gmap.panTo(this.position);
                    if(self.onInfoboxClick) {
                        self.onInfoboxClick(self.last_zoom, this.getPoints(), self.params);
                    }
                }
            }
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault){
                e.preventDefault();
            }

            if (self.onPOIClick){
                self.onPOIClick(this);
            }
        };

        var POILeave = function() {
            if(self.removeInfobox_handle){
                clearTimeout(self.removeInfobox_handle);
                self.removeInfobox_handle = null;
            }
            self.removeInfobox_handle = setTimeout(remove_infobox_FadeOut, 200);
            //self.remove_all_infobox();
        };
        google.maps.event.addListener(marker, "click", POIClick);
        google.maps.event.addListener(marker, "hover", POIHover);
        google.maps.event.addListener(marker, "leave", POILeave);


    },
    add_marker: function(data) {
        var self = this;
        var lat = data.lat;
        var lng = data.lng;
        var pid = data.pid;
        var poi_name = data.name;
        var total = data.total;
        var ext_data = data.ext_data;
        var tid = data.tid;
        var img = data.img;
        var marker = this.markersArray.get(pid);
        var i = 0, key;

        if(marker){
            marker.exist = true;
            marker.ext_data=ext_data;
            if(marker.pid === self.location_pid){
                google.maps.event.trigger(marker, 'hover');
                self.location_pid = '';
            }
            return;
        }
        //判断是否有一个点是当前节点的父节点或子节点，且位置相同，

        var parent_key = null;
        //如果有父节点（放大，从父节点分裂）
        var keys = this.markersArray.getKeys();
        for(i=0;i<keys.length;i++){
            key = keys[i];
            if(this.markersArray.get(key).isParentOf(pid)){
                parent_key = key;
                break;
            }
        }

        if(parent_key){
            var parentMarker = this.markersArray.get(parent_key);
            parentMarker.exist = true;
            parentMarker.stopMove();
            
            marker = this.point_split(parentMarker, pid, tid, poi_name, img, lat, lng, total, ext_data);
            if(parentMarker.getTotal()>1){
                parentMarker.fadeout();
            }
            
        }else{
            var beginLatlng = new google.maps.LatLng(lat,lng);
            var endLatlng = new google.maps.LatLng(lat,lng);

            marker = new poimarker({
                beginLatlng: beginLatlng,
                endLatlng: endLatlng,
                position: endLatlng,
                lat:lat,
                lng:lng,
                total:total,
                map: this.gmap,
                pid: pid,
                tid: tid,
                poi_name: poi_name,
                img: img,
                ext_data: ext_data,
                exist: true,
                isEnd: false,
                //isHide: true,
                onComplete: function(){}
            });
        }

        if(marker){
            //如果有子节点（聚合，归拢至父节点）
            var child_keys = [];
            for(i=0;i<keys.length;i++){
                key = keys[i];
                if(marker.isParentOf(key)){
                    child_keys.push(key);
                }
            }
            if(child_keys.length>0){
                for(i=0;i<child_keys.length;i++){
                    key = child_keys[i];
                    var childMarker = self.markersArray.get(key);
                    childMarker.exist = true;
                    self.point_merge(marker, childMarker, lat, lng);
                }
            }else{
                marker.show();
                //marker.setMap(this.gmap);
            }
        }
        this.add_marker_events(marker);
        this.markersArray.add(pid, marker);
        if(marker){
            if(marker.pid === self.location_pid){
                google.maps.event.trigger(marker, 'hover');
                self.location_pid = '';
            }
        }
    },
    point_split: function(parentMarker, pid, tid, poi_name, img, lat, lng, total, ext_data){
        var self = this;
        var beginLatlng = parentMarker.position;
        var endLatlng = new google.maps.LatLng(lat,lng);
        //只有在屏幕范围内的点才有移动动画效果
        var marker_isEnd = self.last_bounds.contains(endLatlng);
        var marker_isHide = false;
        if(marker_isEnd === false){
            marker_isHide = true;
            //console.log(marker_isEnd);
        }
        var marker = new poimarker({
            beginLatlng: beginLatlng,
            endLatlng: endLatlng,
            position: endLatlng,
            lat:lat,
            lng:lng,
            total:total,
            map: this.gmap,
            ext_data: ext_data,
            tid: tid,
            pid: pid,
            poi_name: poi_name,
            img: img,
            exist: true,
            onComplete : function(){
                var id = parentMarker.pid;
                if(self.markersArray.containsKey(id)){
                    self.markersArray.remove(id);
                    parentMarker.setMap(null);
                    parentMarker.remove();
                }
            },
            isHide: marker_isHide,
            isEnd: marker_isEnd
        });

        return marker;
    },
    point_merge: function(marker, childMarker, lat, lng){
        var self = this;
        var endLatlng = new google.maps.LatLng(lat, lng);

        childMarker.moveTo(endLatlng,function(){
            var id = childMarker.pid;
            if(self.markersArray.containsKey(id)){
                self.markersArray.get(id).fadeout();
                self.markersArray.get(id).setMap(null);
                self.markersArray.get(id).remove();
                self.markersArray.remove(id);
            }
            //marker.fadein();
        });

    },
    initExistOverlays: function(){
        if(this.markersArray){
            $(this.markersArray.getValues()).each(function(i,item){
                if (item){
                    item.stopMove();
                    item.exist = false;
                    item.splitRefCount = null;
                }
            });
        }
    },
    deleteNotExistOverlays: function(){
        var self = this;

        if(self.markersArray){
            $(self.markersArray.getKeys()).each(function(i,key){
                var item = self.markersArray.get(key);
                if (item && !item.exist) {
                    item.setMap(null);
                    item.remove();
                    self.markersArray.remove(key);
                }
            });
        }
    },
    cluster_point: function(data){
        var z = this.last_zoom;

        var i = 0;

        if(z < 1) { z = 1; }

        var cluster_size = this.GROUP_UNIT_SIZE*(Math.pow(2,MAX_ZOOM-z));

        for(i = 0; i < data.length; i++){
            for(var j = i+1; j < data.length; j++){
                if(data[i].need_del || data[i].pid === this.location_pid || data[j].pid === this.location_pid) {
                    break;
                }

                if(this.getDistanceBetweenPoint(data[i].lng, data[i].lat, data[j].lng, data[j].lat) < cluster_size){
                    if(parseInt(data[i].pid.substring(data[i].pid.lastIndexOf(',')+1,data[i].pid.length), 10) <
parseInt(data[j].pid.substring(data[j].pid.lastIndexOf(',')+1,data[j].pid.length), 10)
                        ){
                        data[j].need_del = true;
                        if(!data[i].ext_data) {
                            data[i].ext_data = [];
                        }

                        data[i].ext_data.push(data[j]);
                    }else{
                        data[i].need_del = true;
                        if(!data[j].ext_data) {
                            data[j].ext_data = [];
                        }

                        data[j].ext_data.push(data[i]);
                    }
                    //break;
                }
            }
        }
        var data2=[];

        for(i = 0 ; i < data.length; i++){
            if(!data[i].need_del){
                data2.push(data[i]);
            }
        }
        return data2;
    },
    getDistanceBetweenPoint: function(lng1, lat1, lng2, lat2){
        return Math.sqrt(Math.pow(lng1 - lng2,2) + Math.pow(lat1 - lat2,2));
    },
    fit_bounds:function(){
        var max_bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(this.bounds[1],this.bounds[0]),
            new google.maps.LatLng(this.bounds[3],this.bounds[2])
        );

        //fitBounds
        if( this.bounds[2] - this.bounds[0] === 0/*< 0.125*/ && this.bounds[3] - this.bounds[1] === 0/*< 0.03*/){
            this.gmap.setCenter(max_bounds.getCenter());
            this.gmap.setZoom(13);
        }
        else{
            this.gmap.fitBounds(max_bounds);
        }
    },
    reinit_map:function(id, params, bounds){
        this.bounds = bounds;
        this.id = id,
        this.params = params,
        this.deleteAllMarkers();

        this.fit_bounds();
        this.reload_data();
    },
    reload_data:function(){
        var self = this;
        self.last_zoom = self.gmap.getZoom()-(self.gmap.maxZoom-MAX_ZOOM);
        //console.log(self.gmap.getZoom());

        self.last_bounds = self.gmap.getBounds();
        var lat1 = self.last_bounds.getSouthWest().lat();
        var lng1 = self.last_bounds.getSouthWest().lng();
        var lat2 = self.last_bounds.getNorthEast().lat();
        var lng2 = self.last_bounds.getNorthEast().lng();

        if(lng2 > 180 || lng2 < lng1){
            lng1 = -180;
            lng2 = 180;
        }

        var width = lng2 - lng1;
        var height = lat2 - lat1;

        //lng1 = lng1-width/2;
        //lat1 = lat1-height/2;
        //lng2 = lng2+width/2;
        //lat2 = lat2+height/2;

        if(lng1<-180) { lng1=-180; }
        if(lng2> 180) { lng2= 180; }
        if(lat1<-90) { lat1= -90; }
        if(lat2> 90) { lat2=  90; }
        

        if(self.markersArray){
            $(self.markersArray.getKeys()).each(function(i,key){
                var item = self.markersArray.get(key);
                if (item){
                    var point = new google.maps.LatLng(item.lat,item.lng);
                    if (!self.last_bounds.contains(point)){
                        item.setMap(null);
                        item.remove();
                        self.markersArray.remove(key);
                    }
                }
            });
        }
        
        var zoom = self.last_zoom;
        $.ajax({
            //url:"/j/" + self.type + "/map",
            url:"http://localhost:8088/map",
            type:"get",
            cache:false,
            data:{
                key:self.id,
                zoom:zoom,
                lng1:lng1,
                lat1:lat1,
                lng2:lng2,
                lat2:lat2,
                params: self.params
            },
            error:function(){
              //alert(data);
            },
            success:function(data){
                self.initExistOverlays();
                data = data.data;

                if (!data) { return; }
                
                var poi_ids_array = [];
                var counter = 0;

                var poi_ids = [];
                for (var tt=0;tt < data.length; tt++){
                    if (counter > 100){
                        counter = 0;
                        poi_ids_array.push(poi_ids);
                        poi_ids = [];
                    }
                    
                    poi_ids.push(data[tt].tid);
                    counter ++;        
                }
                if (poi_ids.length > 0){
                    poi_ids_array.push(poi_ids);
                }

                if (self.LOAD_IMG === true){
                    async.map(poi_ids_array, self.getGSImage, function(err, result){
                        //alert(result.length);
                        var image_hash = new $.Hashtable();

                        $(result).each(function(i){
                            var item = result[i];
                            
                            $(item.getKeys()).each(function(i,key){
                                var img_url = item.get(key);

                                if (img_url) {
                                    //console.log(img_url);
                                    image_hash.add(key, img_url);
                                }
                            });
                        });


                        for(var i=0;i<data.length;i++){
                            if(image_hash.containsKey(data[i].tid)){
                                data[i].img = image_hash.get(data[i].tid)
                            }else{
                                data[i].img = '';
                            }
                        }

                        //data = self.cluster_point(data);

                        for (var i = 0, l = data.length; i < l; i++) {
                            self.add_marker(data[i]);
                        }

                        self.deleteNotExistOverlays();
                        console.log("当前marker数：" + self.markersArray.size());

                    });

                } else {
                    for(var i=0;i<data.length;i++){
                        data[i].img = '';
                    }

                    //data = self.cluster_point(data);

                    for (var i = 0, l = data.length; i < l; i++) {
                        self.add_marker(data[i]);
                    }

                    self.deleteNotExistOverlays();

                }
                
                
                
                
            }
        });
    },
    getGSImage: function(ids, callback){
        var image_hash = new $.Hashtable();
        $.ajax({    
                    //http://commsvc.you.ctripcorp.com/poiservice/api/global/json/GetPoiDetail?PoiIds=
                    //url:"/j/" + self.type + "/map",
                    url:"http://commsvc.you.ctripcorp.com/POIService/api/global/json/GetPoiImageList",
                    type:"get",
                    dataType:"jsonp",
                    cache:false,
                    async:false,
                    data:{
                        Start:0,
                        Count:1,
                        ImageSize:'C_100_100',
                        PoiIds:"[" + ids.toString() + "]"//[75627,75628]
                    },
                    error:function(){
                      //alert(data);
                    },
                    success:function(data2){
                        if (!data2) { return; }
                        
                        for(var i=0;i<data2.Result.length;i++){
                            image_hash.add(data2.Result[i].PoiId, data2.Result[i].Image.ImageSizeMap[0].ImageUrl)
                        }
                        callback(null, image_hash);
                    }
                });

    },
    getGSPOIInfo: function(ids, callback){
        $.ajax({    
                    //url:"/j/" + self.type + "/map",
                    url:"http://commsvc.you.ctripcorp.com/poiservice/api/global/json/GetPoiDetail",
                    //url:"http://commsvc.you.ctripcorp.com/POIService/api/global/json/GetPoiImageList",
                    type:"get",
                    dataType:"jsonp",
                    cache:false,
                    async:true,
                    data:{
                        PoiIds:"[" + ids + "]"//[75627,75628]
                    },
                    error:function(){
                      //alert(data);
                    },
                    success:function(data3){
                        if (!data3) { return; }
                        
                        if(data3.Result.length > 0){
                            var row = data3.Result[0]; 
                            
                            callback(null, row.Url);
                        }
                    }
                });

    },
    init_map: function(){
        try{
            var self = this;

            var create_toolbar = function(gmap){
                var zoom_init_control = $('<a href="javascript:;" id="map_zoom_init" class="btn_mzoom"><span></span>全局视图</a>').hide();

                $(zoom_init_control).click(function(){
                    self.fit_bounds();
                });
                gmap.controls[google.maps.ControlPosition.TOP_RIGHT].push(zoom_init_control[0]);
            };

            var _minZoom = ($('#'+self.map_id).width() > 900 ? 2 : 0);
            if(self.bounds[2]-self.bounds[0]<90 && self.bounds[3]-self.bounds[1]<30){
                _minZoom = 3;
            }
            var gmap_options = {
                center: new google.maps.LatLng(36.197453,117.13744),
                zoom: 4,
                maxZoom:19,
                minZoom:_minZoom,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                streetViewControl:false,
                rotateControl:false,
                panControl:($('#'+self.map_id).height() > 350?true:false),
                zoomControl:self.map_options.zoomControl,
                zoomControlOptions:{style:google.maps.ZoomControlStyle.LARGE},
                scrollwheel: self.map_options.scrollwheel,
                mapTypeControl: self.map_options.mapTypeControl,
                draggable: self.map_options.draggable
                //disableDefaultUI:true
            };

            this.gmap = new google.maps.Map(document.getElementById(this.map_id), gmap_options);
            
            
            if(self.map_options.zoomControl === true){
                //add controls
                create_toolbar(this.gmap);
            }
            //add event
            var time_handle;
            var first_run = true;
            google.maps.event.addListener(this.gmap, 'idle', function() {

                if(first_run){
                    self.reload_data();
                    first_run = false;

                    self.origin_zoom = self.gmap.getZoom();
                    return;
                }

                if(time_handle){
                    clearTimeout(time_handle);
                    time_handle = null;
                }
                time_handle = setTimeout(function(){
                    self.reload_data();
                }, self.LOAD_DELAY_MS);
            });

            var enable_scroolwheel = function(){
                if(self.enable_smart_scrollwheel){
                    self.gmap.setOptions({scrollwheel: true});
                }
            };

            google.maps.event.addListener(self.gmap, 'click', function() {
                self.remove_infobox();
                enable_scroolwheel();

                if(self.onMapClick){
                    self.onMapClick();
                }
            });
            google.maps.event.addListener(self.gmap, 'zoom_changed', function() {
                self.remove_all_infobox();
                if(self.gmap.getZoom() !== self.origin_zoom){
                    $('#map_zoom_init').show();
                }else{
                    $('#map_zoom_init').hide();
                }
                //self.remove_infobox();
            });

            $('#' + self.map_id).mousemove(function(){
                    if(self.gmap){
                        if(!self.scrollwheel_handle) {
                            self.scrollwheel_handle = setTimeout(enable_scroolwheel, 2000);
                        }
                    }
                }
            );
            $('#' + self.map_id).hover(function(){},function(){
                    if(self.gmap){
                        if(self.scrollwheel_handle){
                            clearTimeout(self.scrollwheel_handle);
                            self.scrollwheel_handle = null;
                        }
                        self.gmap.setOptions({scrollwheel: false});
                    }
                }
            );
            google.maps.event.addListener(self.gmap, 'dragstart', function() {
                enable_scroolwheel();
                //remove_infobox();
            });
            //fitBounds

            window.load_data(this.gmap,null);
            this.fit_bounds();

        }catch(e){
        }
    }

});

})(jQuery);
