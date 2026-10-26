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
       *  defined. Example:
       <pre>
            buttons: [
                {
                    name: "OK",
                    onclick: function(){
                        win.close();
                    }
                }
            ]
       </pre>
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

    var win, header, body, footer, buttonRow, mask;
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
        var mainDiv = createElement('div', parent, "javaxt-window");


      //Create window div
        win = createElement('div', mainDiv, config.style.panel);
        win.style.position = "absolute";
        win.style.left = "0px";
        win.style.top = "0px";
        win.style.display = "none";
        win.style.visibility = "hidden";
        //win.style.overflow = "hidden";
        win.tabIndex = -1; //allows the div to have focus
        me.setWidth(config.width);
        me.setHeight(config.height);
        me.el = mainDiv;

        if (config.resizable===true){
            addResizeHandles();
        }



      //Create table with 3 rows: header, body, and footer
        var table = createTable(win);
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

                    me.addButton(name, onclick);
                }
            }
        }


      //Create mask (used for modal dialogs and resize). If the window is
      //rendered in the body, use a fixed position so the mask covers the
      //visible part of the page, even if the page scrolls. Otherwise, the
      //mask would only cover the first screenful of the page.
        mask = createElement('div', mainDiv);
        if (config.modal===true){
            addStyle(mask, "mask");
        }
        mask.style.position = isBody() ? "fixed" : "absolute";
        mask.style.left = "0px";
        mask.style.top = "0px";
        mask.style.width = "100%";
        mask.style.height = "100%";
        addShowHide(mask);
        mask.hide();



      //Initialize drag
        if (config.movable===true){
            initDrag(dragHandle, {
                onDragStart: function(x,y){
                    var div = win;

                    var rect = _getRect(div);
                    var rect2 = _getRect(parent);
                    var xOffset = (x-rect.x)+rect2.x;
                    var yOffset = (y-rect.y)+rect2.y;


                    div.xOffset = xOffset;
                    div.yOffset = yOffset;
                    div.width = rect.width;
                    div.height = rect.height;
                    div.bounds = getViewport();


                    div.style.left = (x-xOffset) + 'px';
                    div.style.top = (y-yOffset) + 'px';
                    dragHandle.style.cursor = 'move';

                },
                onDrag: function(x,y){
                    var div = win;
                    var bounds = div.bounds;
                    var maxLeft = bounds.left + bounds.width;
                    var maxTop = bounds.top + bounds.height;

                    var left = (x-div.xOffset);
                    if (left+div.width>maxLeft) left=maxLeft-div.width;
                    if (left<bounds.left) left = bounds.left;

                    var top = (y-div.yOffset);
                    if (top+div.height>maxTop) top=maxTop-div.height;
                    if (top<bounds.top) top = bounds.top;

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

        mask.innerHTML = "";
        var parent = mask.parentNode;
        if (parent) parent.removeChild(mask);
        mask = null;

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
        overflow = parent.style.overflow;
        parent.style.overflow = "hidden";
        mask.style.zIndex = zIndex;
        if (config.modal===true){
            mask.show();
        }


      //Update window
        win.style.zIndex = zIndex+1;
        win.style.display = '';
        win.style.visibility = '';

        if (x!=null & y!=null){
            win.style.left = x + "px";
            win.style.top = y + "px";
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

            parent.style.overflow = overflow;
            mask.hide();
            mask.style.zIndex = '';

            win.style.display = "none";
            win.style.visibility = "hidden";
            win.style.zIndex = '';

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
        return win.offsetWidth;
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
                win.style.width = width;
            }
        }
        else{
            win.style.width = width + "px";
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
        return win.offsetHeight;
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
                win.style.height = height;
            }
        }
        else{
            win.style.height = height + "px";
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
                if (win.offsetWidth<minWidth){
                    win.style.width = minWidth+"px";
                }
            }
            catch(e){}

            try{
                var minHeight = header.offsetHeight + body.offsetHeight + footer.offsetHeight;
                if (win.offsetHeight<minHeight){
                    win.style.height = minHeight+"px";
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

       var w = win.offsetWidth;
       var h = win.offsetHeight;
       var viewport = getViewport();
       var x = viewport.width;
       var y = viewport.height;

     //Update x if >1 monitor in use
       if (screen.width>(2*screen.height)) x=x/2;

     //Set x value to the middle of the screen
       x = (x/2)-(w/2);

     //Compute y value for the middle of the screen
       var m = (y/2)-(h/2);

     //Compute y value
       switch(config.valign){
            case "top":
                y = m/3;
                break;
            default:
                y = m;
       }

       if (y<0) y=0;
       if (x<0) x=0;

     //Move window. Note that the viewport may be offset from the top left
     //corner of the parent (e.g. if the window is in a body that scrolls)
       win.style.left = (viewport.left + x) + "px";
       win.style.top = (viewport.top + y) + "px";

    };


  //**************************************************************************
  //** addButton
  //**************************************************************************
  /** Adds a button to the footer
   */
    this.addButton = function (name, onclick){

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
            return input;
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
            mask.show();


            parentRect = _getRect(parent);
            windowRect = _getRect(win);


            var orgWidth = windowRect.width;
            dx = parseFloat(win.style.width);
            if (dx<orgWidth) dx = orgWidth-dx;
            else dx = 0;


            var orgHeight = windowRect.height;
            dy = parseFloat(win.style.height);
            if (dy<orgHeight) dy = orgHeight-dy;
            else dy = 0;
        };


        var onDragEnd = function(){
            if (config.modal!==true){
                mask.hide();
            }
            mask.style.cursor = "";
            win.focus();
        };


        var setWidth = function(w){
            win.style.width = w + "px";
            var minWidth = Math.max(header.offsetWidth, body.offsetWidth, footer.offsetWidth);
            if (win.offsetWidth<minWidth){
                win.style.width = minWidth+"px";
            }
        };


        var setHeight = function(h){
            win.style.height = h + "px";
            var minHeight = header.offsetHeight + body.offsetHeight + footer.offsetHeight;
            if (win.offsetHeight<minHeight){
                win.style.height = minHeight+"px";
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
            win.style.top = top + 'px';


          //Update height
            var bottom = windowRect.bottom-parentRect.top;
            var height = (bottom-top)-dy;
            setHeight(height);
            var d = _getRect(win).bottom-windowRect.bottom;
            if (d>0) setHeight(height-d);
        };


        pullLeft = function(x){

          //Set left position
            if (x<parentRect.left) x = parentRect.left;
            var left = x-parentRect.left;

            var maxX = (windowRect.right-parentRect.left)-75;
            if (left>maxX) left = maxX;
            win.style.left = left + 'px';


          //Update width
            var right = windowRect.right-parentRect.left;
            var width = (right-left)-dx;
            setWidth(width);
            var d = _getRect(win).right-windowRect.right;
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
        var resizeHandle = createElement("div", win);
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
        win.appendChild(resizeHandle);
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
        win.appendChild(resizeHandle);
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
        win.appendChild(resizeHandle);
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
        win.appendChild(resizeHandle);
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
        win.appendChild(resizeHandle);
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
        win.appendChild(resizeHandle);
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
        win.appendChild(resizeHandle);
    };


  //**************************************************************************
  //** shrinkToFit
  //**************************************************************************
  /** Resize window if it is larger that the parent
   */
    var shrinkToFit = function(){
        var width = me.getWidth();
        var height = me.getHeight();
        var viewport = getViewport();
        var w = viewport.width;
        var h = viewport.height;
        if (width>w){
            me.setWidth(w);
        }
        if (height>h){
            me.setHeight(h);
        }
    };


  //**************************************************************************
  //** isBody
  //**************************************************************************
  /** Returns true if the window is rendered directly in the document body.
   */
    var isBody = function(){
        return parent===document.body || parent===document.documentElement;
    };


  //**************************************************************************
  //** getViewport
  //**************************************************************************
  /** Returns the area in which the window can be displayed, in the same
   *  coordinates used to position the window (i.e. relative to the parent).
   *  Typically, this is simply the parent. However, if the window is rendered
   *  in the body, the area is the visible part of the page. The body may be
   *  taller than the browser window (or shorter than its content) and may be
   *  scrolled, so its dimensions don't reflect what the user can actually see.
   */
    var getViewport = function(){
        if (isBody()){
            var left, top;
            if (javaxt.dhtml.utils.getStyle(parent, "position")==="static"){
              //Window is positioned relative to the document
                left = window.pageXOffset;
                top = window.pageYOffset;
            }
            else{
              //Window is positioned relative to the body
                var rect = parent.getBoundingClientRect();
                left = -(rect.left + parent.clientLeft);
                top = -(rect.top + parent.clientTop);
            }
            return {
                left: left,
                top: top,
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight
            };
        }
        else{
            return {
                left: 0,
                top: 0,
                width: parent.clientWidth,
                height: parent.clientHeight
            };
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
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var getHighestElements = javaxt.dhtml.utils.getHighestElements;
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var initDrag = javaxt.dhtml.utils.initDrag;

    var addStyle = function(el, style){
        javaxt.dhtml.utils.addStyle(el, config.style[style]);
    };


    init();
};