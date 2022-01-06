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
        hidden: false,


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



      //Create outer div used to hold the button, mask, and menu
        var outerDiv = document.createElement('div');
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
        if (config.hidden===true){
            outerDiv.style.visibility = 'hidden';
            outerDiv.style.display = 'none';
        }
        parent.appendChild(outerDiv);
        me.el = outerDiv;


      //Create main div used to represent the button
        mainDiv = document.createElement('div');
        mainDiv.setAttribute("desc", "button");
        addStyle(mainDiv, "button");
        addEventHandlers(mainDiv);


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
        var tableDiv = document.createElement('div');
        if (outerDiv.style.display==="inline-block"){
            tableDiv.style.display = "table";
            if (config.width) tableDiv.style.width = outerDiv.style.width;
        }
        tableDiv.style.height = "100%";
        outerDiv.appendChild(tableDiv);
        tableDiv.appendChild(mainDiv);






      //Create button elements
        icon = document.createElement("div");
        setStyle(icon, "icon");

        arrow = document.createElement("div");
        setStyle(arrow, "arrow");

        label = document.createElement("div");
        setStyle(label, "label");
        if (config.label) label.innerHTML = config.label;



        var table = createTable();
        table.style.fontFamily = "inherit";
        table.style.textAlign = "inherit";
        table.style.color = "inherit";
        var tbody = table.firstChild;
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


      //Add table to the main div
        mainDiv.appendChild(table);



      //Create menu panel as needed
        if (config.menu===true){
            config.toggle = true;
            menu = document.createElement('div');
            menu.setAttribute("desc", "menu");
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
        var outerDiv = me.el;
        outerDiv.style.opacity = "";
        mask.style.visibility = "hidden";
    };


  //**************************************************************************
  //** disable
  //**************************************************************************
    this.disable = function(){

        var outerDiv = me.el;
        outerDiv.style.opacity = "0.5";

        if (mask){
            mask.style.visibility = "visible";
        }
        else{

            mask = document.createElement('div');
            mask.setAttribute("desc", "mask");
            mask.style.position = "absolute";
            mask.style.zIndex = "1";
            mask.style.width = "100%";
            mask.style.height = "100%";

            outerDiv.insertBefore(mask, outerDiv.firstChild);
        }
    };


  //**************************************************************************
  //** isEnabled
  //**************************************************************************
    this.isEnabled = function(){
        return !me.isDisabled();
    };


  //**************************************************************************
  //** isDisabled
  //**************************************************************************
    this.isDisabled = function(){
        if (mask){
            if (mask.style.visibility !== "hidden") return true;
        }
        return false;
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
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };
    var addStyle = function(el, style){
        javaxt.dhtml.utils.addStyle(el, config.style[style]);
    };


    init();
};