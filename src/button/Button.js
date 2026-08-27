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


      /** Used to set spacing between the button icon and the button label.
       *  Default is "5px".
       */
        iconPadding: "5px",


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
        config.iconAlign = iconAlignment;


      //Get menu alignment
        var menuAlignment = config.style.menuAlignment; //legacy
        if (!menuAlignment) menuAlignment = config.menuAlign; //preferred
        if (menuAlignment!=="right") menuAlignment = "bottom";


      //Update arrow style as needed
        if (config.menu===true){
            var arrowDefined = false;
            if (typeof config.style.arrow === "string"){
                arrowDefined = true;
            }
            else{
                for (var key in config.style.arrow){
                    if (config.style.arrow.hasOwnProperty(key)){
                        arrowDefined = true;
                        break;
                    }
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
        outerDiv.className = "javaxt-button";


      //Only set display if there's a mismatch (cleaner dom)
        var cs = window.getComputedStyle(outerDiv);
        if (cs.display!=config.display){
            outerDiv.style.display = config.display;
        }

      //Simlarly, only set position as needed
        if (cs.position!="relative"){
            outerDiv.style.position = "relative";
        }

      //Set width/height as needed
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
        if (outerDiv.style.display==="inline-block" || cs.display==="inline-block"){
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



      //Add arrow (or icon)
        td = tr.addColumn();
        if (iconAlignment==="left"){
            arrow = createElement("div", td, config.style.arrow);
        }
        else{
            icon = createElement("div", td, config.style.icon);
        }



      //Add show/hide to components
        addShowHide(label);
        addShowHide(icon);
        addShowHide(arrow);



      //Hide icon as needed
        var hideIcon = true;
        if (typeof config.style.icon === "string"){
            hideIcon = false;
        }
        else{
            for (var key in config.style.icon){
                if (config.style.icon.hasOwnProperty(key)){
                    hideIcon = false;
                    break;
                }
            }
        }
        if (hideIcon) icon.hide();




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


      //Set button label
        me.setLabel(config.label);


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
        var onclick = function(e){
            e.stopPropagation();
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
                setDefaultStyle(mainDiv);
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
                setHoverStyle(div);
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
                onclick(e);
            }
            else{
                setDefaultStyle(div);
            }
        };



      //Logic to process mouse events
        if (!isTouch){
            div.onmousedown=function(){

                setSelectStyle(div);

                if (menu){
                    me.toggle();
                    //TODO: Add mouseup events to buttons in the menu
                }

                //return false;
            };
            div.onclick = function(e){
                onclick(e);
            };
            div.onmouseover = function(){
                if (div.selected!==true){
                    setHoverStyle(div);
                }
            };
            div.onmouseout = function(){
                if (div.selected!==true){
                    setDefaultStyle(div);
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
  /** Returns the button label. Same as getLabel().
   */
    this.getText = function(){
        return me.getLabel();
    };


  //**************************************************************************
  //** getLabel
  //**************************************************************************
  /** Returns the button label.
   */
    this.getLabel = function(){
        return label.innerText;
    };


  //**************************************************************************
  //** setLabel
  //**************************************************************************
  /** Used to update the button label.
   */
    this.setLabel = function(str){
        if (typeof str === 'undefined' || str===null || str.length===0){
            label.innerText = "";
            label.hide();
        }
        else{
            str = str+"";
            label.innerText = str;
            label.show();
            addLabelPadding(str); //Explicitely pass the label (bug fix)
        }
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
        setDefaultStyle(mainDiv);
        setSelectStyle(mainDiv);
    };


  //**************************************************************************
  //** deselect
  //**************************************************************************
  /** Used to update the "selected" state of the button.
   */
    this.deselect = function(){
        if (mainDiv.selected===true){
            mainDiv.selected = false;
            setDefaultStyle(mainDiv);
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
  //** setDefaultStyle
  //**************************************************************************
    var setDefaultStyle = function(div){
        setStyle(div, "button");
        setStyle(icon, "icon");
        setStyle(arrow, "arrow");
        addLabelPadding();
    };


  //**************************************************************************
  //** setHoverStyle
  //**************************************************************************
    var setHoverStyle = function(div){
        addStyle(div, "hover");
        addStyle(icon, "iconHover");
        addStyle(arrow, "arrowHover");
        addLabelPadding();
    };


  //**************************************************************************
  //** setSelectStyle
  //**************************************************************************
    var setSelectStyle = function(div){
        addStyle(div, "select");
        addStyle(icon, "iconSelect");
        addStyle(arrow, "arrowSelect");
        addLabelPadding();
    };


  //**************************************************************************
  //** addLabelPadding
  //**************************************************************************
    var addLabelPadding = function(){
        if (icon.isVisible()){
            var str = arguments.length>0 ? arguments[0] : me.getLabel();
            if (!(typeof str === 'undefined' || str===null || str.length===0)){
                if (config.iconAlign==="left"){
                    icon.style.marginRight = config.iconPadding;
                }
                else{
                    icon.style.marginLeft = config.iconPadding;
                }
            }
        }
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var isEmpty = javaxt.dhtml.utils.isEmpty;
    var createTable = javaxt.dhtml.utils.createTable;
    var createElement = javaxt.dhtml.utils.createElement;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var setStyle = function(el, style){

      //Don't set empty style. Especially for hidden elements (e.g. icon)
        var s = config.style[style];
        if (isEmpty(s)) return;

        javaxt.dhtml.utils.setStyle(el, s);
    };
    var addStyle = function(el, style){
        javaxt.dhtml.utils.addStyle(el, config.style[style]);
    };


    init();
};