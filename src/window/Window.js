if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Window
//******************************************************************************
/**
 *   Simple window control that can be used to create dialogs, alert, messages,
 *   etc. Window consists of a header, body, footer, and mask. All elements
 *   are optional.
 *
 ******************************************************************************/


javaxt.dhtml.Window = function(parent, config) {
    this.className = "javaxt.dhtml.Window";

    var me = this;
    var mainDiv, header, body, footer, mask;
    var titleDiv;
    var recenter = true;
    var visible = false;
    var noselect;
    var overflow;

    var defaultConfig = {

        title: false,
        body: null,
        footer: null,


        width: null,
        height: null,
        modal: false,
        resizable: true,
        closable: true,
        valign: "middle",


        style: {


          //Panel Style
            panel: {
                fontFamily: "helvetica,arial,verdana,sans-serif", //"tahoma,arial,verdana,sans-serif",
                background: "#ffffff",
                border: "1px solid #b4cbdd",
                borderRadius: "5px",
                display: "inline-block",
                boxShadow: "0 12px 14px 0 rgba(0, 0, 0, 0.2), 0 13px 20px 0 rgba(0, 0, 0, 0.2)"
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
        mainDiv = document.createElement('div');
        setStyle(mainDiv, "panel");
        mainDiv.style.position = "absolute";
        mainDiv.style.left = "0px";
        mainDiv.style.top = "0px";
        mainDiv.style.display = "none";
        mainDiv.style.visibility = "hidden";
        me.setWidth(config.width);
        me.setHeight(config.height);


        parent.appendChild(mainDiv);
        me.el = mainDiv;

        if (config.resizable===true){
            addResizeHandle(mainDiv);
        }



      //Create table with 3 rows: header, body, and footer
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
        mainDiv.appendChild(table);

        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        header = document.createElement("td");
        tr.appendChild(header);

        tr = document.createElement('tr');
        tbody.appendChild(tr);
        body = document.createElement("td");
        setStyle(body, "body");
        body.style.width = "100%";
        body.style.height = "100%";
        tr.appendChild(body);

        tr = document.createElement('tr');
        tbody.appendChild(tr);
        footer = document.createElement("td");
        setStyle(footer, "footer");
        tr.appendChild(footer);



      //Populate header
        var headerDiv = document.createElement('div');
        addStyle(headerDiv, "header");
        headerDiv.style.position = "relative";
        header.appendChild(headerDiv);

        var dragHandle = document.createElement('div');
        dragHandle.style.position = "absolute";
        dragHandle.style.width = "100%";
        dragHandle.style.height = "100%";
        dragHandle.style.zIndex = 1;
        headerDiv.appendChild(dragHandle);

        titleDiv = document.createElement('div');
        addStyle(titleDiv, "title");
        if (config.title) titleDiv.innerHTML = config.title;
        titleDiv.onclick = function(e){
            me.onHeaderClick(headerDiv, e);
        };
        headerDiv.appendChild(titleDiv);


        var iconDiv = document.createElement('div');
        addStyle(iconDiv, "icon");
        headerDiv.appendChild(iconDiv);

        var buttonDiv = document.createElement('div');
        addStyle(buttonDiv, "buttonBar");
        buttonDiv.style.zIndex = 2;
        headerDiv.appendChild(buttonDiv);


        if (config.renderers.headerButtons){
            config.renderers.headerButtons(buttonDiv);
        }
        else{
            createHeaderButtons(buttonDiv);
        }



        me.setContent(config.body);
        me.setFooter(config.footer);



      //Create mask for modal dialogs
        if (config.modal===true){
            mask = document.createElement('div');
            addStyle(mask, "mask");
            mask.style.position = "absolute";
            mask.style.left = "0px";
            mask.style.top = "0px";
            mask.style.width = "100%";
            mask.style.height = "100%";
            mask.style.display = "none";
            mask.style.visibility = "hidden";
            parent.appendChild(mask);
            //parent.insertBefore(mask, parent.firstChild);
        }



      //Initialize drag
        initDrag(dragHandle, {
            onDragStart: function(x,y){
                var div = mainDiv;

                var rect = _getRect(div);
                var rect2 = _getRect(parent);
                var xOffset = x-rect.x;
                var yOffset = (y-rect.y)+rect2.y;


                div.xOffset = xOffset;
                div.yOffset = yOffset;
                div.width = rect.width;
                div.height = rect.height;


                div.style.left = rect.x + 'px';
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


      //Watch for resize events
        addResizeListener(parent, function(){
            if (recenter) me.center();
        });

    };


  //**************************************************************************
  //** createHeaderButtons
  //**************************************************************************
  /** Default renderer for header buttons.
   */
    var createHeaderButtons = function(buttonDiv){
        if (config.closable===true){
            buttonDiv.appendChild(createButton("closeIcon", me.close));
        }
    };


  //**************************************************************************
  //** createButton
  //**************************************************************************
    var createButton = function(icon, onclick){
        var div = document.createElement('div');
        setStyle(div, "button");
        var innerDiv = document.createElement('div');
        setStyle(innerDiv, icon);
        div.appendChild(innerDiv);
        div.onclick = onclick;
        return div;
    };


  //**************************************************************************
  //** setTitle
  //**************************************************************************
    this.setTitle = function(title){
        if (title==null) title = "";
        titleDiv.innerHTML = title;
    };


  //**************************************************************************
  //** onHeaderClick
  //**************************************************************************
  /** Override to capture this header click events.
   */
    this.onHeaderClick = function(){};


  //**************************************************************************
  //** getBody
  //**************************************************************************
    this.getBody = function(){
        return body;
    };

    this.setBody = this.setContent = function(obj){
        if (obj==null) body.innerHTML = "";
        else{
            if (obj instanceof Element){
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
  //** getFooter
  //**************************************************************************
    this.getFooter = function(){
        return footer;
    };

    this.setFooter = function(obj){
        if (obj==null) footer.innerHTML = "";
        else{
            if (obj instanceof Element){
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
  //** show/open
  //**************************************************************************
  /** Used to make the window visible.
   */
    this.show = this.open = function(animation){
        me.showAt(null,null,animation);
    };


  //**************************************************************************
  //** showAt
  //**************************************************************************
  /** Used to make the window visible at a given location on the screen.
   */
    this.showAt = function(x, y){

        var z = getNextHighestZindex();

        if (mask){
            overflow = mask.parentNode.style.overflow;
            mask.parentNode.style.overflow = "hidden";
            mask.style.zIndex = z;
            mask.style.display = '';
            mask.style.visibility = '';
            z++;
        }

        mainDiv.style.zIndex = z;
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



        if (!visible){
            visible = true;
            me.onOpen();
        }
    };



  //**************************************************************************
  //** hide
  //**************************************************************************
  /** Used to close/hide the window
   *  @param silent If true, will not fire the onClose event
   */
    this.hide = this.close = function(silent){

        if (visible){

            if (mask){
                if (overflow) mask.parentNode.style.overflow = overflow;
                mask.style.display = "none";
                mask.style.visibility = "hidden";
                mask.style.zIndex = '';
            }

            mainDiv.style.display = "none";
            mainDiv.style.visibility = "hidden";
            mainDiv.style.zIndex = '';

            visible = false;

            if (silent!==true) me.onClose();
        }
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
    this.getWidth = function(){
        return mainDiv.offsetWidth;
    };


  //**************************************************************************
  //** setWidth
  //**************************************************************************
    this.setWidth = function(width){
        if (isNaN(width)){
            if (typeof width === "string"){
                mainDiv.style.width = width;
            }
        }
        else{
            mainDiv.style.width = width + "px";
        }
    };


  //**************************************************************************
  //** getHeight
  //**************************************************************************
    this.getHeight = function(){
        return mainDiv.offsetHeight;
    };


  //**************************************************************************
  //** setHeight
  //**************************************************************************
    this.setHeight = function(height){
        if (isNaN(height)){
            if (typeof height === "string"){
                mainDiv.style.height = height;
            }
        }
        else{
            mainDiv.style.height = height + "px";
        }
    };



  //**************************************************************************
  //** center
  //**************************************************************************
  /** Moves the window to the center of the screen. */

    this.center = function(){

       var w = mainDiv.offsetWidth;
       var h = mainDiv.offsetHeight;
       var x = document.body.clientWidth;
       var y = document.body.clientHeight;

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
  //** addResizeHandle
  //**************************************************************************
    var addResizeHandle = function(parent){

        var xOffset, yOffset;
        var orgHeight, orgWidth;
        var dx, dy;
        var onDragStart = function(x,y){
            var div = this;
            var rect = _getRect(div);
            var rect2 = _getRect(parent);

            xOffset = (x-rect.x)+rect2.x;
            yOffset = (y-rect.y)+rect2.y;
            orgHeight = rect2.height;
            orgWidth = rect2.width;

            dx = parseFloat(parent.style.width);
            if (dx<orgWidth) dx = orgWidth-dx;
            else dx = 0;

            dy = parseFloat(parent.style.height);
            if (dy<orgHeight) dy = orgHeight-dy;
            else dy = 0;
        };


      //Add vertical resizer to the top of the window (buggy!)
        var resizeHandle = document.createElement("div");
        resizeHandle.style.position = "absolute";
        resizeHandle.style.width = "100%";
        resizeHandle.style.height = "10px";
        resizeHandle.style.top = "-5px";
        resizeHandle.style.cursor = "ns-resize";
        //resizeHandle.style.backgroundColor = "#ff0000";
        resizeHandle.style.zIndex = 2;
        parent.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                var top = (yOffset-y);
                parent.style.top = (y) + "px";
                parent.style.height = ((orgHeight+top)-dy) + "px";
            }
        });


      //Add vertical resizer to the bottom of the window
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "";
        resizeHandle.style.bottom = "-5px";
        parent.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                var top = -(yOffset-y);
                parent.style.height = (top+dy) + "px";
            }
        });


      //Add horizontal resizer to the left of the window
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "0px";
        resizeHandle.style.bottom = "";
        resizeHandle.style.left = "-5px";
        resizeHandle.style.height = "100%";
        resizeHandle.style.width = "10px";
        resizeHandle.style.cursor = "ew-resize";
        parent.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                var top = (xOffset-x);
                parent.style.left = x + 'px';
                parent.style.width = ((orgWidth+top)) + "px";
            }
        });


      //Add nw resizer
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "-5px";
        resizeHandle.style.right = "";
        resizeHandle.style.height = "10px";
        resizeHandle.style.cursor = "se-resize";
        parent.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                var top = (xOffset-x);
                parent.style.left = x + 'px';
                parent.style.width = ((orgWidth+top)) + "px";

                var top = (yOffset-y);
                parent.style.top = (y) + "px";
                parent.style.height = ((orgHeight+top)-dy) + "px";
            }
        });


      //Add sw resizer
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "";
        resizeHandle.style.bottom = "-5px";
        resizeHandle.style.cursor = "ne-resize";
        parent.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                var top = (xOffset-x);
                parent.style.left = x + 'px';
                parent.style.width = ((orgWidth+top)) + "px";

                var top = -(yOffset-y);
                parent.style.height = (top+dy) + "px";
            }
        });


      //Add horizontal resizer to the right of the window
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.left = "";
        resizeHandle.style.right = "-5px";
        resizeHandle.style.top = "0px";
        resizeHandle.style.height = "100%";
        resizeHandle.style.cursor = "ew-resize";
        parent.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                var d = -(xOffset-x);
                parent.style.width = (d+dx) + "px";
            }
        });


      //Add ne resizer
        resizeHandle = resizeHandle.cloneNode();
        resizeHandle.style.top = "-5px";
        resizeHandle.style.height = "10px";
        resizeHandle.style.cursor = "ne-resize";
        parent.appendChild(resizeHandle);
        javaxt.dhtml.utils.initDrag(resizeHandle, {
            onDragStart: onDragStart,
            onDrag: function(x,y){
                var d = -(xOffset-x);
                parent.style.width = (d+dx) + "px";
                var top = (yOffset-y);
                parent.style.top = (y) + "px";
                parent.style.height = ((orgHeight+top)-dy) + "px";
            }
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
                    var d = -(xOffset-x);
                    parent.style.width = (d+dx) + "px";
                    var top = -(yOffset-y);
                    parent.style.height = (top+dy) + "px";
                }
            });
        }
        else{
            resizeHandle.style.width = "25px";
            resizeHandle.style.height = "25px";
            var div = document.createElement("div");
            resizeHandle.appendChild(div);
            setStyle(div, "resizeHandle");
            javaxt.dhtml.utils.initDrag(resizeHandle, {
                onDragStart: onDragStart,
                onDrag: function(x,y){
                    var d = -(xOffset-x)+20;
                    parent.style.width = (d+dx) + "px";
                    var top = -(yOffset-y)+20;
                    parent.style.height = (top+dy) + "px";
                }
            });
        }
        parent.appendChild(resizeHandle);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var _getRect = javaxt.dhtml.utils.getRect;
    var merge = javaxt.dhtml.utils.merge;
    var isEmpty = javaxt.dhtml.utils.isEmpty;
    var getNextHighestZindex = javaxt.dhtml.utils.getNextHighestZindex;
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;
    var initDrag = javaxt.dhtml.utils.initDrag;

    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };
    var addStyle = function(el, style){
        javaxt.dhtml.utils.addStyle(el, config.style[style]);
    };


    init();
};