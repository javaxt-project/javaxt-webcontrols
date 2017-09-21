if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Checkbox Class
//******************************************************************************
/**
 *   Custom checkbox control. 
 *
 ******************************************************************************/


javaxt.dhtml.Checkbox = function(parent, config) {
    this.className = "javaxt.dhtml.Checkbox";

    var me = this;
    var outerDiv;
    var box, check, mask, label;
    
    
    var defaultConfig = {

        label: null, //Text to display 
        id: null, //ID or description metadata
        
        
        
      //Checkbox state
        selected: false,
        disabled: false,
        
        
        display: "inline-block",
        
        
      //Default styles for the checkbox
        style:{
            
            box: {
                width: "13px",
                height: "13px",
                border: "1px solid #cccccc",
                borderRadius: "3px",
                background: "#F6F6F6",
                cursor: "pointer",
                margin: "0px",
                color: "#2b2b2b"
            },
            
            label: {
                fontFamily: "helvetica,arial,verdana,sans-serif",
                fontSize: "14px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                padding: "1px 0 0 5px"
            },
            
            check: {
                content: "",
                display: "block",
                width: "3px",
                height: "6px",
                border: "solid #ffffff",
                borderWidth: "0 2px 2px 0",
                transform: "rotate(45deg)",
                margin: "1px 0 0 4px"
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
        merge(clone, defaultConfig);
        config = clone;     
        
        
      //Create container
        outerDiv = document.createElement('div');
        outerDiv.style.display = config.display;
        outerDiv.style.position = "relative";
        parent.appendChild(outerDiv);
        me.el = outerDiv;
        

        
      //Create checkbox
        if (config.label){
        
          //Create table with 2 columns - one for the checkbox   
          //and a column for the checkbox label.
            var table = document.createElement('table');
            table.cellSpacing = 0;
            table.cellPadding = 0;
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
            box = document.createElement('div');
            setStyle(box, "box");
            td.appendChild(box);


            td = document.createElement('td');
            tr.appendChild(td);
            label = document.createElement("div");
            setStyle(label, "label");
            label.innerHTML = config.label;
            td.appendChild(label);       


            outerDiv.appendChild(table);
            addEventHandlers(table);
        }
        else{
            
          //Create checkbox with no label
            box = document.createElement('div');
            setStyle(box, "box");
            outerDiv.appendChild(box);
            addEventHandlers(box);
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
            addStyle(box, "select");
            return false;
        };
        

      //Create onclick function
        var onclick = function(){
            if (config.sound!=null) config.sound.play();
            me.toggle();
            me.onClick(box.selected);
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
            
            if (box.selected!==true){
                addStyle(box, "hover");
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
            
            if (box.selected!==true){
                addStyle(box, "hover");
            }

        };
        div.onmouseout = function(){

            if (box.selected!==true){
                setStyle(box, "box");
            }
            
        };
    };

    
  //**************************************************************************
  //** show
  //**************************************************************************
    this.show = function(){
        outerDiv.style.display = null;
    };
    
    
  //**************************************************************************
  //** hide
  //**************************************************************************
    this.hide = function(){
        outerDiv.style.display = "none";
    };
    
    
  //**************************************************************************
  //** onClick
  //**************************************************************************
  /** Called whenever the checkbox is clicked.
   */
    this.onClick = function(selected){};
    


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
        if (box.selected===true) return;
        box.selected = true;
        addStyle(box,"select");
        
        if (check){
            check.style.visibility = "visible";
        }
        else{
            check = document.createElement('div');
            setStyle(check, "check");
            box.appendChild(check);
        }
    };


  //**************************************************************************
  //** deselect
  //**************************************************************************
    this.deselect = function(){
        if (box.selected===true){
            box.selected = false;
            setStyle(box,"box");
            check.style.visibility = "hidden";
        }
    };
    

  //**************************************************************************
  //** toggle
  //**************************************************************************
  /** Used to toggle the button's selection state.
   */
    this.toggle = function(){
        if (box.selected===true){
            me.deselect();
        }
        else{
            me.select();
        }
    };


  //**************************************************************************
  //** getValue
  //**************************************************************************
  /** Returns true if the checkbox is selected.
   */
    this.getValue = function(){
        return box.selected;
    };
    
    
  //**************************************************************************
  //** getID
  //**************************************************************************
  /** Returns the ID of the checkbox. THe ID is defined in the config used to 
   *  instantiate this class.
   */
    this.getID = function(){
        return config.id;
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