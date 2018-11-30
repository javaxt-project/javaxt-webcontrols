if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Carousel
//******************************************************************************
/**
 *   Simple carousel control
 *
 ******************************************************************************/

javaxt.dhtml.Carousel = function(parent, config) {
    this.className = "javaxt.dhtml.Carousel";
    
    var me = this;
    var outerDiv, innerDiv;
    var currPanel;
    var sliding = false;
    var noselect;
    
    
    var defaultConfig = {
        
        animate: true,
        animationSteps: 250.0, //time in milliseconds
        loop: false,
        visiblePanels: 1,
        drag: true,
        padding: 0
    };
    
    
    
  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class. */
    
    var init = function(){
        
        if (typeof parent === "string"){
            parent = document.getElementById(parent);
        }
        if (!parent) return;
        
        
      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;  
        
        
      //Remove anything found inside the parent
        var items = [];
        if (config.items){
            items = config.items;
        }
        else{
            for (var i=0; i<parent.childNodes.length; i++){
                var node = parent.childNodes[i];
                if (node.nodeType===1){
                    items.push(node);
                }
            }
            for (var i=0; i<items.length; i++){
                parent.removeChild(items[i]);
            }
            parent.innerHTML = "";
        }
        
        
      //Create overflow divs
        outerDiv = document.createElement("div");
        outerDiv.setAttribute("desc", me.className);
        outerDiv.style.position = "relative";
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        parent.appendChild(outerDiv);
        me.el = outerDiv;
        
        
        var overflowDiv = document.createElement("div");
        overflowDiv.style.position = "absolute";
        overflowDiv.style.overflow = "hidden";
        overflowDiv.style.width = "100%";
        overflowDiv.style.height = "100%";
        var padding = config.padding;
        if (padding>0){
            overflowDiv.style.padding = "0 " + padding + "px";
            overflowDiv.style.left = -padding + "px";
        }
        outerDiv.appendChild(overflowDiv);
        
        
      //Create main div used to store panels. This div will move horizontally
        innerDiv = document.createElement("div");
        innerDiv.style.position = "absolute";
        innerDiv.style.left = "0px";
        innerDiv.style.height = "100%";
        overflowDiv.appendChild(innerDiv);
        
        
        if (config.drag===true){
            addNoSelectRule();
            initDrag(innerDiv);
        }
        
        /*

      //Create logic to process touch events
        var touchStartTime;
        var touchEndTime;
        var x1, x2, y1, y2;

        innerDiv.ontouchstart = function(e) {

            e.preventDefault();
            x1 = e.changedTouches[0].pageX;
            y1 = e.changedTouches[0].pageY;
            touchStartTime = new Date().getTime();
            touchEndTime = null;
        };

        innerDiv.ontouchend = function(e) {

            touchEndTime= new Date().getTime();
            x2 = e.changedTouches[0].pageX;
            y2 = e.changedTouches[0].pageY;

            var distance = Math.sqrt( (x2-=x1)*x2 + (y2-=y1)*y2 );
            if (distance<0) distance = -distance;
            var duration = touchEndTime - touchStartTime;

            if (duration <= 500 && distance <= 10) {
                  // Person tapped their finger (do click/tap stuff here)
            }
            if (duration > 500 && distance <= 10) {
                  // Person pressed their finger (not a quick tap)
            }
            if (duration <= 100 && distance > 10) {
                  // Person flicked their finger
            }
            if (duration > 100 && distance > 10) {
                  // Person dragged their finger
            }
        };
        */
        
        
        for (var i=0; i<items.length; i++){
            me.add(items[i]);
        }
        
        
      //Watch for resize events
        addResizeListener(parent, function(){
            me.resize();
        });
        
    };
    
    

    
  //**************************************************************************
  //** add
  //**************************************************************************
  /**  Used to add a panel to the carousel. 
   */
    this.add = function(el){
        
      //Get width of the innerDiv before adding a new panel
        var w = parseInt(innerDiv.style.width);
        if (isNaN(w)) w = 0;



      //Create divs (for overflow purposes)
        var div = document.createElement('div');
        div.style.width=outerDiv.offsetWidth+"px";
        div.style.height="100%";
        div.style.position="relative";
        div.style.display="inline-block";
        var padding = config.padding;
        if (padding>0){
            div.style.width=(outerDiv.offsetWidth + (padding*2))+"px";
        }
        innerDiv.appendChild(div);

        var overflowDiv = document.createElement('div');
        overflowDiv.style.width="100%";
        overflowDiv.style.height="100%";
        overflowDiv.style.position="absolute";
        overflowDiv.style.overflow="hidden";
        if (padding>0){
            overflowDiv.style.padding = "0 " + padding + "px";
            overflowDiv.style.width=outerDiv.offsetWidth+"px";
        }
        div.appendChild(overflowDiv);
        
        
      //Add element to the overflow div
        overflowDiv.appendChild(el);
        
        
      //Update width
        innerDiv.style.width = (w+div.offsetWidth)+"px";
        
        if (!currPanel) currPanel = div;
        
        
      //Resize all the divs (bug fix for Chrome)
        me.resize();
    };


  //**************************************************************************
  //** resize
  //**************************************************************************
    this.resize = function(){

      //Compute width of individual panels
        var width = outerDiv.offsetWidth;
        var padding = config.padding;
        if (padding>0){
            width += (padding*2);
        }

        
      //Update panel container
        var numPanels = innerDiv.childNodes.length;
        innerDiv.style.width = (width*numPanels) + "px";
        
        
      //Update individual panels
        var currPanelIdx = 0;
        for (var i=0; i<numPanels; i++){
            innerDiv.childNodes[i].style.width = width + "px";

            if (padding>0){
                var overflowDiv = innerDiv.childNodes[i].childNodes[0];
                overflowDiv.style.width=outerDiv.offsetWidth+"px";
            }
            
            if (innerDiv.childNodes[i]==currPanel){
                currPanelIdx = i;
            }
        }
        
        
      //Update position
        innerDiv.style.left = -(currPanelIdx*width)+"px";
    };
    

  //**************************************************************************
  //** slide
  //**************************************************************************
    var slide = function(start, end, lastTick, timeLeft, callback){

        var curTick = new Date().getTime();
        var elapsedTicks = curTick - lastTick;


      //If the animation is complete, ensure that the panel is completely visible 
        if (timeLeft <= elapsedTicks){
            innerDiv.style.left = end+"px";
            if (callback) callback.apply(me, []);
            return;
        }



        timeLeft -= elapsedTicks;
        
        
        var d = start-end;
        var percentComplete = 1-(timeLeft/config.animationSteps);
        var offset = Math.round(percentComplete * d);
        innerDiv.style.left = start-offset + "px";

        setTimeout(function(){
            slide(start, end, curTick, timeLeft, callback);
        }, 33);
    };


  //**************************************************************************
  //** next
  //**************************************************************************
  /** Used to make the next panel visible. */
  
    this.next = function(){

        if (sliding) return;
        sliding = true;

        var start = parseInt(innerDiv.style.left);
        var w;


        var next = function(callback){
            
            var end = start-w;
            
            if (config.animate===true){
                slide(start, end, new Date().getTime(), config.animationSteps, callback);
            }
            else{
                innerDiv.style.left = end+"px";
                if (callback) callback.apply(me, []);
            }
        };

        var nextDiv = currPanel.nextSibling;
        if (nextDiv) {
            me.beforeChange(currPanel.childNodes[0].childNodes[0], nextDiv.childNodes[0].childNodes[0]);
            
            w = nextDiv.offsetWidth;
            
            next(function(){
                me.onChange(nextDiv.childNodes[0].childNodes[0], currPanel.childNodes[0].childNodes[0]);
                currPanel = nextDiv;
                sliding = false;
            });
        }
        else{
            if (config.loop===true){
 
                var firstDiv = innerDiv.childNodes[0];
                w = firstDiv.offsetWidth;
                var clone = firstDiv.cloneNode(true);
                innerDiv.style.width = (innerDiv.offsetWidth+w)+"px";
                innerDiv.appendChild(clone);
                me.beforeChange(currPanel.childNodes[0].childNodes[0], clone.childNodes[0].childNodes[0]);
                
                next(function(){

                    innerDiv.style.left = start + "px";
                    innerDiv.removeChild(firstDiv);
                    innerDiv.style.width = (innerDiv.offsetWidth-w)+"px";
                    
                    me.onChange(clone.childNodes[0].childNodes[0], currPanel.childNodes[0].childNodes[0]);
                    currPanel = clone;
                    sliding = false;

                });
            }
        }
    };
    
    
  //**************************************************************************
  //** back
  //**************************************************************************
  /** Used to make the previous panel visible. */
  
    this.back = function(){
        
        if (sliding) return;
        sliding = true;

        var start, end, w;

        
        var back = function(callback){
            
            if (config.animate===true){
                slide(start, end, new Date().getTime(), config.animationSteps, callback);
            }
            else{
                innerDiv.style.left = end+"px";
                if (callback) callback.apply(me, []);
            }
        };
        
        
        var previousDiv = currPanel.previousSibling;
        if (previousDiv){
            me.beforeChange(currPanel.childNodes[0].childNodes[0], previousDiv.childNodes[0].childNodes[0]);
            
            w = previousDiv.offsetWidth;
            start = parseFloat(innerDiv.style.left);
            end = start + w;
            
            back(function(){
                me.onChange(previousDiv.childNodes[0].childNodes[0], currPanel.childNodes[0].childNodes[0]);
                currPanel = previousDiv;
                sliding = false;
            });
        }
        else{
            if (config.loop===true){
                
                var lastDiv = innerDiv.childNodes[innerDiv.childNodes.length-1];
                w = lastDiv.offsetWidth;
                var clone = lastDiv.cloneNode(true);
                innerDiv.style.width = (innerDiv.offsetWidth+w)+"px";
                innerDiv.insertBefore(clone, innerDiv.firstChild);
                me.beforeChange(currPanel.childNodes[0].childNodes[0], clone.childNodes[0].childNodes[0]);
                
                start = -w;
                end = 0;

                
                innerDiv.style.left = start + "px";
                
                back(function(){
                    
                    innerDiv.removeChild(lastDiv);
                    innerDiv.style.width = (innerDiv.offsetWidth-w)+"px";
                    
                    me.onChange(clone.childNodes[0].childNodes[0], currPanel.childNodes[0].childNodes[0]);
                    currPanel = clone;
                    sliding = false;
                    
                });
                
            }
        }
    };


    
    

    
    
  //**************************************************************************
  //** onChange
  //**************************************************************************
    this.onChange = function(currPanel, prevPanel){};


  //**************************************************************************
  //** beforeChange
  //**************************************************************************
    this.beforeChange = function(currPanel, nextPanel){};
    
    
  //**************************************************************************
  //** getPanels
  //**************************************************************************
    this.getPanels = function(){
        var arr = [];
        for (var i=0; i<innerDiv.childNodes.length; i++){
            var div = innerDiv.childNodes[i];
            var isVisible = (div==currPanel); //Only valid if config.visiblePanels==1
            arr.push({
               div: div.childNodes[0].childNodes[0],
               isVisible: isVisible
            });
        }
        return arr;
    };
        
    
    
  //**************************************************************************
  //** initDrag
  //**************************************************************************
    var initDrag = function(){

        
      //This is how many milliseconds to wait before recognizing a hold
        var holdDelay = 50;
        
        var startX, offsetX;
        var prevPanel;

      //Function called when a drag is initiated
        var onDragStart = function(e){
            startX = e.clientX;
            offsetX = parseInt(innerDiv.style.left);

                   
            
          //Disable text selection in the entire document - very important!
            var body = document.getElementsByTagName('body')[0];
            if (!body.className.match(/(?:^|\s)javaxt-noselect(?!\S)/) ){
                body.className += (body.className.length==0 ? "" : " ") + "javaxt-noselect";
            } 
            
            
            prevPanel = currPanel;
            innerDiv.style.cursor = 'move';
        };
        
        

      //Function called while the div is being dragged 
        var onDrag = function(e){
            var x = e.clientX;
            var d = startX-x; //If d is positive, client is sliding to the right. 
                              //Otherwise, client is sliding to the left.
            
            
            var left = offsetX-d;
            innerDiv.style.left = left + 'px';
            
            if (left>0){ //dragged to the left beyond the first div 
                
                if (config.loop===true){
                    
                    var previousDiv = currPanel.previousSibling;
                    if (previousDiv){
                        
                    }
                    else{
                    
                      //Clone the last div and insert it to the left
                        var lastDiv = innerDiv.childNodes[innerDiv.childNodes.length-1];
                        var w = lastDiv.offsetWidth;
                        var clone = lastDiv.cloneNode(true);
                        innerDiv.insertBefore(clone, innerDiv.firstChild);
                        innerDiv.removeChild(lastDiv);
                        innerDiv.style.left = (-w+parseInt(innerDiv.style.left)) + "px";
                        startX+=w;
                        currPanel = clone;
                    }
                    
                }
                else{
                    //Prevent dragging any further to the right
                }
                
                
            }
            else{
                
                
              //Compute max offset
                var x = 0;
                var lastDivWidth = 0;
                for (var i=0; i<innerDiv.childNodes.length; i++){
                    var w = innerDiv.childNodes[i].offsetWidth;
                    x = x-w;
                    lastDivWidth = w;
                }
                
                
                //console.log(d + "   " + left);
                //console.log(x);
                
                if ((left-lastDivWidth)<x){ //dragged to the right beyond the last div 
                    
                    
                    if (config.loop===true){
                     
                        var firstDiv = innerDiv.childNodes[0];
                        var w = firstDiv.offsetWidth;
                        var clone = firstDiv.cloneNode(true);
                        innerDiv.appendChild(clone);
                        innerDiv.removeChild(firstDiv);
                        innerDiv.style.left = (parseInt(innerDiv.style.left)+w) + "px";
                        startX = startX-w;
                        currPanel = clone;
                    }
                    else{
                        //Prevent dragging any further to the left
                    }
                }
                
                

            }
        };
        
        
      //Function called when the user stops dragging the div
        var onDragEnd = function(){
            
            var rect = _getRect(outerDiv);
            var minX = rect.x;
            var maxX = minX+rect.width;
            var minY = rect.y;
            var maxY = minY+rect.height;
            
            var maxArea = 0;
            var visiblePanel = 0;
            
            for (var i=0; i<innerDiv.childNodes.length; i++){
                
                var panel = innerDiv.childNodes[i];
                var r1 = _getRect(panel);
                
                var left = r1.x;
                var right = left + r1.width;
                var top = r1.y;
                var bottom = top + r1.height;

                if (left<minX) left=minX;
                if (right>maxX) right=maxX;
                if (top<minY) top=minY;
                if (bottom>maxY) bottom=maxY;

                var w = right-left;
                var h = bottom-top;
                var area = w*h;
                
                if (area>maxArea){
                    maxArea = area;
                    visiblePanel = i;
                }
            }
            
            var debug = "Snap to panel " + innerDiv.childNodes[visiblePanel].innerText;
            if (debug.length>60) debug = debug.substring(0, 60);
            //console.log(debug + " idx=" + visiblePanel);
            
            var start = parseInt(innerDiv.style.left);
            var end = 0;
            for (var i=0; i<visiblePanel; i++){
                end += innerDiv.childNodes[i].offsetWidth;
            }
            end = -end;
            //innerDiv.style.left = end + "px";
            
            var animationSteps = ((start-end)/config.animationSteps);
            if (animationSteps<0) animationSteps = -animationSteps;
            //console.log(start + "/" + end + " --> move " + (start-end) + "px in " + animationSteps + "ms");
            
            slide(start, end, new Date().getTime(), 100, function(){
                currPanel = innerDiv.childNodes[visiblePanel];
                if (currPanel!=prevPanel){
                    me.onChange(currPanel.childNodes[0].childNodes[0], prevPanel.childNodes[0].childNodes[0]);
                }
            });
            
        };
        

      //This timeout, started on mousedown, triggers the beginning of a hold
        var holdStarter = null;



      //This flag indicates the user is currently holding the mouse down
        var holdActive = false;


      //OnClick
        //div.onclick = NOTHING!! not using onclick at all - onmousedown and onmouseup take care of everything


      //MouseDown
        innerDiv.onmousedown = function(e){
            if (sliding) return;
            
            // Do not take any immediate action - just set the holdStarter
            // to wait for the predetermined delay, and then begin a hold
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;

              //begin hold-only operation here, if desired
                //console.log("Init Drag!");
                
                onDragStart(e);
                if (document.addEventListener) { // For all major browsers, except IE 8 and earlier
                    document.addEventListener("mousemove", onDrag);
                    document.addEventListener("mouseup", onMouseUp);
                } 
                else if (document.attachEvent) { // For IE 8 and earlier versions
                    document.attachEvent("onmousemove", onDrag);
                    document.addEventListener("onmouseup", onMouseUp);
                }             

            }, holdDelay);
            
        };



      //MouseUp
        var onMouseUp = function (e){

            if (sliding) return;

          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);
                
              //run click-only operation here
                console.log("Click!");

            }
            
          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;

              //end hold-only operation here, if desired
                //console.log("End Drag!");
                if (document.removeEventListener) { // For all major browsers, except IE 8 and earlier
                    document.removeEventListener("mousemove", onDrag);
                    document.removeEventListener("mouseup", onMouseUp);
                } else if (document.detachEvent) { // For IE 8 and earlier versions
                    document.detachEvent("onmousemove", onDrag);
                    document.detachEvent("onmouseup", onMouseUp);
                }
                innerDiv.style.cursor = 'pointer';
                onDragEnd();
                
              //Remove the "javaxt-noselect" class
                var body = document.getElementsByTagName('body')[0];
                body.className = body.className.replace( /(?:^|\s)javaxt-noselect(?!\S)/g , '' );
            }

        };


        innerDiv.onmouseup = onMouseUp;
    };




  //**************************************************************************
  //** addNoSelectRule
  //**************************************************************************
  /** Inserts the "javaxt-noselect" class into the document if it is not 
   *  present.
   */
    var addNoSelectRule = function(){
        if (noselect===true) return;
        noselect = hasStyleRule(".javaxt-noselect");
        if (!noselect){
            var head = document.head || document.getElementsByTagName('head')[0];
            var sheet = document.createElement('style');
            sheet.innerHTML = ".javaxt-noselect {\n";
            var arr = ["-webkit-","-moz-","-o-","-ms-","-khtml-",""];
            for (var i=0; i<arr.length; i++){
                sheet.innerHTML += arr[i] + "user-select: none;\n";
            }                    
            sheet.innerHTML += "}";
            head.appendChild(sheet);
            noselect = true;
        }
    };


  //**************************************************************************
  //** hasStyleRule
  //**************************************************************************
  /** Returns true if there is a style rule defined for a given selector.
   *  @param selector CSS selector (e.g. ".deleteIcon", "h2", "#mid")
   */
    var hasStyleRule = function(selector) {

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
            var rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules;
            if (hasRule(selector, rules)){
                return true;
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
    };


  //**************************************************************************
  //** getRect
  //**************************************************************************
  /** Returns the geometry of a given element.
   */
    var _getRect = function(el){
        
        function findPosX(obj){
            var curleft = 0;
            if (obj.offsetParent){
                while (obj.offsetParent) {
                    curleft += obj.offsetLeft;
                    obj = obj.offsetParent;
                }
            }
            else if (obj.x)
                    curleft += obj.x;
            return curleft;
        };


        function findPosY(obj){
            var curtop = 0;
            if (obj.offsetParent) {
                while (obj.offsetParent){
                    curtop += obj.offsetTop;
                    obj = obj.offsetParent;
                }
            }
            else if (obj.y) {
                curtop += obj.y;
            }
            return curtop;
        };



        var x = 0;
        var y = 0;
        var h = el.offsetHeight;
        var w = el.offsetWidth;

        x = findPosX(el);
        y = findPosY(el);

        return{
            x: x,
            y: y,
            width: w,
            height: h
        };
    };


  //**************************************************************************
  //** merge
  //**************************************************************************
  /** Used to merge properties from one json object into another. Credit:
   *  https://github.com/stevenleadbeater/JSONT/blob/master/JSONT.js
   */
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


  //**************************************************************************
  //** addResizeListener
  //**************************************************************************
  /** Used to watch for resize events for a given element. Credit:
   *  http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
   */
    var addResizeListener = function(element, fn){
        
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

    };



    init();
};