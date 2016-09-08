function initialize() {
    init_infobox();
    // Poygon getBounds extension
    if (!google.maps.Polygon.prototype.getBounds) {
        google.maps.Polygon.prototype.getBounds = function(latLng) {
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

        if (bounds != null && !bounds.contains(latLng)) {
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


    // Circle containsLatLng
    google.maps.Circle.prototype.containsLatLng = function(latLng) {

        var bounds = this.getBounds();

        if (bounds != null && !bounds.contains(latLng)) {
            return false;
        }

        if (google.maps.geometry.spherical.computeDistanceBetween(this.getCenter(), latLng) <= this.getRadius())
            return true;
        else
            return false;

    };

    // Circle getPosition
    google.maps.Circle.prototype.getPosition = function() {
        return this.getCenter();
    };


    // Rectangle containsLatLng
    google.maps.Rectangle.prototype.containsLatLng = function(latLng) {

        var bounds = this.getBounds();

        if (bounds != null && !bounds.contains(latLng)) {
            return false;
        }
        return true;
    };

    // Rectangle getPosition
    google.maps.Rectangle.prototype.getPosition = function() {
        return this.getBounds().getCenter();
    };


    //----------------------------------------------------------------
    /*var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "js/infobox.js";
    document.body.appendChild(script);
    */

    //扩展setTimeout方法，加入参数
    var __sto = setTimeout;
    window.setTimeout = function(callback, timeout, param) {
        var args = Array.prototype.slice.call(arguments, 2);
        if (args.length > 0) {
            var _cb = function() {
                callback.apply(null, args);
            };
            __sto(_cb, timeout);
        }
        else
            __sto(callback, timeout);
    };

    var map;
    var drawingManager;
    var currentID;
    var currentMarker;
    var currentOverlay;
    var currentIB;
    var geocoder;
    var place;
    var markersArray = [];
    var currentAddress;



    function init(){

        //geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(31.247080533798087, 121.45563185000003);
        var myOptions = {
            zoom: 16,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            noClear: true
        };
        map = new google.maps.Map(document.getElementById("pointbind_map"), myOptions);
        //google.maps.event.addListener(map, 'rightclick', function(event) { addPoint(event.latLng); });

        setExtoverViewMapControl(map);

        init_draw_tools(map);

        poi_names=['上海火车站','火车站','火车'];
        lat = 31.250058328103847;
        lng = 121.45600647129527;
        if (lat && lng){
            var marker = addMarker(new google.maps.LatLng(lat,lng), poi_names[0]);
            MoveToPoint(marker);
        }
        $('#pointbind_searchbar_text').html(poi_names[0]);

        $('#query').click(function(){
            var poi_name = $('#shangquan').find("option:selected").text();
            load_all_child_poi(poi_name);
        });

        area = '';
        //area = '31.25068833553871,121.45599246025085|31.25056909761173,121.45631432533264|31.250312276949828,121.45617485046387|31.250046283385025,121.45678639411926|31.24868878731493,121.45612120628357|31.248092583548686,121.45777344703674|31.24789079065207,121.45769834518433|31.24788161823742,121.45792365074158|31.24855120216454,121.45908236503601|31.248633753278835,121.45874977111816|31.24886306155098,121.45885705947876|31.249477604974306,121.45762324333191|31.250027938973602,121.45797729492188|31.249037335465363,121.45995140075684|31.24849616804824,121.45956516265869|31.248619994764784,121.4592969417572|31.248468650978058,121.45920038223267|31.247771549192286,121.45795583724976|31.247643135144116,121.45601391792297|31.24742299636954,121.45601391792297|31.247441341287026,121.45570278167725|31.24798251474944,121.45567059516907|31.247991687154293,121.45599246025085|31.247762376766058,121.45601391792297|31.24785410098816,121.45711898803711|31.249450088190116,121.4530098438263|31.24976194460778,121.45323514938354|31.249275815037542,121.45451188087463|31.250633302668046,121.45524144172668|31.25037648218079,121.45586371421814';
        if (area != ''){
            createPolygonByPathString(area);
        }


    }

    function load_all_child_poi(poi_name){
        $.ajax({
            url:"http://192.168.0.186:9528/dp_zone?zname=" + poi_name,//1855811",
            type:"get",
            dataType:"jsonp",
            cache:false,
            error:function(){
                //alert(data);
            },
            success:function(data){
                if(data){
                    if(!data.error){
                        deleteOverlays();
                        drawingManager.setDrawingMode(null);
                        var bounds = new google.maps.LatLngBounds();
                        for(var i=0;i<data.length;i++){
                            var tag = data[i];
                            var marker = addChildMarker(new google.maps.LatLng(tag.lat,tag.lng), tag.tag_name);
                            bounds.extend(marker.getPosition());
                            //console.log(tag.tag_id + " " + tag.tag_name + " " + tag.lat + " " + tag.lng);
                        }
                        map.fitBounds(bounds);
                    }
                }
            }
        });
    }

    function savePoint() {
        currentMarker.isSave = true;
        var boxText = document.createElement("div");
        boxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: white; padding: 5px;";
        boxText.innerHTML = currentMarker.getTitle() + "<br>经度：" + currentMarker.getPosition().lng() + "<br>纬度：" + currentMarker.getPosition().lat();
        currentIB.setContent(boxText);
        var lat = currentMarker.getPosition().lat();
        var lng = currentMarker.getPosition().lng();
        var poi_info = currentMarker.poi_info;
        //alert(currentID + lat + lng + poi_info);
        //onsave(currentID, lat, lng);
        $.ajax({
            type: "post",
            url: "",
            data:{
                poi_id:currentID,
                lat:lat,
                lng:lng,
                poi_info:poi_info
            },
            success: function(data, textStatus){
                alert('OK');
            }
        });
    }


    function addMarker(location, poi_name) {
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            title: poi_name ,
            animation: google.maps.Animation.DROP,
            draggable: false,
            optimized: true,
            icon: 'http://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=star|1111FF',
            //icon: './static/img/' + charList[index] + '_poi.png',
            shadow: new google.maps.MarkerImage('http://chart.googleapis.com/chart?chst=d_map_pin_shadow',
                    new google.maps.Size(40, 37),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(11, 37))
        });
        return marker;

        //markersArray.push(marker);
    }


    function addChildMarker(location, poi_name) {
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            title: poi_name ,
            animation: null,
            draggable: false,
            optimized: true,
            icon: 'http://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=star|FF1100'
            //icon: './static/img/' + charList[index] + '_poi.png',
        });
        markersArray.push(marker);
        return marker;
    }



    function MoveToPoint(marker) {

        map.panTo(marker.position);

    }
    // Deletes all markers in the array by removing references to them
    function deleteOverlays() {
        if (markersArray && markersArray.length > 0) {
            //alert(markersArray.length);
            for (var k=0;k<markersArray.length;k++) {
                markersArray[k].setMap(null);
            }
            markersArray.length = 0;
        }
    }

    function clearCurrentPoint() {
        if (currentIB !== null) {
            currentIB.setMap(null);
            currentIB = null;
        }
        if (currentMarker !== null) {
            currentMarker.setMap(null);
            currentMarker = null;
        }
    }


    function loadMap(poi_id, poi_names, lat, lng) {
        currentID = poi_id;
        currentAddress = poi_names[0];

    }



    init();

    function create_text_control(map) {
        var controlDiv = document.createElement('div');
        controlDiv.id = 'colorpicker_control';
        controlDiv.style.padding = '5px';

        // Set CSS for the control border
        var controlUI = document.createElement('div');
        controlUI.style.backgroundColor = 'white';
        controlUI.style.borderStyle = 'solid';
        controlUI.style.borderWidth = '1px';
        controlUI.style.cursor = 'pointer';
        controlUI.style.textAlign = 'center';

        controlUI.title = '点击选择颜色';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior
        var controlText = document.createElement('div');
        controlText.style.fontFamily = 'Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.paddingLeft = '4px';
        controlText.style.paddingRight = '4px';
        //controlText.style.width = '50px';
        controlText.style.height = '24px';
        controlText.style.width = '24px';
        controlUI.appendChild(controlText);


        $(controlUI).ColorPicker({
            //flat: true,
            color: '#00FF00',
            onShow: function (colpkr) {
                //$(colpkr).css('background-image', 'url(static/img/custom_background.png)');
                $(colpkr).fadeIn(200);
                return false;
            },
            onHide: function (colpkr) {
                $(colpkr).fadeOut(200);
                return false;
            },
            onChange: function (hsb, hex, rgb) {
                $(controlText).css('backgroundColor', '#' + hex);
            }
        });
        return controlDiv;

      }

    function init_draw_tools(map){
        drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYGON]
            },
            polygonOptions: {
                strokeColor: "#FF0000",
                strokeOpacity: 0.6,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.35,
                editable: false
            }
        });

        google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
            if (event.type == google.maps.drawing.OverlayType.POLYGON) {

                removeCurrentOverlay();
                currentOverlay = event.overlay;
                //google.maps.event.addListener(event.overlay, 'click', EditOverlay);

                currentOverlay.setOptions({
                strokeColor: "#0000FF",
                strokeOpacity: 0.6,
                strokeWeight: 2,
                fillColor: "#0000FF",
                fillOpacity: 0.35,
                editable: true
                });

                var boxText = $('<div></div>').css({
                    'font-weight':'bolder',
                    'color':'white',
                    'text-align':'center',
                    'margin':'0 auto 0 auto',
                    'width':'100px',
                    'height':'50px',
                    'font-family':'arial,sans-serif',
                    'font-size':'12px'
                });
                var saveBtn = $("<img width=30 height=30 src='static/img/save.png' title='保存' alt='保存'></img>")
                $(saveBtn).click(function(){
                    saveArea();
                });
                boxText.append(saveBtn);

                var myOptions = {
                    content: boxText[0],
                    disableAutoPan: true,
                    pixelOffset: new google.maps.Size(-50, -25),
                    //position: secheltLoc
                    closeBoxURL: "",
                    isHidden: false,
                    pane: "floatShadow",
                    enableEventPropagation: false
                };

                currentIB = new InfoBox(myOptions);
                currentIB.open(map, event.overlay);

                google.maps.event.addListener(event.overlay.getPath(), 'set_at', function() {
                    currentIB.open(map, event.overlay);
                });
                google.maps.event.addListener(event.overlay.getPath(), 'remove_at', function() {
                    currentIB.open(map, event.overlay);
                });
                google.maps.event.addListener(event.overlay.getPath(), 'insert_at', function() {
                    currentIB.open(map, event.overlay);
                });


                drawingManager.setDrawingMode(null);


            }
        });

        drawingManager.setMap(map);

    }

    function saveArea() {
        currentOverlay.isSave = true;
        var tempPath = '';
        for (var i = 0; i < currentOverlay.getPath().length; i++) {
            tempPath += currentOverlay.getPath().getAt(i).lat() + ',' + currentOverlay.getPath().getAt(i).lng() + "|";
        }
        if (tempPath.length > 0) {
            tempPath = tempPath.substring(0, tempPath.length - 1);
        }
        currentPath = tempPath;
        alert(currentPath);
        //onsave(currentDetailPostcode, currentPath, currentOverlay.getBounds().getSouthWest().lat(), currentOverlay.getBounds().getSouthWest().lng(), currentOverlay.getBounds().getNorthEast().lat(), currentOverlay.getBounds().getNorthEast().lng());
    }

    function cleanArea(){
        alert("清除成功");
    }

    function removeCurrentOverlay() {
        if (currentOverlay != null) {
            currentOverlay.setMap(null);
            currentOverlay = null;
        }
        if (currentIB != null) {
            currentIB.setMap(null);
            currentID = null;
        }
    }

    function createPolygonByPathString(chrPath) {
        var path = chrPath.split('|');
        var lanLngArray = [];
        for (var i = 0; i < path.length; i++) {
            lanLngArray.push(new google.maps.LatLng(path[i].split(',')[0], path[i].split(',')[1]));

        }

        currentOverlay = new google.maps.Polygon({
            paths: lanLngArray,
            strokeColor: "#0000FF",
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: "#0000FF",
            fillOpacity: 0.35,
            editable: true
        });

        var boxText = $('<div></div>').css({
                    'font-weight':'bolder',
                    'color':'white',
                    'text-align':'center',
                    'margin':'0 auto 0 auto',
                    'width':'100px',
                    'height':'50px',
                    'font-family':'arial,sans-serif',
                    'font-size':'12px'
        });
        var clearBtn = $("<img width=30 height=30 src='static/img/delete.png' title='清除' alt='清除'></img>");
        $(clearBtn).click(function(){
            cleanArea();
        });

        boxText.append(clearBtn);

        var myOptions = {
            content: boxText[0],
            disableAutoPan: true,
            pixelOffset: new google.maps.Size(-50, -25),
            closeBoxURL: "",
            isHidden: false,
            pane: "floatShadow",
            enableEventPropagation: false
        };

        currentIB = new InfoBox(myOptions);
        currentIB.open(map, currentOverlay);

        google.maps.event.addListener(currentOverlay.getPath(), 'set_at', function() {
            currentIB.open(map, currentOverlay);
            var saveBtn = $("<img width=30 height=30 src='static/img/save.png' title='保存' alt='保存'></img>");
            $(saveBtn).click(function(){
                saveArea();
            });
            boxText.empty().append(saveBtn);
        });
        google.maps.event.addListener(currentOverlay.getPath(), 'remove_at', function() {
            currentIB.open(map, currentOverlay);
            var saveBtn = $("<img width=30 height=30 src='static/img/save.png' title='保存' alt='保存'></img>");
            $(saveBtn).click(function(){
                saveArea();
            });
            boxText.empty().append(saveBtn);
        });
        google.maps.event.addListener(currentOverlay.getPath(), 'insert_at', function() {
            currentIB.open(map, currentOverlay);
            var saveBtn = $("<img width=30 height=30 src='static/img/save.png' title='保存' alt='保存'></img>");
            $(saveBtn).click(function(){
                saveArea();
            });
            boxText.empty().append(saveBtn);
        });


        map.fitBounds(currentOverlay.getBounds());
        currentOverlay.setMap(map);
        drawingManager.setDrawingMode(null);

    }


}

function loadScript() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://ditu.google.cn/maps/api/js?language=chinese&sensor=false&v=3.10&libraries=places,geometry,drawing&callback=initialize";
    //script.src = "https://maps-api-ssl.google.com/maps/api/js?&sensor=false&v=3.9&libraries=places&callback=initialize";
    document.body.appendChild(script);
}

window.onload = loadScript;

