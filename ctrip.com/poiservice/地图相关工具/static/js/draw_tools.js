function initialize() {
    var getStringByLatlng = function(latlng){
        return latlng.lat() + ',' + latlng.lng();
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
        google.maps.event.addListener(overlay, 'click', function(){
            select_overlay(this);
        });
        google.maps.event.addListener(overlay, 'rightclick', function(event){
            google.maps.event.trigger(map, "rightclick", event);
        });
        overlay.setMap(map);
        add_overlay(overlay);
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
        google.maps.event.addListener(overlay, 'click', function(){
            select_overlay(this);
        });
        google.maps.event.addListener(overlay, 'rightclick', function(event){
            google.maps.event.trigger(map, "rightclick", event);
        });
        overlay.setMap(map);
        add_overlay(overlay);
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

        google.maps.event.addListener(overlay, 'click', function(){
            select_overlay(this);
        });
        google.maps.event.addListener(overlay, 'rightclick', function(event){
            google.maps.event.trigger(map, "rightclick", event);
        });
        overlay.setMap(map);
        add_overlay(overlay);
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

        google.maps.event.addListener(overlay, 'click', function(){
            select_overlay(this);
        });
        google.maps.event.addListener(overlay, 'rightclick', function(event){
            google.maps.event.trigger(map, "rightclick", event);
        });
        overlay.setMap(map);
        add_overlay(overlay);
        return overlay;
    };

    function poimarker(opt_options) {
        this.setValues(opt_options);
    }
    poimarker.prototype = new google.maps.OverlayView();

    poimarker.getPositionByString = function(obj_str){
        return new google.maps.LatLng(obj_str.split(',')[0], obj_str.split(',')[1]);
    };
    poimarker.prototype.getPositionString = function(){
        return this.position.lat() + ',' + this.position.lng();
    };

    poimarker.loadByData = function(obj){
        var overlay = new poimarker({
            position: this.getPositionByString(obj.position),
            map: map,
            title: obj.title,
            marker_type:obj.marker_type,
            animation: google.maps.Animation.DROP,
            is_selected: false,
            overlay_type:obj.type,
            zIndex:obj.zIndex
        });

        google.maps.event.addListener(overlay, 'click', function(e){
            select_overlay(this);
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault){
                e.preventDefault();
            }
        });
        overlay.setMap(map);
        add_overlay(overlay);
    };

    poimarker.prototype.show = function(){
        $(this.div).show();
    };

    poimarker.prototype.hide = function(){
        $(this.div).hide();
    };

    poimarker.prototype.onRemove = function () {
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
      if (this.edit_box){
        this.edit_box.parentNode.removeChild(this.edit_box);
        this.edit_box = null;
      }
    };

    poimarker.prototype.setAnimation = function (animation){
        this.animation = animation;
        if(this.div)
            this.draw();
    };

    poimarker.prototype.setZindex = function (zindex){
        this.zIndex = zindex;
        if(this.div){
            $(this.div).css({
                'z-index':this.zIndex
            });
        }
    };

    poimarker.prototype.setPosition = function (position){
        this.position = position;
        if(this.div)
            this.draw();
    };

    poimarker.prototype.getPosition = function (){
            return this.position;
    };

    poimarker.prototype.onAdd = function () {

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

        _html = '<a href="#" class="m_icon_' + this.marker_type + '"></a>';
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
            var inputText = prompt("请输入文本",self.title);
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

    poimarker.prototype.draw = function() {

        var self = this;

        var div = this.div;
        var edit_box = this.edit_box;
        var point = this.getProjection().fromLatLngToDivPixel(this.position);
        $(edit_box).css({
            'left': (point.x-30) + 'px',
            'top':  point.y + 'px'
        });
        if (this.animation != null){
            if(this.animation == google.maps.Animation.DROP){
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
                        endPoint = self.getProjection().fromLatLngToDivPixel(self.position);
                        div.style.left = endPoint.x + 'px';
                        div.style.top = endPoint.y + 'px';

                        self.animation = null;
                    }
                });
            }else if(this.animation == google.maps.Animation.BOUNCE){
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

     Array.prototype.indexOf = function(val) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == val) return i;
        }
        return -1;
    };
    Array.prototype.remove = function(val) {
        var index = this.indexOf(val);
        if (index > -1) {
            this.splice(index, 1);
        }
    };
    /*-------------------------------------------------------------------------
    ########################
    jquery easing v1.3
    ########################
    -------------------------------------------------------------------------*/
    jQuery.easing['jswing'] = jQuery.easing['swing'];

    jQuery.extend( jQuery.easing,
    {
        def: 'easeOutQuad',
        swing: function (x, t, b, c, d) {
            //alert(jQuery.easing.default);
            return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
        },
        easeInQuad: function (x, t, b, c, d) {
            return c*(t/=d)*t + b;
        },
        easeOutQuad: function (x, t, b, c, d) {
            return -c *(t/=d)*(t-2) + b;
        },
        easeInOutQuad: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },
        easeInCubic: function (x, t, b, c, d) {
            return c*(t/=d)*t*t + b;
        },
        easeOutCubic: function (x, t, b, c, d) {
            return c*((t=t/d-1)*t*t + 1) + b;
        },
        easeInOutCubic: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        },
        easeInQuart: function (x, t, b, c, d) {
            return c*(t/=d)*t*t*t + b;
        },
        easeOutQuart: function (x, t, b, c, d) {
            return -c * ((t=t/d-1)*t*t*t - 1) + b;
        },
        easeInOutQuart: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
            return -c/2 * ((t-=2)*t*t*t - 2) + b;
        },
        easeInQuint: function (x, t, b, c, d) {
            return c*(t/=d)*t*t*t*t + b;
        },
        easeOutQuint: function (x, t, b, c, d) {
            return c*((t=t/d-1)*t*t*t*t + 1) + b;
        },
        easeInOutQuint: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
            return c/2*((t-=2)*t*t*t*t + 2) + b;
        },
        easeInSine: function (x, t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },
        easeOutSine: function (x, t, b, c, d) {
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        },
        easeInOutSine: function (x, t, b, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        },
        easeInExpo: function (x, t, b, c, d) {
            return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
        },
        easeOutExpo: function (x, t, b, c, d) {
            return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },
        easeInOutExpo: function (x, t, b, c, d) {
            if (t==0) return b;
            if (t==d) return b+c;
            if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
            return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
        },
        easeInCirc: function (x, t, b, c, d) {
            return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
        },
        easeOutCirc: function (x, t, b, c, d) {
            return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
        },
        easeInOutCirc: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
        },
        easeInElastic: function (x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        },
        easeOutElastic: function (x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
        },
        easeInOutElastic: function (x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
            return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
        },
        easeInBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },
        easeOutBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },
        easeInOutBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
        },
        easeInBounce: function (x, t, b, c, d) {
            return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
        },
        easeOutBounce: function (x, t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
            }
        },
        easeInOutBounce: function (x, t, b, c, d) {
            if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
            return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
        }
    });


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

    // Polyline getBounds extension
    if (!google.maps.Polyline.prototype.getBounds) {
        google.maps.Polyline.prototype.getBounds = function(latLng) {
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

    /**
     * @name InfoBox
     * @version 1.1.11 [January 9, 2012]
     * @author Gary Little (inspired by proof-of-concept code from Pamela Fox of Google)
     * @copyright Copyright 2010 Gary Little [gary at luxcentral.com]
     * @fileoverview InfoBox extends the Google Maps JavaScript API V3 <tt>OverlayView</tt> class.
     *  <p>
     *  An InfoBox behaves like a <tt>google.maps.InfoWindow</tt>, but it supports several
     *  additional properties for advanced styling. An InfoBox can also be used as a map label.
     *  <p>
     *  An InfoBox also fires the same events as a <tt>google.maps.InfoWindow</tt>.
     */

    /*!
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *       http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /*jslint browser:true */
    /*global google */

    /**
     * @name InfoBoxOptions
     * @class This class represents the optional parameter passed to the {@link InfoBox} constructor.
     * @property {string|Node} content The content of the InfoBox (plain text or an HTML DOM node).
     * @property {boolean} disableAutoPan Disable auto-pan on <tt>open</tt> (default is <tt>false</tt>).
     * @property {number} maxWidth The maximum width (in pixels) of the InfoBox. Set to 0 if no maximum.
     * @property {Size} pixelOffset The offset (in pixels) from the top left corner of the InfoBox
     *  (or the bottom left corner if the <code>alignBottom</code> property is <code>true</code>)
     *  to the map pixel corresponding to <tt>position</tt>.
     * @property {LatLng} position The geographic location at which to display the InfoBox.
     * @property {number} zIndex The CSS z-index style value for the InfoBox.
     *  Note: This value overrides a zIndex setting specified in the <tt>boxStyle</tt> property.
     * @property {string} boxClass The name of the CSS class defining the styles for the InfoBox container.
     *  The default name is <code>infoBox</code>.
     * @property {Object} [boxStyle] An object literal whose properties define specific CSS
     *  style values to be applied to the InfoBox. Style values defined here override those that may
     *  be defined in the <code>boxClass</code> style sheet. If this property is changed after the
     *  InfoBox has been created, all previously set styles (except those defined in the style sheet)
     *  are removed from the InfoBox before the new style values are applied.
     * @property {string} closeBoxMargin The CSS margin style value for the close box.
     *  The default is "2px" (a 2-pixel margin on all sides).
     * @property {string} closeBoxURL The URL of the image representing the close box.
     *  Note: The default is the URL for Google's standard close box.
     *  Set this property to "" if no close box is required.
     * @property {Size} infoBoxClearance Minimum offset (in pixels) from the InfoBox to the
     *  map edge after an auto-pan.
     * @property {boolean} isHidden Hide the InfoBox on <tt>open</tt> (default is <tt>false</tt>).
     * @property {boolean} alignBottom Align the bottom left corner of the InfoBox to the <code>position</code>
     *  location (default is <tt>false</tt> which means that the top left corner of the InfoBox is aligned).
     * @property {string} pane The pane where the InfoBox is to appear (default is "floatPane").
     *  Set the pane to "mapPane" if the InfoBox is being used as a map label.
     *  Valid pane names are the property names for the <tt>google.maps.MapPanes</tt> object.
     * @property {boolean} enableEventPropagation Propagate mousedown, mousemove, mouseover, mouseout,
     *  mouseup, click, dblclick, touchstart, touchend, touchmove, and contextmenu events in the InfoBox
     *  (default is <tt>false</tt> to mimic the behavior of a <tt>google.maps.InfoWindow</tt>). Set
     *  this property to <tt>true</tt> if the InfoBox is being used as a map label.
     */

    /**
     * Creates an InfoBox with the options specified in {@link InfoBoxOptions}.
     *  Call <tt>InfoBox.open</tt> to add the box to the map.
     * @constructor
     * @param {InfoBoxOptions} [opt_opts]
     */

    function InfoBox(opt_opts) {

      opt_opts = opt_opts || {};

      google.maps.OverlayView.apply(this, arguments);

      // Standard options (in common with google.maps.InfoWindow):
      //
      this.content_ = opt_opts.content || "";
      this.disableAutoPan_ = opt_opts.disableAutoPan || false;
      this.maxWidth_ = opt_opts.maxWidth || 0;
      this.pixelOffset_ = opt_opts.pixelOffset || new google.maps.Size(0, 0);
      this.position_ = opt_opts.position || new google.maps.LatLng(0, 0);
      this.zIndex_ = opt_opts.zIndex || null;

      // Additional options (unique to InfoBox):
      //
      this.boxClass_ = opt_opts.boxClass || "infoBox";
      this.boxStyle_ = opt_opts.boxStyle || {};
      this.closeBoxMargin_ = opt_opts.closeBoxMargin || "2px";
      this.closeBoxURL_ = opt_opts.closeBoxURL || "http://www.google.com/intl/en_us/mapfiles/close.gif";
      if (opt_opts.closeBoxURL === "") {
        this.closeBoxURL_ = "";
      }
      this.infoBoxClearance_ = opt_opts.infoBoxClearance || new google.maps.Size(1, 1);
      this.isHidden_ = opt_opts.isHidden || false;
      this.alignBottom_ = opt_opts.alignBottom || false;
      this.pane_ = opt_opts.pane || "floatPane";
      this.enableEventPropagation_ = opt_opts.enableEventPropagation || false;

      this.div_ = null;
      this.closeListener_ = null;
      this.moveListener_ = null;
      this.contextListener_ = null;
      this.eventListeners_ = null;
      this.fixedWidthSet_ = null;
    }

    /* InfoBox extends OverlayView in the Google Maps API v3.
     */
    InfoBox.prototype = new google.maps.OverlayView();

    /**
     * Creates the DIV representing the InfoBox.
     * @private
     */
    InfoBox.prototype.createInfoBoxDiv_ = function () {

      var i;
      var events;
      var bw;
      var me = this;

      // This handler prevents an event in the InfoBox from being passed on to the map.
      //
      var cancelHandler = function (e) {
        e.cancelBubble = true;
        if (e.stopPropagation) {
          e.stopPropagation();
        }
      };

      // This handler ignores the current event in the InfoBox and conditionally prevents
      // the event from being passed on to the map. It is used for the contextmenu event.
      //
      var ignoreHandler = function (e) {

        e.returnValue = false;

        if (e.preventDefault) {

          e.preventDefault();
        }

        if (!me.enableEventPropagation_) {

          cancelHandler(e);
        }
      };

      if (!this.div_) {

        this.div_ = document.createElement("div");

        this.setBoxStyle_();

        if (typeof this.content_.nodeType === "undefined") {
          this.div_.innerHTML = this.getCloseBoxImg_() + this.content_;
        } else {
          this.div_.innerHTML = this.getCloseBoxImg_();
          this.div_.appendChild(this.content_);
        }

        // Add the InfoBox DIV to the DOM
        this.getPanes()[this.pane_].appendChild(this.div_);

        this.addClickHandler_();

        if (this.div_.style.width) {

          this.fixedWidthSet_ = true;

        } else {

          if (this.maxWidth_ !== 0 && this.div_.offsetWidth > this.maxWidth_) {

            this.div_.style.width = this.maxWidth_;
            this.div_.style.overflow = "auto";
            this.fixedWidthSet_ = true;

          } else { // The following code is needed to overcome problems with MSIE

            bw = this.getBoxWidths_();

            this.div_.style.width = (this.div_.offsetWidth - bw.left - bw.right) + "px";
            this.fixedWidthSet_ = false;
          }
        }

        this.panBox_(this.disableAutoPan_);

        if (!this.enableEventPropagation_) {

          this.eventListeners_ = [];

          // Cancel event propagation.
          //
          // Note: mousemove not included (to resolve Issue 152)
          events = ["mousedown", "mouseover", "mouseout", "mouseup",
          "click", "dblclick", "touchstart", "touchend", "touchmove"];

          for (i = 0; i < events.length; i++) {

            this.eventListeners_.push(google.maps.event.addDomListener(this.div_, events[i], cancelHandler));
          }

          // Workaround for Google bug that causes the cursor to change to a pointer
          // when the mouse moves over a marker underneath InfoBox.
          this.eventListeners_.push(google.maps.event.addDomListener(this.div_, "mouseover", function (e) {
            this.style.cursor = "default";
          }));
        }

        this.contextListener_ = google.maps.event.addDomListener(this.div_, "contextmenu", ignoreHandler);

        /**
         * This event is fired when the DIV containing the InfoBox's content is attached to the DOM.
         * @name InfoBox#domready
         * @event
         */
        google.maps.event.trigger(this, "domready");
      }
    };

    /**
     * Returns the HTML <IMG> tag for the close box.
     * @private
     */
    InfoBox.prototype.getCloseBoxImg_ = function () {

      var img = "";

      if (this.closeBoxURL_ !== "") {

        img  = "<img";
        img += " src='" + this.closeBoxURL_ + "'";
        img += " align=right"; // Do this because Opera chokes on style='float: right;'
        img += " style='";
        img += " position: relative;"; // Required by MSIE
        img += " cursor: pointer;";
        img += " margin: " + this.closeBoxMargin_ + ";";
        img += "'>";
      }

      return img;
    };

    /**
     * Adds the click handler to the InfoBox close box.
     * @private
     */
    InfoBox.prototype.addClickHandler_ = function () {

      var closeBox;

      if (this.closeBoxURL_ !== "") {

        closeBox = this.div_.firstChild;
        this.closeListener_ = google.maps.event.addDomListener(closeBox, 'click', this.getCloseClickHandler_());

      } else {

        this.closeListener_ = null;
      }
    };

    /**
     * Returns the function to call when the user clicks the close box of an InfoBox.
     * @private
     */
    InfoBox.prototype.getCloseClickHandler_ = function () {

      var me = this;

      return function (e) {

        // 1.0.3 fix: Always prevent propagation of a close box click to the map:
        e.cancelBubble = true;

        if (e.stopPropagation) {

          e.stopPropagation();
        }

        /**
         * This event is fired when the InfoBox's close box is clicked.
         * @name InfoBox#closeclick
         * @event
         */
        google.maps.event.trigger(me, "closeclick");

        me.close();
      };
    };

    /**
     * Pans the map so that the InfoBox appears entirely within the map's visible area.
     * @private
     */
    InfoBox.prototype.panBox_ = function (disablePan) {

      var map;
      var bounds;
      var xOffset = 0, yOffset = 0;

      if (!disablePan) {

        map = this.getMap();

        if (map instanceof google.maps.Map) { // Only pan if attached to map, not panorama

          if (!map.getBounds().contains(this.position_)) {
          // Marker not in visible area of map, so set center
          // of map to the marker position first.
            map.setCenter(this.position_);
          }

          bounds = map.getBounds();

          var mapDiv = map.getDiv();
          var mapWidth = mapDiv.offsetWidth;
          var mapHeight = mapDiv.offsetHeight;
          var iwOffsetX = this.pixelOffset_.width;
          var iwOffsetY = this.pixelOffset_.height;
          var iwWidth = this.div_.offsetWidth;
          var iwHeight = this.div_.offsetHeight;
          var padX = this.infoBoxClearance_.width;
          var padY = this.infoBoxClearance_.height;
          var pixPosition = this.getProjection().fromLatLngToContainerPixel(this.position_);

          if (pixPosition.x < (-iwOffsetX + padX)) {
            xOffset = pixPosition.x + iwOffsetX - padX;
          } else if ((pixPosition.x + iwWidth + iwOffsetX + padX) > mapWidth) {
            xOffset = pixPosition.x + iwWidth + iwOffsetX + padX - mapWidth;
          }
          if (this.alignBottom_) {
            if (pixPosition.y < (-iwOffsetY + padY + iwHeight)) {
              yOffset = pixPosition.y + iwOffsetY - padY - iwHeight;
            } else if ((pixPosition.y + iwOffsetY + padY) > mapHeight) {
              yOffset = pixPosition.y + iwOffsetY + padY - mapHeight;
            }
          } else {
            if (pixPosition.y < (-iwOffsetY + padY)) {
              yOffset = pixPosition.y + iwOffsetY - padY;
            } else if ((pixPosition.y + iwHeight + iwOffsetY + padY) > mapHeight) {
              yOffset = pixPosition.y + iwHeight + iwOffsetY + padY - mapHeight;
            }
          }

          if (!(xOffset === 0 && yOffset === 0)) {

            // Move the map to the shifted center.
            //
            var c = map.getCenter();
            map.panBy(xOffset, yOffset);
          }
        }
      }
    };

    /**
     * Sets the style of the InfoBox by setting the style sheet and applying
     * other specific styles requested.
     * @private
     */
    InfoBox.prototype.setBoxStyle_ = function () {

      var i, boxStyle;

      if (this.div_) {

        // Apply style values from the style sheet defined in the boxClass parameter:
        this.div_.className = this.boxClass_;

        // Clear existing inline style values:
        this.div_.style.cssText = "";

        // Apply style values defined in the boxStyle parameter:
        boxStyle = this.boxStyle_;
        for (i in boxStyle) {

          if (boxStyle.hasOwnProperty(i)) {

            this.div_.style[i] = boxStyle[i];
          }
        }

        // Fix up opacity style for benefit of MSIE:
        //
        if (typeof this.div_.style.opacity !== "undefined" && this.div_.style.opacity !== "") {

          this.div_.style.filter = "alpha(opacity=" + (this.div_.style.opacity * 100) + ")";
        }

        // Apply required styles:
        //
        this.div_.style.position = "absolute";
        this.div_.style.visibility = 'hidden';
        if (this.zIndex_ !== null) {

          this.div_.style.zIndex = this.zIndex_;
        }
      }
    };

    /**
     * Get the widths of the borders of the InfoBox.
     * @private
     * @return {Object} widths object (top, bottom left, right)
     */
    InfoBox.prototype.getBoxWidths_ = function () {

      var computedStyle;
      var bw = {top: 0, bottom: 0, left: 0, right: 0};
      var box = this.div_;

      if (document.defaultView && document.defaultView.getComputedStyle) {

        computedStyle = box.ownerDocument.defaultView.getComputedStyle(box, "");

        if (computedStyle) {

          // The computed styles are always in pixel units (good!)
          bw.top = parseInt(computedStyle.borderTopWidth, 10) || 0;
          bw.bottom = parseInt(computedStyle.borderBottomWidth, 10) || 0;
          bw.left = parseInt(computedStyle.borderLeftWidth, 10) || 0;
          bw.right = parseInt(computedStyle.borderRightWidth, 10) || 0;
        }

      } else if (document.documentElement.currentStyle) { // MSIE

        if (box.currentStyle) {

          // The current styles may not be in pixel units, but assume they are (bad!)
          bw.top = parseInt(box.currentStyle.borderTopWidth, 10) || 0;
          bw.bottom = parseInt(box.currentStyle.borderBottomWidth, 10) || 0;
          bw.left = parseInt(box.currentStyle.borderLeftWidth, 10) || 0;
          bw.right = parseInt(box.currentStyle.borderRightWidth, 10) || 0;
        }
      }

      return bw;
    };

    /**
     * Invoked when <tt>close</tt> is called. Do not call it directly.
     */
    InfoBox.prototype.onRemove = function () {

      if (this.div_) {

        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
      }
    };

    /**
     * Draws the InfoBox based on the current map projection and zoom level.
     */
    InfoBox.prototype.draw = function () {

      this.createInfoBoxDiv_();

      var pixPosition = this.getProjection().fromLatLngToDivPixel(this.position_);

      this.div_.style.left = (pixPosition.x + this.pixelOffset_.width) + "px";

      if (this.alignBottom_) {
        this.div_.style.bottom = -(pixPosition.y + this.pixelOffset_.height) + "px";
      } else {
        this.div_.style.top = (pixPosition.y + this.pixelOffset_.height) + "px";
      }

      if (this.isHidden_) {

        this.div_.style.visibility = 'hidden';

      } else {

        this.div_.style.visibility = "visible";
      }
    };

    /**
     * Sets the options for the InfoBox. Note that changes to the <tt>maxWidth</tt>,
     *  <tt>closeBoxMargin</tt>, <tt>closeBoxURL</tt>, and <tt>enableEventPropagation</tt>
     *  properties have no affect until the current InfoBox is <tt>close</tt>d and a new one
     *  is <tt>open</tt>ed.
     * @param {InfoBoxOptions} opt_opts
     */
    InfoBox.prototype.setOptions = function (opt_opts) {
      if (typeof opt_opts.boxClass !== "undefined") { // Must be first

        this.boxClass_ = opt_opts.boxClass;
        this.setBoxStyle_();
      }
      if (typeof opt_opts.boxStyle !== "undefined") { // Must be second

        this.boxStyle_ = opt_opts.boxStyle;
        this.setBoxStyle_();
      }
      if (typeof opt_opts.content !== "undefined") {

        this.setContent(opt_opts.content);
      }
      if (typeof opt_opts.disableAutoPan !== "undefined") {

        this.disableAutoPan_ = opt_opts.disableAutoPan;
      }
      if (typeof opt_opts.maxWidth !== "undefined") {

        this.maxWidth_ = opt_opts.maxWidth;
      }
      if (typeof opt_opts.pixelOffset !== "undefined") {

        this.pixelOffset_ = opt_opts.pixelOffset;
      }
      if (typeof opt_opts.alignBottom !== "undefined") {

        this.alignBottom_ = opt_opts.alignBottom;
      }
      if (typeof opt_opts.position !== "undefined") {

        this.setPosition(opt_opts.position);
      }
      if (typeof opt_opts.zIndex !== "undefined") {

        this.setZIndex(opt_opts.zIndex);
      }
      if (typeof opt_opts.closeBoxMargin !== "undefined") {

        this.closeBoxMargin_ = opt_opts.closeBoxMargin;
      }
      if (typeof opt_opts.closeBoxURL !== "undefined") {

        this.closeBoxURL_ = opt_opts.closeBoxURL;
      }
      if (typeof opt_opts.infoBoxClearance !== "undefined") {

        this.infoBoxClearance_ = opt_opts.infoBoxClearance;
      }
      if (typeof opt_opts.isHidden !== "undefined") {

        this.isHidden_ = opt_opts.isHidden;
      }
      if (typeof opt_opts.enableEventPropagation !== "undefined") {

        this.enableEventPropagation_ = opt_opts.enableEventPropagation;
      }

      if (this.div_) {

        this.draw();
      }
    };

    /**
     * Sets the content of the InfoBox.
     *  The content can be plain text or an HTML DOM node.
     * @param {string|Node} content
     */
    InfoBox.prototype.setContent = function (content) {
      this.content_ = content;

      if (this.div_) {

        if (this.closeListener_) {

          google.maps.event.removeListener(this.closeListener_);
          this.closeListener_ = null;
        }

        // Odd code required to make things work with MSIE.
        //
        if (!this.fixedWidthSet_) {

          this.div_.style.width = "";
        }

        if (typeof content.nodeType === "undefined") {
          this.div_.innerHTML = this.getCloseBoxImg_() + content;
        } else {
          this.div_.innerHTML = this.getCloseBoxImg_();
          this.div_.appendChild(content);
        }

        // Perverse code required to make things work with MSIE.
        // (Ensures the close box does, in fact, float to the right.)
        //
        if (!this.fixedWidthSet_) {
          this.div_.style.width = this.div_.offsetWidth + "px";
          if (typeof content.nodeType === "undefined") {
            this.div_.innerHTML = this.getCloseBoxImg_() + content;
          } else {
            this.div_.innerHTML = this.getCloseBoxImg_();
            this.div_.appendChild(content);
          }
        }

        this.addClickHandler_();
      }

      /**
       * This event is fired when the content of the InfoBox changes.
       * @name InfoBox#content_changed
       * @event
       */
      google.maps.event.trigger(this, "content_changed");
    };

    /**
     * Sets the geographic location of the InfoBox.
     * @param {LatLng} latlng
     */
    InfoBox.prototype.setPosition = function (latlng) {

      this.position_ = latlng;

      if (this.div_) {

        this.draw();
      }

      /**
       * This event is fired when the position of the InfoBox changes.
       * @name InfoBox#position_changed
       * @event
       */
      google.maps.event.trigger(this, "position_changed");
    };

    /**
     * Sets the zIndex style for the InfoBox.
     * @param {number} index
     */
    InfoBox.prototype.setZIndex = function (index) {

      this.zIndex_ = index;

      if (this.div_) {

        this.div_.style.zIndex = index;
      }

      /**
       * This event is fired when the zIndex of the InfoBox changes.
       * @name InfoBox#zindex_changed
       * @event
       */
      google.maps.event.trigger(this, "zindex_changed");
    };

    /**
     * Returns the content of the InfoBox.
     * @returns {string}
     */
    InfoBox.prototype.getContent = function () {

      return this.content_;
    };

    /**
     * Returns the geographic location of the InfoBox.
     * @returns {LatLng}
     */
    InfoBox.prototype.getPosition = function () {

      return this.position_;
    };

    /**
     * Returns the zIndex for the InfoBox.
     * @returns {number}
     */
    InfoBox.prototype.getZIndex = function () {

      return this.zIndex_;
    };

    /**
     * Shows the InfoBox.
     */
    InfoBox.prototype.show = function () {

      this.isHidden_ = false;
      if (this.div_) {
        this.div_.style.visibility = "visible";
      }
    };

    /**
     * Hides the InfoBox.
     */
    InfoBox.prototype.hide = function () {

      this.isHidden_ = true;
      if (this.div_) {
        this.div_.style.visibility = "hidden";
      }
    };

    /**
     * Adds the InfoBox to the specified map or Street View panorama. If <tt>anchor</tt>
     *  (usually a <tt>google.maps.Marker</tt>) is specified, the position
     *  of the InfoBox is set to the position of the <tt>anchor</tt>. If the
     *  anchor is dragged to a new location, the InfoBox moves as well.
     * @param {Map|StreetViewPanorama} map
     * @param {MVCObject} [anchor]
     */
    InfoBox.prototype.open = function (map, anchor) {

      var me = this;

      if (anchor) {

        this.position_ = anchor.getPosition();
        this.moveListener_ = google.maps.event.addListener(anchor, "position_changed", function () {
          me.setPosition(this.getPosition());
        });
      }

      this.setMap(map);

      if (this.div_) {

        this.panBox_();
      }
    };

    /**
     * Removes the InfoBox from the map.
     */
    InfoBox.prototype.close = function () {

      var i;

      if (this.closeListener_) {

        google.maps.event.removeListener(this.closeListener_);
        this.closeListener_ = null;
      }

      if (this.eventListeners_) {

        for (i = 0; i < this.eventListeners_.length; i++) {

          google.maps.event.removeListener(this.eventListeners_[i]);
        }
        this.eventListeners_ = null;
      }

      if (this.moveListener_) {

        google.maps.event.removeListener(this.moveListener_);
        this.moveListener_ = null;
      }

      if (this.contextListener_) {

        google.maps.event.removeListener(this.contextListener_);
        this.contextListener_ = null;
      }

      this.setMap(null);
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

    var currentIB;
    var markersArray = [];
    var currentAddress;
    var max_zindex = 1;

    var command_list = [];
    var overlay_list = [];
    var currentOverlay = null;
    var currentColor = '#FF0000';

    var do_command = function(command){
        command_list.push(command);
        command.do();

        set_undo_control_enabled(true);
        //console.log(overlay_list.length);
        if(get_selected() != null){
            set_remove_control_enabled(true);
        }else{
            set_remove_control_enabled(false);
        }
    };

    var undo_command = function(){
        var command = command_list.pop();
        command.undo();

        if(command_list.length > 0){
            set_undo_control_enabled(true);
        }else{
            set_undo_control_enabled(false);
        }

        if(get_selected() != null){
            set_remove_control_enabled(true);
        }else{
            set_remove_control_enabled(false);
        }
    };

    var add_overlay = function(overlay){
        overlay_list.push(overlay);
    };

    var remove_overlay = function(overlay){
        overlay_list.remove(overlay);
    };

    var select_overlay = function(overlay){
        for(var i=0;i<overlay_list.length;i++){
            var item = overlay_list[i];
            if(item.setEditable){
                item.setEditable(false);
                item.setDraggable(false);
            }
            else if(item.overlay_type == 'marker'){
                item.setAnimation(null);
            }
            item.is_selected = false;
        }
        if(overlay){
            if(overlay.setEditable){
                overlay.setEditable(true);
                overlay.setDraggable(true);
                set_bring_to_front_control_enabled(true);
            }else if(overlay.overlay_type == 'marker'){
                overlay.setAnimation(google.maps.Animation.BOUNCE);
                console.log(overlay.title);
                set_bring_to_front_control_enabled(true);
            }
            overlay.is_selected = true;
            currentOverlay = overlay;
            set_remove_control_enabled(true);
        }else{
            currentOverlay = null;
            set_remove_control_enabled(false);
            set_bring_to_front_control_enabled(false);
        }
    };

    var get_selected = function(){
        var selected = null;
        for(var i in overlay_list){
            var item = overlay_list[i];
            if(item.is_selected === true){
                return item;
            }
        }
        return null;
    };

    var base_command = function(){
        this.init();
    };
    $.extend(base_command.prototype,{
        init: function(){
            //alert('base_command init');
        },
        do: function(){
            //alert('base_command do');
        },
        undo: function(){
            //alert('base_command undo');
        }
    });

    var set_position_command = function(overlay,position){
        this.init(overlay,position);
    };
    set_position_command.prototype = new base_command();
    $.extend(set_position_command.prototype,{
        init: function(obj, position){
            var self = this;
            self.overlay = obj;
            self.new_position = position;
            self.old_position = self.overlay.position;
        },
        do: function(){
            var self = this;
            if(self.overlay.overlay_type == 'marker'){
                self.overlay.setPosition(self.new_position);
            }
        },
        undo: function(){
            var self = this;
            if(self.overlay.overlay_type == 'marker'){
                self.overlay.setPosition(self.old_position);
            }
        }
    });

    var bring_to_front_command = function(overlay){
        this.init(overlay);
    };
    bring_to_front_command.prototype = new base_command();
    $.extend(bring_to_front_command.prototype,{
        init: function(obj){
            var self = this;
            self.overlay = obj;
            self.old_zindex = self.overlay.zindex;
        },
        do: function(){
            var self = this;
            if(self.overlay.overlay_type == 'marker'){
                self.overlay.setZindex(max_zindex++);
            }else{
                self.overlay.setOptions({
                    zIndex:max_zindex++
                });
            }
        },
        undo: function(){
            var self = this;
            if(self.overlay.overlay_type == 'marker'){
                self.overlay.setZindex(old_zindex);
            }else{
                self.overlay.setOptions({
                    zIndex:self.old_zindex
                })
            }
        }
    });

    var remove_command = function(overlay){
        this.init(overlay);
    };
    remove_command.prototype = new base_command();
    $.extend(remove_command.prototype,{
        init: function(obj){
            var self = this;
            self.overlay = obj;
        },
        do: function(){
            var self = this;
            self.overlay.setMap(null);
            remove_overlay(self.overlay);
            currentOverlay = null;
            select_overlay(null);
        },
        undo: function(){
            var self = this;
            self.overlay.setMap(map);
            add_overlay(self.overlay);
            select_overlay(self.overlay);
        }
    });

    var polygon_command = function(overlay){
        this.init(overlay);
    };
    polygon_command.prototype = new base_command();
    $.extend(polygon_command.prototype,{
        init: function(obj){
            var self = this;
            self.overlay = obj;
            self.overlay.zIndex = max_zindex++;
        },
        do: function(){
            var self = this;

            var data = {
                'type':'polygon',
                'color': currentColor,
                'zIndex': self.overlay.zIndex,
                'paths': self.overlay.getPathString()
            };
            currentOverlay = google.maps.Polygon.loadByData(data);

            self.overlay.setMap(null);
            select_overlay(currentOverlay);
            drawingManager.setDrawingMode(null);
        },
        undo: function(){
            var self = this;
            var overlay = overlay_list[overlay_list.length-1];
            overlay.setMap(null);
            remove_overlay(overlay);
        }
    });

    var circle_command = function(overlay){
        this.init(overlay);
    };
    circle_command.prototype = new base_command();
    $.extend(circle_command.prototype,{
        init: function(obj){
            var self = this;
            self.overlay = obj;
            self.overlay.zIndex = max_zindex++;
        },
        do: function(){
            var self = this;
            var data = {
                'type':'circle',
                'color': currentColor,
                'zIndex': self.overlay.zIndex,
                'center': self.overlay.getCenterString(),
                'radius': self.overlay.radius
            };
            currentOverlay = google.maps.Circle.loadByData(data)

            self.overlay.setMap(null);
            select_overlay(currentOverlay);
            drawingManager.setDrawingMode(null);
        },
        undo: function(){
            var self = this;
            var overlay = overlay_list[overlay_list.length-1];
            overlay.setMap(null);
            remove_overlay(overlay);
        }
    });

    var rectangle_command = function(overlay){
        this.init(overlay);
    };
    rectangle_command.prototype = new base_command();
    $.extend(rectangle_command.prototype,{
        init: function(obj){
            var self = this;
            self.overlay = obj;
            self.overlay.zIndex = max_zindex++;
        },
        do: function(){
            var self = this;
            var data = {
                'type':'rectangle',
                'color': currentColor,
                'zIndex': self.overlay.zIndex,
                'bounds': self.overlay.getBoundsString()
            };
            currentOverlay = google.maps.Rectangle.loadByData(data);

            self.overlay.setMap(null);
            select_overlay(currentOverlay);
            drawingManager.setDrawingMode(null);
        },
        undo: function(){
            var self = this;
            var overlay = overlay_list[overlay_list.length-1];
            overlay.setMap(null);
            remove_overlay(overlay);
        }
    });

    var polyline_command = function(overlay){
        this.init(overlay);
    };
    polyline_command.prototype = new base_command();
    $.extend(polyline_command.prototype,{
        init: function(obj){
            var self = this;
            self.overlay = obj;
            self.overlay.zIndex = max_zindex++;
        },
        do: function(){
            var self = this;

            var data = {
                'type':'polyline',
                'color': currentColor,
                'zIndex': self.overlay.zIndex,
                'paths': self.overlay.getPathString()
            };
            currentOverlay = google.maps.Polyline.loadByData(data);

            self.overlay.setMap(null);
            select_overlay(currentOverlay);
            drawingManager.setDrawingMode(null);
        },
        undo: function(){
            var self = this;
            var overlay = overlay_list[overlay_list.length-1];
            overlay.setMap(null);
            remove_overlay(overlay);
        }
    });

    var marker_command = function(overlay){
        this.init(overlay);
    };
    marker_command.prototype = new base_command();
    $.extend(marker_command.prototype,{
        init: function(obj){
            var self = this;
            self.overlay = obj;
            self.overlay.zIndex = max_zindex++;
        },
        do: function(){
            var self = this;

            var data = {
                'type':'marker',
                'title':currentMarker.type_name,
                'marker_type': currentMarker.type_id,
                'zIndex': self.overlay.zIndex,
                'position': getStringByLatlng(self.overlay.position)
            };
            currentOverlay = poimarker.loadByData(data);

            self.overlay.setMap(null);
            select_overlay(currentOverlay);
            drawingManager.setDrawingMode(null);
        },
        undo: function(){
            var self = this;
            var overlay = overlay_list[overlay_list.length-1];
            overlay.setMap(null);
            remove_overlay(overlay);
        }
    });

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
        google.maps.event.addListener(map,'click',function(event){
            select_overlay(null);
        });

        google.maps.event.addListener(map,'rightclick',function(event){
            var selected = get_selected();
            if(selected && selected.overlay_type == 'marker'){
                var command = new set_position_command(selected,event.latLng);
                do_command(command);
            }
        });


        setExtoverViewMapControl(map);

        init_draw_tools(map);

        poi_names=['上海火车站','火车站','火车'];

        $('#pointbind_searchbar').html(poi_names[0]);


        load_data();

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

    function save(){
        var ret = [];
        for(var i=0;i<overlay_list.length;i++){
            var overlay = overlay_list[i];
            var obj = {
                'type':overlay.overlay_type
            };
            if(overlay.overlay_type == 'marker'){
                obj.marker_type = overlay.marker_type;
                obj.title = overlay.title;
                obj.position = overlay.getPositionString();
            }else if(overlay.overlay_type == 'polyline' || overlay.overlay_type == 'polygon'){
                obj.color = overlay.strokeColor;
                obj.zIndex = overlay.zIndex;
                obj.paths = overlay.getPathString();
            }else if(overlay.overlay_type == 'circle'){
                obj.color = overlay.strokeColor;
                obj.zIndex = overlay.zIndex;
                obj.center = overlay.getCenterString();
                obj.radius = overlay.radius;
            }else if(overlay.overlay_type == 'rectangle'){
                obj.color = overlay.strokeColor;
                obj.zIndex = overlay.zIndex;
                obj.bounds = overlay.getBoundsString();
            }
            ret.push(obj);
        }
        console.log(JSON.stringify(ret));
    }


    var isChildOf = function(parentEl, el, container) {
        if (parentEl == el) {
            return true;
        }
        if (parentEl.contains) {
            return parentEl.contains(el);
        }
        if ( parentEl.compareDocumentPosition ) {
            return !!(parentEl.compareDocumentPosition(el) & 16);
        }
        var prEl = el.parentNode;
        while(prEl && prEl != container) {
            if (prEl == parentEl)
                return true;
            prEl = prEl.parentNode;
        }
        return false;
    };

    init();

    function create_marker_control(map){
        var controlDiv = document.createElement('div');
        controlDiv.id = 'marker_control';
        $(controlDiv).css({
            'padding': '5px'
        });

        var controlUI = document.createElement('div');
        $(controlUI).css({
            'width':'18px'
        }).addClass('map_btn');

        controlUI.title = '点击选择标记';
        $(controlUI).html('<img  width="14px" height="20px" style="margin-top:2px" src="http://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=star|308FE0"></img>');
        controlDiv.appendChild(controlUI);

        var popup = document.createElement('div');
        popup.id = 'jquery-marker-select';
        $(popup).css({
            'display':'none',
            'position':'absolute'
        });

        var markers = [{
            type_id:'entrance',
            type_name:'入口'
        },{
            type_id:'cable',
            type_name:'缆车站'
        },{
            type_id:'port',
            type_name:'码头'
        },{
            type_id:'food',
            type_name:'餐饮'
        },{
            type_id:'flight',
            type_name:'机场'
        },{
            type_id:'train',
            type_name:'火车站'
        },{
            type_id:'info',
            type_name:'问询处'
        },{
            type_id:'hotel',
            type_name:'住宿'
        },{
            type_id:'park',
            type_name:'停车场'
        },{
            type_id:'ticket',
            type_name:'售票处'
        },{
            type_id:'more',
            type_name:'其它'
        }
        ];
        $(markers).each(function(index,marker){
            var m = $('<a style="margin:0px 0px 0px 0px;position:relative" class="m_icon_' + marker.type_id + '" title="'+marker.type_name+'"></a>');
            $(popup).append(m);
            $(m).click(function(){
                drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
                set_marker(marker);

                $(popup).hide();
                $(document).unbind('mousedown', hide);
                //alert(marker.type_id);
            });
        });

        var hide = function(ev){
            if (!isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0))) {
                $(popup).fadeOut(200);
                $(document).unbind('mousedown', hide);
            }
        };
        controlDiv.appendChild(popup);


        $(controlUI).click(function(){
            $(popup).fadeIn(200);
            $(document).bind('mousedown', {cal:$(popup)}, hide);
        });
        return controlDiv;
    }

    function set_undo_control_enabled(enabled){
        if(enabled){
            $('#undo_control>div').css({
                'color':'black'
            });
        }else{
            $('#undo_control>div').css({
                'color':'gray'
            });
        }
    }

    function create_undo_control(map){
        var controlDiv = document.createElement('div');
        controlDiv.id = 'undo_control';
        $(controlDiv).css({
            'padding': '5px'
        });

        var controlUI = document.createElement('div');
        $(controlUI).css({
            'width':'24px',
            'color':'gray'
        }).addClass('map_btn');

        controlUI.title = '撤消';
        $(controlUI).html('撤消');

        $(controlUI).click(function(){
            undo_command();
        });
        controlDiv.appendChild(controlUI);
        return controlDiv;
    }

    function set_remove_control_enabled(enabled){
        if(enabled){
            $('#remove_control>div').css({
                'color':'black'
            });
        }else{
            $('#remove_control>div').css({
                'color':'gray'
            });
        }
    }

    function create_remove_control(map){
        var controlDiv = document.createElement('div');
        controlDiv.id = 'remove_control';
        $(controlDiv).css({
            'padding': '5px'
        });

        var controlUI = document.createElement('div');
        $(controlUI).css({
            'width':'24px',
            'color':'gray'
        }).addClass('map_btn');

        controlUI.title = '删除';
        $(controlUI).html('删除');

        $(controlUI).click(function(){
            if(get_selected() != null){
                var command = new remove_command(currentOverlay);
                do_command(command);
            }
        });
        controlDiv.appendChild(controlUI);
        return controlDiv;
    }

    function set_bring_to_front_control_enabled(enabled){
        if(enabled){
            $('#bring_to_front_control>div').css({
                'color':'black'
            });
        }else{
            $('#bring_to_front_control>div').css({
                'color':'gray'
            });
        }
    }

    function create_bring_to_front_control(map){
        var controlDiv = document.createElement('div');
        controlDiv.id = 'bring_to_front_control';
        $(controlDiv).css({
            'padding': '5px'
        });

        var controlUI = document.createElement('div');
        $(controlUI).css({
            'width':'50px',
            'color':'gray'
        }).addClass('map_btn');

        controlUI.title = '移到顶层';
        $(controlUI).html('移到顶层');

        $(controlUI).click(function(){
            var selected = get_selected();
            if(selected != null){
                var command = new bring_to_front_command(currentOverlay);
                do_command(command);
            }
        });
        controlDiv.appendChild(controlUI);
        return controlDiv;
    }

    function create_save_control(map){
        var controlDiv = document.createElement('div');
        controlDiv.id = 'colorpicker_control';
        $(controlDiv).css({
            'padding': '5px'
        });

        var controlUI = document.createElement('div');
        controlUI.add
        $(controlUI).css({
            'width':'24px',
        }).addClass('map_btn');

        controlUI.title = '保存';
        $(controlUI).html('保存');

        $(controlUI).click(function(){
            save();
        });
        controlDiv.appendChild(controlUI);
        return controlDiv;
    }

    function create_colorpicker_control(map) {
        var controlDiv = document.createElement('div');
        controlDiv.id = 'colorpicker_control';
        $(controlDiv).css({
            'padding': '5px'
        });

        var controlUI = document.createElement('div');
        $(controlUI).css({
            'background-color':'white',
            'border':'solid 1px',
            'cursor':'pointer',
            'text-align':'center',
            'padding-left':'4px',
            'padding-right':'4px',
            'width':'24px',
            'height':'24px'
        });

        controlUI.title = '点击选择颜色';
        controlDiv.appendChild(controlUI);

        var popup = document.createElement('div');
        popup.id = 'jquery-colour-picker';
        $(popup).html('<ul><li><a href="#" title="#ffffff" rel="ffffff" style="background: #ffffff; colour: 000000;">#ffffff</a></li><li><a href="#" title="#ffccc9" rel="ffccc9" style="background: #ffccc9; colour: 000000;">#ffccc9</a></li><li><a href="#" title="#ffce93" rel="ffce93" style="background: #ffce93; colour: 000000;">#ffce93</a></li><li><a href="#" title="#fffc9e" rel="fffc9e" style="background: #fffc9e; colour: 000000;">#fffc9e</a></li><li><a href="#" title="#ffffc7" rel="ffffc7" style="background: #ffffc7; colour: 000000;">#ffffc7</a></li><li><a href="#" title="#9aff99" rel="9aff99" style="background: #9aff99; colour: 000000;">#9aff99</a></li><li><a href="#" title="#96fffb" rel="96fffb" style="background: #96fffb; colour: 000000;">#96fffb</a></li><li><a href="#" title="#cdffff" rel="cdffff" style="background: #cdffff; colour: 000000;">#cdffff</a></li><li><a href="#" title="#cbcefb" rel="cbcefb" style="background: #cbcefb; colour: 000000;">#cbcefb</a></li><li><a href="#" title="#cfcfcf" rel="cfcfcf" style="background: #cfcfcf; colour: 000000;">#cfcfcf</a></li><li><a href="#" title="#fd6864" rel="fd6864" style="background: #fd6864; colour: 000000;">#fd6864</a></li><li><a href="#" title="#fe996b" rel="fe996b" style="background: #fe996b; colour: 000000;">#fe996b</a></li><li><a href="#" title="#fffe65" rel="fffe65" style="background: #fffe65; colour: 000000;">#fffe65</a></li><li><a href="#" title="#fcff2f" rel="fcff2f" style="background: #fcff2f; colour: 000000;">#fcff2f</a></li><li><a href="#" title="#67fd9a" rel="67fd9a" style="background: #67fd9a; colour: 000000;">#67fd9a</a></li><li><a href="#" title="#38fff8" rel="38fff8" style="background: #38fff8; colour: 000000;">#38fff8</a></li><li><a href="#" title="#68fdff" rel="68fdff" style="background: #68fdff; colour: 000000;">#68fdff</a></li><li><a href="#" title="#9698ed" rel="9698ed" style="background: #9698ed; colour: 000000;">#9698ed</a></li><li><a href="#" title="#c0c0c0" rel="c0c0c0" style="background: #c0c0c0; colour: 000000;">#c0c0c0</a></li><li><a href="#" title="#fe0000" rel="fe0000" style="background: #fe0000; colour: 000000;">#fe0000</a></li><li><a href="#" title="#f8a102" rel="f8a102" style="background: #f8a102; colour: 000000;">#f8a102</a></li><li><a href="#" title="#ffcc67" rel="ffcc67" style="background: #ffcc67; colour: 000000;">#ffcc67</a></li><li><a href="#" title="#f8ff00" rel="f8ff00" style="background: #f8ff00; colour: 000000;">#f8ff00</a></li><li><a href="#" title="#34ff34" rel="34ff34" style="background: #34ff34; colour: 000000;">#34ff34</a></li><li><a href="#" title="#68cbd0" rel="68cbd0" style="background: #68cbd0; colour: 000000;">#68cbd0</a></li><li><a href="#" title="#34cdf9" rel="34cdf9" style="background: #34cdf9; colour: 000000;">#34cdf9</a></li><li><a href="#" title="#6665cd" rel="6665cd" style="background: #6665cd; colour: 000000;">#6665cd</a></li><li><a href="#" title="#9b9b9b" rel="9b9b9b" style="background: #9b9b9b; colour: 000000;">#9b9b9b</a></li><li><a href="#" title="#cb0000" rel="cb0000" style="background: #cb0000; colour: 000000;">#cb0000</a></li><li><a href="#" title="#f56b00" rel="f56b00" style="background: #f56b00; colour: 000000;">#f56b00</a></li><li><a href="#" title="#ffcb2f" rel="ffcb2f" style="background: #ffcb2f; colour: 000000;">#ffcb2f</a></li><li><a href="#" title="#ffc702" rel="ffc702" style="background: #ffc702; colour: 000000;">#ffc702</a></li><li><a href="#" title="#32cb00" rel="32cb00" style="background: #32cb00; colour: 000000;">#32cb00</a></li><li><a href="#" title="#00d2cb" rel="00d2cb" style="background: #00d2cb; colour: 000000;">#00d2cb</a></li><li><a href="#" title="#3166ff" rel="3166ff" style="background: #3166ff; colour: 000000;">#3166ff</a></li><li><a href="#" title="#6434fc" rel="6434fc" style="background: #6434fc; colour: 000000;">#6434fc</a></li><li><a href="#" title="#656565" rel="656565" style="background: #656565; colour: 000000;">#656565</a></li><li><a href="#" title="#9a0000" rel="9a0000" style="background: #9a0000; colour: 000000;">#9a0000</a></li><li><a href="#" title="#ce6301" rel="ce6301" style="background: #ce6301; colour: 000000;">#ce6301</a></li><li><a href="#" title="#cd9934" rel="cd9934" style="background: #cd9934; colour: 000000;">#cd9934</a></li><li><a href="#" title="#999903" rel="999903" style="background: #999903; colour: 000000;">#999903</a></li><li><a href="#" title="#009901" rel="009901" style="background: #009901; colour: 000000;">#009901</a></li><li><a href="#" title="#329a9d" rel="329a9d" style="background: #329a9d; colour: 000000;">#329a9d</a></li><li><a href="#" title="#3531ff" rel="3531ff" style="background: #3531ff; colour: 000000;">#3531ff</a></li><li><a href="#" title="#6200c9" rel="6200c9" style="background: #6200c9; colour: 000000;">#6200c9</a></li><li><a href="#" title="#343434" rel="343434" style="background: #343434; colour: 000000;">#343434</a></li><li><a href="#" title="#680100" rel="680100" style="background: #680100; colour: 000000;">#680100</a></li><li><a href="#" title="#963400" rel="963400" style="background: #963400; colour: 000000;">#963400</a></li><li><a href="#" title="#986536" rel="986536" style="background: #986536; colour: 000000;">#986536</a></li><li><a href="#" title="#646809" rel="646809" style="background: #646809; colour: 000000;">#646809</a></li><li><a href="#" title="#036400" rel="036400" style="background: #036400; colour: 000000;">#036400</a></li><li><a href="#" title="#34696d" rel="34696d" style="background: #34696d; colour: 000000;">#34696d</a></li><li><a href="#" title="#00009b" rel="00009b" style="background: #00009b; colour: 000000;">#00009b</a></li><li><a href="#" title="#303498" rel="303498" style="background: #303498; colour: 000000;">#303498</a></li><li><a href="#" title="#000000" rel="000000" style="background: #000000; colour: ffffff;">#000000</a></li><li><a href="#" title="#330001" rel="330001" style="background: #330001; colour: 000000;">#330001</a></li><li><a href="#" title="#643403" rel="643403" style="background: #643403; colour: 000000;">#643403</a></li><li><a href="#" title="#663234" rel="663234" style="background: #663234; colour: 000000;">#663234</a></li><li><a href="#" title="#343300" rel="343300" style="background: #343300; colour: 000000;">#343300</a></li><li><a href="#" title="#013300" rel="013300" style="background: #013300; colour: 000000;">#013300</a></li><li><a href="#" title="#003532" rel="003532" style="background: #003532; colour: 000000;">#003532</a></li><li><a href="#" title="#010066" rel="010066" style="background: #010066; colour: 000000;">#010066</a></li><li><a href="#" title="#340096" rel="340096" style="background: #340096; colour: 000000;">#340096</a></li></ul></div>');
        $(popup).css({
            'display': 'none',
            'position': 'absolute'
        });

        $(controlDiv).append(popup);

        var hide = function(ev){
            if (!isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0))) {
                $(popup).fadeOut(200);
                $(document).unbind('mousedown', hide);
            }
        };

        $(' li a',$(popup)).click(function(){
            var bg_color = $(this).html();
            $(controlUI).css('backgroundColor', bg_color);
            set_color(bg_color);

            $(popup).hide();
            $(document).unbind('mousedown', hide);
        });


        controlDiv.appendChild(popup);


        $(controlUI).click(function(){
            $(popup).fadeIn(200);
            $(document).bind('mousedown', {cal:$(popup)}, hide);
        });

        var bg_color = '#f56b00';
        $(controlUI).css('backgroundColor', bg_color);
        set_color(bg_color);

        return controlDiv;
    }

    function set_marker(type){
        currentMarker = type;
    }
    function set_color(bg_color){
        currentColor = bg_color;
        drawingManager.setOptions({
            polylineOptions: {
                strokeColor: bg_color,
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: bg_color,
                fillOpacity: 0.30,
                editable: false
            },
            circleOptions: {
                strokeColor: bg_color,
                strokeOpacity: 1,
                fillColor: bg_color,
                fillOpacity: 0.30,
                strokeWeight: 2,
                clickable: true,
                zIndex: 1,
                editable: false
            },
            rectangleOptions: {
                strokeColor: bg_color,
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: bg_color,
                fillOpacity: 0.30,
                editable: false
            },
            polygonOptions: {
                strokeColor: bg_color,
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: bg_color,
                fillOpacity: 0.30,

                editable: false
            }
        });
    }


    function load_data(data){
        //var data = [{"type":"circle","color":"#f56b00","zIndex":1,"center":"31.24727456915418,121.45181894302368","radius":281.58139983384075},{"type":"rectangle","color":"#f56b00","zIndex":2,"bounds":"31.243238594329206,121.45177602767944|31.24492638660281,121.45390033721924"},{"type":"polygon","color":"#f56b00","zIndex":3,"paths":"31.24549509242258,121.45372867584229|31.245201567335812,121.45765542984009|31.247641467473372,121.4576768875122|31.246760909280358,121.45293474197388"},{"type":"marker","marker_type":"entrance","title":"入口","position":"31.250154682082254,121.45505905151367"},{"type":"marker","marker_type":"flight","title":"灰机","position":"31.249347525535672,121.4568829536438"}];
        if (data instanceof Array){
            var bounds = new google.maps.LatLngBounds();

            for(var i=0;i<data.length;i++){
                var overlay = data[i];
                switch(overlay.type){
                    case 'polygon':
                        var o = google.maps.Polygon.loadByData(overlay);
                        bounds.union(o.getBounds());
                        break;
                    case 'polyline':
                        var o = google.maps.Polyline.loadByData(overlay);
                        bounds.union(o.getBounds());
                        break;
                    case 'circle':
                        var o = google.maps.Circle.loadByData(overlay);
                        bounds.union(o.getBounds());
                        break;
                    case 'rectangle':
                        var o = google.maps.Rectangle.loadByData(overlay);
                        bounds.union(o.getBounds());
                        break;
                    case 'marker':
                        var o = poimarker.loadByData(overlay);
                        bounds.extend(o.getPosition());
                        break;
                }
            }
            map.fitBounds(bounds);
        }
    }


    function init_draw_tools(map){
        var sorrow={
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, //arrow
            strokeOpacity: 1,
            scale: 2
        };
        var lineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 2
        };

        var draw_options = {
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYLINE, google.maps.drawing.OverlayType.CIRCLE, google.maps.drawing.OverlayType.RECTANGLE, google.maps.drawing.OverlayType.POLYGON]
            },
            /*markerOptions: {
                icon: new google.maps.MarkerImage('https://chart.googleapis.com/chart?chst=d_map_pin_icon_withshadow&chld=home|1111FF')
            },*/
            polylineOptions: {
                strokeColor: "#FF0000",
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.30,
                //icons:[{icon:sorrow,offset: '100%'}],

                //icons:[{icon:lineSymbol,offset: '0',repeat: '20px'},{icon:sorrow,offset: '100%'}],
                editable: false
            },
            circleOptions: {
                strokeColor: "#FF0000",
                strokeOpacity: 1,
                fillColor: "#FF0000",
                fillOpacity: 0.30,
                strokeWeight: 2,
                clickable: true,
                zIndex: 1,
                editable: false
            },
            rectangleOptions: {
                strokeColor: "#FF0000",
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.30,
                editable: false
            },
            polygonOptions: {
                strokeColor: "#FF0000",
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.30,
                editable: false
            }
        };

        drawingManager = new google.maps.drawing.DrawingManager(draw_options);

        google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
            var command = null;
            if (event.type == google.maps.drawing.OverlayType.POLYGON){
                command = new polygon_command(event.overlay);
            }
            else if (event.type == google.maps.drawing.OverlayType.CIRCLE){
                command = new circle_command(event.overlay);
            }
            else if (event.type == google.maps.drawing.OverlayType.RECTANGLE) {
                command = new rectangle_command(event.overlay);
            }
            else if (event.type == google.maps.drawing.OverlayType.POLYLINE) {
                command = new polyline_command(event.overlay);
            }
            else if (event.type == google.maps.drawing.OverlayType.MARKER) {
                command = new marker_command(event.overlay);
            }

            if (command){
                do_command(command);
            }

        });


        drawingManager.setMap(map);

        //colorpicker
        var colorpicker_control = create_colorpicker_control(map);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(colorpicker_control);
        //marker
        var marker_control = create_marker_control(map);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(marker_control);
        //undo
        var undo_control = create_undo_control(map);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(undo_control);
        //remove
        var remove_control = create_remove_control(map);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(remove_control);
        //bring to front
        var bring_to_front_control = create_bring_to_front_control(map)
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(bring_to_front_control);
        //save
        var save_control = create_save_control(map);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(save_control);
    }


}

function loadScript() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://ditu.google.cn/maps/api/js?language=chinese&sensor=false&libraries=places,geometry,drawing&callback=initialize";
    //script.src = "https://maps-api-ssl.google.com/maps/api/js?&sensor=false&v=3.9&libraries=places&callback=initialize";
    document.body.appendChild(script);
}

window.onload = loadScript;

