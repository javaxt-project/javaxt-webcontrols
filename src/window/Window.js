if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Window
//******************************************************************************
/**
 *   Window control that can be used to create dialogs, alerts, etc. The window
 *   consists of a header, body, footer, and mask.
 *   <br/>
 *   Here's a simple example of how to instantiate a resizable window:
 <pre>
    var window = new javaxt.dhtml.Window(document.body, {
        title: "Window Test",
        width: 400,
        height: 200,
        modal: false,
        resizable: true
    });
 </pre>
 *   Once the window is instantiated you can call any of the public methods.
 *   You can also add event listeners by overriding any of the public "on" or
 *   "before" methods like this:
 <pre>
    window.open();
    window.onResize = function(){
        console.log(window.getWidth(), window.getHeight());
    };
 </pre>
 *
 ******************************************************************************/

javaxt.dhtml.Window = function(parent, config) {
    this.className = "javaxt.dhtml.Window";

    var me = this;

    var defaultConfig = {

      /** DOM element or string rendered in the header. Note that this config
       *  is optional and can be set after the Window has been instantiated.
       *  See setTitle().
       */
        title: false,

      /** DOM element or string rendered in the body. Note that this config is
       *  optional and can be set after the Window has been instantiated. See
       *  setBody().
       */
        body: null,

      /** DOM element or string rendered in the footer. Note that this config
       *  is optional and can be set after the Window has been instantiated.
       *  See setFooter().
       */
        footer: null,

      /** Buttons to put in the footer. Only rendered if no "footer" config is
       *  defined.
       */
        buttons: [],

      /** Initial width of the window, in pixels.
       */
        width: null,

      /** Initial height of the window, in pixels.
       */
        height: null,

      /** If true, will render a mask directly behind the window to prevent
       *  users from interacting with any other part of the window's parent.
       *  Default is false.
       */
        modal: false,

      /** If true, users can resize the window using resize handles along the
       *  border of the window. Default is true.
       */
        resizable: true,

      /** If true, will add a button to the header that will close the window
       *  when clicked. Default is true.
       */
        closable: true,

      /** If true, will allow users to move the window around by dragging the
       *  window header. Default is true.
       */
        movable: true,


      /** If true, will resize window if it is larger that the parent. Default
       *  is false.
       */
        shrinkToFit: false,

      /** Vertical align hint used when rendering the window. Options include
       *  "top" and "middle" (default).
       */
        valign: "middle",


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {


          //Panel Style
            panel: {
                fontFamily: "helvetica,arial,verdana,sans-serif", //"tahoma,arial,verdana,sans-serif",
                background: "#ffffff",
                border: "1px solid #b4cbdd",
                borderRadius: "5px",
                display: "inline-block",
                boxShadow: "0 12px 14px 0 rgba(0, 0, 0, 0.2), 0 13px 20px 0 rgba(0, 0, 0, 0.2)",
                minWidth: "50px"
                //rgba(0, 0, 0, 0.2) 0px 2px 4px 0px, rgba(0, 0, 0, 0.2) 0px 3px 2px 0px
            },


          //Window header
            header: {
                background: "#d9e7f8",
                height: "28px",
                borderRadius: "4px 4px 0 0", //top left and righ radius should match the panel radius
                border: "1px solid #ecf2fb",
                borderBottom: "1px solid #b4cbdd"
            },


          //Title (header)
            title: {
                position: "absolute",
                width: "100%",
                whiteSpace: "nowrap",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#04468C",
                textAlign: "left",
                cursor: "default",
                padding: "5px"
            },


          //App icon (header)
            icon: {
                float: "left"
            },

          //Container for buttons in the header
            buttonBar: {

              //float: "right",
                position: "absolute",
                right: 0,
                padding: "5px"
            },

          //Style for individual buttons in the header
            button: {
                width: "16px",
                height: "16px",
                border: "1px solid #cccccc",
                borderRadius: "3px",
                background: "#F6F6F6",
                color: "#6f6f6f",
                cursor: "default"
            },


            closeIcon: {
                //content: "&#10006;",
                content: "&#x2715;",
                lineHeight: "16px",
                textAlign: "center"
            },

            body: {
                padding: "7px",
                verticalAlign: "top",
                color: "#484848"
            },

            footer: {

            },

            footerButtonBar: {
                display: "inline-block",
                float: "right",
                padding: "7px 7px 14px 7px"
            },

          //Style for individual buttons in the button bar (footer)
            footerButton: {
                borderRadius: "3px",
                color: "#363636",
                display: "inline-block",
                fontSize: "14px",
                width: "80px",
                height: "26px",
                lineHeight: "26px",
                verticalAlign: "middle",
                textAlign: "center",
                backgroundColor: "#e4e4e4",
                border: "1px solid #b4b4b4",
                boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.2)",
                textShadow: "1px 1px 0px rgb(255, 255, 255)",
                cursor: "pointer",
                marginLeft: "7px"
            },

            resizeHandle: {
                //should be about 20x20 px with rounded corner to match window
            },

            mask: {
                background: "rgba(0,0,0,0.1)"
            }
        },

        renderers: {

            headerButtons: createHeaderButtons
        }

    };

    var mainDiv, header, body, footer, buttonRow, mask;
    var titleDiv, iconDiv, buttonDiv; //header elements
    var recenter = true;
    var visible = false;
    var seen = false;
    var overflow;
    var resizeListener;


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
        mainDiv = createElement('div', parent, config.style.panel);
        mainDiv.style.position = "absolute";
        mainDiv.style.left = "0px";
        mainDiv.style.top = "0px";
        mainDiv.style.display = "none";
        mainDiv.style.visibility = "hidden";
        //mainDiv.style.overflow = "hidden";
        mainDiv.tabIndex = -1; //allows the div to have focus
        me.setWidth(config.width);
        me.setHeight(config.height);
        me.el = mainDiv;

        if (config.resizable===true){
            addResizeHandles();
        }



      //Create table with 3 rows: header, body, and footer
        var table = createTable(mainDiv);
        table.style.fontFamily = "inherit";
        table.style.textAlign = "inherit";
        table.style.color = "inherit";


        header = table.addRow().addColumn();

        body = table.addRow().addColumn(config.style.body);
        body.style.width = "100%";
        body.style.height = "100%";

        footer = table.addRow().addColumn(config.style.footer);



      //Populate header
        var headerDiv = createElement('div', header, config.style.header);
        headerDiv.style.position = "relative";

        var dragHandle = createElement('div', headerDiv);
        dragHandle.style.position = "absolute";
        dragHandle.style.width = "100%";
        dragHandle.style.height = "100%";
        dragHandle.style.zIndex = 1;

        titleDiv = createElement('div', headerDiv, config.style.title);
        if (config.title) titleDiv.innerHTML = config.title;
        titleDiv.onclick = function(e){
            me.onHeaderClick(headerDiv, e);
        };

        iconDiv = createElement('div', headerDiv, config.style.icon);

        buttonDiv = createElement('div', headerDiv, config.style.buttonBar);
        buttonDiv.style.zIndex = 2;


        if (config.renderers.headerButtons){
            config.renderers.headerButtons(buttonDiv);
        }
        else{
            createHeaderButtons(buttonDiv);
        }



        me.setContent(config.body);


      //Populate the footer
        if (config.footer){
            me.setFooter(config.footer);
        }
        else{
            if (config.buttons){
                for (var i=0; i<config.buttons.length; i++){

                    var button = config.buttons[i];
                    var name = button.name;
                    var enabled = true;
                    var onclick = button.onclick;

                    addButton(name, enabled, onclick);
                }
            }
        }


      //Create mask (used for modal dialogs and resize)
        mask = createElement('div', parent);
        if (config.modal===true){
            addStyle(mask, "mask");
        }
        mask.style.position = "absolute";
        mask.style.left = "0px";
        mask.style.top = "0px";
        mask.style.width = "100%";
        mask.style.height = "100%";
        mask.style.display = "none";
        mask.style.visibility = "hidden";
        //parent.insertBefore(mask, parent.firstChild);



      //Initialize drag
        if (config.movable===true){
            initDrag(dragHandle, {
                onDragStart: function(x,y){
                    var div = mainDiv;

                    var rect = _getRect(div);
                    var rect2 = _getRect(parent);
                    var xOffset = (x-rect.x)+rect2.x;
                    var yOffset = (y-rect.y)+rect2.y;


                    div.xOffset = xOffset;
                    div.yOffset = yOffset;
                    div.width = rect.width;
                    div.height = rect.height;


                    div.style.left = (x-xOffset) + 'px';
                    div.style.top = (y-yOffset) + 'px';
                    dragHandle.style.cursor = 'move';

                },
                onDrag: function(x,y){
                    var div = mainDiv;

                    var left = (x-div.xOffset);
                    if (left<0) left = 0;


                    if (left+div.width>parent.offsetWidth) left=parent.offsetWidth-div.width;

                    var top = (y-div.yOffset);
                    if (top<0) top = 0;

                    if (top+div.height>parent.offsetHeight) top=parent.offsetHeight-div.height;

                    div.style.left = left + 'px';
                    div.style.top = top + 'px';

                },
                onDragEnd: function(){
                    this.style.cursor = 'default';
                }
            });
        }


      //Watch for resize events
        if (config.shrinkToFit===true){
            addResizeListener(shrinkToFit);
        }
    };


  //**************************************************************************
  //** destroy
  //**************************************************************************
  /** Used to destroy the window and remove it from the DOM
   */
    this.destroy = function(){
        if (resizeListener){
            resizeListener.listeners = [];
            resizeListener.destroy();
        }
        me.close();
        if (mask){
            mask.innerHTML = "";
            var parent = mask.parentNode;
            if (parent) parent.removeChild(mask);
            mask = null;
        }
        destroy(me);
        me = null;
        return me;
    };


  //**************************************************************************
  //** createHeaderButtons
  //**************************************************************************
  /** Default renderer for header buttons.
   */
    var createHeaderButtons = function(buttonDiv){
        if (config.closable===true){
            buttonDiv.appendChild(createButton(config.style.closeIcon, me.close));
        }
    };


  //**************************************************************************
  //** createButton
  //**************************************************************************
    var createButton = function(icon, onclick){
        var div = createElement('div', config.style.button);
        div.onclick = onclick;
        createElement('div', div, icon);
        return div;
    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
  /** Returns the content of the window's header/title area
   */
    this.getTitle = function(){
        return titleDiv.innerHTML;
    };


  //**************************************************************************
  //** setTitle
  //**************************************************************************
  /** Used to update the content of the window's header/title area
   */
    this.setTitle = function(obj){
        if (obj==null) titleDiv.innerHTML = "";
        else{
            if (isElement(obj)){
                titleDiv.innerHTML = "";
                body.appendChild(obj);
            }
            else{
                if (typeof obj === "string"){
                    titleDiv.innerHTML = obj;
                }
            }
        }
    };


  //**************************************************************************
  //** onHeaderClick
  //**************************************************************************
  /** Called whenever the header is clicked.
   */
    this.onHeaderClick = function(){};


  //**************************************************************************
  //** onResize
  //**************************************************************************
  /** Called whenever the window is resized
   */
    this.onResize = function(){};


  //**************************************************************************
  //** getBody
  //**************************************************************************
  /** Returns the window's body (main content panel) as a DOM element
   */
    this.getBody = function(){
        return body;
    };


  //**************************************************************************
  //** setBody
  //**************************************************************************
  /** Used to update/replace window's body (main content panel)
   *  @param obj Accepts strings, DOM elements, and nulls
   */
    this.setBody = function(obj){
        if (obj==null) body.innerHTML = "";
        else{
            if (isElement(obj)){
                body.innerHTML = "";
                var p = obj.parentNode;
                if (p) p.removeChild(obj);
                body.appendChild(obj);
            }
            else{
                if (typeof obj === "string"){
                    body.innerHTML = obj;
                }
            }
        }
    };


  //**************************************************************************
  //** setContent
  //**************************************************************************
  /** Exactly the same as setBody()
   */
    this.setContent = function(obj){
        me.setBody(obj);
    };


  //**************************************************************************
  //** getFooter
  //**************************************************************************
    this.getFooter = function(){
        return footer;
    };


  //**************************************************************************
  //** setFooter
  //**************************************************************************
    this.setFooter = function(obj){
        if (obj==null) footer.innerHTML = "";
        else{
            if (isElement(obj)){
                var p = obj.parentNode;
                if (p) p.removeChild(obj);
                footer.appendChild(obj);
            }
            else{
                if (typeof obj === "string"){
                    footer.innerHTML = obj;
                }
            }
        }
    };


  //**************************************************************************
  //** open
  //**************************************************************************
  /** Used to make the window visible.
   */
    this.open = function(animation){
        me.show(animation);
    };


  //**************************************************************************
  //** show
  //**************************************************************************
  /** Exactly the same as open()
   */
    this.show = function(animation){
        me.showAt(null, null, animation);
    };


  //**************************************************************************
  //** showAt
  //**************************************************************************
  /** Used to make the window visible at a given location on the screen.
   */
    this.showAt = function(x, y, animation){


      //Set zIndex
        var highestElements = getHighestElements();
        var zIndex = highestElements.zIndex;
        if (!highestElements.contains(mask)) zIndex++;


      //Update mask
        overflow = mask.parentNode.style.overflow;
        mask.parentNode.style.overflow = "hidden";
        mask.style.zIndex = zIndex;
        if (config.modal===true){
            mask.style.display = '';
            mask.style.visibility = '';
        }


      //Update window
        mainDiv.style.zIndex = zIndex+1;
        mainDiv.style.display = '';
        mainDiv.style.visibility = '';

        if (x!=null & y!=null){
            mainDiv.style.left = x + "px";
            mainDiv.style.top = y + "px";
            recenter = false;
        }
        else{
           if (recenter) me.center();
        }


        if (!seen){
            if (recenter){
                addResizeListener(function(){
                    if (recenter) me.center();
                });
            }
            seen = true;
        }


        if (!visible){
            me.update();
            visible = true;
            me.onOpen();
            if (config.shrinkToFit===true){
                shrinkToFit();
            }
        }
    };


  //**************************************************************************
  //** close
  //**************************************************************************
  /** Used to close/hide the window
   *  @param silent If true, will not fire the onClose event
   */
    this.close = function(silent){

        if (visible){

            if (overflow) mask.parentNode.style.overflow = overflow;
            if (config.modal===true){
                mask.style.display = "none";
                mask.style.visibility = "hidden";
            }
            mask.style.zIndex = '';

            mainDiv.style.display = "none";
            mainDiv.style.visibility = "hidden";
            mainDiv.style.zIndex = '';

            visible = false;

            if (silent!==true) me.onClose();
        }
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
  /** Exactly the same as close()
   */
    this.hide = function(silent){
        me.close(silent);
    };


  //**************************************************************************
  //** isOpen
  //**************************************************************************
  /** Returns true if the window is open.
   */
    this.isOpen = function(){
        return visible;
    };


  //**************************************************************************
  //** onOpen
  //**************************************************************************
  /** Called whenever the window is opened or made visible.
   */
    this.onOpen = function(){};


  //**************************************************************************
  //** onClose
  //**************************************************************************
  /** Called whenever the window is closed or hidden from view.
   */
    this.onClose = function(){};


  //**************************************************************************
  //** getWidth
  //**************************************************************************
  /** Returns the current width of the window in pixels (number)
   */
    this.getWidth = function(){
        return mainDiv.offsetWidth;
    };


  //**************************************************************************
  //** setWidth
  //**************************************************************************
  /** Used to set the width of the window
   *  @param width Accepts numbers or strings with valid CSS values ("1px, "1%")
   */
    this.setWidth = function(width){
        if (isNaN(width)){
            if (typeof width === "string"){
                mainDiv.style.width = width;
            }
        }
        else{
            mainDiv.style.width = width + "px";
        }
        me.update();
        me.onResize();
    };


  //**************************************************************************
  //** getHeight
  //**************************************************************************
  /** Returns the current height of the window in pixels (number)
   */
    this.getHeight = function(){
        return mainDiv.offsetHeight;
    };


  //**************************************************************************
  //** setHeight
  //**************************************************************************
  /** Used to set the height of the window
   *  @param height Accepts numbers or strings with valid CSS values ("1px, "1%")
   */
    this.setHeight = function(height){
        if (isNaN(height)){
            if (typeof height === "string"){
                mainDiv.style.height = height;
            }
        }
        else{
            mainDiv.style.height = height + "px";
        }
        me.update();
        me.onResize();
    };


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update the size of the window. Called internally whenever the
   *  window is resized to insure that the window contents fit inside the
   *  window. If you are updating DOM elements within the window dynamically,
   *  you may need to call this method.
   */
    this.update = function(){
        setTimeout(function(){
            try{
                var minWidth = Math.max(header.offsetWidth, body.offsetWidth, footer.offsetWidth);
                if (mainDiv.offsetWidth<minWidth){
                    mainDiv.style.width = minWidth+"px";
                }
            }
            catch(e){}

            try{
                var minHeight = header.offsetHeight + body.offsetHeight + footer.offsetHeight;
                if (mainDiv.offsetHeight<minHeight){
                    mainDiv.style.height = minHeight+"px";
                }
            }
            catch(e){}
        }, 0);
    };


  //**************************************************************************
  //** center
  //**************************************************************************
  /** Moves the window to the center of the screen.
   */
    this.center = function(){

       var w = mainDiv.offsetWidth;
       var h = mainDiv.offsetHeight;
       var x = parent.clientWidth;
       var y = parent.clientHeight;

     //Update x if >1 monitor in use
       if (screen.width>(2*screen.height)) x=x/2;

     //Set x value to the middle of the screen
       x = (x/2)-(w/2);

     //Compute y value
       switch(config.valign){
            case "top":
                y = (y/4)-(h/2);
                break;
            default:
                y = (y/2)-(h/2);
       }

       if (y<0) y=0;
       if (x<0) x=0;

     //Move form
       mainDiv.style.left = x + "px";
       mainDiv.style.top = y + "px";

    };


  //**************************************************************************
  //** addButton
  //**************************************************************************
    addButton = function (name, enabled, onclick){

        if (!buttonRow){
            var buttonDiv = createElement('div', footer, config.style.footerButtonBar);
            buttonRow = createTable(buttonDiv).addRow();
        }

        var td = buttonRow.addColumn();
        if (name.toLowerCase()==="spacer"){
            td.style.width="100%";
        }
        else{
            var input = createElement('input', td, config.style.footerButton);
            input.type = "button";
            input.name = name;
            input.value = name;
            input.onclick = onclick;
        }
    };


  //**************************************************************************
  //** addResizeHandles
  //**************************************************************************
    var addResizeHandles = function(){


        var parentRect, windowRect;
        var dx, dy;

        var onDragStart = function(x,y){
            var resizeHandle = this;

            mask.style.cursor = resizeHandle.style.cursor;
            mask.style.display = "";
            mask.style.visibility = "";


            parentRect = _getRect(parent);
            windowRect = _getRect(mainDiv);


            var orgWidth = windowRect.width;
            dx = parseFloat(mainDiv.style.width);
            if (dx<orgWidth) dx = orgWidth-dx;
            else dx = 0;


            var orgHeight = windowRect.height;
            dy = parseFloat(mainDiv.style.height);
            if (dy<orgHeight) dy = orgHeight-dy;
            else dy = 0;
        };


        var onDragEnd = function(){
            if (config.modal!==true){
                mask.style.display = "none";
                mask.style.visibility = "hidden";
            }
            mask.style.cursor = "";
            mainDiv.focus();
        };


        var setWidth = function(w){
            mainDiv.style.width = w + "px";
            var minWidth = Math.max(header.offsetWidth, body.offsetWidth, footer.offsetWidth);
            if (mainDiv.offsetWidth<minWidth){
                mainDiv.style.width = minWidth+"px";
            }
        };


        var setHeight = function(h){
            mainDiv.style.height = h + "px";
            var minHeight = header.offsetHeight + body.offsetHeight + footer.offsetHeight;
            if (mainDiv.offsetHeight<minHeight){
                mainDiv.style.height = minHeight+"px";
            }
        };


        var pullDown = function(y){

          //Update height
            var top = windowRect.top-parentRect.top;
            if (y>parentRect.bottom) y = parentRect.bottom;
            var bottom = y-parentRect.top;
            var height = (bottom-top)-dx;
            setHeight(height);
        };


        var pullUp = function(y){

          //Set top position
            var top = y-parentRect.top;
            if (top<0) top = 0;
            var minY = (windowRect.bottom-parentRect.top)-50;
            if (top>minY) top = minY;
            mainDiv.style.top = top + 'px';


          //Update height
            var bottom = windowRect.bottom-parentRect.top;
            var height = (bottom-top)-dy;
            setHeight(height);
            var d = _getRect(mainDiv).bottom-windowRect.bottom;
            if (d>0) setHeight(height-d);
        };


        pullLeft = function(x){

          //Set left position
            if (x<parentRect.left) x = parentRect.left;
            var left = x-parentRect.left;

            var maxX = (windowRect.right-parentRect.left)-75;
            if (left>maxX) left = maxX;
            mainDiv.style.left = left + 'px';


          //Update width
            var right = windowRect.right-parentRect.left;
            var width = (right-left)-dx;
            setWidth(width);
            var d = _getRect(mainDiv).right-windowRect.right;
            if (d>0) setWidth(width-d);
        };


        var pullRight = function(x){
          //Set width
            var left = windowRect.left-parentRect.left;
            if (x>parentRect.right) x = parentRect.right;
            var right = x-parentRect.left;

            var width = (right-left)-dx;
            setWidth(width);
        };



      //Add vertical resizer to the top of the window
        var resizeHandle = createElement("div", mainDiv);
        resizeHandle.style.position = "absolute";
        resizeHandle.style.width = "100%";
        resizeHandle.style.height = "10px";
        resizeHandle.style.top = "-5px";
        resizeHandle.style.cursor = "ns-resize";
        //resizeHandle.style.backgroundColor = "#ff0000";
        resizeHandle.style.zIndex = 2;
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                pullUp(y);
                me.onResize();
            },
            onDragEnd: onDragEnd
        });


      //Add vertical resizer to the bottom of the window
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "";
        resizeHandle.style.bottom = "-5px";
        mainDiv.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                pullDown(y);
                me.onResize();
            },
            onDragEnd: onDragEnd
        });


      //Add horizontal resizer to the left of the window
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "0px";
        resizeHandle.style.bottom = "";
        resizeHandle.style.left = "-5px";
        resizeHandle.style.height = "100%";
        resizeHandle.style.width = "10px";
        resizeHandle.style.cursor = "ew-resize";
        mainDiv.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                pullLeft(x);
                me.onResize();
            },
            onDragEnd: onDragEnd
        });


      //Add nw resizer
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "-5px";
        resizeHandle.style.right = "";
        resizeHandle.style.height = "10px";
        resizeHandle.style.cursor = "se-resize";
        mainDiv.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                pullLeft(x);
                pullUp(y);
                me.onResize();
            },
            onDragEnd: onDragEnd
        });


      //Add sw resizer
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "";
        resizeHandle.style.bottom = "-5px";
        resizeHandle.style.cursor = "ne-resize";
        mainDiv.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                pullLeft(x);
                pullDown(y);
                me.onResize();
            },
            onDragEnd: onDragEnd
        });


      //Add horizontal resizer to the right of the window
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.left = "";
        resizeHandle.style.right = "-5px";
        resizeHandle.style.top = "0px";
        resizeHandle.style.height = "100%";
        resizeHandle.style.cursor = "ew-resize";
        mainDiv.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                pullRight(x);
                me.onResize();
            },
            onDragEnd: onDragEnd
        });


      //Add ne resizer
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "-5px";
        resizeHandle.style.height = "10px";
        resizeHandle.style.cursor = "ne-resize";
        mainDiv.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                pullRight(x);
                pullUp(y);
                me.onResize();
            },
            onDragEnd: onDragEnd
        });



      //Add se resizer
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "";
        resizeHandle.style.cursor = "se-resize";
        if (config.style.resizeHandle==null || isEmpty(config.style.resizeHandle)){
            resizeHandle.style.bottom = "-5px";
            javaxt.dhtml.utils.initDrag(resizeHandle, {
                onDragStart: onDragStart,
                onDrag: function(x,y){
                    pullRight(x);
                    pullDown(y);
                    me.onResize();
                },
                onDragEnd: onDragEnd
            });
        }
        else{
            resizeHandle.style.width = "25px";
            resizeHandle.style.height = "25px";
            createElement("div", resizeHandle, config.style.resizeHandle);
            javaxt.dhtml.utils.initDrag(resizeHandle, {
                onDragStart: onDragStart,
                onDrag: function(x,y){
                    pullRight(x);
                    pullDown(y);
                    me.onResize();
                },
                onDragEnd: onDragEnd
            });
        }
        mainDiv.appendChild(resizeHandle);
    };


  //**************************************************************************
  //** shrinkToFit
  //**************************************************************************
  /** Resize window if it is larger that the parent
   */
    var shrinkToFit = function(){
        var width = me.getWidth();
        var height = me.getHeight();
        var w = parent.offsetWidth;
        var h = parent.offsetHeight;
        if (width>w){
            me.setWidth(w);
        }
        if (height>h){
            me.setHeight(h);
        }
    };


  //**************************************************************************
  //** addResizeListener
  //**************************************************************************
    var addResizeListener = function(fn){
        if (!resizeListener){
            resizeListener = javaxt.dhtml.utils.addResizeListener(parent, function(){
                var listeners = resizeListener.listeners;
                for (var i=0; i<listeners.length; i++){
                    listeners[i].apply(me, []);
                }
            });
            resizeListener.listeners = [];
        }
        resizeListener.listeners.push(fn);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var _getRect = javaxt.dhtml.utils.getRect;
    var merge = javaxt.dhtml.utils.merge;
    var destroy = javaxt.dhtml.utils.destroy;
    var isEmpty = javaxt.dhtml.utils.isEmpty;
    var isElement = javaxt.dhtml.utils.isElement;
    var getHighestElements = javaxt.dhtml.utils.getHighestElements;
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var initDrag = javaxt.dhtml.utils.initDrag;

    var addStyle = function(el, style){
        javaxt.dhtml.utils.addStyle(el, config.style[style]);
    };


    init();
};