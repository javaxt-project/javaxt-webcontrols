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
        arrowLocation: "left",
        arrowAlignment: "top",


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
  /** Creates a new instance of this class. */

    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;




      //Create outer div
        div = document.createElement("div");
        div.setAttribute("desc", me.className);
        if (config.position==="absolute"){
            div.style.display = "none";
            div.style.position = "absolute";
            div.style.top = div.style.left = 0;
        }
        parent.appendChild(div);
        me.el = div;


      //Create callout box
        callout = document.createElement("div");
        setStyle(callout, "panel");
        callout.style.position = "relative";
        callout.style.margin = 0;
        callout.style.padding = 0;
        callout.style.borderWidth = "1px"; //notch assumes the border is 1px. See showAt() method...
        div.appendChild(callout);



      //Create content div
        innerDiv = document.createElement("div");
        innerDiv.style.width="100%";
        innerDiv.style.height="100%";
        callout.appendChild(innerDiv);



      //Create temporary div to get arrow style
        var temp = document.createElement("div");
        setStyle(temp, "arrow");
        temp.style.position = "absolute";
        temp.style.visibility = 'hidden';
        temp.style.display = 'block';
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(temp);
        var style = temp.currentStyle || window.getComputedStyle(temp);
        var getStyle = function(prop){

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

        config.arrow = {
            backgroundColor: getStyle("backgroundColor"),
            borderColor: getStyle(["borderColor", "borderLeftColor", "borderRightColor", "borderTopColor", "borderBottomColor"]),
            paddingTop: parseInt(getStyle("paddingTop")),
            paddingBottom: parseInt(getStyle("paddingBottom")),
            paddingLeft: parseInt(getStyle("paddingLeft")),
            paddingRight: parseInt(getStyle("paddingRight"))
        };
        temp.style.border = 0;
        temp.style.padding = 0;
        temp.style.margin = 0;
        config.arrow.width = temp.offsetWidth;
        config.arrow.height = temp.offsetHeight;
        body.removeChild(temp);
        temp = null;



      //Create notch (triangle)
        notch = document.createElement("b");
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
        notchBorder = document.createElement("b");
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



        div.appendChild(notchBorder);
        div.appendChild(notch);



      //Add event listeners
        if (config.position==="absolute"){

            var onresize = function(){
                me.hide();
            };

            var onclick = function(e){
                var x = e.clientX;
                var y = e.clientY;
                hideIfOutside(x, y);
            };

            var ontouchstart = function(e){
                var x = e.changedTouches[0].pageX;
                var y = e.changedTouches[0].pageY;
                hideIfOutside(x, y);
            };


            if (document.addEventListener) { // For all major browsers, except IE 8 and earlier
                document.addEventListener("click", onclick);
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
  //** hideIfOutside
  //**************************************************************************
    var hideIfOutside = function(x, y){

        if (opening) return;

        if (div.style.display === 'block'){

            var x1 = parseInt(div.style.left);
            var x2 = x1+div.offsetWidth;
            var y1 = parseInt(div.style.top);
            var y2 = y1+div.offsetHeight;

            if (x<x1 || x>x2){
                me.hide();
            }
            else{
                if (y<y1 || y>y2){
                    me.hide();
                }
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
  /** Returns the width and height of the callout. */
    this.getSize = function(){
        var size;

        if (div.style.display === 'none'){
            div.style.visibility = 'hidden';
            div.style.display = 'block';
            size = {
                width: div.offsetWidth,
                height: div.offsetHeight
            };
            div.style.visibility = '';
            div.style.display = 'none';
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
    this.show = function(){
        opening = true;

        div.style.zIndex = getNextHighestZindex();
        div.style.display = 'block';
        me.onShow();

        setTimeout(function() {
            opening = false;
        }, 500);
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
    this.showAt = function(x, y, position, align){
        opening = true;


      //Hack to get div width/height BEFORE making the div visible
        div.style.visibility = 'hidden';
        div.style.display = 'block';


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
                div.style.left = ((x-div.offsetWidth) + (notchOffset+notchCenter)) + "px";
                notch.style.left=notchBorder.style.left= (div.offsetWidth-(notchOffset+(notchCenter*2))) + "px";
            }
            else if (align==="center" || align==="middle"){
                var center = div.offsetWidth/2;
                div.style.left = (x-center) + "px";
                notch.style.left=notchBorder.style.left= (center-notchCenter) + "px";
            }
            else{
                return;
            }
        };


        var valign = function(){
            callout.style.top = "0px";

            if (align==="top"){
                notchOffset = config.arrow.paddingTop;
                div.style.top = (y-(notchOffset+notchCenter)) + "px";
                notch.style.top=notchBorder.style.top=notchOffset + "px";
            }
            else if (align==="bottom"){
                notchOffset = config.arrow.paddingBottom;
                div.style.top = ((y-div.offsetWidth) + (notchOffset+notchCenter)) + "px";
                notch.style.top = notchBorder.style.top = (div.offsetHeight-(notchOffset+(notchCenter*2))) + "px";
            }
            else if (align==="middle" || align==="center"){
                var center = div.offsetHeight/2;
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


          //Set vertical position of the notch, div, and callout
            div.style.top = ((y-div.offsetHeight)-notchHeight) + "px";
            callout.style.top = "0px";
            notch.style.top = (div.offsetHeight-1) + "px"; //-1 for the border width
            notchBorder.style.top = div.offsetHeight + "px";


          //Set horizontal alignment of the notch and div
            halign();
        }
        else if (position==="below"){

          //Update notch style so the arrow is pointing up
            notch.style.borderTop=notchBorder.style.borderTop=0;
            notch.style.borderLeft=notchBorder.style.borderLeft=notchSize+"px solid transparent";
            notch.style.borderRight=notchBorder.style.borderRight=notchSize+"px solid transparent";
            notch.style.borderBottom=notchBorder.style.borderBottom=notchSize+"px solid " + backgroundColor;
            notchBorder.style.borderBottomColor=borderColor; //<--Make sure this appears after all other border definitions!


          //Set vertical position of the notch, div, and callout
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
            div.style.left = (x-(div.offsetWidth+notchHeight)) + "px";
            callout.style.left = "0px";
            notch.style.left = (div.offsetWidth-1) + "px";
            notchBorder.style.left = div.offsetWidth + "px";


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

        me.show();
    };



  //**************************************************************************
  //** hide
  //**************************************************************************
  /** Used to hide the callout. */
    this.hide = function(){
        div.style.display = 'none';
        opening = false;
        me.onHide();
    };


    this.onShow = function(){};
    this.onHide = function(){};




  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var getNextHighestZindex = javaxt.dhtml.utils.getNextHighestZindex;
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };


    init();
};
