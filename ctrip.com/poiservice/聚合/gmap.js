document.write('<script src="velocity.min.js"></script>');
document.write('<script src="async.js"></script>');
document.write('<script src="jquery.base.js"></script>');
document.write('<script src="jquery.hashtable.js"></script>');
document.write('<script src="gmapplus.js"></script>');
document.write('<script src="ktb_map.js"></script>');

$(function(){

    function init_gmap(){
        init_gmapplus();
            var id = $('#map-canvas').data('id');
            var click_handle = function(poi){
        };
        
        var type = 'board'
        var bounds = [0, 0, 128, 73];

        new ktb_map({
            map_id: 'map-canvas',
            type: type,
            id: id,
            bounds: bounds,
            enable_smart_scrollwheel: true,
            enable_scrollwheel: true,
            enable_zoomControl: true,
            enable_mapTypeControl: true,
            enable_draggable: true,
            enable_info_box: true,
            onPOIClick: click_handle,
            onMapClick: null//click_handle
        });
        
    }

    window.init_gmap = init_gmap;
    
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://ditu.google.cn/maps/api/js?sensor=false&callback=init_gmap";
    document.body.appendChild(script);
});
