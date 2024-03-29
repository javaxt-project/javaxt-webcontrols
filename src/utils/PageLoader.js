if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  PageLoader
//*****************************************************************************/
/**
 *   Used to dynamically load html documents.
 *
 ******************************************************************************/

javaxt.dhtml.PageLoader = function(config) {

    var me = this;
    var head = document.getElementsByTagName("head")[0];
    var debug = false;
    var includes;


    var init = function(){
        if (config){
            if (config.debug===true) debug = true;
        }
    };



  //**************************************************************************
  //** loadPage
  //**************************************************************************
  /** Used to replace the body of the current document with html from another
   *  document found at a given url. Dynamically loads any css stylesheets and
   *  javascripts sourced in the html document.
   */
    this.loadPage = function(url, onSuccess, onFail, onUpdate){
        me.load(url,
            function(html, title, inlineScripts){

              //Set title
                document.title = title;


              //Update body
                var body = document.getElementsByTagName("body")[0];
                body.innerHTML = html;


              //Add inline scripts
                for (var i=0; i<inlineScripts.length; i++){
                    var script = inlineScripts[i].firstChild.nodeValue;
                    var type = inlineScripts[i].getAttribute("type");
                    if (type=="module"){
                        script = script.replace("//<![CDATA[","").replace("//]]>","");
                        var s = document.createElement("script");
                        s.setAttribute("type", type);
                        s.innerHTML = script;
                        body.appendChild(s);
                    }
                    else{
                        eval(script);
                    }
                }


              //Dispatch onload event. Warning: ES6 modules with imports may not be ready...
                dispatchEvent("load");

                if (onSuccess) onSuccess.apply(me, []);
            },
            onFail,
            onUpdate
        );
    };


  //**************************************************************************
  //** load
  //**************************************************************************
  /** Used to fetch an html document found at a given url. Loads any css
   *  stylesheets and javascripts sourced in the html document. Returns the
   *  raw html, document title, and any inline scripts via the callback. It
   *  is up to the caller to decide what to do with the html (e.g. replace
   *  element) and when to execute the inline scripts.
   */
    this.load = function(url, onSuccess, onFail, onUpdate){
        get(url, function(html){

            var div = document.createElement("div");
            div.innerHTML = html;


          //Get title
            var title;
            var titles = div.getElementsByTagName("title");
            if (titles.length>0){
                title = titles[0].innerHTML;
            }


          //Get scripts
            var inlineScripts = [];
            var externalScripts = []; //urls
            var scripts = div.getElementsByTagName("script");
            for (var i=0; i<scripts.length; i++){
                if (scripts[i].src.length>0){
                    externalScripts.push(scripts[i].src);
                }
                else{
                    inlineScripts.push(scripts[i]);
                }
            }


          //Get external style sheets
            var css = []; //urls
            var cssNodes = [];
            var links = div.getElementsByTagName("link");
            for (var i=0; i<links.length; i++){
                if (links[i].rel=="stylesheet"){
                    if (links[i].href.length>0){
                        css.push(links[i].href);
                        cssNodes.push(links[i]);
                    }
                }
            }


          //Remove unused/unwanted nodes
            removeNodes(titles);
            removeNodes(div.getElementsByTagName("description"));
            removeNodes(div.getElementsByTagName("keywords"));
            removeNodes(div.getElementsByTagName("meta"));
            removeNodes(scripts);
            removeNodes(links);
            removeNodes(cssNodes);


          //Remove comments
            var comments = [];
            for (var i=0; i<div.childNodes.length; i++){
                var node = div.childNodes[i];
                if (node.nodeType==8){
                    comments.push(node);
                }
            }
            while (comments.length>0){
                div.removeChild(comments[0]);
                comments.shift();
            }



          //Get html and delete div
            html = div.innerHTML;
            div = null;


          //Load includes
            loadIncludes(
                css,
                externalScripts,
                function(){
                    if (onSuccess) onSuccess.apply(me, [html, title, inlineScripts]);
                },
                onUpdate
            );

        }, onFail);
    };


  //**************************************************************************
  //** loadApp
  //**************************************************************************
  /** Used to fetch an application xml document found at a given url. Loads
   *  any css stylesheets and javascripts sourced in the xml document. Returns
   *  the name and main function used to instantiate the application.
   */
    this.loadApp = function(url, onSuccess, onFail, onUpdate){
        get(url, function(text, xml){

          //Parse app info
            var appInfo = {};
            var application = xml.getElementsByTagName("application")[0];
            if (application){
                appInfo.name = application.getAttribute("name");
                appInfo.main = application.getAttribute("main");
            }


          //Parse includes
            var scripts = [];
            var css = [];
            var includes = xml.getElementsByTagName("includes")[0].childNodes;
            for (var i=0; i<includes.length; i++){
                var include = includes[i];
                if (include.nodeType==1){
                    var type = include.getAttribute("type");
                    if (type==="text/javascript"){
                        scripts.push(include.getAttribute("src"));
                    }
                    else if (type==="text/css"){
                        css.push(include.getAttribute("href"));
                    }
                }
            }


          //Load includes and call the onSuccess callback
            loadIncludes(
                css,
                scripts,
                function(){
                    if (onSuccess){
                        appInfo.init = function(){
                            var cls = stringToFunction(this.main);
                            return newInstance(cls).apply(arguments);
                        };
                        onSuccess.apply(me, [appInfo, xml]);
                    }
                },
                onUpdate
            );

        }, onFail);
    };


  //**************************************************************************
  //** loadIncludes
  //**************************************************************************
  /** Dynamically loads javascript and stylesheets.
   */
    var loadIncludes = function(css, scripts, onComplete, onUpdate){

        parseIncludes();

        var addInclude = function(category, key){
            if (category=="css") return true; //css order is important. skipping css files might mess up the order
            var obj = includes[category];
            for (var k in obj){
                if (obj.hasOwnProperty(k)){
                    if (k==key) return false;
                }
            }
            return true;
        };

        var arr = [];


      //Generate list of stylesheets to include
        for (var i=0; i<css.length; i++){
            if (addInclude("css", css[i])){
                var link = document.createElement("link");
                link.setAttribute("rel", "stylesheet");
                link.setAttribute("type", "text/css");
                link.setAttribute("href", css[i]);
                arr.push(link);

                includes.css[css[i]] = true;
            }
            else{
                log("Skipping " + css[i] + "...");
            }
        }


      //Generate list of javascripts to include
        for (var i=0; i<scripts.length; i++){
            if (addInclude("scripts", scripts[i])){
                var script = document.createElement("script");
                script.setAttribute("type", "text/javascript");
                script.setAttribute("src", scripts[i]);
                arr.push(script);

                includes.scripts[scripts[i]] = true;
            }
            else{
                log("Skipping " + scripts[i] + "...");
            }
        }


      //Load includes
        if (arr.length>0){

            var t = arr.length;
            var loadResource = function(obj){

                var processResponse = function(){

                    var percentComplete = Math.round((1-(arr.length/t))*100);
                    if (percentComplete===100 && arr.length>0) percentComplete = 99;
                    log(percentComplete + "%");

                    if (onUpdate!=null){
                        onUpdate({
                            totalIncludes: t,
                            remainingIncludes: arr.length,
                            percentComplete: percentComplete
                        });
                    }


                    if (arr.length>0) loadResource(arr.shift());
                    else {
                        if (onComplete!=null) onComplete.apply(me, []);
                    }
                };

                obj.onload = function() {
                    processResponse();
                };
                obj.onerror = function() {
                    processResponse();
                };

                head.appendChild(obj);
            };

            loadResource(arr.shift());
        }
        else{
            if (onComplete!=null) onComplete.apply(me, []);
        }

    };


  //**************************************************************************
  //** parseIncludes
  //**************************************************************************
    var parseIncludes = function(){
        if (includes) return;

        includes = {
            css: {},
            scripts: {}
        };


        var scripts = document.getElementsByTagName("script");
        for (var i=0; i<scripts.length; i++){
            if (scripts[i].src.length>0){
                includes.scripts[scripts[i].src] = true;
            }
        }


        var css = document.getElementsByTagName("link");
        for (var i=0; i<css.length; i++){
            if (css[i].rel=="stylesheet"){
                if (css[i].href.length>0){
                    includes.css[css[i].href] = true;
                }
            }
        }
    };


  //**************************************************************************
  //** removeNodes
  //**************************************************************************
    var removeNodes = function(nodes){
        while (nodes.length>0){
            var node = nodes[0];
            var parent = node.parentNode;
            if (!parent) break;
            parent.removeChild(node);
        }
    };


  //**************************************************************************
  //** stringToFunction
  //**************************************************************************
  /** Converts a string to a function or class. Example:
   *  var DateInput = stringToFunction("javaxt.dhtml.DateInput");
   *  var dateInput = new DateInput(...);
   */
    var stringToFunction = function(str) {
      var arr = str.split(".");

      var fn = (window || this);
      for (var i = 0, len = arr.length; i < len; i++) {
        fn = fn[arr[i]];
      }

      if (typeof fn !== "function") {
        throw new Error("function not found");
      }

      return  fn;
    };


  //**************************************************************************
  //** newInstance
  //**************************************************************************
  /** Used to instantiate a new instance of a given class. Example:
   *  var app = newInstance(cls).apply(arguments);
   */
    var newInstance = function(cls){

        var fn = (new Function("return function () { };"))();
        fn.prototype = cls.prototype;
        var self = new fn();

        return {
            apply: function(args) {
                cls.apply(self, args);
                return self;
            }
        };
    };


  //**************************************************************************
  //** dispatchEvent
  //**************************************************************************
  /** Fires a given window event (e.g. "load")
   */
    var dispatchEvent = function(name){
        var evt;
        try{
            evt = new Event(name);
        }
        catch(e){ //e.g. IE
            evt = document.createEvent('Event');
            evt.initEvent(name, false, false);
        }
        window.dispatchEvent(evt);
    };


  //**************************************************************************
  //** log
  //**************************************************************************
    var log = function(str){
        if (debug) console.log(str);
    };


  //**************************************************************************
  //** get
  //**************************************************************************
    var get = function(url, success, onFail){
        javaxt.dhtml.utils.get(url, {
            success: function(text, xml, url, request){
                request.abort();
                request = null;
                if (success) success.apply(me, [text, xml, url]);
            },
            failure: function(request){
                if (onFail) onFail.apply(me, [request]);
            }
        });
    };

    init();
};