if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Accordion Class
//******************************************************************************
/**
 *   A custom widget used to create an accordian control. Borrowed heavily from 
 *   the following tutorial:
 *   http://www.switchonthecode.com/tutorials/javascript-and-css-tutorial-accordion-menus
 *
 ******************************************************************************/


javaxt.dhtml.Accordion = function(parent, config) {

    this.className = "javaxt.dhtml.Accordion";

    var me = this;
    var tabs = {};
    var currTab = null;
    var maxHeight;
    
    var innerDiv;
    
    var defaultConfig = {
        
        activeOnTop: true,
        animate: true,
        animationSteps: 250.0, //time in milliseconds
        
        width: "100%",
        height: "100%",
        border: "1px solid #969696",
        margin: "0px",
                
        
        headerStyle: {
            borderBottom: "1px solid #969696",
            padding: "2px 0 3px 5px",
            cursor: "pointer",
            whiteSpace: "nowrap" 
        },
        
        
        contentStyle: {
            borderBottom: "1px solid #969696",
            padding: "2px 0 0 5px"
        }
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
        var childNodes = [];
        for (var i=0; i<parent.childNodes.length; i++){
            var node = parent.childNodes[i];
            if (node.nodeType===1){
                childNodes.push(node);
            }
        }
        for (var i=0; i<childNodes.length; i++){
            parent.removeChild(childNodes[i]);
        }
        parent.innerHTML = "";
        
        
        
      //Create outer table
        var table = document.createElement('table');
        table.style.width = getPixels(config.width);
        table.style.height = getPixels(config.height);
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.borderCollapse = "collapse";
        table.style.margin = config.margin;
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        var row = document.createElement('tr');
        var td = document.createElement('td');
        td.style.width="100%";
        td.style.height="100%";
        td.style.border = config.border;
        td.style.verticalAlign = "top";
        row.appendChild(td);
        tbody.appendChild(row);
        parent.appendChild(table);
        
        
        var outerDiv = document.createElement('div');
        outerDiv.style.width="100%";
        outerDiv.style.height="100%";
        outerDiv.style.position = "relative";
        td.appendChild(outerDiv);

        innerDiv = document.createElement('div');
        innerDiv.style.width="100%";
        innerDiv.style.height="100%";
        innerDiv.style.position = "absolute";
        innerDiv.style.overflow = "hidden";
        outerDiv.appendChild(innerDiv);
        
        

        
      //Watch for resize events
        addResizeListener(parent, function(){
            me.resize();
        });        
        
        
        
      //Add tabs
        for (var i=0; i<childNodes.length; i++){
            me.add(childNodes[i]);
        }
        
        
        
        if (config.default){
            var _animate = config.animate;
            config.animate = false;
            me.open(config.default);
            config.animate = _animate;
        }
        
    };
    
    



  //**************************************************************************
  //** addTab
  //**************************************************************************
  /** Used to add a panel to the accordion control.
   *  
   *  @param el Element (e.g. div or span) to add to the accordion. It is 
   *  recommended that the element have a "title" attribute that can be used 
   *  as the header label
   *  
   *  @param header If the el doesn't have a "title" attribute, you can pass in  
   *  a string to use as the header label. Alternatively, you can pass in a 
   *  custom html element to use as the header.
   */
    this.add = function(el, header){
        
      //Add Header
        var title;
        if (header){
            if (typeof header == "string"){
                title = header;
                header = createHeader(title);
            }
            else{ 
                //Assume that we have an html dom element...
                title = header.title;
            }
        }
        else{
            title = el.title;
            header = createHeader(title);
        }  
        innerDiv.appendChild(header);



        
      //Add Content
        setStyle(el, "contentStyle");
        el.style.height = "0px";
        el.style.overflow = "hidden";
        el.style.display = "none";
        innerDiv.appendChild(el);
        

      //Generate tab id
        var id = 1;
        for (var tabID in tabs){
            if (tabs.hasOwnProperty(tabID)){
                id++;
            }
        }
        
      //Update index
        tabs["tab"+id] = {
            title: title,
            el: el
        };
        

        header.setAttribute("tabID", id);
        
        
        header.onclick = function(e){
            var tabID = parseInt(this.getAttribute("tabID")); 
            var tab = tabs["tab"+tabID];
            me.open(tabID);
            me.onHeaderClick(tab.title, this, tab.el, e);
        };
    };
    
    
  //**************************************************************************
  //** createHeader
  //**************************************************************************
    var createHeader = function(title){
        var header = document.createElement("div");
        header.innerHTML = title;
        //header.onmouseover = mouseOver;
        //header.onmouseout = mouseOut;
        header.onselectstart = function(){ return false; };
        setStyle(header, "headerStyle");
        return header;
    };


  //**************************************************************************
  //** getCurrentTab
  //**************************************************************************
    this.getCurrentTab = function(){
        if (currTab){
            var tab = tabs["tab"+currTab];
            if (tab){
                return {
                    id: currTab,
                    el: tab.el,
                    title: tab.title
                };
            }
        }
        return null;
    };


  //**************************************************************************
  //** open
  //**************************************************************************
  /** Used to raise/open a panel on the accordion control.
   *  @param id The index number or title of the panel you want to raise.
   */
    this.open = function(id){


      //Find tab to open
        var el = null;
        if (typeof id == "string"){
            for (var tabID in tabs){
                if (tabs.hasOwnProperty(tabID)){
                    var tab = tabs[tabID];
                    if (tab.title === id){
                        el = tab.el;
                        id = parseInt(tabID.substring(3));
                        break;
                    }
                }
            }
        }
        else if (typeof id == "number"){
            var tab = tabs["tab"+id];
            if (tab){
                el = tab.el;
            }
        }
        if (el==null) return;



      //Check whether the tab is already open
        if (id==currTab){
            if (config.activeTabClosable == true){
              //Allow opened tab to be closed (no tabs will be open)
            }
            else{
              //Prevent opened tab from being closed (ensures that 1 tab is always open)
                return;
            }
        }


        var currEl = null;
        if (currTab){
            var tab = tabs["tab"+currTab];
            if (tab){
                currEl = tab.el;
            }
        }


        me.beforeChange();


      //Set currTab ID
        currTab = id;
        maxHeight = getMaxHeight(el);
        

        if (config.animate==true){
            animate(new Date().getTime(), config.animationSteps, currEl, el);
        }
        else{
            open(el, currEl);
        }
    };


  //**************************************************************************
  //** open
  //**************************************************************************
  /** Used to completely open one panel and close/hide another. 
   */
    var open = function(opening, closing){
        
        if (opening){
            opening.style.display = 'block';
            opening.style.height = maxHeight + 'px';
            opening.style.filter='alpha(opacity=100)';
            opening.style.MozOpacity=1;
        }

        if (closing){
            closing.style.display = 'none';
            closing.style.height = '0px';
            closing.style.filter='alpha(opacity=0)';
            closing.style.MozOpacity=0;
        }

        me.afterChange();
    };


  //**************************************************************************
  //** animate
  //**************************************************************************
  /**  Used to slide a panel open. */

    var animate = function(lastTick, timeLeft, closing, opening){
        
        var curTick = new Date().getTime();
        var elapsedTicks = curTick - lastTick;


      //Get Content Height
        if (maxHeight==null){
            maxHeight = getMaxHeight(opening);
        }


      //If the animation is complete, ensure that the panel is completely open 
        if (timeLeft <= elapsedTicks){
            open(opening, closing);
            return;
        }


        timeLeft -= elapsedTicks;
        var padding = getPadding(opening);
        var newClosedHeight = Math.round((timeLeft/config.animationSteps) * maxHeight-padding);
        var percentComplete = (timeLeft/config.animationSteps)*100;

        if (opening){
            if (opening.style.display != 'block'){
                opening.style.display = 'block';
                opening.style.filter='alpha(opacity='+(100-percentComplete)+')';
                opening.style.MozOpacity=(100-percentComplete)/100;
            }
            opening.style.height = (maxHeight - newClosedHeight)-padding + 'px';
        }

        if (closing){
            closing.style.height = newClosedHeight + 'px';
            closing.style.filter='alpha(opacity='+(percentComplete)+')';
            closing.style.MozOpacity=percentComplete/100;
        }


        setTimeout(function(){
            animate(curTick, timeLeft, closing, opening);
        }, 33);
    };



  //**************************************************************************
  //** resize
  //**************************************************************************
  /**  Used to resize the open panel whenever the browser is resized. */

    this.resize = function(){
        if (currTab){
            var tab = tabs["tab"+currTab];
            if (tab){
                var h = getMaxHeight();
                var p = getPadding(tab.el);
                tab.el.style.height = (h-p) + 'px';
            }
        }
    };


  //**************************************************************************
  //** onHeaderClick
  //**************************************************************************
  /** Called whenever a header is clicked.
   */
    this.onHeaderClick = function(title, header, panel, event){};


  //**************************************************************************
  //** beforeChange
  //**************************************************************************
  /** Called before a panel is raised.
   */
    this.beforeChange = function(){};
    

  //**************************************************************************
  //** afterChange
  //**************************************************************************
  /** Called after a panel is raised.
   */
    this.afterChange = function(){};



  //**************************************************************************
  //** getMaxHeight
  //**************************************************************************
  /**  Used to calculate the height of a panel. */

    var getMaxHeight = function(opening){
        
        var height = innerDiv.offsetHeight;
        if (height>0){

            if (document.body.clientHeight<height){
                height = document.body.clientHeight;
            }


          //Subtract height of each header/title div
            for (var i=0; i<innerDiv.childNodes.length; i++){
                var node = innerDiv.childNodes[i];
                if (node.nodeType===1){
                    var tabID = node.getAttribute("tabID");
                    if (tabID){
                        if (node.offsetHeight>0){                        
                            height-=node.offsetHeight;
                        }
                    }
                }
            }

          //Subtract padding and border
            var padding = 0;
            if (opening) padding = getPadding(opening);

            return height-padding;
        }
        return 0;
    };


  //**************************************************************************
  //** getPadding
  //**************************************************************************
  /** Returns the vertical padding and border widths for a given element. 
   */
    var getPadding = function(opening){

        var paddingTop = parseFloat(getElementStyle(opening, "padding-top").replace("px", ""));
        var paddingBottom = parseFloat(getElementStyle(opening, "padding-bottom").replace("px", ""));

        var borderTop = parseFloat(getElementStyle(opening, "border-top-width").replace("px", ""));
        var borderBottom = parseFloat(getElementStyle(opening, "border-bottom-width").replace("px", ""));
        
        var h = (paddingTop+paddingBottom+borderTop+borderBottom);
        if (isNaN(h)) return 0; //<--IE
        else return h;
    };


  //**************************************************************************
  //** getElementStyle
  //**************************************************************************
    var getElementStyle = function(element, styleProp){
        if (element.currentStyle){
            return element.currentStyle[styleProp];
        }
        else if (window.getComputedStyle){
            return document.defaultView.getComputedStyle(element, '').getPropertyValue(styleProp);
        }
    };


  //**************************************************************************
  //** setStyle
  //**************************************************************************
    var setStyle = function(el, style){
        if (typeof config[style] === 'string' || config[style] instanceof String){
            el.className = config[style];
        }
        else{
            for (var o in config[style]){
                var key = o;
                var val = config[style][o];

                if (key=="class") el.className = val;
                else el.style[key] = val;
            }
        }              
        
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
  //** getPixels
  //**************************************************************************
  /** Appends "px" if the object does not end in "px" or "%".
   */
    var getPixels = function(obj){
        var str = obj+"";
        var x = str.substring(str.length-1).toLowerCase();
        if (x=="x" || x =="%") return str;
        
        x = parseFloat(obj);
        if (isNaN(x)) return obj;
        else return x + "px";
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