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
        var settings = {
            method: "GET",
            payload: null
        };
        javaxt.dhtml.utils.merge(settings, config);
        javaxt.dhtml.utils.http(url, settings);
    },


  //**************************************************************************
  //** post
  //**************************************************************************
    post: function(url, payload, config){
        var settings = {
            method: "POST",
            payload: payload
        };
        javaxt.dhtml.utils.merge(settings, config);
        javaxt.dhtml.utils.http(url, settings);
    },


  //**************************************************************************
  //** delete
  //**************************************************************************
    delete: function(url, config){
        var settings = {
            method: "DELETE",
            payload: null
        };
        javaxt.dhtml.utils.merge(settings, config);
        return javaxt.dhtml.utils.http(url, settings);
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
        
        request.onreadystatechange = function(){
            if (request.readyState === 4) {
                if (request.status===200){
                    
                    if (success) success.apply(scope, [request.responseText, request.responseXML]);
                    
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
  //** merge
  //**************************************************************************
  /** Used to merge properties from one json object into another. Credit:
   *  https://github.com/stevenleadbeater/JSONT/blob/master/JSONT.js
   */
    merge: function(settings, defaults) {
        var merge = function(settings, defaults) {
            for (var p in defaults) {
                if ( defaults.hasOwnProperty(p) && typeof settings[p] !== "undefined" ) {
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
        var clone = {};
        javaxt.dhtml.utils.merge(clone, obj);
        return clone;
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
                    rett = diff(obj1[i], obj2[i]);
                    if (!isEmpty(rett) ){
                        ret[i]= rett;
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
  //** setStyle
  //**************************************************************************
  /** Used to set the style for a given element. Styles are defined via a CSS
   *  class name or inline using the config.style definitions.
   */
    setStyle: function(el, style){
        if (el===null || el===0) return;
        if (style===null) return;

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