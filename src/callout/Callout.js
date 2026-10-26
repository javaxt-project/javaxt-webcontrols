if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};


//******************************************************************************
//**  Callout Class
//******************************************************************************
/**
 *   Used to create simple tooltip/popup boxes with an arrow.
 *
 ******************************************************************************/

javaxt.dhtml.Callout = function(parent, config) {
    this.className = "javaxt.dhtml.Callout";

    var me = this;
    var div, innerDiv, callout, notch, notchBorder;
    var opening = false;

    var defaultConfig = {

        position: "absolute",


      /** If true, the callout will hide itself when the user clicks (or
       *  touches) outside of it, or when the window is resized.
       */
        autoHide: true,


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {

            panel: {
                border: "1px solid #c5d9e8",
                backgroundColor: "#eef4f9",
                borderRadius: "6px",
                boxShadow: "0 12px 14px 0 rgba(0, 0, 0, 0.2), 0 13px 20px 0 rgba(0, 0, 0, 0.2)"
            },

            arrow: {

              //Only backgroundColor, borderColor, width, height, and padding
              //are considered. All other properties are ignored.
                borderColor: "#c5d9e8",
                backgroundColor: "#eef4f9",
                width: "10px",
                height: "10px",
                padding: "10px"
            }

        }
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;




      //Create outer div
        div = createElement("div", parent, "javaxt-callout");
        if (config.position==="absolute"){
            div.style.display = "none";
            div.style.position = "absolute";
            div.style.top = div.style.left = 0;
        }
        me.el = div;


      //Create callout box
        callout = createElement("div", div, config.style.panel);
        callout.style.position = "relative";
        callout.style.margin = 0;
        callout.style.padding = 0;
        callout.style.borderWidth = "1px"; //notch assumes the border is 1px. See showAt() method...



      //Create content div
        innerDiv = createElement("div", callout, {
            width: "100%",
            height: "100%"
        });



      //Update arrow style config
        config.arrow = getArrowStyle();



      //Create notch (triangle)
        notch = createElement("b");
        notch.setAttribute("desc","notch");
        notch.style.position = "absolute";
        notch.style.top=0;
        notch.style.left=0;
        notch.style.margin=0;
        notch.style.padding=0;
        notch.style.width=0;
        notch.style.height=0;
        notch.style.fontSize=0;
        notch.style.lineHeight=0;



      //Create border for the notch
        notchBorder = createElement("b", div);
        notchBorder.setAttribute("desc","notchBorder");
        notchBorder.style.position="absolute";
        notchBorder.style.top=0;
        notchBorder.style.left=0;
        notchBorder.style.margin=0;
        notchBorder.style.padding=0;
        notchBorder.style.width=0;
        notchBorder.style.height=0;
        notchBorder.style.fontSize=0;
        notchBorder.style.lineHeight=0;


        // ie6 transparent fix
        //_border-right-color: pink;
        //_border-left-color: pink;
        //_filter: chroma(color=pink);



        div.appendChild(notch);



      //Add event listeners used to hide the callout automatically
        if (config.position==="absolute" && config.autoHide!==false){

            var onresize = function(e){
                autoHide(e);
            };

            var onclick = function(e){
                var x = e.clientX;
                var y = e.clientY;
                hideIfOutside(x, y, e);
            };

            var ontouchstart = function(e){
                var x = e.changedTouches[0].pageX;
                var y = e.changedTouches[0].pageY;
                hideIfOutside(x, y, e);
            };


            if (document.addEventListener) { // For all major browsers, except IE 8 and earlier
                document.addEventListener("click", onclick, true);
                document.addEventListener("touchstart", ontouchstart);
                window.addEventListener("resize", onresize);
            }
            else if (document.attachEvent) { // For IE 8 and earlier versions
                document.attachEvent("onclick", onclick);
                document.attachEvent("ontouchstart", ontouchstart);
                window.attachEvent("onresize", onresize);
            }
        }
    };


  //**************************************************************************
  //** getInnerDiv
  //**************************************************************************
  /** Returns the content div inside the callout that can be populated with
   *  text, html, menu buttons, etc.
   */
    this.getInnerDiv = function(){
        return innerDiv;
    };


  //**************************************************************************
  //** getSize
  //**************************************************************************
  /** Returns the width and height of the callout.
   */
    this.getSize = function(){
        var size;

        if (div.style.display === 'none'){

          //Measure the div in the top left corner (see showAt)
            var left = div.style.left;
            var top = div.style.top;
            div.style.left = div.style.top = "0px";

            div.style.visibility = 'hidden';
            div.style.display = 'block';
            size = {
                width: div.offsetWidth,
                height: div.offsetHeight
            };
            div.style.visibility = '';
            div.style.display = 'none';

            div.style.left = left;
            div.style.top = top;
        }
        else{
            size = {
                width: div.offsetWidth,
                height: div.offsetHeight
            };
        }
        return size;
    };


  //**************************************************************************
  //** show
  //**************************************************************************
  /** Used to render the callout.
   */
    this.show = function(animation){
        opening = true;

        var callback = function(){
            div.style.zIndex = getNextHighestZindex();
            div.style.display = 'block';
            me.onShow();

            setTimeout(function() {
                opening = false;
            }, 500);
        };

        if (animation){
            animation.apply(me, [div, callback]);
        }
        else{
            callback();
        }
    };


  //**************************************************************************
  //** showAt
  //**************************************************************************
  /** Used to render the callout at a specific coordinate. The tip of the
   *  arrow associated with the callout will appear at the given coordinate.
   *
   *  @param position Where to place the callout box relative to the given
   *  coordinate. Options include left, right, above, and below.
   *
   *  @param align Options include left, right, center if the "position" is
   *  above or below. Otherwise, options are top, bottom, or middle.
   */
    this.showAt = function(x, y, position, align, animation){
        opening = true;


      //Hack to get div width/height BEFORE making the div visible
        div.style.visibility = 'hidden';
        div.style.display = 'block';
        div.style.left = div.style.top = "0px";
        var width = div.offsetWidth;


      //Reset the offset of the callout box within the div. Each position sets
      //the offset it needs (e.g. "right" moves the box to the right to make
      //room for the arrow), so don't carry it over from the last showAt().
        callout.style.left = callout.style.top = "0px";


      //Update arrow style config
        config.arrow = getArrowStyle();


        var backgroundColor = config.arrow.backgroundColor;
        var borderColor = config.arrow.borderColor;


        var notchSize = Math.max(config.arrow.width, config.arrow.height);
        var notchOffset = 0;
        var notchCenter = notchSize;
        var notchHeight = notchSize;



        var halign = function(){
            if (align==="left"){
                notchOffset = config.arrow.paddingLeft;
                div.style.left = (x-(notchOffset+notchCenter)) + "px";
                notch.style.left=notchBorder.style.left=notchOffset + "px";
            }
            else if (align==="right"){
                notchOffset = config.arrow.paddingRight;
                div.style.left = ((x-width) + (notchOffset+notchCenter)) + "px";
                notch.style.left=notchBorder.style.left= (width-(notchOffset+(notchCenter*2))) + "px";
            }
            else if (align==="center" || align==="middle"){
                var center = width/2;
                div.style.left = (x-center) + "px";
                notch.style.left=notchBorder.style.left= (center-notchCenter) + "px";
            }
            else{
                return;
            }
        };


      //Note that valign() is called after the div is in its final horizontal
      //position (see the "left" and "right" positions below). The height of
      //the div depends on its width (e.g. text wraps when the div is near the
      //right edge of the window) so it is measured here, not in advance.
        var valign = function(){
            callout.style.top = "0px";
            var height = div.offsetHeight;

            if (align==="top"){
                notchOffset = config.arrow.paddingTop;
                div.style.top = (y-(notchOffset+notchCenter)) + "px";
                notch.style.top=notchBorder.style.top=notchOffset + "px";
            }
            else if (align==="bottom"){
                notchOffset = config.arrow.paddingBottom;
                div.style.top = ((y-height) + (notchOffset+notchCenter)) + "px";
                notch.style.top = notchBorder.style.top = (height-(notchOffset+(notchCenter*2))) + "px";
            }
            else if (align==="middle" || align==="center"){
                var center = height/2;
                div.style.top = (y-center) + "px";
                notch.style.top = notchBorder.style.top = (center-notchCenter) + "px";
            }
            else{
                return;
            }
        };


      //Update notch style align elements. Notch style is based on a CSS triangle
      //described here: https://css-tricks.com/snippets/css/css-triangle/
        if (position==="above"){

          //Update notch style so the arrow is pointing down
            notch.style.borderTop=notchBorder.style.borderTop=notchSize+"px solid " + backgroundColor;
            notch.style.borderLeft=notchBorder.style.borderLeft=notchSize+"px solid transparent";
            notch.style.borderRight=notchBorder.style.borderRight=notchSize+"px solid transparent";
            notch.style.borderBottom=notchBorder.style.borderBottom=0;
            notchBorder.style.borderTopColor=borderColor; //<--Make sure this appears after all other border definitions!


          //Set horizontal alignment of the notch and div. Do this first: the
          //height of the div depends on its width, which depends on where the
          //div is (e.g. text wraps when the div is near the right edge).
            div.style.left = x + "px"; //in case the align is invalid
            halign();


          //Set vertical position of the notch, div, and callout
            var height = div.offsetHeight;
            div.style.top = ((y-height)-notchHeight) + "px";
            callout.style.top = "0px";
            notch.style.top = (height-1) + "px"; //-1 for the border width
            notchBorder.style.top = height + "px";
        }
        else if (position==="below"){

          //Update notch style so the arrow is pointing up
            notch.style.borderTop=notchBorder.style.borderTop=0;
            notch.style.borderLeft=notchBorder.style.borderLeft=notchSize+"px solid transparent";
            notch.style.borderRight=notchBorder.style.borderRight=notchSize+"px solid transparent";
            notch.style.borderBottom=notchBorder.style.borderBottom=notchSize+"px solid " + backgroundColor;
            notchBorder.style.borderBottomColor=borderColor; //<--Make sure this appears after all other border definitions!


          //Set vertical position of the notch, div, and callout
            div.style.left = x + "px";
            div.style.top = y + "px";
            callout.style.top = notchHeight + "px";
            notch.style.top = "1px"; //+1 for border width
            notchBorder.style.top = "0px";


          //Set horizontal position of the notch and div
            halign();
        }
        else if (position==="left"){

          //Update notch style so the arrow is pointing right
            notch.style.borderTop=notchBorder.style.borderTop=notchSize+"px solid transparent";
            notch.style.borderLeft=notchBorder.style.borderLeft=notchSize+"px solid " + backgroundColor;
            notch.style.borderRight=notchBorder.style.borderRight=0;
            notch.style.borderBottom=notchBorder.style.borderBottom=notchSize+"px solid transparent";
            notchBorder.style.borderLeftColor=borderColor; //<--Make sure this appears after all other border definitions!


          //Set horizontal position
            div.style.left = (x-(width+notchHeight)) + "px";
            callout.style.left = "0px";
            notch.style.left = (width-1) + "px";
            notchBorder.style.left = width + "px";


          //Set vertical position of the notch and div
            valign();
        }
        else if (position==="right"){


          //Update notch style so the arrow is pointing left
            notch.style.borderTop=notchBorder.style.borderTop=notchSize+"px solid transparent";
            notch.style.borderLeft=notchBorder.style.borderLeft=0;
            notch.style.borderRight=notchBorder.style.borderRight=notchSize+"px solid " + backgroundColor;
            notch.style.borderBottom=notchBorder.style.borderBottom=notchSize+"px solid transparent";
            notchBorder.style.borderRightColor=borderColor; //<--Make sure this appears after all other border definitions!


          //Set horizontal position
            div.style.left = x + "px";
            callout.style.left = notchHeight + "px";
            notch.style.left = "1px";
            notchBorder.style.left = "0px";


          //Set vertical position of the notch and div
            valign();
        }
        else{
            return;
        }


        div.style.visibility = "";

        me.show(animation);
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
  /** Used to hide the callout.
   *  @param silent If true, hides the callout without calling beforeHide() or
   *  onHide().
   */
    this.hide = function(silent){
        if (silent!==true && me.beforeHide()===false) return;
        var e; //leave undefined
        hide(e, silent);
    };


  //**************************************************************************
  //** isVisible
  //**************************************************************************
  /** Returns true of the callout is visible.
   */
    this.isVisible = function(){
        return (div.style.display !== 'none');
    };


  //**************************************************************************
  //** onShow
  //**************************************************************************
  /** Called whenever the callout is made visible.
   */
    this.onShow = function(){};


  //**************************************************************************
  //** onHide
  //**************************************************************************
  /** Called whenever the callout is hidden.
   *  @param e The click, touchstart, or resize event. May be undefined.
   */
    this.onHide = function(e){};


  //**************************************************************************
  //** beforeHide
  //**************************************************************************
  /** Called immediately before the callout is hidden. Return false to keep
   *  the callout open. Example:
   <pre>
    callout.beforeHide = function(e){
        if (e && e.type==="click" && button.contains(e.target)) return false;
    };
   </pre>
   *  @param e The click, touchstart, or resize event that caused the callout
   *  to hide itself. Undefined when called from the hide() method.
   */
    this.beforeHide = function(e){};



  //**************************************************************************
  //** hideIfOutside
  //**************************************************************************
    var hideIfOutside = function(x, y, e){

        if (opening) return;

        if (div.style.display === 'block'){

            var x1 = parseInt(div.style.left);
            var x2 = x1+div.offsetWidth;
            var y1 = parseInt(div.style.top);
            var y2 = y1+div.offsetHeight;

            if (x<x1 || x>x2){
                autoHide(e);
            }
            else{
                if (y<y1 || y>y2){
                    autoHide(e);
                }
            }
        }
    };


  //**************************************************************************
  //** autoHide
  //**************************************************************************
  /** Hides the callout in response to an event (e.g. a click outside of the
   *  callout or a window resize).
   */
    var autoHide = function(e){
        if (div.style.display === 'none') return;
        if (me.beforeHide(e)===false) return;
        hide(e);
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
    var hide = function(e, silent){
        div.style.display = 'none';
        opening = false;
        if (silent===true) return;
        me.onHide(e);
    };


  //**************************************************************************
  //** getArrowStyle
  //**************************************************************************
  /** Reads the arrow's colors, padding, and size from config.style.arrow by
   *  rendering a temporary element and inspecting its computed style. This is
   *  called both at construction and each time the callout is opened, so the
   *  arrow reflects the current theme even when the stylesheet is swapped at
   *  runtime (config.style.arrow may be a CSS class whose colors change).
   */
    var getArrowStyle = function(){

      //Create temporary div to get arrow style
        var temp = createElement("div", "javaxt-callout");
        temp.style.position = "absolute";
        temp.style.visibility = 'hidden';
        temp.style.display = 'block';
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(temp);
        temp = createElement("div", temp, config.style.arrow);
        var style = getStyle(temp);
        var getStyleValue = function(prop){

            var _getStyle = function(prop){
                if (style.getPropertyValue){
                    var val = style.getPropertyValue(prop);
                    if (val && val.length>0) return val;
                    prop = prop.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
                    return style.getPropertyValue(prop);
                }
                else{
                    return style[prop];
                }
            };

            if (prop instanceof Array){
                var arr = prop;
                for (var i=0; i<arr.length; i++){
                    var val = _getStyle(arr[i]);
                    if (val && val.length>0){
                        return val;
                    }
                }
            }
            else{
                return _getStyle(prop);
            }

        };

        var arrow = {
            backgroundColor: getStyleValue("backgroundColor"),
            borderColor: getStyleValue(["borderColor", "borderLeftColor", "borderRightColor", "borderTopColor", "borderBottomColor"]),
            paddingTop: parseInt(getStyleValue("paddingTop")),
            paddingBottom: parseInt(getStyleValue("paddingBottom")),
            paddingLeft: parseInt(getStyleValue("paddingLeft")),
            paddingRight: parseInt(getStyleValue("paddingRight"))
        };
        temp.style.border = 0;
        temp.style.padding = 0;
        temp.style.margin = 0;
        arrow.width = temp.offsetWidth;
        arrow.height = temp.offsetHeight;
        body.removeChild(temp.parentNode);
        temp = null;

        return arrow;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var getNextHighestZindex = javaxt.dhtml.utils.getNextHighestZindex;
    var createElement = javaxt.dhtml.utils.createElement;
    var getStyle = javaxt.dhtml.utils.getStyle;
    var merge = javaxt.dhtml.utils.merge;


    init();
};