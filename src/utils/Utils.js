if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Utils
//*****************************************************************************/
/**
 *   Common functions and utilities used by the webcontrols
 *
 ******************************************************************************/

javaxt.dhtml.utils = {


  //**************************************************************************
  //** get
  //**************************************************************************
  /** Used to generate a HTTP get request. Example:
    get(url + "?filter=" + encodeURIComponent(filter), {
        success: function(text){
            var arr = JSON.parse(text).records;
        },
        failure: function(request){
            alert(request.status);
        }
    });
   */
    get: function(url, config){

        if (config.payload!=null){ //convert to post request
            var payload = config.payload;
            delete config.payload;
            return javaxt.dhtml.utils.post(url, payload, config);
        }

        var settings = {
            method: "GET",
            payload: null
        };
        javaxt.dhtml.utils.merge(settings, config);
        return javaxt.dhtml.utils.http(url, settings);
    },


  //**************************************************************************
  //** post
  //**************************************************************************
    post: function(url, payload, config){
        var settings;
        if (payload.payload){
            settings = payload;
            settings.method = "POST";
        }
        else{
            var settings = {
                method: "POST",
                payload: payload
            };
            javaxt.dhtml.utils.merge(settings, config);
        }
        return javaxt.dhtml.utils.http(url, settings);
    },


  //**************************************************************************
  //** delete
  //**************************************************************************
    delete: function(url, config){
        config.method = "DELETE";
        return javaxt.dhtml.utils.http(url, config);
    },


  //**************************************************************************
  //** http
  //**************************************************************************
    http: function(url, config){

        var cache = false; //no caching by default!
        if (config.cache){
            if (config.cache==true) cache = true;
        }
        if (!cache){
            if (url.indexOf("?")==-1) url += "?";
            url += "&_=" + new Date().getTime();
        }


        var method = config.method;
        var success = config.success;
        var scope = config.scope;
        var async = true;
        if (config.async){
            if (config.async!=false) async = true;
        }
        var failure = config.failure;
        if (typeof failure === "undefined") failure = function(request){
            if (request.status!==0){
                alert(request);
            }
        };



        var request = new XMLHttpRequest();
        if (config.username && config.password){
            request.open(method, url, async, config.username, config.password);
            request.setRequestHeader("Authorization", "Basic " + btoa(config.username + ":" + config.password)); //<-- Needed to add this sometime in mid 2018...
        }
        else{
            request.open(method, url, async);
        }

        if (!cache) request.setRequestHeader("Cache-Control", "no-cache, no-transform");

        request.onreadystatechange = function(){
            if (request.readyState === 4) {
                if (request.status>=200 && request.status<300){

                    if (success) success.apply(scope, [request.responseText, request.responseXML, request.responseURL, request]);

                }
                else{
                    if (failure) failure.apply(scope, [request]);
                }
            }
        };

        if (config.payload) request.send(config.payload);
        else request.send();
        return request;
    },


  //**************************************************************************
  //** getParameter
  //**************************************************************************
  /** Returns the value of a given parameter name in a URL querystring
   *  @param name Parameter name
   *  @param url URL (e.g. window.location.href)
   */
    getParameter: function(name, url){
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec(url);
        if (results == null) return "";
        else return results[1];
    },


  //**************************************************************************
  //** merge
  //**************************************************************************
  /** Used to merge properties from one json object into another. Credit:
   *  https://github.com/stevenleadbeater/JSONT/blob/master/JSONT.js
   */
    merge: function(settings, defaults) {
        var merge = function(settings, defaults) {
            if (settings==null) return;
            for (var p in defaults) {
                if (defaults.hasOwnProperty(p) && typeof settings[p] !== "undefined") {
                    if (p!=0) //<--Added this as a bug fix
                    merge(settings[p], defaults[p]);
                }
                else {
                    settings[p] = defaults[p];
                }
            }
        };
        merge(settings, defaults);
        return settings;
    },


  //**************************************************************************
  //** clone
  //**************************************************************************
    clone: function(obj){
        return javaxt.dhtml.utils.merge({}, obj);
    },


  //**************************************************************************
  //** isDirty
  //**************************************************************************
  /** Returns true if the given json object differs from the original.
   */
    isDirty: function(obj, org){
        var isEmpty = javaxt.dhtml.utils.isEmpty;
        var a = isEmpty(obj);
        var b = isEmpty(org);
        if ((a==true && b==false) || (b==true && a==false)) return true;

        var d = javaxt.dhtml.utils.diff(obj, org);
        return !isEmpty(d);
    },


  //**************************************************************************
  //** diff
  //**************************************************************************
  /** Used to compare 2 json objects. Returns a json object with differences.
   *  Credit: https://stackoverflow.com/a/13389935/
   */
    diff: function(obj1, obj2){

        var isEmpty = javaxt.dhtml.utils.isEmpty;
        var merge = javaxt.dhtml.utils.merge;

        var diff = function(obj1, obj2){
            var ret = {},rett;
            for (var i in obj2) {
                rett = {};
                if (typeof obj2[i] === 'object'){

                    if (obj1.hasOwnProperty(i)){
                        rett = diff(obj1[i], obj2[i]);
                        if (!isEmpty(rett) ){
                            ret[i]= rett;
                        }
                    }
                    else{
                        ret[i] = obj2[i];
                    }
                }
                else{
                    if (!obj1 || !obj1.hasOwnProperty(i) || obj2[i] !== obj1[i]) {
                        ret[i] = obj2[i];
                    }
                }
            }
            return ret;
        };

        var d1 = diff(obj1, obj2);
        var d2 = diff(obj2, obj1);

        return merge(d1,d2);


    },


  //**************************************************************************
  //** isEmpty
  //**************************************************************************
  /** Returns true if the given json object has no key/value pairs.
   */
    isEmpty: function(obj){
        return JSON.stringify(obj) === "{}";
    },


  //**************************************************************************
  //** isArray
  //**************************************************************************
  /** Used to check whether a given object is an array. Note that this check
   *  does not use the "instanceof Array" approach because of issues with
   *  frames.
   */
    isArray: function(obj){
        return (Object.prototype.toString.call(obj)==='[object Array]');
    },


  //**************************************************************************
  //** isNumber
  //**************************************************************************
  /** Returns true if the given object can be converted to a number.
   */
    isNumber: function(n) {
        return !isNaN(parseFloat(n)) && !isNaN(n - 0);
    },


  //**************************************************************************
  //** setStyle
  //**************************************************************************
  /** Used to set the style for a given element. Styles are defined via a CSS
   *  class name or inline using the config.style definitions.
   */
    setStyle: function(el, style){
        if (el===null || el===0) return;
        if (style===null) return;


      //Special case for iScroll
        if (typeof IScroll !== 'undefined'){
            if (el instanceof IScroll){

                var indicators = el.indicators;
                if (indicators){
                    var indicatorClass = "iScrollIndicator";
                    if (style.indicator) indicatorClass = style.indicator;

                    for (var i=0; i<indicators.length; i++){
                        var indicator = indicators[i].indicator;
                        indicator.className = indicatorClass;
                        var scrollbar = indicator.parentNode;

                        if (scrollbar.className.indexOf("iScrollVerticalScrollbar")){
                            if (style.verticalScrollbar){
                                scrollbar.className = scrollbar.className.replace("iScrollVerticalScrollbar", style.verticalScrollbar);
                            }
                        }
                        else{
                            if (style.horizontalScrollbar){
                                scrollbar.className = scrollbar.className.replace("iScrollHorizontalScrollbar", style.horizontalScrollbar);
                            }
                        }
                    }
                }
                return;
            }
        }



        el.style = '';
        el.removeAttribute("style");


        if (typeof style === 'string' || style instanceof String){
            el.className = style;
        }
        else{
            for (var key in style){
                var val = style[key];
                if (key==="content"){
                    el.innerHTML = val;
                }
                else{
                    el.style[key] = val;
                }
            }
        }
    },


  //**************************************************************************
  //** addStyle
  //**************************************************************************
  /** Used to add style to a given element. Styles are defined via a CSS class
   *  name or inline using the config.style definitions.
   */
    addStyle: function(el, style){
        if (el===null || el===0) return;
        if (style===null) return;

        if (typeof style === 'string' || style instanceof String){
            if (el.className && el.className!=null) el.className += " " + style;
            else el.className = style;
        }
        else{
            for (var key in style){
                var val = style[key];

                el.style[key] = val;
                if (key==="transform"){
                    el.style["-webkit-" +key] = val;
                }
            }
        }
    },


  //**************************************************************************
  //** hasStyleRule
  //**************************************************************************
  /** Returns true if there is a style rule defined for a given selector.
   *  @param selector CSS selector (e.g. ".deleteIcon", "h2", "#mid")
   */
    hasStyleRule: function(selector) {

        var hasRule = function(selector, rules){
            if (!rules) return false;
            for (var i=0; i<rules.length; i++) {
                var rule = rules[i];
                if (rule.selectorText){
                    var arr = rule.selectorText.split(',');
                    for (var j=0; j<arr.length; j++){
                        if (arr[j].indexOf(selector) !== -1){
                            var txt = trim(arr[j]);
                            if (txt===selector){
                                return true;
                            }
                            else{
                                var colIdx = txt.indexOf(":");
                                if (colIdx !== -1){
                                    txt = trim(txt.substring(0, colIdx));
                                    if (txt===selector){
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return false;
        };

        var trim = function(str){
            return str.replace(/^\s*/, "").replace(/\s*$/, "");
        };

        for (var i=0; i<document.styleSheets.length; i++){
            var rules;
            try{
                rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules;
                if (hasRule(selector, rules)){
                    return true;
                }
            }
            catch(e){
                //Security error, typically occurs when running on the local file system (vs web server)
            }

            var imports = document.styleSheets[i].imports;
            if (imports){
                for (var j=0; j<imports.length; j++){
                    rules = imports[j].rules || imports[j].cssRules;
                    if (hasRule(selector, rules)) return true;
                }
            }
        }

        return false;
    },


  //**************************************************************************
  //** addNoSelectRule
  //**************************************************************************
  /** Inserts the "javaxt-noselect" class into the document if it is not
   *  present.
   */
    addNoSelectRule: function(){
        var hasStyleRule = javaxt.dhtml.utils.hasStyleRule;
        if (!hasStyleRule(".javaxt-noselect")){
            var head = document.head || document.getElementsByTagName('head')[0];
            var sheet = document.createElement('style');
            sheet.innerHTML = ".javaxt-noselect {\n";
            var arr = ["-webkit-","-moz-","-o-","-ms-","-khtml-",""];
            for (var i=0; i<arr.length; i++){
                sheet.innerHTML += arr[i] + "user-select: none;\n";
            }
            sheet.innerHTML += "}";
            head.appendChild(sheet);
        }
    },


  //**************************************************************************
  //** createTable
  //**************************************************************************
    createTable: function(){
        var table = document.createElement('table');

        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.width = "100%";
        table.style.height = "100%";
        table.style.margin = 0;
        table.style.padding = 0;
        table.style.borderCollapse = "collapse";


        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        return table;
    },


  //**************************************************************************
  //** onRender
  //**************************************************************************
  /** Used to check whether DOM element has been added to the document. Calls
   *  a callback if it exists or when it is added.
   */
    onRender: function(el, callback){
        var w = el.offsetWidth;
        if (w===0 || isNaN(w)){
            var timer;

            var checkWidth = function(){
                var w = el.offsetWidth;
                if (w===0 || isNaN(w)){
                    timer = setTimeout(checkWidth, 100);
                }
                else{
                    clearTimeout(timer);
                    if (callback) callback.apply(el, [el]);
                }
            };

            timer = setTimeout(checkWidth, 100);
        }
        else{
            if (callback) callback.apply(el, [el]);
        }
    },


  //**************************************************************************
  //** updateDOM
  //**************************************************************************
  /** Used to update the default befaviour of the browser to prevent things
   *  like right mouse click, scrolling beyond a page, and drag and drop.
   */
    updateDOM: function(){

        if (document.javaxt) return;

      //Disable right-click context menu
        document.oncontextmenu = function(e){
            return false;
        };


      //Add logic to prevent touch devices like iPad from scrolling beyond the document
      //http://stackoverflow.com/a/26853900
        var firstMove;
        window.addEventListener('touchstart', function (e) {
            firstMove = true;
        });
        window.addEventListener('touchmove', function (e) {
            if (firstMove) {
                e.preventDefault();

                firstMove = false;
            }
        });



      //Watch for drag and drop events
        if (!document.body) document.body = document.getElementsByTagName("body")[0];
        var body = document.body;
        body.addEventListener('dragover', function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }, false);
        body.addEventListener('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }, false);


        document.javaxt = {};
    },


  //**************************************************************************
  //** getRect
  //**************************************************************************
  /** Returns the geometry of a given element.
   */
    getRect: function(el){

        if (el.getBoundingClientRect){
            return el.getBoundingClientRect();
        }
        else{
            var x = 0;
            var y = 0;
            var w = el.offsetWidth;
            var h = el.offsetHeight;

            function isNumber(n){
               return n === parseFloat(n);
            }

            var org = el;

            do{
                x += el.offsetLeft - el.scrollLeft;
                y += el.offsetTop - el.scrollTop;
            } while ( el = el.offsetParent );


            el = org;
            do{
                if (isNumber(el.scrollLeft)) x -= el.scrollLeft;
                if (isNumber(el.scrollTop)) y -= el.scrollTop;
            } while ( el = el.parentNode );


            return{
                x: x,
                y: y,
                left: x,
                right: x+w,
                top: y,
                bottom: y+h,
                width: w,
                height: h
            };
        }
    },


  //**************************************************************************
  //** intersects
  //**************************************************************************
  /** Used to test whether two rectangles intersect.
   */
    intersects: function(r1, r2) {
      return !(r2.left > r1.right ||
               r2.right < r1.left ||
               r2.top > r1.bottom ||
               r2.bottom < r1.top);
    },


  //**************************************************************************
  //** getAreaOfIntersection
  //**************************************************************************
  /** Returns the area of intersection between 2 rectangles.
   */
    getAreaOfIntersection: function(r1, r2){

        var minX = r2.left;
        var maxX = r2.right;
        var minY = r2.top;
        var maxY = r2.bottom;

        var left = r1.left;
        var right = r1.right;
        var top = r1.top;
        var bottom = r1.bottom;

        if (left<minX) left=minX;
        if (right>maxX) right=maxX;
        if (top<minY) top=minY;
        if (bottom>maxY) bottom=maxY;

        var w = right-left;
        var h = bottom-top;
        return w*h;
    },


  //**************************************************************************
  //** initDrag
  //**************************************************************************
    initDrag : function(dragHandle, config){
        javaxt.dhtml.utils.addNoSelectRule();

        if (!config) config = {};
        var holdDelay = config.holdDelay;
        if (isNaN(holdDelay)) holdDelay = 50;

        var cursor = dragHandle.style.cursor;
        if (!cursor) cursor = "default";


      //This timeout, started on mousedown, triggers the beginning of a hold
        var holdStarter = null;


      //This flag indicates the user is currently holding the mouse down
        var holdActive = false;


      //OnClick
        //div.onclick = NOTHING!! not using onclick at all - onmousedown and onmouseup take care of everything


      //MouseDown
        dragHandle.onmousedown = function(e){


          //Set the holdStarter and wait for the predetermined delay, and then begin a hold
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;


              //Initiate drag
                startDrag(e);


              //Add event listeners
                if (document.addEventListener) {
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                }
                else if (document.attachEvent) {
                    document.attachEvent("onmousemove", onMouseMove);
                    document.attachEvent("onmouseup", onMouseUp);
                }

            }, holdDelay);

        };



      //MouseUp
        var onMouseUp = function(e){



          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);


                //simple click
            }

          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;

              //Remove event listeners
                if (document.removeEventListener) {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                } else if (document.detachEvent) {
                    document.detachEvent("onmousemove", onMouseMove);
                    document.detachEvent("onmouseup", onMouseUp);
                }

              //Update cursor
                dragHandle.style.cursor = cursor;

                if (config.onDragEnd)
                config.onDragEnd.apply(dragHandle, []);


              //Remove the "javaxt-noselect" class
                var body = document.getElementsByTagName('body')[0];
                setTimeout(function() {
                body.className = body.className.replace( /(?:^|\s)javaxt-noselect(?!\S)/g , '' );
                }, 800);
            }
        };


        dragHandle.onmouseup = onMouseUp;



      //Start touch (similar to "onmousedown")
        dragHandle.ontouchstart = function(e) {

            e.preventDefault();
            var touch = e.touches[0];
            var x = touch.pageX;
            var y = touch.pageY;




          //Set the holdStarter and wait for the holdDelay before starting the drag
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;

              //Initiate drag
                startDrag({
                    clientX: x,
                    clientY: y
                });


              //Add "touchmove" event listener
                if (document.removeEventListener) {
                    dragHandle.addEventListener("touchmove", onTouchMove);
                }
                else if (document.detachEvent) {
                    dragHandle.attachEvent("ontouchmove", onTouchMove);
                }


            }, holdDelay);
        };

      //End touch (similar to "onmouseup")
        dragHandle.ontouchend = function(e) {


          //Remove "touchmove" event listener
            if (document.removeEventListener) {
                dragHandle.removeEventListener("touchmove", onTouchMove);
            }
            else if (document.detachEvent) {
                dragHandle.detachEvent("ontouchmove", onTouchMove);
            }



          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);
                //Click Event!
            }

          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;
                //End drag!
            }

        };



        var onMouseMove = function(e){
            var x = e.clientX;
            var y = e.clientY;

            if (config.onDrag)
            config.onDrag.apply(dragHandle, [x,y]);
        };

        var onTouchMove = function(e) {
            e.preventDefault();
            var touch = e.touches[0];
            var x = touch.pageX;
            var y = touch.pageY;

            onMouseMove({
                clientX: x,
                clientY: y
            });
        };


        var startDrag = function(e){
            var x = e.clientX;
            var y = e.clientY;

            if (config.onDragStart)
            config.onDragStart.apply(dragHandle, [x,y]);


          //Disable text selection in the entire document - very important!
            var body = document.getElementsByTagName('body')[0];
            if (!body.className.match(/(?:^|\s)javaxt-noselect(?!\S)/) ){
                body.className += (body.className.length==0 ? "" : " ") + "javaxt-noselect";
            }

        };
    },


  //**************************************************************************
  //** addResizeListener
  //**************************************************************************
  /** Used to watch for resize events for a given element. Credit:
   *  http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
   */
    addResizeListener: function(element, fn){

        var attachEvent = document.attachEvent;
        var isIE = navigator.userAgent.match(/Trident/);

        var requestFrame = (function(){
            var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
            function(fn){ return window.setTimeout(fn, 20); };
            return function(fn){ return raf(fn); };
        })();

        var cancelFrame = (function(){
            var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
            window.clearTimeout;
            return function(id){ return cancel(id); };
        })();

        function resizeListener(e, fn){
            var win = e.target || e.srcElement;
            if (win.__resizeRAF__) cancelFrame(win.__resizeRAF__);
            win.__resizeRAF__ = requestFrame(function(){
                var trigger = win.__resizeTrigger__;
                fn.call(trigger, e);
            });
        };


        if (attachEvent) {
            element.__resizeTrigger__ = element;
            element.attachEvent('onresize', function(e){
                resizeListener(e, fn);
            });
        }
        else {
            if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
            var obj = element.__resizeTrigger__ = document.createElement('object');
            obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
            obj.__resizeElement__ = element;
            obj.onload = function(e){
                this.contentDocument.defaultView.__resizeTrigger__ = this.__resizeElement__;
                this.contentDocument.defaultView.addEventListener('resize', function(e){
                    resizeListener(e, fn);
                });
            };
            obj.type = 'text/html';
            if (isIE) element.appendChild(obj);
            obj.data = 'about:blank';
            if (!isIE) element.appendChild(obj);
        }

    },
    
    
  //**************************************************************************
  //** getHighestElements
  //**************************************************************************
  /** Returns an array of elements at the highest z-index in the document
   */
    getHighestElements: function(obj){
        var arr = [];
        var highestIndex = 0;
        var currentIndex = 0;
        var elArray = Array();
        if(obj){elArray = obj.getElementsByTagName('*');}else{elArray = document.getElementsByTagName('*');}
        for (var i=0; i < elArray.length; i++){
            var el = elArray[i];
            if (el.currentStyle){
                currentIndex = parseFloat(el.currentStyle['zIndex']);
            }
            else if(window.getComputedStyle){
                currentIndex = parseFloat(document.defaultView.getComputedStyle(el,null).getPropertyValue('z-index'));
            }
            if(!isNaN(currentIndex)){
                if (currentIndex > highestIndex){
                    highestIndex = currentIndex;
                    arr = [];
                    arr.push(el);
                }
                else if (currentIndex===highestIndex){
                    arr.push(el);
                }
            }
        }
        return {
            zIndex: highestIndex,
            elements: arr,
            contains: function(el){  
                for (var i=0; i<arr.length; i++){
                    if (arr[i]===el) return true;
                }
                return false;
            }
        };
    },
    
    
  //**************************************************************************
  //** getNextHighestZindex
  //**************************************************************************
    getNextHighestZindex: function(obj){
        var highestIndex = javaxt.dhtml.utils.getHighestElements(obj).zIndex;
        return(highestIndex+1);
    },


  //**************************************************************************
  //** round
  //**************************************************************************
  /** Rounds decimal to the nearest 10ths place.
   */
    round : function(number, decimalPlaces){
        if (decimalPlaces){
            var n = Math.pow(10, decimalPlaces);
            return Math.round( number * n ) / n;
        }
        else{
            return Math.round(number);
        }
    }


};


//  //**************************************************************************
//  //** alert
//  //**************************************************************************
//  /** Overrides the native javascript alert() method by creating a
//   *  javaxt.dhtml.Alert window.
//   */
//    var alert = function(msg, callback, scope){
//
//        if (msg==null) msg = "";
//
//
//      //Special case for ajax request
//        if (!(typeof(msg) === 'string' || msg instanceof String)){
//            if (msg.responseText){
//                msg = (msg.responseText.length>0 ? msg.responseText : msg.statusText);
//            }
//        }
//
//        var win = javaxt.dhtml.Alert;
//
//        if (!win){
//
//            var body = document.getElementsByTagName("body")[0];
//
//
//            var outerDiv = document.createElement('div');
//            outerDiv.style.width = "100%";
//            outerDiv.style.height = "100%";
//            outerDiv.style.position = "relative";
//            outerDiv.style.cursor = "inherit";
//            var innerDiv = document.createElement('div');
//            innerDiv.style.width = "100%";
//            innerDiv.style.height = "100%";
//            innerDiv.style.position = "absolute";
//            innerDiv.style.overflowX = 'hidden';
//            innerDiv.style.cursor = "inherit";
//            outerDiv.appendChild(innerDiv);
//
//
//            win = javaxt.dhtml.Alert = new javaxt.dhtml.Window(body, {
//                width: 450,
//                height: 200,
//                valign: "top",
//                modal: true,
//                title: "Alert",
//                body: outerDiv,
//                style: {
//                    panel: "window",
//                    header: "window-header alert-header",
//                    title: "window-title",
//                    buttonBar: {
//                        float: "right",
//                        padding: "9px"
//                    },
//                    button: "window-header-button",
//                    body: {
//                        padding: "10px 10px 15px 15px",
//                        verticalAlign: "top"
//                    }
//                }
//            });
//            win.div = innerDiv;
//        }
//
//
//        win.div.innerHTML = msg;
//        win.show();
//
//    };
//
//    javaxt.dhtml.Alert = null;