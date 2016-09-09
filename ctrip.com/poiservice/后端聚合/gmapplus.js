/*global google:true,icon_marker:true*/
/*jshint bitwise:false*/

//开启动画
var ENABLE_ANIMATE = true;
var ANIMATE_DURATION = 500;
var EASING_TYPE = "easeOutCirc";//easeOutCirc

//是否移动端
var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
};

String.prototype.replaceWith = function(d) {
    return this.replace(/\{\$(\w+)\}/g, function(a, c) {
        if (c in d) {
            return d[c];
        } else {
            return a;
        }
    });
};

// var getStringByLatlng = function(latlng){
//     return latlng.lat() + ',' + latlng.lng();
// };



window.load_data = function(map, data){
    var data = [{"type":"circle","color":"#f56b00","zIndex":1,"center":"31.24727456915418,121.45181894302368","radius":281.58139983384075},{"type":"rectangle","color":"#f56b00","zIndex":2,"bounds":"31.243238594329206,121.45177602767944|31.24492638660281,121.45390033721924"},{"type":"polygon","color":"#f56b00","zIndex":3,"paths":"31.24549509242258,121.45372867584229|31.245201567335812,121.45765542984009|31.247641467473372,121.4576768875122|31.246760909280358,121.45293474197388"},{"type":"marker","marker_type":"entrance","title":"入口","position":"31.250154682082254,121.45505905151367"},{"type":"marker","marker_type":"flight","title":"灰机","position":"31.249347525535672,121.4568829536438"}];
    var bounds = new google.maps.LatLngBounds();
    var o;
    if (data instanceof Array){

        for(var i=0;i<data.length;i++){
            var overlay = data[i];
            
            switch(overlay.type){
                case 'polygon':
                    o = google.maps.Polygon.loadByData(overlay);
                    o.setMap(map);
                    bounds.union(o.getBounds());
                    console.log(o.getBounds());
                    break;
                case 'polyline':
                    o = google.maps.Polyline.loadByData(overlay);
                    o.setMap(map);
                    bounds.union(o.getBounds());
                    break;
                case 'circle':
                    o = google.maps.Circle.loadByData(overlay);
                    o.setMap(map);
                    bounds.union(o.getBounds());
                    break;
                case 'rectangle':
                    o = google.maps.Rectangle.loadByData(overlay);
                    o.setMap(map);
                    bounds.union(o.getBounds());
                    break;
                case 'marker':
                    o = icon_marker.loadByData(overlay);
                    o.setMap(map);
                    bounds.extend(o.getPosition());
                    break;

            }
        }
        map.fitBounds(bounds);
    }
    return bounds;
};

/*-------------------------------------------------------------------------
########################
jquery easing v1.3
########################
-------------------------------------------------------------------------*/
jQuery.easing.jswing = jQuery.easing.swing;

jQuery.extend( jQuery.easing,
{
    def: 'easeOutCirc',
    easeOutCirc: function (x, t, b, c, d) {
        return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
    },
    easeOutBounce: function (x, t, b, c, d) {
        if ((t/=d) < (1/2.75)) {
            return c*(7.5625*t*t) + b;
        } else if (t < (2/2.75)) {
            return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
        } else if (t < (2.5/2.75)) {
            return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
        } else {
            return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
        }
    }
});

function init_gmapplus(){

    /*-------------------------------------------------------------------------
    ########################
    icon_marker
    ########################
    --------------------------------------------------------------------------*/
    function icon_marker(opt_options) {
        this.setValues(opt_options);
    }
    icon_marker.prototype = new google.maps.OverlayView();
    window.icon_marker = icon_marker;

    icon_marker.getPositionByString = function(obj_str){
        return new google.maps.LatLng(obj_str.split(',')[0], obj_str.split(',')[1]);
    };
    icon_marker.prototype.getPositionString = function(){
        return this.position.lat() + ',' + this.position.lng();
    };

    icon_marker.loadByData = function(obj){
        var overlay = new icon_marker({
            position: this.getPositionByString(obj.position),
            //map: map,
            title: obj.title,
            marker_type:obj.marker_type,
            animation: null,//google.maps.Animation.DROP,
            is_selected: false,
            overlay_type:obj.type,
            zIndex:obj.zIndex
        });

        google.maps.event.addListener(overlay, 'click', function(e){
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault){
                e.preventDefault();
            }
        });

        return overlay;
    };

    icon_marker.prototype.show = function(){
        $(this.div).show();
    };

    icon_marker.prototype.hide = function(){
        $(this.div).hide();
    };

    icon_marker.prototype.onRemove = function () {
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
      if (this.edit_box){
        this.edit_box.parentNode.removeChild(this.edit_box);
        this.edit_box = null;
      }
    };

    icon_marker.prototype.setAnimation = function (animation){
        this.animation = animation;
        if(this.div){
            this.draw();
        }
    };

    icon_marker.prototype.setZindex = function (zindex){
        this.zIndex = zindex;
        if(this.div){
            $(this.div).css({
                'z-index':this.zIndex
            });
        }
    };

    icon_marker.prototype.setPosition = function (position){
        this.position = position;
        if(this.div){
            this.draw();
        }
    };

    icon_marker.prototype.getPosition = function (){
            return this.position;
    };

    icon_marker.prototype.onAdd = function () {

        var self = this;
        var div;
        this.isEnd = false;

        div = document.createElement("div");
        $(div).css({
            'position':'absolute',
            'z-index':self.zIndex
        }).attr('title',self.title);
        //div.className = "map_dot";
        //div.id = this.pid;

        var _html = '<a href="javascript:;" class="m_icon_' + this.marker_type + '"></a>';
        div.innerHTML = _html;

        google.maps.event.addDomListener($('a', $(div))[0], "click", function(event) {
            google.maps.event.trigger(self, "click", event);
        });

        var edit_box = document.createElement("div");
        $(edit_box).css({
            'position':'absolute'
        }).html('<input type="button" value="编辑文本" >');
        google.maps.event.addDomListener($('input', $(edit_box))[0], "click", function(e) {
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault){
                e.preventDefault();
            }
            var inputText = window.prompt("请输入文本",self.title);
            if(inputText){
                self.title=inputText;
                $(div).attr('title',self.title);
            }
        });

        this.div = div;
        this.edit_box = edit_box;


        var panes = this.getPanes();
        panes.overlayImage.appendChild(div);
        panes.overlayImage.appendChild(edit_box);


    };

    icon_marker.prototype.draw = function() {

        var self = this;

        var div = this.div;
        var edit_box = this.edit_box;
        var point = this.getProjection().fromLatLngToDivPixel(this.position);
        $(edit_box).css({
            'left': (point.x-30) + 'px',
            'top':  point.y + 'px'
        });
        if (this.animation !== null){
            if(this.animation === google.maps.Animation.DROP){
                $(self.edit_box).hide();
                $(div).css({
                    'left': point.x + 'px',
                    'top':  point.y-300 + 'px'
                });

                $(div).animate({
                    'left': point.x + 'px',
                    'top': point.y + 'px'
                },{
                    duration: 900,
                    specialEasing: {
                      left: 'easeOutBounce',
                      top: 'easeOutBounce'
                    },
                    complete:function(){
                        var endPoint = self.getProjection().fromLatLngToDivPixel(self.position);
                        div.style.left = endPoint.x + 'px';
                        div.style.top = endPoint.y + 'px';

                        self.animation = null;
                    }
                });
            }else if(this.animation === google.maps.Animation.BOUNCE){
                $(this.edit_box).show();
                var animate_bounce = function(){
                    var p = self.getProjection().fromLatLngToDivPixel(self.position);
                    $(div).animate({
                        'left': p.x ,
                        'top': (p.y-30)
                    },{duration:400,easing:'easeOutQuad'}).animate({'left': p.x ,'top': p.y},{
                        duration: 400,
                        easing:'easeInQuad',
                        complete:function(){
                            if(self.div){
                                var endPoint = self.getProjection().fromLatLngToDivPixel(self.position);
                                div.style.left = endPoint.x + 'px';
                                div.style.top = endPoint.y + 'px';
                                animate_bounce();
                            }
                        }
                    });
                };
                if(!this.run_once){
                    $(div).css({
                        'left': point.x + 'px',
                        'top':  point.y + 'px'
                    });
                    animate_bounce();
                    this.run_once = true;
                }else{
                    $(div).stop(true, false);
                    $(div).css({
                        'left': point.x + 'px',
                        'top':  point.y + 'px'
                    });
                    animate_bounce();
                }

            }
        }else{
            $(this.edit_box).hide();
            $(div).stop(true,false);
            $(div).css({
                'left': point.x + 'px',
                'top':  point.y + 'px'
            });
        }

    };

    google.maps.Polygon.prototype.getPathString = function(){
        var points = [];
        for (var i = 0; i < this.getPath().length; i++) {
            points.push(this.getPath().getAt(i).lat() + ',' + this.getPath().getAt(i).lng());
        }
        return points.join('|');
    };
    google.maps.Polygon.getPathByString = function(obj_str){
        var path = obj_str.split('|');
        var latLngArray = [];
        for (var i = 0; i < path.length; i++) {
            latLngArray.push(new google.maps.LatLng(path[i].split(',')[0], path[i].split(',')[1]));
        }
        return latLngArray;
    };
    google.maps.Polygon.loadByData = function(obj){
        var overlay = new google.maps.Polygon({
            paths: this.getPathByString(obj.paths),
            strokeColor: obj.color,
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: obj.color,
            fillOpacity: 0.30,
            editable: false,
            is_selected: false,
            overlay_type:obj.type,
            zIndex:obj.zIndex
        });

        return overlay;
    };

    google.maps.Polyline.prototype.getPathString = function(){
        var points = [];
        for (var i = 0; i < this.getPath().length; i++) {
            points.push(this.getPath().getAt(i).lat() + ',' + this.getPath().getAt(i).lng());
        }
        return points.join('|');
    };
    google.maps.Polyline.getPathByString = function(obj_str){
        var path = obj_str.split('|');
        var latLngArray = [];
        for (var i = 0; i < path.length; i++) {
            latLngArray.push(new google.maps.LatLng(path[i].split(',')[0], path[i].split(',')[1]));
        }
        return latLngArray;
    };
    google.maps.Polyline.loadByData = function(obj){
        var overlay = new google.maps.Polyline({
            path: this.getPathByString(obj.paths),
            strokeColor: obj.color,
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: obj.color,
            fillOpacity: 0.30,
            editable: false,
            is_selected: false,
            overlay_type:obj.type,
            zIndex:obj.zIndex
        });

        return overlay;
    };

    google.maps.Circle.prototype.getCenterString = function(){
        return this.getCenter().lat() + ',' + this.getCenter().lng();
    };
    google.maps.Circle.getCenterByString = function(obj_str){
        return new google.maps.LatLng(obj_str.split(',')[0], obj_str.split(',')[1]);
    };
    google.maps.Circle.loadByData = function(obj){
        var overlay = new google.maps.Circle({
            strokeColor: obj.color,
            strokeOpacity: 1,
            strokeWeight: 2,
            fillColor: obj.color,
            fillOpacity: 0.30,
            center: this.getCenterByString(obj.center),
            radius: obj.radius,
            editable: false,
            is_selected: false,
            overlay_type:obj.type,
            zIndex:obj.zIndex
        });

        return overlay;
    };

    google.maps.Rectangle.prototype.getBoundsString = function(){
        var sw = this.getBounds().getSouthWest();
        var ne = this.getBounds().getNorthEast();

        return sw.lat() + ',' + sw.lng() + '|' + ne.lat() + ',' + ne.lng();
    };
    google.maps.Rectangle.getBoundsByString = function(obj_str){
        var latLngArray = obj_str.split('|');

        var sw = new google.maps.LatLng(latLngArray[0].split(',')[0],latLngArray[0].split(',')[1]);
        var ne = new google.maps.LatLng(latLngArray[1].split(',')[0],latLngArray[1].split(',')[1]);

        return new google.maps.LatLngBounds(sw,ne);
    };

    google.maps.Rectangle.loadByData = function(obj){
        var overlay = new google.maps.Rectangle({
            strokeColor: obj.color,
            strokeOpacity: 1,
            strokeWeight: 2,
            fillColor: obj.color,
            fillOpacity: 0.30,
            bounds: this.getBoundsByString(obj.bounds),
            editable: false,
            is_selected: false,
            overlay_type:obj.type,
            zIndex:obj.zIndex
        });

        return overlay;
    };

   // Poygon getBounds extension
    if (!google.maps.Polygon.prototype.getBounds) {
        google.maps.Polygon.prototype.getBounds = function() {
            var bounds = new google.maps.LatLngBounds();
            var paths = this.getPaths();
            var path;

            for (var p = 0; p < paths.getLength(); p++) {
                path = paths.getAt(p);
                for (var i = 0; i < path.getLength(); i++) {
                    bounds.extend(path.getAt(i));
                }
            }

            return bounds;
        };
    }

    // Polygon containsLatLng
    google.maps.Polygon.prototype.containsLatLng = function(latLng) {

        var bounds = this.getBounds();

        if (bounds !== null && !bounds.contains(latLng)) {
            return false;
        }

        var inPoly = false;

        var numPaths = this.getPaths().getLength();
        for (var p = 0; p < numPaths; p++) {
            var path = this.getPaths().getAt(p);
            var numPoints = path.getLength();
            var j = numPoints - 1;

            for (var i = 0; i < numPoints; i++) {
                var vertex1 = path.getAt(i);
                var vertex2 = path.getAt(j);

                if (vertex1.lng() < latLng.lng() && vertex2.lng() >= latLng.lng() || vertex2.lng() < latLng.lng() && vertex1.lng() >= latLng.lng()) {
                    if (vertex1.lat() + (latLng.lng() - vertex1.lng()) / (vertex2.lng() - vertex1.lng()) * (vertex2.lat() - vertex1.lat()) < latLng.lat()) {
                        inPoly = !inPoly;
                    }
                }

                j = i;
            }
        }

        return inPoly;
    };

    // Polygon getPosition
    google.maps.Polygon.prototype.getPosition = function() {
        return this.getBounds().getCenter();
    };


    // Polyline getBounds extension
    if (!google.maps.Polyline.prototype.getBounds) {
        google.maps.Polyline.prototype.getBounds = function() {
            var bounds = new google.maps.LatLngBounds();
            var path = this.getPath();

            for (var i = 0; i < path.getLength(); i++) {
                bounds.extend(path.getAt(i));
            }

            return bounds;
        };
    }

    // Circle containsLatLng
    google.maps.Circle.prototype.containsLatLng = function(latLng) {

        var bounds = this.getBounds();

        if (bounds !== null && !bounds.contains(latLng)) {
            return false;
        }

        if (google.maps.geometry.spherical.computeDistanceBetween(this.getCenter(), latLng) <= this.getRadius()){
            return true;
        } else {
            return false;
        }

    };

    // Circle getPosition
    google.maps.Circle.prototype.getPosition = function() {
        return this.getCenter();
    };


    // Rectangle containsLatLng
    google.maps.Rectangle.prototype.containsLatLng = function(latLng) {

        var bounds = this.getBounds();

        if (bounds !== null && !bounds.contains(latLng)) {
            return false;
        }
        return true;
    };

    // Rectangle getPosition
    google.maps.Rectangle.prototype.getPosition = function() {
        return this.getBounds().getCenter();
    };



    /*-------------------------------------------------------------------------
    ########################
    poi_marker
    ########################
    -------------------------------------------------------------------------*/
    /*
    beginLatlng,
    endLatlng,
    map,
    location,
    pid,
    isEnd,
    onComplete,
    normal_img_url,
    hover_img_url,
    multi_img_index
    */
    function poimarker(opt_options) {
        this.normal_img_url = 'icon_map_dot.png';
        this.hover_img_url = 'icon_map_dot.png';
        this.multi_img_index = 0;
        this.img_height = 37;
        this.setValues(opt_options);

        if(this.getTotal() > 1){
            this.normal_img_url = 'map_dot_more.png';
            this.hover_img_url = 'map_dot_more.png';
            /*this.coords = [13,0,
                        8,3,
                        5,6,
                        3,10,
                        1,13,
                        1,18,
                        3,20,
                        4,26,
                        9,29,
                        14,31,
                        19,31,
                        26,28,
                        30,23,
                        32,19,
                        32,13,
                        29,6,
                        24,2,
                        19,0];*/
        }else{
            /*this.coords = [10,0+this.multi_img_index*this.img_height,
                        5,2+this.multi_img_index*this.img_height,
                        0,8+this.multi_img_index*this.img_height,
                        0,14+this.multi_img_index*this.img_height,
                        10,29+this.multi_img_index*this.img_height,
                        12,35+this.multi_img_index*this.img_height,
                        13,35+this.multi_img_index*this.img_height,
                        16,29+this.multi_img_index*this.img_height,
                        25,14+this.multi_img_index*this.img_height,
                        25,8+this.multi_img_index*this.img_height,
                        20,2+this.multi_img_index*this.img_height,
                        15,0+this.multi_img_index*this.img_height];*/
        }
        //this.zIndex = 9999;
    }


    poimarker.prototype = new google.maps.OverlayView();
    window.poimarker = poimarker;

    poimarker.prototype.setIconUrl = function(normal_img_url, hover_img_url){
        this.normal_img_url = normal_img_url;
        this.hover_img_url = hover_img_url;
        if(this.div){
            $('img',$(this.div)).attr('src', this.normal_img_url);
        }
    };

    poimarker.prototype.moveTo = function(endLatlng, onComplete){
        var self = this;
        var endPoint = this.getProjection().fromLatLngToDivPixel(endLatlng);
        this.setZindex(-999999999);

        if(ENABLE_ANIMATE === true){
            $(this.div).velocity({ 
                left: parseInt(endPoint.x),
                top: parseInt(endPoint.y)
            }, {
                duration: ANIMATE_DURATION,
                easing: EASING_TYPE,//"easeOutCirc",
                queue: "",
                complete: function(){
                    //endPoint = self.getProjection().fromLatLngToDivPixel(endLatlng);
                    //self.div.style.left = endPoint.x + 'px';
                    //self.div.style.top  = endPoint.y + 'px';
                    
                    onComplete();
                },
                loop: false,
                delay: false,
                display: true,
                mobileHA: true
            });
            /*$(this.div).animate({
                            left: endPoint.x,
                            top: endPoint.y
                        }, {
                        duration: 300,
                        specialEasing: {
                          left: 'easeOutCirc',
                          top: 'easeOutCirc'
                        },
                        step: function(now, fx) {
                            //var data = fx.elem.id + ' ' +  + ': ' + now;
                            if(self.shadow){
                                if(fx.prop === 'left'){
                                    self.shadow.style.left = now + 'px';
                                }else if(fx.prop === 'top'){
                                    self.shadow.style.top = now + 'px';
                                }
                            }
                          },
                        complete: function(){
                            endPoint = self.getProjection().fromLatLngToDivPixel(endLatlng);
                            self.div.style.left = endPoint.x + 'px';
                            self.div.style.top  = endPoint.y + 'px';
                            //self.shadow.style.left = endPoint.x + 'px';
                            //self.shadow.style.top = endPoint.y + 'px';

                            onComplete();
                        }
                    });
            */
        } else {
                    
            endPoint = self.getProjection().fromLatLngToDivPixel(endLatlng);
            $(self.div).css({
                left: parseInt(endPoint.x),
                top: parseInt(endPoint.y)
            });
            //self.div.style.left = endPoint.x + 'px';
            //self.div.style.top  = endPoint.y + 'px';
            //self.shadow.style.left = endPoint.x + 'px';
            //self.shadow.style.top = endPoint.y + 'px';

            onComplete();
        
        }
        
    };

    poimarker.prototype.stopMove = function(){
        $(this.div).stop(true, true);
    };

    poimarker.prototype.animateBounce = function(){
        var self = this;
        $(this.div).stop(true, true);
        if(self.div){
            var marker_offset = 20;
            self.div.style.zIndex = 9999999999;
            var marker_top = parseInt(self.div.style.top.replace('px',''),10);
            var shadow_top = parseInt(self.shadow.style.top.replace('px',''),10);
            var shadow_left = parseInt(self.shadow.style.left.replace('px',''),10);

            self.div.style.top = (marker_top - marker_offset) + 'px';

            $(self.div).animate({
                    top: marker_top + 'px'
                }, {
                    duration: 600,
                    specialEasing: {
                      top: 'easeOutBounce'
                    },
                    step: function(now, fx) {
                        //var data = fx.elem.id + ' ' +  + ': ' + now;
                        if(self.shadow){
                            if(fx.prop === 'top'){
                                var offset = marker_top - now;
                                var shadow_offset = Math.pow(Math.pow(offset, 2)/2, 0.5);

                                self.shadow.style.top = (shadow_top - shadow_offset) + 'px';
                                self.shadow.style.left = (shadow_left + shadow_offset) + 'px';
                            }
                        }
                      },
                    complete: function(){
                        self.div.style.top = marker_top + 'px';
                        self.shadow.style.top = shadow_top + 'px';
                        self.shadow.style.left = shadow_left + 'px';

                        self.div.style.zIndex = self.getZindex();
                    }
                });

        }
    };

    poimarker.prototype.show = function(){
        if(!this.div){
            $(this.div).show();
            //$(this.shadow).show();
        }
    };

    poimarker.prototype.hide = function(){
        if(this.div){
            $(this.div).hide();
            //$(this.shadow).hide();
        }
    };

    poimarker.prototype.fadein = function(){
        if(!this.div){
            //console.log("fadein");
            $(this.div).velocity("fadeIn", { duration: 500 });
            //$(this.div).fadeIn();
            //$(this.shadow).show();
        }
    };

    poimarker.prototype.fadeout = function(){
        
        if(this.div){
            //console.log("fadeout");
            $(this.div).velocity("fadeOut", { duration: 5000});            
            //$(this.div).fadeOut();
            //$(this.shadow).hide();
        }
    };

    poimarker.prototype.getPoints = function(){
        var points = [];
        if(this.endLatlng){
            points.push(this.lng);
            points.push(this.lat);
        }
        if(this.ext_data){
            for(var i=0;i<this.ext_data.length;i++){
                var p = this.ext_data[i];
                points.push(p.lng);
                points.push(p.lat);
            }
        }
        return points.join(',');
    };

    poimarker.prototype.getTotal = function(){
        var total = this.total;
        if(this.ext_data){
            for(var i=0;i<this.ext_data.length;i++){
                var p = this.ext_data[i];
                total += p.total;
            }
        }
        return total;
    };

    poimarker.prototype.isParentOf = function(pid){

        //if(this.pid === pid || (this.pid !== pid && pid.indexOf(this.pid + ',') === 0)){
        if(this.pid === pid || (this.pid !== pid && pid.indexOf(this.pid) === 0)){
            return true;
        }else{
            if(this.ext_data){
                for(var i=0;i<this.ext_data.length;i++){
                    var p = this.ext_data[i];
                    //if(p.pid === pid || (p.pid !== pid && pid.indexOf(p.pid + ',') === 0)){
                    if(p.pid === pid || (p.pid !== pid && pid.indexOf(p.pid) === 0)){
                        return true;
                    }
                }
            }
            return false;
        }
    };

    poimarker.prototype.isChildOf = function(pid){
        //if(this.pid !== pid && this.pid.indexOf(pid + ',') === 0){
        if(this.pid !== pid && this.pid.indexOf(pid) === 0){
            return true;
        }
        else{
            if(this.ext_data){
                for(var i=0;i<this.ext_data.length;i++){
                    var p = this.ext_data[i];
                    //if(p.pid !== pid && p.pid.indexOf(pid + ',') === 0){
                    if(p.pid !== pid && p.pid.indexOf(pid) === 0){
                        return true;
                    }
                }
            }
            return false;
        }
    };

    /*poimarker.prototype.changed = function(prop) {

    };*/
    poimarker.prototype.getZindex = function (){
        return 999999999 - Math.round(this.position.lat()*100000) << 5;
    };

    poimarker.prototype.setZindex = function (zindex){
        if(this.div){
            $(this.div).css({'zIndex':zindex});
        }
    };

    poimarker.prototype.onAdd = function () {

        var self = this;
        var marker = null;
        var shadow = null;

        var control = 'img';
        var total = this.getTotal();
        var _html = '';
        if (self.img != ''){
            marker = $('<div class="map_dot_img" style="cursor:pointer;background-image:url(' + self.img + ');background-size:cover;" id="' + self.pid + '"></div>');

            //_html = '<img src="' + self.img + '"/>';//'<span style="cursor:pointer" class="marker_total"></span>' +
            //shadow = $('<div class="map_dot_more_shadow"></div>');
        }
        else{

            if(total > 1){
                //marker = $('<div class="map_dot_more" style="cursor:pointer;background-image:url(' + self.normal_img_url + ');" id="' + self.pid + '"></div>');
                marker = $('<div class="map_dot_more" id="' + self.pid + '"></div>');
                
                var total_num = String(total);
                if(total > 99){
                    total_num = 'N';
                }
                _html = total_num;
                /*
                if(self.coords !== '' && !$.BS.isIE && !isMobile.any()){
                    _html = '<span style="cursor:pointer" class="marker_total">' + total_num + '</span>' +
                        '<img src="' + self.normal_img_url + '" usemap="#gmimap' + self.pid + '" />' +
                        '<map name="gmimap' + this.pid + '" id="gmimap' + this.pid + '">' +
                        //'<area href="javascript:void(0)" log="miw" coords="' + self.coords + '" shape="poly" style="cursor: pointer; "></area>' +
                        '</map>';
                    control = 'map';//'area';
                }else{
                    _html = '<span style="cursor:pointer" class="marker_total">' + total_num + '</span>' +
                        '<img src="' + self.normal_img_url + '" />';

                    marker.css({
                        'cursor': 'pointer'
                    });
                }
                shadow = $('<div class="map_dot_more_shadow"></div>');
                */
            }else{
                marker = $('<div class="map_dot" style="cursor:pointer;background-image:url(' + self.normal_img_url + ');background-size:cover;" id="' + self.pid + '"></div>');
                /*
                if(self.coords !== '' && !$.BS.isIE && !isMobile.any()){
                    _html = '<img src="' + self.normal_img_url + '" usemap="#gmimap' + self.pid + '" style="margin-top:' + (-self.img_height*self.multi_img_index) + 'px"/>'+
                            '<map name="gmimap' + self.pid + '" id="gmimap' + self.pid + '">'+
                            //'<area href="javascript:void(0)" log="miw" coords="' + self.coords + '" shape="poly" style="cursor: pointer; "></area>' +
                            '</map>';
                    control = 'map';//'area';
                }else{
                    _html = '<img src="' + self.normal_img_url + '" style="margin-top:' + (-self.img_height*self.multi_img_index) + 'px"/>';

                    marker.css({
                        'cursor': 'pointer'
                    });
                }
                shadow = $('<div class="map_dot_shadow"></div>');
                */
            }
        }

        marker.html(_html).css({
            'zIndex': self.getZindex()
        }).attr("title", self.tid + " " + self.poi_name);
        
        //self.shadow = shadow[0];
        self.div = marker[0];

        google.maps.event.addDomListener($(self.div)[0], "click", function(event) {
                google.maps.event.trigger(self, "click", event);
        });

        
        /*
        if(self.img === '' && total > 1){
            google.maps.event.addDomListener($('.marker_total', $(self.div))[0], "click", function(event) {
                google.maps.event.trigger(self, "click", event);
            });
        }
        */
        //if(self.img === ''){
            google.maps.event.addDomListener($(self.div)[0], "click", function(event) {
                google.maps.event.trigger(self, "click", event);
            });

            $(self.div).hover(function(event){
                google.maps.event.trigger(self, "hover", event);
            }, function(event){
                google.maps.event.trigger(self, "leave", event);
            });
        //}
        
        var panes = self.getPanes();
        panes.overlayImage.appendChild(self.div);
        //panes.overlayShadow.appendChild(self.shadow);

        if(self.isHide){
            self.hide();
        }

    };

    poimarker.prototype.draw = function() {

        var self = this;

        var div = this.div;
        var shadow = this.shadow;

        var beginPoint = this.getProjection().fromLatLngToDivPixel(this.beginLatlng);
        var endPoint = this.getProjection().fromLatLngToDivPixel(this.endLatlng);

        if (beginPoint && endPoint) {
            $(div).css({
                left: parseInt(beginPoint.x),
                top: parseInt(beginPoint.y)
            });
            //div.style.left = beginPoint.x + 'px';
            //div.style.top = beginPoint.y + 'px';
            //shadow.style.left = beginPoint.x + 'px';
            //shadow.style.top = beginPoint.y + 'px';
        }


        if (this.isEnd === false){
            $(div).css({
                left: parseInt(endPoint.x),
                top: parseInt(endPoint.y)
            });
            
            self.beginLatlng = self.endLatlng;

            //self.isEnd = false;
            self.onComplete();
        }
        else {
            if(ENABLE_ANIMATE === true){
                $(this.div).velocity({ 
                    left: parseInt(endPoint.x),
                    top: parseInt(endPoint.y)
                }, {
                    duration: ANIMATE_DURATION,
                    easing: EASING_TYPE,//"easeOutCirc",
                    queue: "",
                    complete: function(){
                        //endPoint = self.getProjection().fromLatLngToDivPixel(self.endLatlng);
                        //div.style.left = endPoint.x + 'px';
                        //div.style.top = endPoint.y + 'px';

                        self.beginLatlng = self.endLatlng;
                        self.isEnd = false;
                        
                        self.onComplete();
                    },
                    loop: false,
                    delay: false,
                    display: true,
                    mobileHA: true
                });
                /*
                $(div).animate({
                    left: endPoint.x,
                    top: endPoint.y
                }, {
                    duration: 300,
                    specialEasing: {
                      left: 'easeOutCirc',
                      top: 'easeOutCirc'
                    },
                    step: function(now, fx) {
                        //var data = fx.elem.id + ' ' +  + ': ' + now;
                        if(self.shadow){
                            if(fx.prop === 'left'){
                                self.shadow.style.left = now + 'px';
                            }else if(fx.prop === 'top'){
                                self.shadow.style.top = now + 'px';
                            }
                        }
                      },
                    complete: function(){
                        endPoint = self.getProjection().fromLatLngToDivPixel(self.endLatlng);
                        div.style.left = endPoint.x + 'px';
                        div.style.top = endPoint.y + 'px';
                        //shadow.style.left = endPoint.x + 'px';
                        //shadow.style.top = endPoint.y + 'px';

                        self.beginLatlng = self.endLatlng;

                        self.isEnd = false;
                        //$(shadow).show();
                        self.onComplete();
                    }
                });
                */
            } else {
                endPoint = self.getProjection().fromLatLngToDivPixel(self.endLatlng);
                $(div).css({
                    left: parseInt(endPoint.x),
                    top: parseInt(endPoint.y)
                });
                //div.style.left = endPoint.x + 'px';
                //div.style.top = endPoint.y + 'px';
                
                self.beginLatlng = self.endLatlng;

                self.isEnd = false;
                self.onComplete();
            }

        }


    };

    /*
    poimarker.prototype.getPosition = function () {
      return this.position;
    };

    poimarker.prototype.setPosition = function (latlng) {

      this.position = latlng;
      if (this.div) {
        this.draw();
      }
    }
    */

    poimarker.prototype.remove = function() {
        if (this.div) {
            this.div.parentNode.removeChild(this.div);
            //this.shadow.parentNode.removeChild(this.shadow);
            
            this.div = null;
            //this.shadow = null;
        }
    };


    /*-------------------------------------------------------------------------
    ########################
    poi_info_box
    ########################
    -------------------------------------------------------------------------*/
    function poiinfobox(opt_options) {
        this.pic = '';
        this.pin_total = -1;
        this.poi_name = '';
        this.poi_total = -1;
        this.poi_url = '';

        this.setValues(opt_options);
        if(this.marker.getTotal() > 1){
            this.y_offset=8;
            this.x_offset=4;
        }else{
            this.y_offset=0;
            this.x_offset=0;
        }
    }

    poiinfobox.prototype = new google.maps.OverlayView();
    window.poiinfobox = poiinfobox;
    /*poiinfobox.prototype.changed = function(prop) {

    };*/

    poiinfobox.prototype.onAdd = function() {
        var self = this;
        var div;

        div = this.div = document.createElement("div");

        div.className = "box_regular map_pic";

        var html =  '<div class="pic_summary">'+
                '<span class="arrow"><i>◆</i><b>◆</b></span>'+
                '<div class="cover">'+
                '<img src="" />'+
                '</div>'+
                '<div class="poi_summary"></div>'+
                '<div class="pic_nub"></div>'+
                '</div>';

        div.innerHTML = html;

        google.maps.event.addDomListener(div, "click", function(event) {
            google.maps.event.trigger(self, "click", event);
        });
        /*
        google.maps.event.addDomListener($('.poi_summary', $(div))[0], "click", function(event) {
            google.maps.event.trigger(self, "poi_click", event);
        });
        */
        $(div).hover(function(event) {
            google.maps.event.trigger(self, "hover", event);
        }, function(event) {
            google.maps.event.trigger(self, "leave", event);
        });
        this.div = div;

        var panes = this.getPanes();
        panes.floatPane.appendChild(div);

    };

    poiinfobox.prototype.setData = function(data){
        
        this.pic = data.pic;
        this.pin_total = data.pin_total;
        if(this.pin_total>1){
            this.poi_name = '<span class="icon_position"></span><p>' + data.poi_name + '等</p>';
        } else {
            this.poi_name = '<span class="icon_position"></span><p>' + data.poi_name + '</p>';
        }
        this.poi_total = this.marker.getTotal();
        this.poi_url = data.poi_url;

        /*if(this.poi_total > 1){
            this.poi_name = '<span class="icon_position">' + this.poi_total + '</span><p>个地点</p>';
        }*/

        this.draw();

    };

    poiinfobox.prototype.draw = function() {

        var self = this;

        var div = self.div;
        if(div){
            var Point = self.getProjection().fromLatLngToDivPixel(self.position);

            div.style.top = (Point.y - 24 + self.y_offset) + 'px';
            if(self.left_side){
                $(div).addClass('side');
                div.style.left = (Point.x - 99 - self.x_offset) + 'px';
            }else{
                $(div).removeClass('side');
                div.style.left = (Point.x + 22 + self.x_offset) + 'px';
            }
            if(self.pic !== ''){
                $('img',$(self.div)).attr('src',self.pic);
            }
            if(self.pin_total >= 0){
                var t = self.pin_total + '个地点';
                if(this.poi_url != ''){
                    t = t + "[攻略]";
                }
                $('.pic_nub',$(self.div)).html(t);
            }
            $('.poi_summary',$(self.div)).html(self.poi_name);
        }

    };

    poiinfobox.prototype.removeFadeOut = function() {
        var self = this;
        if (self.div) {
            if($.BS.isIE){
                self.remove();
            }else{
                $(self.div).fadeOut(200,function(){
                    self.remove();
                });
            }
        }
    };

    poiinfobox.prototype.remove = function() {
        if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
            this.setMap(null);
        }
    };


    /*-------------------------------------------------------------------------
    ########################
    album_info_box
    ########################
    -------------------------------------------------------------------------*/
    function albuminfobox(opt_options) {
        this.album_cover = '';
        this.album_title = '';
        this.album_url = '';
        this.album_id = 0;
        this.setValues(opt_options);

        this.draw();
    }

    albuminfobox.prototype = new google.maps.OverlayView();

    window.albuminfobox = albuminfobox;
    /*albuminfobox.prototype.changed = function(prop) {

    };*/

    albuminfobox.prototype.onAdd = function() {
        var self = this;
        var div;

        div = this.div = document.createElement("div");

        div.className = "map_pic";

        var _imgs = '';
        var img_array = self.album_cover.split(',');

        for(var i=0; i<img_array.length; i++){
            _imgs += '<img src="' + img_array[i] + '" />';
        }
        _imgs += '<img src="http://img.pintupinqu.com/images/find_more.png" />';

        var html = [
         '<div class="mask"></div>',
         '<b></b>',
         '<p>' + self.album_title + '</p>',
         '<div class="pic_summary">',
         '<div class="pic_summary_box">',
         _imgs,
         '</div>',
         '</div>'
         ].join('');

        div.innerHTML = html;

        google.maps.event.addDomListener(div, "click", function(event) {
            google.maps.event.trigger(self, "click", event);
        });


        $(div).hover(function(event) {
            google.maps.event.trigger(self, "hover", event);
        }, function(event) {
            google.maps.event.trigger(self, "leave", event);
        });
        this.div = div;

        var panes = this.getPanes();
        panes.floatPane.appendChild(div);

    };


    albuminfobox.prototype.draw = function() {

        var self = this;

        var div = this.div;
        if(div){
            var Point = self.getProjection().fromLatLngToDivPixel(self.position);

           div.style.top = (Point.y - 70) + 'px';
            if(self.left_side){
                $(div).addClass('right');
                div.style.left = (Point.x - 278) + 'px';
            }else{
                $(div).removeClass('right');
                div.style.left = (Point.x + 20) + 'px';
            }

        /*if (!this.init_complete) {
            this.init_complete = true;
        }*/
        }

    };

    albuminfobox.prototype.removeFadeOut = function() {
        if (this.div) {
            $(this.div).fadeOut(200,function(){
                if(this.div){
                    this.div.parentNode.removeChild(this.div);
                    this.div = null;
                    this.setMap(null);
                }
            });
        }
    };

    albuminfobox.prototype.remove = function() {
        if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
            this.setMap(null);
        }
    };

    /*-------------------------------------------------------------------------
    ########################
    tag_info_box
    ########################
    -------------------------------------------------------------------------*/
    function taginfobox(opt_options) {
        this.poi_name = '';
        this.desc = '';
        this.pic = '';
        this.poi_id = 0;
        this.setValues(opt_options);

        this.draw();
    }
    taginfobox.prototype = new google.maps.OverlayView();
    window.taginfobox = taginfobox;
    /*taginfobox.prototype.changed = function(prop) {

    };*/

    taginfobox.prototype.onAdd = function() {
        var self = this;
        var div;

        div = this.div = document.createElement("div");

        div.className = "pop_poi";

        var html = [
            '<span class="arrow">&nbsp;</span>',
            '<h4><a href="/poi/' + self.poi_id + '">' + self.poi_name + '</a></h4>',
            '<a href="/poi/' + self.poi_id  + '" class="poi_pic"><img src="' + self.pic + '" /></a>',
            '<p>',
            self.desc,
            '</p>'
        ].join('');

        div.innerHTML = html;

        google.maps.event.addDomListener(div, "click", function(event) {
            google.maps.event.trigger(self, "click", event);
        });


        $(div).hover(function(event) {
            google.maps.event.trigger(self, "hover", event);
        }, function(event) {
            google.maps.event.trigger(self, "leave", event);
        });
        this.div = div;

        var panes = this.getPanes();
        panes.floatPane.appendChild(div);

    };


    taginfobox.prototype.draw = function() {

        var self = this;

        var div = this.div;
        if(div){
            var Point = self.getProjection().fromLatLngToDivPixel(self.position);

           div.style.top = (Point.y - 49) + 'px';
            if(self.left_side){
                $(div).addClass('side');
                div.style.left = (Point.x - 254) + 'px';
            }else{
                $(div).removeClass('side');
                div.style.left = (Point.x + 24) + 'px';
            }

        /*if (!this.init_complete) {
            this.init_complete = true;
        }*/
        }

    };

    taginfobox.prototype.removeFadeOut = function() {
        if (this.div) {
            $(this.div).fadeOut(200,function(){
                if(this.div){
                    this.div.parentNode.removeChild(this.div);
                    this.div = null;
                    this.setMap(null);
                }
            });
        }
    };

    taginfobox.prototype.remove = function() {
        if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
            this.setMap(null);
        }
    };


    /*-------------------------------------------------------------------------
    ########################
    time_info_box
    ########################
    -------------------------------------------------------------------------*/
    function timeinfobox(opt_options) {
        this.pic = '';
        this.pin_total = -1;
        this.poi_name = '';
        this.poi_total = -1;
        this.poi_url = '';

        this.setValues(opt_options);
        if(this.marker.getTotal() > 1){
            this.y_offset=8;
            this.x_offset=4;
        }else{
            this.y_offset=0;
            this.x_offset=0;
        }
    }

    timeinfobox.prototype = new google.maps.OverlayView();
    window.timeinfobox = timeinfobox;
    /*poiinfobox.prototype.changed = function(prop) {

    };*/

    timeinfobox.prototype.onAdd = function() {
        var self = this;
        var div;

        div = this.div = document.createElement("div");

        div.className = "box_regular map_pic";

        var html = '<div class="pic_summary">' +
                        '<div class="poi_summary2"></div>' +
                        '<span class="arrow"><i>◆</i><b>◆</b></span>' +
                    '</div>';


        div.innerHTML = html;
        $('.poi_summary2', $(div)).css({
            'overflow': 'hidden',
            'white-space': 'nowrap',
            'text-overflow': 'ellipsis'
        });
        google.maps.event.addDomListener(div, "click", function(event) {
            google.maps.event.trigger(self, "click", event);
        });
        /*
        google.maps.event.addDomListener($('.poi_summary', $(div))[0], "click", function(event) {
            google.maps.event.trigger(self, "poi_click", event);
        });
        */
        $(div).hover(function(event) {
            google.maps.event.trigger(self, "hover", event);
        }, function(event) {
            google.maps.event.trigger(self, "leave", event);
        });
        this.div = div;

        var panes = this.getPanes();
        panes.floatPane.appendChild(div);

    };

    timeinfobox.prototype.setData = function(data){

        this.poi_name = data.poi_name ;
        this.poi_url = data.poi_url;

        this.draw();

    };

    timeinfobox.prototype.draw = function() {

        var self = this;

        var div = self.div;
        if(div){
            var Point = self.getProjection().fromLatLngToDivPixel(self.position);

            if(self.left_side){
                $(div).addClass('side');
                div.style.left = (Point.x - 185 - self.x_offset) + 'px';
                div.style.top = (Point.y - 42 + self.y_offset) + 'px';
            }else{
                $(div).removeClass('side');
                div.style.left = (Point.x + 22  + self.x_offset) + 'px';
                div.style.top = (Point.y - 8  + self.y_offset) + 'px';
            }

            $('.poi_summary2',$(self.div)).html(self.poi_name);
        }

    };

    timeinfobox.prototype.removeFadeOut = function() {
        var self = this;
        if (self.div) {
            if($.BS.isIE){
                self.remove();
            }else{
                $(self.div).fadeOut(200,function(){
                    self.remove();
                });
            }
        }
    };

    timeinfobox.prototype.remove = function() {
        if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
            this.setMap(null);
        }
    };

}

window.init_gmapplus = init_gmapplus;
