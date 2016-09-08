function initialize() {

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
    var currentID;
    var currentMarker;
    var currentIB;
    var geocoder;
    var place;
    var markersArray = [];
    var currentAddress;



    function init(){

        geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(31.247080533798087, 121.45563185000003);
        var myOptions = {
            zoom: 16,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            noClear: true
        };
        map = new google.maps.Map(document.getElementById("pointbind_map"), myOptions);
        google.maps.event.addListener(map, 'rightclick', function(event) { addPoint(event.latLng); });

        place = new google.maps.places.PlacesService(map);

        setExtoverViewMapControl(map);
        /*var p1 = new google.maps.LatLng(39.9,118.39);
        var p2 = new google.maps.LatLng(39.95402,118.365105);
        alert(google.maps.geometry.spherical.computeDistanceBetween);
        a = google.maps.geometry.spherical.computeDistanceBetween(p1,p2,6378137)
        alert(a);
        */
        //init_draw_tools(map);


        poi_names=['上海火车站','火车站','火车'];
        loadMap(1, poi_names, 31.250058328103847, 121.45600647129527);

    }

    function removeOverlay(overlay) {
        overlay.setMap(null);
    }



    function addPoint(latLng,allowClear, poi_info, formatted_address) {

        var marker = new google.maps.Marker({
            position: latLng,
            map: map,
            title: currentAddress,
            animation: google.maps.Animation.DROP,
            draggable: true,
            zindex: google.maps.Marker.MAX_ZINDEX,
            icon: 'http://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=star|1111FF',
            //icon:'./static/img/Star_point.png',
            shadow: new google.maps.MarkerImage('http://chart.googleapis.com/chart?chst=d_map_pin_shadow',
                new google.maps.Size(40, 37),
                new google.maps.Point(0, 0),
                new google.maps.Point(11, 37))
        });
        marker.isSave = false;
        marker.poi_info = poi_info;
        marker.formatted_address = formatted_address;

        var boxText = document.createElement("div");
        boxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: white; padding: 5px;";
        if (allowClear){
            boxText.innerHTML = marker.getTitle() + "&nbsp;<br>经度：" + latLng.lng() + "<br>纬度：" + latLng.lat();
        }else{
            boxText.innerHTML = marker.getTitle() + "&nbsp;";
            var save = $("<img alt='保存' width=25 height=25 src='./static/img/Save.png'/>");
            $(boxText).append(save);
            $(save).click(function(){
                savePoint();
            });
            $(boxText).append("<br>经度：" + latLng.lng() + "<br>纬度：" + latLng.lat());
        }
        if(formatted_address && formatted_address !== ""){
          $(boxText).append("<br>地址：<span class='formatted_address'>" + formatted_address + "</span>");
        }
        var myOptions = {
            content: boxText,
			disableAutoPan: false,
			maxWidth: 0,
			pixelOffset: new google.maps.Size(-140, 0),
			zIndex: null,
			boxStyle: {
                background: "url('./static/img/tipbox.gif') no-repeat",
                opacity: 0.85,
                width: "280px"
            },
			closeBoxMargin: "10px 2px 2px 2px",
			closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
			infoBoxClearance: new google.maps.Size(1, 1),
			isHidden: false,
			pane: "floatPane",
            clickable: true,
			enableEventPropagation: false
        };
        google.maps.event.addListener(marker, "click", function(e) {
            ib.open(map, this);
        });

        google.maps.event.addListener(marker, "dblclick", function(e) {
            map.setZoom(map.getZoom() + 1);
        });

        google.maps.event.addListener(marker, "drag", function(e) {
            marker.isSave = false;
            var boxText = document.createElement("div");
            boxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: white; padding: 5px;";
            boxText.innerHTML = currentMarker.getTitle() + "<br>经度：" + currentMarker.getPosition().lng() + "<br>纬度：" + currentMarker.getPosition().lat();
            if(currentMarker.formatted_address && currentMarker.formatted_address !== ""){
                $(boxText).append("<br>地址：<span class='formatted_address'>" + currentMarker.formatted_address + "</span>");
            }
            currentIB.setContent(boxText);
        });
        google.maps.event.addListener(marker, "dragend", function(e) {
            var boxText = document.createElement("div");
            boxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: white; padding: 5px;";
            boxText.innerHTML = currentMarker.getTitle() + "&nbsp;";
            var save = $("<img width=25 height=25 src='./static/img/Save.png'/>");
            $(boxText).append(save);
            $(save).click(function(){
                savePoint();
            });
            $(boxText).append("<br>经度：" + currentMarker.getPosition().lng() + "<br>纬度：" + currentMarker.getPosition().lat());
            //currentMarker.poi_info = null;
            if(currentMarker.formatted_address && currentMarker.formatted_address !== ""){
                $(boxText).append("<br>地址：<span class='formatted_address'>" + currentMarker.formatted_address  + "</span>");
            }
            currentIB.setContent(boxText);
        });
        var ib = new InfoBox(myOptions);
        ib.open(map, marker);

        clearCurrentPoint();
        currentIB = ib;

        currentMarker = marker;

        map.panTo(latLng); map.setZoom(17);

    }

    function savePoint() {
        currentMarker.isSave = true;
        var boxText = document.createElement("div");
        boxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: white; padding: 5px;";
        boxText.innerHTML = currentMarker.getTitle() + "<br>经度：" + currentMarker.getPosition().lng() + "<br>纬度：" + currentMarker.getPosition().lat();
        if(currentMarker.formatted_address && currentMarker.formatted_address !== ""){
            $(boxText).append("<br>地址：<span class='formatted_address'>" + currentMarker.formatted_address + "</span>");
        }
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

    //设置区域限制
    function setAddressLimit(address) {

        return address;
    }

    function get_poi_info(result){
        var ret = {
            name:result.name,
            vicinity:result.vicinity,
            reference:result.reference,
            types:result.types,
            address_components:[]
        };
        if(result.website){
            ret.website = result.website;
        }
        if(result.formatted_phone_number){
            ret.formatted_phone_number = result.formatted_phone_number;
        }
        if(result.international_phone_number){
            ret.international_phone_number = result.international_phone_number;
        }
        if(result.rating){
            ret.rating = result.rating;
        }
        if(result.opening_hours){
            ret.opening_hours = result.opening_hours;
        }
        if(result.reviews){
            ret.reviews = result.reviews;
        }
        if(result.utc_offset){
            ret.utc_offset = result.utc_offset;
        }

        for(var i=0;i<result.address_components.length;i++){
            var row = {};
            var types = [];
            var item = result.address_components[i];
            row.long_name = item.long_name;
            row.short_name = item.short_name;
            for(var j=0;j<item.types.length;j++){
                types.push(item.types[j]);
            }
            row.types = types;
            ret.address_components.push(row);
        }
        return JSON.stringify(ret);
    }


    var charList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    //按输入进行地理定位
    function codeAddress(isAutoMove) {
        deleteOverlays();

        var search_callback = function(results, status){
            if (status == google.maps.places.PlacesServiceStatus.OK) {
            //if (status == google.maps.GeocoderStatus.OK) {
              var resultString = '<table cellpadding=0 cellspacing=0 id="pointbind_resultDiv">';

              var index = 0;
              var bounds = new google.maps.LatLngBounds();
              for (var i=0;i<results.length;i++) {
                  if (results[i].formatted_address/* && results[i].formatted_address.indexOf('中国上海市') >= 0*/) {
                      console.log(results[i]);
                      //console.log(get_poi_info(results[i]));
                      resultString += "<tbody><tr lat='" + results[i].geometry.location.lat() + "' lng='" + results[i].geometry.location.lng() + "' class='unlightTR' ><td style='width:30px;vertical-align: top;'>"
                      + "<img src='http://chart.googleapis.com/chart?chst=d_map_pin_letter_withshadow&chld=" + charList[i] + "|FF2222|000000' width=30 height=30></img></td><td>" + results[i].name + "<br />" + results[i].formatted_address + "</td></tr></tbody>";

                      //计算扩展区域
                      bounds.extend(results[i].geometry.location);

                      window.setTimeout(addMarker, index * 50, index, results[i].geometry.location, results[i].name, results[i].formatted_address, results[i].reference);
                      index++;
                  }
              }
              if (isAutoMove) {
                  //自动调整到显示所有标记点
                  if (!bounds.isEmpty()) {
                      if (google.maps.geometry.spherical.computeDistanceBetween(bounds.getNorthEast(), bounds.getSouthWest()) > 200) {
                          map.fitBounds(bounds);
                      }
                      else {
                          if (index == 1)
                              map.panTo(bounds.getSouthWest());
                          else
                              map.panToBounds(bounds);
                      }

                  }
              }
              resultString += "</table>";
              document.getElementById("pointbind_searchresult").innerHTML = resultString;
            } else {
              //alert("Geocode was not successful for the following reason: " + status);
            }
        };

        document.getElementById("pointbind_searchresult").innerHTML = '';
        var address = setAddressLimit(document.getElementById("address").value);

        place.textSearch({query: address}, search_callback);
        //只查上海
        //geocoder.geocode({ 'address': address }, search_callback);
    }

    function contains(array, item) {
        for (var i = 0, I = array.length; i < I; ++i) {
            if (array[i] == item) return true;
        }
        return false;
    }

    function addMarker(index, location, name, formatted_address, reference) {
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            title: name + ' ' + formatted_address,
            animation: google.maps.Animation.DROP,
            draggable: false,
            optimized: true,
            icon: 'http://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=' + charList[index] + '|FF2222|000000',
            //icon: './static/img/' + charList[index] + '_poi.png',
            shadow: new google.maps.MarkerImage('http://chart.googleapis.com/chart?chst=d_map_pin_shadow',
                    new google.maps.Size(40, 37),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(11, 37))
        });
        google.maps.event.addListener(marker, 'click', function(event) {
          place.getDetails({reference: reference}, function(place, status){
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                console.log(place);
                poi_info = get_poi_info(place);
                addPoint(event.latLng, false, poi_info, place.formatted_address);
            }else{
                addPoint(event.latLng, false, null);
            }
          });
        });
        markersArray.push(marker);
    }

    function TableRowOver(row) {
        row.className = 'lightTR';
    }

    function TableRowOut(row) {
        row.className = 'unlightTR';
    }
    function MoveToPoint(row) {

        var latlng = new google.maps.LatLng(row.attributes["lat"].value, row.attributes["lng"].value);

        map.panTo(latlng);

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
    //定位地址及经纬度座标
    function setAddress(address, lat, lng) {
        var isAutoMove = true;
        deleteOverlays();
        //如果之前没有位置的话，给其一个中心点
        if (currentMarker !== null) {
            if(lat !== '')
                isAutoMove = false;
            var latlng = new google.maps.LatLng(31.247080533798087, 121.45563185000003);
            map.setCenter(latlng);
            clearCurrentPoint();
        }

        if (address !== '') {
            loadAddress(address,isAutoMove);
        }
        if (lat !== '' && lng !== '') {
            var latlng = new google.maps.LatLng(lat,lng);
            addPoint(latlng,true);
        }
    }

    function loadAddress(address,isAutoMove){
            document.getElementById("address").value = address;
            codeAddress(isAutoMove);
    }

    function clearCurrentPoint() {
        if (currentIB != null) {
            currentIB.setMap(null);
            currentIB = null;
        }
        if (currentMarker != null) {
            currentMarker.setMap(null);
            currentMarker = null;
        }
    }


    function loadMap(poi_id, poi_names, lat, lng) {
        currentID = poi_id;
        currentAddress = poi_names[0];
        var alias_poi = $('<select style="width:150px" id="poi_alias"></select>');
        $('#pointbind_selectbar').append(alias_poi);
        $.each(poi_names, function(index, value){
            $('#poi_alias').append('<option value="'+value+'">'+value+'</option>');
        });

        alias_poi.change(function(){
            address = $("#poi_alias").val();
            loadAddress(address,true);
        });

        //var location_poi = $('<input type="button" title="' + currentAddress + '" value="POI定位">');
        //location_poi.click(function(){
        //    loadAddress(this.title,true);
        //});

        var set_poi = $('<input type="button" title="在地图中心放置定位点" value="放置定位点">');
        set_poi.click(function(){
            addPoint(map.getCenter());
        });


        //$('#pointbind_selectbar').append(location_poi);
        $('#pointbind_selectbar').append(set_poi);

        setAddress(currentAddress, lat, lng);
    }


    $('#query').click(function(){
        codeAddress(true);
    });

    $('#form1').submit(function(){
        //codeAddress(true);
        return false;
    });

    $('#pointbind_resultDiv tr').live('click', function(){
        MoveToPoint(this);
    });


    $('#pointbind_resultDiv tr').live('dblclick', function(){
        MoveToPoint(this);
        map.setZoom(17);
    });

    $('#pointbind_resultDiv tr').live('mouseover', function(){
        TableRowOver(this);
    });


    $('#pointbind_resultDiv tr').live('mouseout', function(){
        TableRowOut(this);
    });

    var input = document.getElementById('address');
    var options = {
        //types: ['(cities)'],
        //componentRestrictions: {country: 'fr'}
    };

    autocomplete = new google.maps.places.Autocomplete(input, options);
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
      var place = autocomplete.getPlace();
      console.log(place);
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }
      deleteOverlays();

      var resultString = '<table cellpadding=0 cellspacing=0 id="pointbind_resultDiv">';
      resultString += "<tbody><tr lat='" + place.geometry.location.lat() + "' lng='" + place.geometry.location.lng() + "' class='unlightTR' ><td style='width:30px;vertical-align: top;'>"
                      + "<img src='http://chart.googleapis.com/chart?chst=d_map_pin_letter_withshadow&chld=" + charList[0] + "|FF2222|000000' width=30 height=30></img></td><td>" + place.name + "<br />" + place.formatted_address + "</td></tr></tbody>";
      resultString += "</table>";
      document.getElementById("pointbind_searchresult").innerHTML = resultString;

      addMarker(0, place.geometry.location, place.name, place.formatted_address,  place.reference);

    });
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

        /*border-top-color: #717B87;
        border-right-color: #717B87;
        border-bottom-color: #717B87;
        -webkit-box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px;
        box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px;
        */
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
        controlText.style.width = '18px';
        controlUI.appendChild(controlText);

        // Setup the click event listeners: simply set the map to
        // Chicago
        /*google.maps.event.addDomListener(controlUI, 'click', function() {
            alert('aa');
        });*/

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
      var drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.MARKER,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.MARKER, google.maps.drawing.OverlayType.POLYLINE, google.maps.drawing.OverlayType.CIRCLE, google.maps.drawing.OverlayType.RECTANGLE, google.maps.drawing.OverlayType.POLYGON]
            },
            markerOptions: {
                icon: new google.maps.MarkerImage('https://chart.googleapis.com/chart?chst=d_map_pin_icon_withshadow&chld=home|1111FF')
            },
            polylineOptions: {
                strokeColor: "#FF0000",
                strokeOpacity: 0.6,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.35,
                editable: false
            },
            circleOptions: {
                strokeColor: "#FF0000",
                strokeOpacity: 0.6,
                fillColor: "#FF0000",
                fillOpacity: 0.35,
                strokeWeight: 2,
                clickable: true,
                zIndex: 1,
                editable: false
            },
            rectangleOptions: {
                strokeColor: "#FF0000",
                strokeOpacity: 0.6,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.35,
                editable: false
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
            if (event.type == google.maps.drawing.OverlayType.CIRCLE || event.type == google.maps.drawing.OverlayType.POLYGON || event.type == google.maps.drawing.OverlayType.RECTANGLE) {
                /*for (var i in markersArray) {
                    var coordinate = markersArray[i].position;
                    var isWithinOverlay = event.overlay.containsLatLng(coordinate);

                    if (isWithinOverlay) {
                        markersArray[i].setIcon('https://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=home|FF1111');
                    }
                    else {
                        markersArray[i].setIcon('https://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=home|1111FF');
                    }
                }*/
                google.maps.event.addListener(event.overlay, 'click', function(){
                    event.overlay.setEditable(true);
                    //removeOverlay(event.overlay);
                });
                google.maps.event.addListener(event.overlay, 'rightclick', function(){
                    event.overlay.setEditable(false);
                });

                //setTimeout(removeOverlay, 0,event.overlay);
                //removeOverlay(event.overlay);
            }
            else if (event.type == google.maps.drawing.OverlayType.POLYLINE) {
                //setTimeout(removeOverlay, 0,event.overlay);
                google.maps.event.addListener(event.overlay, 'click', function(){
                    event.overlay.setEditable(true);
                    //removeOverlay(event.overlay);
                });
                google.maps.event.addListener(event.overlay, 'rightclick', function(){
                    event.overlay.setEditable(false);
                });
                //removeOverlay(event.overlay);
            }
            else if (event.type == google.maps.drawing.OverlayType.MARKER) {
                google.maps.event.addListener(event.overlay, 'click', toggleBounce);
                markersArray.push(event.overlay);
            }
        });


        drawingManager.setMap(map);

        //添加控件
        var text_control = create_text_control(map);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(text_control);
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

        google.maps.event.addListener(currentOverlay.getPath(), 'set_at', function() {
            currentIB.open(map, currentOverlay);
            boxText.innerHTML = currentDetailPostcode + "<br/><img width=30 height=30 src='../image/save.png' title ='保存'alt='保存' onclick='saveDetailPostcodeArea()'/>";
        });
        google.maps.event.addListener(currentOverlay.getPath(), 'remove_at', function() {
            currentIB.open(map, currentOverlay);
            boxText.innerHTML = currentDetailPostcode + "<br/><img width=30 height=30 src='../image/save.png' title ='保存'alt='保存' onclick='saveDetailPostcodeArea()'/>";
        });
        google.maps.event.addListener(currentOverlay.getPath(), 'insert_at', function() {
            currentIB.open(map, currentOverlay);
            boxText.innerHTML = currentDetailPostcode + "<br/><img width=30 height=30 src='../image/save.png' title ='保存'alt='保存' onclick='saveDetailPostcodeArea()'/>";
        });


        map.fitBounds(currentOverlay.getBounds());
        currentOverlay.setMap(map);

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

