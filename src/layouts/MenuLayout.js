if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  MenuLayout
//******************************************************************************
/**
 *   Layout initially intended for mobile applications. Contains a header, 
 *   body, and menu panel. The header includes a menu icon which is used to 
 *   slide open/close a menu panel.
 *
 ******************************************************************************/

javaxt.dhtml.MenuLayout = function(parent, config) {
    this.className = "javaxt.dhtml.MenuLayout";
    
    var me = this;
    var outerDiv;
    var innerDiv;
    var headerDiv;
    var menuDiv;
    var bodyDiv;
    var titleDiv;
    var title;
    
    var menuWidth;
    
    
    var defaultConfig = {
        
        animationSteps: 250.0, //time in milliseconds
        menuWidth: 250, 

        title: "",

        style: {

            header: {
                height: "35px",
                background: "#777777",
                color: "#FFFFFF"
            },
            
            title: {
                lineHeight: "35px",
                position: "absolute",
                width: "100%",
                whiteSpace: "nowrap",
                fontFamily: "helvetica,arial,verdana,sans-serif",
                fontSize: "20px",
                color: "white",
                textAlign: "center",
                cursor: "pointer"
                //textTransform: "uppercase"
            },            
            
            
            menu: {
                background: "#4BB5EF"
            },
            
            menuIcon: {
                //Defaults to createMenuIcon() function
            },
            
            body: {
                
            }
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
        defaultConfig.style.menuIcon = createMenuIcon; 
        merge(clone, defaultConfig);
        config = clone;  
        
        
      //Process config
        menuWidth = config.menuWidth;
        title = config.title;
        
        
        
      //Create outer table (for resize purposes)
        var table = createTable();
        table.setAttribute("desc", me.className);
        var tbody = table.firstChild;
        var row = document.createElement('tr');
        var td = document.createElement('td');
        td.style.width = "100%";
        td.style.height = "100%";
        td.style.border = "0px"; //"1px solid #969696"
        td.style.verticalAlign = "top";
        row.appendChild(td);
        tbody.appendChild(row);
        parent.appendChild(table);
        me.el = table;
        
        
      //Create divs (for overflow purposes)
        outerDiv = document.createElement('div');
        outerDiv.style.width="100%";
        outerDiv.style.height="100%";
        outerDiv.style.position = "relative";
        td.appendChild(outerDiv);

        var overflowDiv = document.createElement('div');
        overflowDiv.style.width="100%";
        overflowDiv.style.height="100%";
        overflowDiv.style.position = "absolute";
        overflowDiv.style.overflow = "hidden";
        outerDiv.appendChild(overflowDiv);
        


        
      //Create content div with a width = parent width + menu width
        innerDiv = document.createElement('div');
        innerDiv.style.width=(outerDiv.offsetWidth+menuWidth)+"px";
        innerDiv.style.height="100%";
        innerDiv.style.position = "relative";
        innerDiv.style.marginLeft = -menuWidth+"px";
        overflowDiv.appendChild(innerDiv);
                

        
      //Create table with 2 columns - one for the menu and one for the body
        table = createTable();
        tbody = table.firstChild;
        row = document.createElement('tr');
        var leftCol = document.createElement('td');
        leftCol.style.height="100%";
        leftCol.style.verticalAlign = "top";
        row.appendChild(leftCol);
        
        menuDiv = document.createElement('div');
        setStyle(menuDiv, "menu");
        menuDiv.style.height = "100%";
        menuDiv.style.width = menuWidth + "px";
        leftCol.appendChild(menuDiv);
        
        
        var rightCol = document.createElement('td');
        rightCol.style.width="100%";
        rightCol.style.height="100%";
        rightCol.style.verticalAlign = "top";
        row.appendChild(rightCol);
        
        tbody.appendChild(row);
        innerDiv.appendChild(table);
        
        
        
      //Create table with 2 rows - one for the header and one for the body
        table = createTable();
        tbody = table.firstChild;
        row = document.createElement('tr');
        headerDiv = document.createElement('td');
        setStyle(headerDiv, "header");
        headerDiv.style.width="100%";
        row.appendChild(headerDiv);
        tbody.appendChild(row);        
        row = document.createElement('tr');
        bodyDiv = document.createElement('td');
        bodyDiv.style.width="100%";
        bodyDiv.style.height="100%";
        bodyDiv.style.verticalAlign = "top";
        row.appendChild(bodyDiv);
        tbody.appendChild(row);
        
        rightCol.appendChild(table); 
        
        
        
      
        
        
        
      //Function called after the table has been added to the DOM
        var onRender = function(){
            
          //Create header after the table has been added to the document!
            headerDiv.appendChild(createHeader());


          //Watch for resize events
            addResizeListener(outerDiv, function(){
                me.resize();
            }); 
        };



      //Check whether the table has been added to the DOM
        var w = bodyDiv.offsetWidth;
        if (w===0 || isNaN(w)){
            var timer;

            var checkWidth = function(){
                var w = bodyDiv.offsetWidth;
                if (w===0 || isNaN(w)){
                    timer = setTimeout(checkWidth, 100);
                }
                else{
                    clearTimeout(timer);
                    onRender();
                }
            };

            timer = setTimeout(checkWidth, 100);
        }
        else{
            onRender();
        }
        
        

        //menuDiv.innerHTML = "Menu";
        //bodyDiv.innerHTML = "Body";
        
        


        
      //Hide navbar hack. More info here:
      //https://developers.google.com/web/fundamentals/native-hardware/fullscreen/
        window.scrollTo(0,1);
    };
    
    

  //**************************************************************************
  //** createHeader
  //**************************************************************************
    var createHeader = function(){
        
        var table = createTable();
        var tbody = table.firstChild;
        var row = document.createElement('tr');
        
        
      //Create left column used to trigger the slider
        var leftCol = document.createElement('td');
        leftCol.onclick = function(){
            var margin = parseFloat(innerDiv.style.marginLeft);
            if (margin<0){
                me.showMenu();
            }
            else{
                me.hideMenu();
            }
        };
        
      //Add menu icon to the left cell
        var menuIcon;
        if (typeof config.style.menuIcon === "function") {
            menuIcon = config.style.menuIcon();
        }
        else{
            menuIcon = document.createElement('div');
            setStyle(menuIcon, config.style.menuIcon);
        }
        leftCol.appendChild(menuIcon);
        row.appendChild(leftCol);
        
        
        
      //Create title
        var centerCol = document.createElement('td');
        centerCol.style.width = "100%";
        centerCol.style.height = "100%";
        row.appendChild(centerCol);
        centerCol.appendChild(createTitle());
        
        
      //Create right column
        var rightCol = document.createElement('td');
        row.appendChild(rightCol);           
        
        tbody.appendChild(row);

        return table;
    };


  //**************************************************************************
  //** createMenuIcon
  //**************************************************************************
    var createMenuIcon = function(){
        
        var h = headerDiv.offsetHeight;
        
        var outerDiv = document.createElement('div');
        outerDiv.style.width = h+"px";
        outerDiv.style.height = h+"px";
        outerDiv.style.position = "relative";
        outerDiv.style.cursor = "pointer";
        
        
        var overflowDiv = document.createElement('div');
        overflowDiv.style.width="100%";
        overflowDiv.style.height="100%";
        overflowDiv.style.position = "absolute";
        overflowDiv.style.overflow = "hidden";        
        outerDiv.appendChild(overflowDiv);
        
        
        var barWidth = 22;
        var barHeight = 3;
        var barSpacing = 3;
        
        for (var i=0; i<3; i++){
            
            var bar = document.createElement('div');
            bar.style.width=barWidth+"px";
            bar.style.height=barHeight+"px";
            bar.style.background="#FFFFFF";
            bar.style.marginBottom=barSpacing+"px";
            overflowDiv.appendChild(bar);

        }
        
        
        overflowDiv.style.marginLeft = ((h-barWidth)/2)+"px";
        overflowDiv.style.marginTop = ((h-((barHeight+barSpacing)*3))/2)+"px";
        //overflowDiv.style.marginBottom = "-" + div.style.marginTop;
        
        

        
        return outerDiv;
    };
    
    
  //**************************************************************************
  //** createTitle
  //**************************************************************************
    var createTitle = function(){
     
        var outerDiv = document.createElement('div');
        outerDiv.style.width="100%";
        outerDiv.style.height="100%";
        outerDiv.style.position = "relative";


        var overflowDiv = document.createElement('div');
        overflowDiv.style.width="100%";
        overflowDiv.style.height="100%";
        overflowDiv.style.position = "absolute";
        overflowDiv.style.overflow = "hidden";
        outerDiv.appendChild(overflowDiv);
        
        titleDiv = document.createElement('div');
        setStyle(titleDiv, "title");
        me.setTitle(title);
        overflowDiv.appendChild(titleDiv);
        
        return outerDiv;
    };
    


  //**************************************************************************
  //** setTitle
  //**************************************************************************
    this.setTitle = function(str){
        title = str;
        if (str instanceof Element){
            titleDiv.appendChild(str);
        }
        else{
            titleDiv.innerHTML = title;
        }
    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
    this.getTitle = function(){
        return title;
    };
    
    
  //**************************************************************************
  //** showMenu
  //**************************************************************************
    this.showMenu = function(){
        slideMenu(true, new Date().getTime(), config.animationSteps, null);
        
    };
    
    
  //**************************************************************************
  //** hideMenu
  //**************************************************************************
    this.hideMenu = function(){
        slideMenu(false, new Date().getTime(), config.animationSteps, null);
    };
    
    
    
  //**************************************************************************
  //** slideMenu
  //**************************************************************************
  /**  Used to slide the menu panel open or close. */

    var slideMenu = function(slideOpen, lastTick, timeLeft, callback){
        
        var curTick = new Date().getTime();
        var elapsedTicks = curTick - lastTick;


      //If the animation is complete, ensure that the panel is completely open 
        if (timeLeft <= elapsedTicks){
            
            
            innerDiv.style.marginLeft = slideOpen? "0px" : -menuWidth+"px";
            
            if (callback!=null){
                callback.apply(me, []);
            }
            
            return;
        }


        timeLeft -= elapsedTicks;
        
        var marginLeft;
        if (slideOpen){
            marginLeft = Math.round((timeLeft/config.animationSteps) * menuWidth);
        }
        else{
            marginLeft = menuWidth - Math.round((timeLeft/config.animationSteps) * menuWidth);
        }
        
        innerDiv.style.marginLeft = -marginLeft + "px";
        

        setTimeout(function(){
            slideMenu(slideOpen, curTick, timeLeft, callback);
        }, 33);
    };
    
    
    
    
  //**************************************************************************
  //** resize
  //**************************************************************************
    this.resize = function(){
        innerDiv.style.width=(outerDiv.offsetWidth+menuWidth)+"px";
    };
    
    
  //**************************************************************************
  //** getMenu
  //**************************************************************************
  /** Returns the menu panel
   */
    this.getMenu = function(){
        return menuDiv;
    };
    
    
  //**************************************************************************
  //** getBody
  //**************************************************************************
  /** Returns the body panel
   */
    this.getBody = function(){
        return bodyDiv;
    };



  //**************************************************************************
  //** setStyle
  //**************************************************************************
  /** Used to set the style for a given element. Styles are defined via a CSS 
   *  class name or inline using the config.style definitions. 
   */
    var setStyle = function(el, style){
        
        style = config.style[style];
        if (style===null) return;
        
        
        el.style = '';
        el.removeAttribute("style");
        
        
        if (typeof style === 'string' || style instanceof String){
            el.className = style;
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



  //**************************************************************************
  //** createTable
  //**************************************************************************
    var createTable = function(){
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
    };

    init();
};