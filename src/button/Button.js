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
    var defaultConfig = {

      /** Text label for the button.
       */
        label: null,


      /** If true, the button will initially appear in a selected state and the
       *  isSelected() method will return true. Default is false.
       */
        selected: false,


      /** If true, the button will initially appear disabled and the
       *  isDisabled() method will return true. Default is false.
       */
        disabled: false,


      /** If true, the button will be rendered as a toggle button. Default is
       *  false, unless the button has a menu.
       */
        toggle: false,


      /** If true, will create a drop-down menu for the button. Components such
       *  as buttons or custom DOM elements can be added directly to the menu.
       *  See getMenuPanel() for more information.
       */
        menu: false,


      /** Sets the position of the menu panel. Options are "bottom" or "right".
       */
        menuAlign: "bottom",



      /** Used to set the "display" style attribute for the outer DOM element.
       *  This is not commonly ued. Default is "inline-block".
       */
        display: "inline-block",


      /** Used to set the width of the button. This property is optional.
       */
        width: null,


      /** Used to set the height of the button. This property is optional.
       */
        height: null,


      /** Used to set the icon position relative to the button label. Options
       *  are "left" or "right". Note that the icon style is set in the style
       *  config. The icon style should not be used to control whether the
       *  icon appears to the left or right of the label. Use this config
       *  instead.
       */
        iconAlign: "left",


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
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

            hover: {
                background: "#ededed"
            },


            menu: {
                border: "1px solid #cccccc",
                background: "#F6F6F6",
                cursor: "pointer",
                padding: "3px 3px",
                zIndex: "1"
            }

        },


      /** Sound to play when the button is clicked
       */
        sound: null
    };

    var mainDiv;
    var mask, menu;
    var icon, label, arrow;


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


      //Get icon alignment
        var iconAlignment = config.style.iconAlign; //legacy
        if (!iconAlignment) iconAlignment = config.iconAlign; //preferred
        if (iconAlignment!=="right") iconAlignment = "left";


      //Get menu alignment
        var menuAlignment = config.style.menuAlignment; //legacy
        if (!menuAlignment) menuAlignment = config.menuAlign; //preferred
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



      //Create outer div used to hold the button, mask, and menu
        var outerDiv = createElement('div', parent);
        outerDiv.setAttribute("desc", me.className);
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
        if (config.hidden===true){ //legacy config...
            outerDiv.style.visibility = 'hidden';
            outerDiv.style.display = 'none';
        }
        me.el = outerDiv;




      //The button is implemented using a simple HTML table with 3 columns. The
      //left and right columns are for icons and the center column is for the
      //button label. The width of the center column is set to 100% and the
      //width of the left and right columns are defined by the "icon" and
      //"arrow" styles. Unfortunately, some browsers seem to have issues
      //rendering the table correctly inside of a div when the outerDiv's
      //display style set to "inline-block". For example, Mobile Safari will
      //completely ignore the "inline-block" style and stretch the button to
      //100% of the available width. In Chrome, if the left or right columns has
      //a width, the "inline-block" style is ignored and the button is stretched
      //to 100% of the available width. As a workaround, it looks like we can
      //wrap the button div in another div with the display style set to "table".
        var tableDiv = createElement('div', outerDiv);
        if (outerDiv.style.display==="inline-block"){
            tableDiv.style.display = "table";
            if (config.width) tableDiv.style.width = outerDiv.style.width;
        }
        tableDiv.style.height = "100%";


      //Create main div used to represent the button
        mainDiv = createElement('div', tableDiv, config.style.button);
        mainDiv.setAttribute("desc", "button");
        addEventHandlers(mainDiv);



        var table = createTable(mainDiv);
        table.style.fontFamily = "inherit";
        table.style.textAlign = "inherit";
        table.style.color = "inherit";
        var tr = table.addRow();
        var td;


      //Add icon (or label)
        td = tr.addColumn();
        if (iconAlignment==="left"){
            icon = createElement("div", td, config.style.icon);
        }
        else{
            arrow = createElement("div", td, config.style.arrow);
        }


      //Add label
        td = tr.addColumn({width: "100%"});
        label = createElement("div", td);
        setStyle(label, "label");
        if (config.label) label.innerHTML = config.label;


      //Add arrow (or icon)
        td = tr.addColumn();
        if (iconAlignment==="left"){
            arrow = createElement("div", td, config.style.arrow);
        }
        else{
            icon = createElement("div", td, config.style.icon);
        }



      //Create menu panel as needed
        if (config.menu===true){
            config.toggle = true;
            menu = createElement('div', outerDiv, config.style.menu);
            menu.setAttribute("desc", "menu");
            menu.style.position = "absolute";
            menu.style.visibility = "hidden";


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


      //Add public show/hide methods
        addShowHide(me);
    };


  //**************************************************************************
  //** addEventHandlers
  //**************************************************************************
    var addEventHandlers = function(div){

      //Disable text selection
        div.unselectable="on";
        div.onselectstart=function(){return false;};


      //Create onclick function
        var onclick = function(){
            if (config.sound!=null) config.sound.play();


            if (config.toggle===true){
                if (menu){

                    if (isTouch){
                        me.toggle();
                    }
                    else{
                        //Do nothing - button is toggled on mouse down...
                    }
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
            else{
                setStyle(div, "button");
                setStyle(icon, "icon");
                setStyle(arrow, "arrow");
            }
        };



      //Logic to process mouse events
        if (!isTouch){
            div.onmousedown=function(){

                addStyle(div, "select");
                addStyle(icon, "iconSelect");
                addStyle(arrow, "arrowSelect");

                if (menu){
                    me.toggle();
                    //TODO: Add mouseup events to buttons in the menu
                }

                //return false;
            };
            div.onclick = function(){
                onclick();
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
        }
    };


  //**************************************************************************
  //** click
  //**************************************************************************
  /** Used to click the button and fire onClick event
   */
    this.click = function(){
        mainDiv.click();
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
  /** Returns the button label.
   */
    this.getText = function(){
        return label.innerHTML;
    };


  //**************************************************************************
  //** enable
  //**************************************************************************
  /** Used to enable the button.
   */
    this.enable = function(){
        var outerDiv = me.el;
        outerDiv.style.opacity = "";
        if (mask) mask.style.visibility = "hidden";
    };


  //**************************************************************************
  //** disable
  //**************************************************************************
  /** Used to disable the button.
   */
    this.disable = function(){

        var outerDiv = me.el;
        outerDiv.style.opacity = "0.5";

        if (mask){
            mask.style.visibility = "visible";
        }
        else{
            mask = createElement('div',{
                position: "absolute",
                zIndex: "1",
                width: "100%",
                height: "100%"
            });
            mask.setAttribute("desc", "mask");
            outerDiv.insertBefore(mask, outerDiv.firstChild);
        }
    };


  //**************************************************************************
  //** isEnabled
  //**************************************************************************
  /** Returns true if the button is enabled (i.e. not disabled).
   */
    this.isEnabled = function(){
        return !me.isDisabled();
    };


  //**************************************************************************
  //** isDisabled
  //**************************************************************************
  /** Returns true if the button is disabled.
   */
    this.isDisabled = function(){
        if (mask){
            if (mask.style.visibility !== "hidden") return true;
        }
        return false;
    };


  //**************************************************************************
  //** select
  //**************************************************************************
  /** Used to update the "selected" state of the button.
   */
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
  /** Used to update the "selected" state of the button.
   */
    this.deselect = function(){
        if (mainDiv.selected===true){
            mainDiv.selected = false;
            setStyle(mainDiv,"button");
            setStyle(icon,"icon");
            setStyle(arrow,"arrow");
        }
    };


  //**************************************************************************
  //** isSelected
  //**************************************************************************
  /** Returns true if the button is selected (e.g. depressed)
   */
    this.isSelected = function(){
        return (mainDiv.selected===true);
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
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;
    var createElement = javaxt.dhtml.utils.createElement;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };
    var addStyle = function(el, style){
        javaxt.dhtml.utils.addStyle(el, config.style[style]);
    };


    init();
};