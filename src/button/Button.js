if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Button Class
//******************************************************************************
/**
 *   Custom button control. The button has 3 parts: icon, label, and an arrow.
 *
 ******************************************************************************/


javaxt.dhtml.Button = function(parent, config) {
    this.className = "javaxt.dhtml.Button";

    var me = this;
    var mainDiv;
    var mask, menu;
    var icon, label, arrow;

    
    var defaultConfig = {

        label: null, //Text to display 
        name: null, //Name of the button (optional)
        
        
        
      //Button state
        selected: false,
        disabled: false,
        toggle: false,
        menu: false,
        
        
        
      //Properties for the outer div
        display: "inline-block",
        width: null,
        height: null,
        
        
      //Default styles for the button, label, icon, arrow, and menu
        style:{
            
            button: {
                border: "1px solid #cccccc",
                borderRadius: "3px",
                background: "#F6F6F6",
                cursor: "pointer",
                padding: "3px 7px",
                margin: "0px",
                color: "#2b2b2b"
            },
            
            label: {
                fontFamily: "helvetica,arial,verdana,sans-serif",
                fontSize: "14px",
                whiteSpace: "nowrap" 
            },
            
            icon: {
                
            },
            
            arrow: {

            },
            
            select: {
                background: "#007FFF",
                border: "1px solid #003EFF",
                color: "#FFFFFF"
            },
            
            disable: {
                background: "#ffffff",
                border: "1px solid #ffffff",
                borderRadius: "3px",
                cursor: "pointer",
                opacity: "0.5"
            },
            
            hover: {
                background: "#ededed"
            },
            
            
            menu: {
                border: "1px solid #cccccc",
                background: "#F6F6F6",
                cursor: "pointer",
                padding: "3px 3px",
                zIndex: "1"
            },
            
            menuAlign: "bottom"

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
        
        
      //Get icon alignment
        var iconAlignment = config.style.iconAlign;
        if (iconAlignment!=="right") iconAlignment = "left";
        
        
      //Get menu alignment
        var menuAlignment = config.style.menuAlign;
        if (menuAlignment!=="right") menuAlignment = "bottom";
        
        
      //Update arrow style as needed
        if (config.menu===true){
            var arrowDefined = false;
            for (var key in config.style.arrow){
                if (config.style.arrow.hasOwnProperty(key)){
                    arrowDefined = true;
                    break;
                }
            }
            
            if (!arrowDefined){
                if (menuAlignment==="bottom"){
                    config.style.arrow = {
                        width: 0,
                        height: 0,
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "5px solid #575757",
                        marginLeft: "10px"
                    };
                    config.style.arrowSelect = {
                        borderTop: "5px solid #FFFFFF"
                    };
                }
            }
        }
        
        
        
      //Create container
        var outerDiv = document.createElement('div');
        outerDiv.style.display = config.display;
        if (config.width){
            if (typeof config.width === "string"){
                outerDiv.style.width = config.width;
            }
            else{
                outerDiv.style.width = config.width + "px";
            }
        }
        if (config.height){
            if (typeof config.height === "string"){
                outerDiv.style.height = config.height;
            }
            else{
                outerDiv.style.height = config.height + "px";
            }
        }
        outerDiv.style.position = "relative";
        parent.appendChild(outerDiv);
        me.el = outerDiv;
        
        
        
      //Create main div used to represent the button
        mainDiv = document.createElement('div');
        addStyle(mainDiv, "button");
        outerDiv.appendChild(mainDiv);
        addEventHandlers(mainDiv);
        
        
      //Create table with 3 columns
        var table = document.createElement('table');
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.width = "100%";
        table.style.height = "100%";
        table.style.fontFamily = "inherit";
        table.style.textAlign = "inherit";
        table.style.color = "inherit";
        table.style.borderCollapse = "collapse";
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var td;
        
        
        td = document.createElement('td');
        tr.appendChild(td);
        if (iconAlignment==="left"){
            icon = document.createElement("div");
            setStyle(icon, "icon");
            td.appendChild(icon);
        }
        else{
            arrow = document.createElement("div");
            setStyle(arrow, "arrow");
            td.appendChild(arrow);
        }
        
        
        td = document.createElement('td');
        td.style.width = "100%";
        tr.appendChild(td);
        label = document.createElement("div");
        setStyle(label, "label");
        if (config.label) label.innerHTML = config.label;
        td.appendChild(label);
        
        
        
        td = document.createElement('td');
        tr.appendChild(td);
        if (iconAlignment==="left"){
            arrow = document.createElement("div");
            setStyle(arrow, "arrow");
            td.appendChild(arrow);
        }
        else{
            icon = document.createElement("div");
            setStyle(icon, "icon");
            td.appendChild(icon);
        }
        

        
      //On most browsers (not Firefox), if the left or right columns has a width, 
      //then the button display goes from "inline-block" to 100%. As a workaround
      //we'll wrap the table in another table.
        var innerTable = table;
        table = document.createElement('table');
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.width = "100%";
        table.style.height = "100%";
        table.style.fontFamily = "inherit";
        table.style.textAlign = "inherit";
        table.style.color = "inherit";
        table.style.borderCollapse = "collapse";
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var td = document.createElement('td');
        td.appendChild(innerTable);
        tr.appendChild(td);
        
        
        
      //Add table to the main div
        mainDiv.appendChild(table);
        


      //Create menu panel as needed
        if (config.menu===true){
            config.toggle = true;
            menu = document.createElement('div');
            setStyle(menu, "menu");
            menu.style.position = "absolute";
            menu.style.visibility = "hidden";
            outerDiv.appendChild(menu);
          
            
            var hideMenu = function(e){
                if (!mainDiv.contains(e.target)){
                    menu.style.visibility = "hidden";
                    me.deselect();
                }
            };
            
          //Hide menu if the client clicks outside of the menu
            window.addEventListener('click', hideMenu);
            
            
          //Create logic to process touch events
            var touchStartTime, touchEndTime;
            var x1, x2, y1, y2;

            window.addEventListener('touchstart', function(e){
                x1 = e.changedTouches[0].pageX;
                y1 = e.changedTouches[0].pageY;
                touchStartTime = new Date().getTime();
                touchEndTime = null;
            });

            window.addEventListener('touchend', function(e){

                touchEndTime= new Date().getTime();
                x2 = e.changedTouches[0].pageX;
                y2 = e.changedTouches[0].pageY;

                var distance = Math.sqrt( (x2-=x1)*x2 + (y2-=y1)*y2 );
                if (distance<0) distance = -distance;
                var duration = touchEndTime - touchStartTime;

                if ((duration <= 500 && distance <= 10) || //Quick tap
                    (duration > 500 && distance <= 10)) {  //Long press
                    hideMenu(e);
                }
            });
            
        }
        

      //Set button state
        if (config.disabled===true) me.disable();
        if (config.selected===true) me.select();
    };
    

  //**************************************************************************
  //** addEventHandlers
  //**************************************************************************
    var addEventHandlers = function(div){

      //Disable text selection
        div.unselectable="on";
        div.onselectstart=function(){return false;};
        
        
        div.onmousedown=function(){
            addStyle(div, "select");
            addStyle(icon, "iconSelect");
            addStyle(arrow, "arrowSelect");
            
            if (menu){ 
                me.toggle();
                //TODO: Add mouseup events to buttons in the menu
            }
            
            return false;
        };
        

      //Create onclick function
        var onclick = function(){
            if (config.sound!=null) config.sound.play();
            

            if (config.toggle===true){
                if (menu){
                    //Do nothing - button is toggled on mouse down...
                }
                else{
                    me.toggle();
                }
            }
            else{
                setStyle(mainDiv,"button");
                setStyle(icon,"icon");
                setStyle(arrow,"arrow");                
            }

            
            me.onClick();
        };


      //Create logic to process touch events
        var touchStartTime;
        var touchEndTime;
        var x1, x2, y1, y2;
        var isTouch = false;

        div.ontouchstart = function(e) {
            isTouch = true;

            e.preventDefault();
            x1 = e.changedTouches[0].pageX;
            y1 = e.changedTouches[0].pageY;
            touchStartTime = new Date().getTime();
            touchEndTime = null;
            
            if (div.selected!==true){
                addStyle(div, "hover");
                addStyle(icon, "iconHover");
                addStyle(arrow, "arrowHover");
            }
        };

        div.ontouchend = function(e) {

            touchEndTime= new Date().getTime();
            x2 = e.changedTouches[0].pageX;
            y2 = e.changedTouches[0].pageY;

            var distance = Math.sqrt( (x2-=x1)*x2 + (y2-=y1)*y2 );
            if (distance<0) distance = -distance;
            var duration = touchEndTime - touchStartTime;

            if ((duration <= 500 && distance <= 10) || //Quick tap
                (duration > 500 && distance <= 10)) {  //Long press
                onclick();
            }
        };



      //Logic to process mouse events
        div.onclick = function(){
            if (!isTouch) onclick();
        };
        div.onmouseover = function(){
            
            if (div.selected!==true){
                addStyle(div, "hover");
                addStyle(icon, "iconHover");
                addStyle(arrow, "arrowHover");
            }

        };
        div.onmouseout = function(){

            if (div.selected!==true){
                setStyle(div, "button");
                setStyle(icon, "icon");
                setStyle(arrow, "arrow");
            }
            
        };
    };
    

    
  //**************************************************************************
  //** onClick
  //**************************************************************************
  /** Called whenever the button is clicked.
   */
    this.onClick = function(){};
    
    
    
  //**************************************************************************
  //** getText
  //**************************************************************************
    this.getText = function(){
        return label.innerHTML;
    };
    

  //**************************************************************************
  //** enable
  //**************************************************************************
  /** Used to enable the button.
   */
    this.enable = function(){
        mask.style.visibility = "hidden";
    };


  //**************************************************************************
  //** disable
  //**************************************************************************
    this.disable = function(){
        
        if (mask){
            mask.style.visibility = "visible";
        }
        else{
            
            mask = document.createElement('div');
            setStyle(mask, "disable");
            mask.style.position = "absolute";
            mask.style.zIndex = "1";
            mask.style.width = "100%";
            mask.style.height = "100%";

            var outerDiv = me.el;
            outerDiv.insertBefore(mask, outerDiv.firstChild);
        }
    };
    
    
  //**************************************************************************
  //** select
  //**************************************************************************
    this.select = function(){
        if (mainDiv.selected===true) return;
        mainDiv.selected = true;
        setStyle(mainDiv,"button");
        setStyle(icon,"icon");
        setStyle(arrow,"arrow");
        addStyle(mainDiv,"select");
        addStyle(icon,"iconSelect");
        addStyle(arrow,"arrowSelect");
    };


  //**************************************************************************
  //** deselect
  //**************************************************************************
    this.deselect = function(){
        if (mainDiv.selected===true){
            mainDiv.selected = false;
            setStyle(mainDiv,"button");
            setStyle(icon,"icon");
            setStyle(arrow,"arrow");
        }
    };
    

  //**************************************************************************
  //** toggle
  //**************************************************************************
  /** Used to toggle the button's selection state.
   */
    this.toggle = function(){
        if (config.toggle===true){
            if (mainDiv.selected===true){
                me.deselect();
                if (menu) menu.style.visibility = "hidden";
            }
            else{
                me.select();
                if (menu) menu.style.visibility = "visible";
            }
        }
    };


  //**************************************************************************
  //** getMenuPanel
  //**************************************************************************
  /** Returns the DOM element associated with the menu panel. Typically, this
   *  is used to render menu options (i.e. buttons).
   */
    this.getMenuPanel = function(){
        return menu;
    };    


  //**************************************************************************
  //** addStyle
  //**************************************************************************
  /** Used to add style to a given element. Styles are defined via a CSS class
   *  name or inline using the config.style definitions. 
   */
    var addStyle = function(el, style){
        
        style = config.style[style];
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
        
        
        el.style = null;
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
    

    
    init();
};