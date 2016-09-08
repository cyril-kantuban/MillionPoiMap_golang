$(function(){
    function init_gmap(){
        init_gmapplus();
        var id = $('#map-canvas').data('id');
        //var type = $('#map-canvas').data('type'); 
        /*var click_handle = function(){
            if(type === 'board'){
                parent.window.location.href='/board/' + id + '/map';
            }else if(type === 'people'){
                parent.window.location.href='/people/' + id + '/collects';
            }
        };
        */
        var bounds = [0, 0, 128, 73];
        
        new ktb_map({
            map_id: 'map-canvas',
            type: type,
            id: id,
            bounds: bounds,
            enable_smart_scrollwheel: false,
            enable_scrollwheel: false, 
            enable_zoomControl: false,
            enable_mapTypeControl: false,
            enable_draggable: false,
            enable_info_box: false,
            onPOIClick: click_handle,
            onMapClick: click_handle
        });
    }
    window.init_gmap = init_gmap;

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://ditu.google.cn/maps/api/js?sensor=false&callback=init_gmap";
    document.body.appendChild(script);
});
