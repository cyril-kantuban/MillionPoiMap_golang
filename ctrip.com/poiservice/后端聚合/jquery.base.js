(function ($) {

    var $w = window,
        nv = $w.navigator,
        ua = nv.userAgent,
        pf = nv.platform,
        vd = nv.vendor,
        av = nv.appVersion,
        versionMarker
        ;

    var platform = {
        "Win32":[pf],
        "Mac":[pf],
        "iPhone":[ua],
        "iPad":[ua],
        "Android":[ua],
        "Linux":[pf]
    };

    var browser = {
        "Chrome":[ua],
        "Safari":[vd, "Apple", "Version"],
        "Opera":[$w.opera, null, "Version"],
        "Firefox":[ua],
        "IE":[ua, "MSIE", "MSIE"],
        "WebKit":[ua],
        "Gecko":[ua, null, "rv"]
    };

    function ck(data, flag) {
        var str, sStr, k;

        for (k in data) {
            if (data.hasOwnProperty(k)) {
                str = String(data[k][0]);
                sStr = data[k][1] || k;
                if (str.indexOf(sStr) >= 0) {
                    if (flag) {
                        versionMarker = data[k][2] || k;
                    }
                    return k;
                }
            }
        }
        return "";
    }

    function ckVersion(dataString) {
        var index = dataString.indexOf(versionMarker);
        if (index < 0) {
            return "";
        }
        return parseFloat(dataString.substring(index + versionMarker.length + 1));
    }


    $.OS = {
        name:ck(platform)
    };

    $.BS = (function () {
        var name = ck(browser, true),
            version = ckVersion(ua) || ckVersion(av),

            v = {
                name:name,
                version:version || 0,
                isIE:name === "IE",
                isOpera:name === "Opera",
                isChrome:name === "Chrome",
                isSafari:name === "Safari"
            };

        v.isWebkit = v.isChrome || v.isSafari || name === "WebKit";
        v.isFirefox = name === "Firefox";
        v.isGecko = v.isFirefox || name === "Gecko";
        v.isIE6 = v.isIE && version === 6.0;
        v.isIE7 = v.isIE && version === 7.0;
        v.isIE8 = v.isIE && version === 8.0;
        v.isIE9 = v.isIE && version === 9.0;

        return v;
    })();

})(jQuery);

(function(window, $){
    "use strict";
    var event = $.event,
        scrollTimeout;

    event.special.smartresize = {
        setup: function () {
            $(this).bind("resize", event.special.smartresize.handler);
        },
        teardown: function () {
            $(this).unbind("resize", event.special.smartresize.handler);
        },
        handler: function (event, execAsap) {
            // Save the context
            var context = this;

            // set correct event type
            event.type = "smartresize";

            if (scrollTimeout) { clearTimeout(scrollTimeout); }
            scrollTimeout = setTimeout(function () {
                $.event.trigger(event, null, context);
            }, execAsap === "execAsap" ? 0 : 100);
        }
    };

    $.fn.smartresize = function (fn) {
        return fn ? this.bind("smartresize", fn) : this.trigger("smartresize", ["execAsap"]);
    };

})(this, jQuery);

(function(window, undefined){

    // IE6-8 doesn't support oninput
    // IE9-10 doesn't trigger oninput when content is removed with BACKSPACE, ctrl+x etc...
    // Don't support pop up & namespace
    var onInputSupport = !$.BS.isIE;
    var namespace = "ui-input-event";

    function OnInput(element, callback, options) {
        this.element   = element;
        this.$element  = $(element);
        this.value     = element.value;
        this._callback = callback;
        this.time      = (options && options.time) ? options.time : 150;
        this.$element.on('focus.' + namespace, $.proxy(this._listen, this));
        this.$element.on('blur.' + namespace, $.proxy(this._unlisten, this));
    }

    OnInput.prototype = {

        _listen: function(){

            this.value = this.element.value;

            if(onInputSupport){
                this.$element.on('input.' + namespace, $.proxy(this._run, this));
            }
            else {
                this._interval = window.setInterval($.proxy(this._check, this), this.time);
            }
        },

        _unlisten: function(){
            if(onInputSupport){
                this.$element.off("input." + namespace, this._run);
            } else {
                window.clearInterval(this._interval);
            }
        },

        _run: function(){
            this.value = this.element.value;
            this._callback.call(this.element, this.value);
        },

        _check: function(){
            if(this.element.value !== this.value) {
                this._run();
            }
        },

        destroy: function(){
            this.$element.off('.' + namespace);
            this.element = this.$element = this._callback = null;
        }
    };

    var jQuery_val = $.fn.val;

    if (!onInputSupport) {
        $.fn.val = function(txt) {

            if (txt === undefined) {
                return jQuery_val.call(this);
            }

            var input = this.data(namespace);
            
            if (input) {
                input.value = txt;
            }

            jQuery_val.call(this, txt);

            return this;
        };
    }

    $.event.special.simulateinput = {
        setup: function (data) {
            var self = this;

            $(self).data(namespace, new OnInput(self, function(v){
                $.event.trigger("simulateinput", v, self);
            }, data));
        },
        teardown: function () {
            var oninput = $(this).data(namespace);

            if (oninput) {
                oninput.destroy();
            }

            $(this).removeData(namespace);
        }
    };

})(this);


(function(window, $, undefined){
    "use strict";
    var hash = {
        l: 0, c: 0.5, r: 1,
        t: 0, m: 0.5, b: 1
    };

    $.fn.placeTo = function(elem, p, fix){

        return this.each(function(){
            var self = $(this),
                jObj = $(elem).first(),
                apos = jObj.position(),

                asize = { x: jObj.outerWidth(), y: jObj.outerHeight() },
                bsize = { x: self.outerWidth(), y: self.outerHeight() };

            if (!apos) {
                return;
            }

            var pos = (p || "ltlb").split("");
            fix = $.extend({ x: 0, y: 0 }, fix);

            function caculate(size, i) {
                return hash[pos[i]] * size[ i % 2 ? "y" : "x" ];
            }

            /// transfor fix direction
            var _horizontal = pos[0], _vertical = pos[1];

            if (_horizontal === "l") { fix.x = fix.x; } 
            else if (_horizontal === "r") { fix.x = 0 - fix.x; } 
            else { fix.x = 0; }

            if (_vertical === "t") { fix.y = fix.y; } 
            else if (_vertical === "b") { fix.y = 0 - fix.y; }
            else { fix.y = 0; }

            self.css("left", apos.left - caculate(bsize, 0) + caculate(asize, 2) + fix.x)
                .css("top", apos.top - caculate(bsize, 1) + caculate(asize, 3) + fix.y);
        });

    };
})(this, jQuery);

/**
 * setTo an element
 * like ltlb  in ( lcd tmb )
 */

(function(window, $, undefined){
    "use strict";
    
    var doc = window.document,
        html = doc.documentElement;

    $.viewSize = {};
    
    $.windowSize = function(){
        return $.isEmptyObject($.viewSize) ? _viewSize() : $.viewSize;
    };

    var _caculateZoomSize = function(r, width, height) {

        if (!r) {
            return null;
        }

        var midX = r.left + width / 2,
            midY = r.top + height / 2,
            fullWidth = html.scrollWidth,
            fullHeight = html.scrollHeight;

        r.left = Math.max(0, midX - width / 2);
        r.top = Math.max(0, midY - height / 2);
        r.right = Math.min(midX + width / 2, fullWidth);
        r.bottom = Math.min(midY + height / 2, fullHeight);

        return r;
    };


    var _viewSize = function() {

        var win = $(window);

        var r = {
            left: win.scrollLeft(),
            top: win.scrollTop()
        };

        var width = win.width(),
            height = win.height();

        var ret = _caculateZoomSize(r, width, height);

        $.viewSize = ret;

        return ret;
    };

    $(window).on("scroll smartresize", function(){ _viewSize(); });


    $.fn.setTo = function(elem, p, fix) {

        var self = this.first(),
            jObj = $(elem).first(),
            auto = !p,
            apos = jObj.offset(),

            asize = { x: jObj.outerWidth(), y: jObj.outerHeight() },
            bsize = { x: self.outerWidth(), y: self.outerHeight() };

        if (!apos) {
            return;
        }

        var pos = (p || "ltlb").split("");
        fix = $.extend({ x: 0, y: 0 }, fix);

        if (auto) {

            var view = $.isEmptyObject($.viewSize) ? _viewSize() : $.viewSize;

            if (apos.left + bsize.x > view.right &&
                apos.left + asize.x - bsize.x >= view.left) {
                pos[0] = 'r';
                pos[2] = 'r';
            }

            if (apos.top + asize.y + bsize.y > view.bottom &&
                apos.top - bsize.y >= view.top) {
                pos[1] = 'b';
                pos[3] = 't';
            }
        }

        var hash = {
            l: 0, c: 0.5, r: 1,
            t: 0, m: 0.5, b: 1
        };

        function caculate(size, i) {
            return hash[pos[i]] * size[ i % 2 ? "y" : "x" ];
        }

        /// transfor fix direction
        var _horizontal = pos[0], _vertical = pos[1];

        if (_horizontal === "l") { fix.x = fix.x; } 
        else if (_horizontal === "r") { fix.x = 0 - fix.x; } 
        else { fix.x = 0; }

        if (_vertical === "t") { fix.y = fix.y; } 
        else if (_vertical === "b") { fix.y = 0 - fix.y; }
        else { fix.y = 0; }

        self.css("left", apos.left - caculate(bsize, 0) + caculate(asize, 2) + fix.x)
            .css("top", apos.top - caculate(bsize, 1) + caculate(asize, 3) + fix.y);

        return this;
    };

})(this, jQuery);

(function(){
    "use strict";

    var reURL    = (/^([^:\s]+):\/{2,3}([^\/\s:]+)(?::(\d{1,5}))?(\/[^\?\s#]+)?(\?[^#\s]+)?(#[^\s]+)?/),
        reSearch = (/(?:[\?&])(\w+)=([^#&\s]*)/g),
        URLLi    = "protocol host port path search hash";


    $.extend({
        parseURL: function(url) {
            if (!url) {
                url = location.href;
            }

            var arr  = url.match(reURL),
                temp = {};

            $.each(URLLi.split(" "), function(i, item) {
                temp[item] = arr[i];
            });

            return temp;
        },
        parseSearch: function(search) {
            if (!search) {
                search = location.search;
            }

            var temp = {};

            search.replace(reSearch, function(a, f, s) {
                temp[f] = decodeURIComponent(s);
            });

            return temp;
        }
    });
    
})();

    