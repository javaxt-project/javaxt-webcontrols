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
        valign: "middle",

        closable: true,


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



      //Populate body
        if (config.body){
            if (config.body instanceof Element){
                var p = config.body.parentNode;
                if (p) p.removeChild(config.body);
                body.appendChild(config.body);
            }
            else{
                if (typeof config.body === "string"){
                    body.innerHTML = config.body;
                }
            }
        }

      //Populate footer
        if (config.footer){
            if (config.footer instanceof Element){
                var p = config.footer.parentNode;
                if (p) p.removeChild(config.footer);
                footer.appendChild(config.footer);
            }
            else{
                if (typeof parent === "string"){
                    footer.innerHTML = config.footer;
                }
            }
        }




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
        addNoSelectRule();
        initDrag(mainDiv, dragHandle, 50);


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
        titleDiv.innerHTML = title;
    };


  //**************************************************************************
  //** onHeaderClick
  //**************************************************************************
  /** Override to capture this header click events.
   */
    this.onHeaderClick = function(){};


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


        visible = true;

        me.onOpen();
    };



  //**************************************************************************
  //** hide
  //**************************************************************************
    this.hide = this.close = function(){

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

        me.onClose();
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
  //** initDrag
  //**************************************************************************

    var initDrag = function(div, dragHandle, holdDelay){



      //This timeout, started on mousedown, triggers the beginning of a hold
        var holdStarter = null;


      //This flag indicates the user is currently holding the mouse down
        var holdActive = false;


      //OnClick
        //div.onclick = NOTHING!! not using onclick at all - onmousedown and onmouseup take care of everything


      //MouseDown
        dragHandle.onmousedown = function(e){


          //Set the holdStarter and wait for the predetermined delay, and then begin a hold
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;


              //Initiate drag
                startDrag(e);


              //Add event listeners
                if (document.addEventListener) {
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                }
                else if (document.attachEvent) {
                    document.attachEvent("onmousemove", onMouseMove);
                    document.attachEvent("onmouseup", onMouseUp);
                }

            }, holdDelay);

        };



      //MouseUp
        var onMouseUp = function(e){



          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);


                //simple click
            }

          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;

              //Remove event listeners
                if (document.removeEventListener) {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                } else if (document.detachEvent) {
                    document.detachEvent("onmousemove", onMouseMove);
                    document.detachEvent("onmouseup", onMouseUp);
                }

              //Update cursor
                dragHandle.style.cursor = 'default';


              //Remove the "javaxt-noselect" class
                var body = document.getElementsByTagName('body')[0];
                body.className = body.className.replace( /(?:^|\s)javaxt-noselect(?!\S)/g , '' );
            }
        };


        dragHandle.onmouseup = onMouseUp;



      //Start touch (similar to "onmousedown")
        dragHandle.ontouchstart = function(e) {

            e.preventDefault();
            var touch = e.touches[0];
            var x = touch.pageX;
            var y = touch.pageY;




          //Set the holdStarter and wait for the holdDelay before starting the drag
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;

              //Initiate drag
                startDrag({
                    clientX: x,
                    clientY: y
                });


              //Add "touchmove" event listener
                if (document.removeEventListener) {
                    dragHandle.addEventListener("touchmove", onTouchMove);
                }
                else if (document.detachEvent) {
                    dragHandle.attachEvent("ontouchmove", onTouchMove);
                }


            }, holdDelay);
        };

      //End touch (similar to "onmouseup")
        dragHandle.ontouchend = function(e) {


          //Remove "touchmove" event listener
            if (document.removeEventListener) {
                dragHandle.removeEventListener("touchmove", onTouchMove);
            }
            else if (document.detachEvent) {
                dragHandle.detachEvent("ontouchmove", onTouchMove);
            }



          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);
                //Click Event!
            }

          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;
                //End drag!
            }

        };



        var onMouseMove = function(e){
            var x = e.clientX;
            var y = e.clientY;

            var left = (x-div.xOffset);
            if (left<0) left = 0;


            if (left+div.width>parent.offsetWidth) left=parent.offsetWidth-div.width;

            var top = (y-div.yOffset);
            if (top<0) top = 0;

            if (top+div.height>parent.offsetHeight) top=parent.offsetHeight-div.height;

            div.style.left = left + 'px';
            div.style.top = top + 'px';
        };

        var onTouchMove = function(e) {
            e.preventDefault();
            var touch = e.touches[0];
            var x = touch.pageX;
            var y = touch.pageY;

            onMouseMove({
                clientX: x,
                clientY: y
            });
        };


        var startDrag = function(e){
            var x = e.clientX;
            var y = e.clientY;

            var rect = _getRect(div);
            var xOffset = x-rect.x;
            var yOffset = y-rect.y;


            div.xOffset = xOffset;
            div.yOffset = yOffset;
            div.width = rect.width;
            div.height = rect.height;


            div.style.left = rect.x + 'px';
            div.style.top = (y-yOffset) + 'px';
            dragHandle.style.cursor = 'move';


          //Disable text selection in the entire document - very important!
            var body = document.getElementsByTagName('body')[0];
            if (!body.className.match(/(?:^|\s)javaxt-noselect(?!\S)/) ){
                body.className += (body.className.length==0 ? "" : " ") + "javaxt-noselect";
            }

        };
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var _getRect = javaxt.dhtml.utils.getRect;
    var merge = javaxt.dhtml.utils.merge;
    var getNextHighestZindex = javaxt.dhtml.utils.getNextHighestZindex;
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;
    var addNoSelectRule = function(){
        if (noselect===true) return;
        javaxt.dhtml.utils.addNoSelectRule();
        noselect = true;
    };
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };
    var addStyle = function(el, style){
        javaxt.dhtml.utils.addStyle(el, config.style[style]);
    };


    init();
};