if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Carousel
//******************************************************************************
/**
 *   Component used to render two or more panels in a horizonal layout. Users 
 *   can cycle through the panels using the back() and next() functions. The
 *   carousel can store a fixed set of panels or you can create the illusion
 *   of having infinite panels by updating panels when they are out of view.
 *
 ******************************************************************************/

javaxt.dhtml.Carousel = function(parent, config) {
    this.className = "javaxt.dhtml.Carousel";

    var me = this;
    var outerDiv, innerDiv;
    var currPanel;
    var sliding = false;
    var noselect;
    var resizeListener;

    var defaultConfig = {
        
      /** If true, will animate transitions when calling the back() and next()
       *  functions.
       */
        animate: true,
        
        
      /** Time to transition between panels, in milliseconds. Only applicable 
       *  when "animate" is set to true.
       */
        animationSteps: 250.0,
        
        
      /** Transition effect. Only applicable when "animate" is set to true and
       *  an "fx" config is given. See the javaxt.dhtml.Effects class for
       *  a list of options.
       */
        transitionEffect: "linear",
        
        
      /** An instance of a javaxt.dhtml.Effects class used to animate 
       *  transitions. Only used when "animate" is set to true.
       */
        fx: null,
        
        
      /** By default, a user cannot go past the last panel in the carousel when
       *  calling next() or past the first panel when calling back(). However,
       *  when "loop" is set to true, users can go past the first/last panels 
       *  by cloning the "next" or "previous" panel and appending it to
       *  the carousel so you can cycle through elements.
       */
        loop: false,
        
        
      /** If true, will move the next panel over the current panel during
       *  transitions. Only applicable when "animate" is set to true.
       */
        slideOver: false,
        
        
      /** If true, will allow touchscreen users to slide back and forth through 
       *  the panels using touch gestures.
       */
        drag: true,
        
        
      /** Currently unused
       */
        visiblePanels: 1,
        
        
      /** Amount of padding between panels, in pixels.
       */
        padding: 0
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
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


      //Add public show/hide methods
        addShowHide(me);


      //Watch for resize events
        resizeListener = addResizeListener(parent, function(){
            me.resize();
        });



      //Check whether the carousel has been added to the DOM
        onRender(outerDiv, function(){
            me.resize();
            me.onRender();
        });
    };


  //**************************************************************************
  //** destroy
  //**************************************************************************
  /** Used to destroy the carousel and remove it from the DOM
   */
    this.destroy = function(){
        if (resizeListener) resizeListener.destroy();
        me.disableAnimation();
        sliding = true;
        destroy(me);
        me = null;
        return me;
    };


  //**************************************************************************
  //** onRender
  //**************************************************************************
  /** Called after the carousel has been added to the DOM
   */
    this.onRender = function(){};


  //**************************************************************************
  //** add
  //**************************************************************************
  /** Used to add a panel to the carousel
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
  //** clear
  //**************************************************************************
  /** Used to remove all the panels from the carousel
   */
    this.clear = function(){
        currPanel = null;
        innerDiv.innerHTML = "";
        innerDiv.style.left = "0px";
        sliding = false;
        resize();
    };


  //**************************************************************************
  //** resize
  //**************************************************************************
    this.resize = function(){
        var w = outerDiv.offsetWidth;
        if (w===0 || isNaN(w)){
            var timer;

            var checkWidth = function(){
                var w = outerDiv.offsetWidth;
                if (w===0 || isNaN(w)){
                    timer = setTimeout(checkWidth, 100);
                }
                else{
                    clearTimeout(timer);
                    resize();
                }
            };

            timer = setTimeout(checkWidth, 100);
        }
        else{
            resize();
        }
    };


    var resize = function(){

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
        if (sliding) return;
        innerDiv.style.left = -(currPanelIdx*width)+"px";
    };


  //**************************************************************************
  //** slide
  //**************************************************************************
    var slide = function(el, start, end, lastTick, timeLeft, callback){

        if (config.fx){


            setTimeout(function(){

                config.fx.setTransition(el, config.transitionEffect, config.animationSteps);
                el.style.left = end+"px";
                setTimeout(function(){


                    el.style.WebkitTransition =
                    el.style.MozTransition =
                    el.style.MsTransition =
                    el.style.OTransition =
                    el.style.transition = "";

                    if (callback) callback.apply(me, []);

                }, config.animationSteps+50);
            }, 50);

        }
        else{


            var curTick = new Date().getTime();
            var elapsedTicks = curTick - lastTick;


          //If the animation is complete, ensure that the panel is completely visible
            if (timeLeft <= elapsedTicks){
                el.style.left = end+"px";
                if (callback) callback.apply(me, []);
                return;
            }



            timeLeft -= elapsedTicks;


            var d = start-end;
            var percentComplete = 1-(timeLeft/config.animationSteps);
            var offset = Math.round(percentComplete * d);
            el.style.left = start-offset + "px";

            setTimeout(function(){
                slide(el, start, end, curTick, timeLeft, callback);
            }, 33);
        }
    };


  //**************************************************************************
  //** next
  //**************************************************************************
  /** Used to make the next panel visible. In a horizontal configuration, the
   *  active panel will slide left.
   */
    this.next = function(){
        
        if (config.animate===true){
            if (sliding) return;
            sliding = true;
        }

        var start = parseInt(innerDiv.style.left);
        var w;
        var currDiv = currPanel.childNodes[0].childNodes[0];
        var nextDiv;


        var next = function(callback){

            var end = start-w;

            if (config.animate===true){
                slide(innerDiv, start, end, new Date().getTime(), config.animationSteps, callback);
            }
            else{
                innerDiv.style.left = end+"px";
                if (callback) callback.apply(me, []);
            }
        };

        var raiseDiv = function(div){

          //Get y-offset of nextPanel
            var s = 0;
            for (var i=0; i<innerDiv.childNodes.length; i++){
                var p = innerDiv.childNodes[i];
                s+=p.offsetWidth;
                if (p===currPanel) break;
            }

          //Update div to be an absolute div
            div.style.display = "none";
            currPanel.style.marginRight = w +"px";
            div.style.position = "absolute";
            div.style.zIndex = 2;
            div.style.left = s + "px";
            div.style.top = "0px";
            div.style.display = "";
            return s;
        };
        
        var lowerDiv = function(div){
            div.style.display = "inline-block";
            div.style.position = "relative";
            div.style.zIndex = "";
            div.style.left = "";
            div.style.top = "";
        };


        
        var nextPanel = currPanel.nextSibling;
        if (nextPanel) {
            
            nextDiv = nextPanel.childNodes[0].childNodes[0];

            
            me.beforeChange(currDiv, nextDiv);

            var onChange = function(){
                me.onChange(nextDiv, currDiv);
                currPanel = nextPanel;
                sliding = false;
            };
            

            w = nextPanel.offsetWidth;

            if (config.slideOver===true && config.animate===true){
                
              //Update nextPanel to be an absolute div
                var s = raiseDiv(nextPanel);

              //Slide nextPanel over currPanel
                slide(nextPanel, s, s-w, new Date().getTime(), config.animationSteps, function(){
                    
                  //Slide innerDiv
                    var end = start-w;
                    innerDiv.style.left = end+"px";
                    currPanel.style.marginRight = "0px";
                    
                  //Update nextPanel to it's original state (e.g. relative div)
                    lowerDiv(nextPanel);
                    
                  //Call onChange
                    onChange();
                });
            }
            else{
                next(onChange);
            }
        }
        else{
            if (config.loop===true){

                var firstDiv = innerDiv.childNodes[0];
                w = firstDiv.offsetWidth;
                var clone = firstDiv.cloneNode(true);
                innerDiv.style.width = (innerDiv.offsetWidth+w)+"px";
                innerDiv.appendChild(clone);
                
                nextDiv = clone.childNodes[0].childNodes[0];
                
                me.beforeChange(currDiv, nextDiv);

                var onChange = function(){
                    innerDiv.style.left = start + "px";
                    innerDiv.removeChild(firstDiv);
                    innerDiv.style.width = (innerDiv.offsetWidth-w)+"px";

                    me.onChange(nextDiv, currDiv);
                    currPanel = clone;
                    sliding = false;
                };


                if (config.slideOver===true && config.animate===true){

                  //Update clone to be an absolute div
                    var s = raiseDiv(clone);
                    
                  //Slide nextPanel over currPanel
                    slide(clone, s, s-w, new Date().getTime(), config.animationSteps, function(){

                      //Slide innerDiv
                        currPanel.style.marginRight = "0px";

                      //Update clone to it's original state (e.g. relative div)
                        lowerDiv(clone);

                      //Call onChange
                        onChange();
                    });
                    
                }
                else{
                    next(onChange);
                }
            }
            else{
                sliding = false;
            }
        }
    };


  //**************************************************************************
  //** back
  //**************************************************************************
  /** Used to make the previous panel visible. In a horizontal configuration,
   *  the active panel will slide right.
   */
    this.back = function(){

        if (config.animate===true){
            if (sliding) return;
            sliding = true;
        }

        var start, end, w;
        var currDiv = currPanel.childNodes[0].childNodes[0];
        var nextDiv;
        

        var back = function(callback){

            if (config.animate===true){
                slide(innerDiv, start, end, new Date().getTime(), config.animationSteps, callback);
            }
            else{
                innerDiv.style.left = end+"px";
                if (callback) callback.apply(me, []);
            }
        };

        var raiseDiv = function(div){
            
          //Get y-offset of div
            var s = 0;
            for (var i=0; i<innerDiv.childNodes.length; i++){
                var p = innerDiv.childNodes[i];
                if (p===div) break;
                s+=p.offsetWidth;
            }

          //Update div to be an absolute div
            div.style.display = "none";
            currPanel.style.marginLeft = w +"px";
            div.style.position = "absolute";
            div.style.zIndex = 2;
            div.style.left = s + "px";
            div.style.top = "0px";
            div.style.display = "";

            return s;
        };
        
        var lowerDiv = function(div){
            div.style.display = "inline-block";
            div.style.position = "relative";
            div.style.zIndex = "";
            div.style.left = "";
            div.style.top = "";
        };


        var nextPanel = currPanel.previousSibling;
        if (nextPanel){
            
            nextDiv = nextPanel.childNodes[0].childNodes[0];
            
            me.beforeChange(currDiv, nextDiv);

            var onChange = function(){
                me.onChange(nextDiv, currDiv);
                currPanel = nextPanel;
                sliding = false;
            };


            w = nextPanel.offsetWidth;
            start = parseFloat(innerDiv.style.left);
            end = start + w;

            if (config.slideOver===true && config.animate===true){
                
              //Update nextPanel to be an absolute div
                var s = raiseDiv(nextPanel);

              //Slide nextPanel over currPanel
                slide(nextPanel, s, s+w, new Date().getTime(), config.animationSteps, function(){
                    
                  //Slide innerDiv
                    innerDiv.style.left = end+"px";
                    currPanel.style.marginLeft = "0px";
                    
                  //Update nextPanel to it's original state (e.g. relative div)
                    lowerDiv(nextPanel);
                    
                  //Call onChange
                    onChange();
                });
            }
            else{
                back(onChange);
            }
        }
        else{
            if (config.loop===true){

                var lastDiv = innerDiv.childNodes[innerDiv.childNodes.length-1];
                w = lastDiv.offsetWidth;
                var clone = lastDiv.cloneNode(true);
                innerDiv.style.width = (innerDiv.offsetWidth+w)+"px";
                innerDiv.insertBefore(clone, innerDiv.firstChild);
                
                nextDiv = clone.childNodes[0].childNodes[0];

                me.beforeChange(currDiv, nextDiv);
                
                var onChange = function(){
                    me.onChange(nextDiv, currDiv);
                    currPanel = clone;
                    sliding = false;
                };

                start = -w;
                end = 0;


                if (config.slideOver===true && config.animate===true){
                    
                  //Update clone to be an absolute div
                    raiseDiv(clone);
                    var s = -w;
                    clone.style.left = s + "px";
                    
                    
                    innerDiv.style.width = (innerDiv.offsetWidth-w)+"px";
                    currPanel.style.marginLeft = "0px";
                    
                    
                  //Slide clone over currPanel
                    slide(clone, s, s+w, new Date().getTime(), config.animationSteps, function(){

                      //Remove lastDiv
                        innerDiv.removeChild(lastDiv);

                      //Update clone to it's original state (e.g. relative div)
                        lowerDiv(clone);

                      //Call onChange
                        onChange();
                    });

                }
                else{

                    innerDiv.style.left = start + "px";

                    back(function(){
                        innerDiv.removeChild(lastDiv);
                        innerDiv.style.width = (innerDiv.offsetWidth-w)+"px";
                        onChange();
                    });
                }
            }
            else{
                sliding = false;
            }
        }
    };


  //**************************************************************************
  //** onChange
  //**************************************************************************
  /** Called after the carousel switches panels
   *  @param currPanel Content of the active panel
   *  @param prevPanel Content of the previously active panel
   */
    this.onChange = function(currPanel, prevPanel){};


  //**************************************************************************
  //** beforeChange
  //**************************************************************************
  /** Called before the carousel switches panels.
   *  @param currPanel Content of the active panel
   *  @param prevPanel Content of the next active panel
   */
    this.beforeChange = function(currPanel, nextPanel){};


  //**************************************************************************
  //** getPanels
  //**************************************************************************
  /** Returns an array with information for each panel in the carousel
   *  including whether the panel is visible and the panel content.
   */
    this.getPanels = function(){
        var arr = [];
        var r1 = _getRect(outerDiv);



        for (var i=0; i<innerDiv.childNodes.length; i++){
            var panel = innerDiv.childNodes[i];
            var r2 = _getRect(panel);
            var isVisible = intersects(r1, r2);
            if (isVisible){
                var visibleArea = getAreaOfIntersection(r1, r2);
                if (visibleArea<=config.padding) isVisible = false;
            }

            arr.push({
               div: panel.childNodes[0].childNodes[0],
               isVisible: isVisible
            });
        }
        return arr;
    };


  //**************************************************************************
  //** enableAnimation
  //**************************************************************************
  /** Used to enable animations when transitioning between panels
   */
    this.enableAnimation = function(){
        config.animate = true;
    };


  //**************************************************************************
  //** disableAnimation
  //**************************************************************************
  /** Used to disable animations when transitioning between panels
   */
    this.disableAnimation = function(){
        config.animate = false;
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

            slide(innerDiv, start, end, new Date().getTime(), 100, function(){
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
                //console.log("Click!");

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
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var destroy = javaxt.dhtml.utils.destroy;
    var onRender = javaxt.dhtml.utils.onRender;
    var _getRect = javaxt.dhtml.utils.getRect;
    var intersects = javaxt.dhtml.utils.intersects;
    var getAreaOfIntersection = javaxt.dhtml.utils.getAreaOfIntersection;
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var addNoSelectRule = function(){
        if (noselect===true) return;
        javaxt.dhtml.utils.addNoSelectRule();
        noselect = true;
    };


    init();
};