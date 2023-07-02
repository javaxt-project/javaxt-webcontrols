if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Slider
//*****************************************************************************/
/**
 *   Basic horizontal slide control. Can be used as a range slider, play
 *   control, etc. Supports touch devices. Credit:
 *   http://css3wizardry.com/2010/09/14/range-slider-with-css-and-javascript/
 *
 ******************************************************************************/

javaxt.dhtml.Slider = function(parent, config) {

    var me = this;
    var defaultConfig = {

      /** Initial value for the slider
       */
        value: 0,

      /** If true, the slider will be disabled when it is initialized. The
       *  slider can be enabled and disabled using the enable() and disable()
       *  methods.
       */
        disabled: false,


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {
            groove: "sliderGrove",
            handle: "sliderHandle"
        }
    };


    var handle, slider, mask;
    var value; //number - leave undefined initially

    var sliderHeight = 0;
    var handleWidth = 0;
    var handleHeight = 0;
    var xOffset = 0;
    var yOffset = 0;


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


      //Create slider div
        slider = createElement('div', parent, config.style.groove);
        slider.style.position = "relative";
        slider.style.padding = "0px"; //padding inside the grove can throw off height calc
        slider.style.width = '100%';
        me.el = slider;


      //Add slider control
        handle = createElement('div', slider, config.style.handle);
        handle.style.position = "absolute";


        onRender(slider, function(){

            var handleRect = javaxt.dhtml.utils.getRect(handle);
            var sliderRect = javaxt.dhtml.utils.getRect(slider);


            handleWidth = handleRect.width;
            handleHeight = handleRect.height;
            var sliderWidth = getWidth(slider);
            sliderHeight = sliderRect.height;

            xOffset = -(handleWidth/2);
            yOffset = -(handleHeight/2) + (sliderHeight/2);

            updateSlider(0, true);
            handle.style.left = xOffset + 'px';
            handle.style.top = yOffset + 'px';




            var top = yOffset; //-6;
            Drag.init(handle, null, 0, sliderWidth-handleWidth, top, top);


            handle.onDrag = function() {
                updateSlider(Drag.x);
                me.onDrag(me.getValue());
            };

            handle.onDragEnd = function() {

            };


          //Bind to 'touchmove' events (touch devices only)
            handle.addEventListener('touchmove', function(event) {
                event.preventDefault();
                var touch = event.touches[0];
                var x = touch.pageX - this.parentNode.offsetLeft;
                if (x<0) x = 0;
                if (x>(sliderWidth-(handleWidth))) x = (sliderWidth-(handleWidth));
                this.style.left = x + 'px';

                updateSlider(x);
                me.onDrag(me.getValue());
            }, false);


            if (config.disabled===true) me.disable();

            me.setValue(config.value, true);
            me.onRender();
        });
    };


  //**************************************************************************
  //** enable
  //**************************************************************************
  /** Used to enable the slider.
   */
    this.enable = function(){
        var outerDiv = me.el;
        outerDiv.style.opacity = "";
        if (mask) mask.style.visibility = "hidden";
    };


  //**************************************************************************
  //** disable
  //**************************************************************************
  /** Used to disable the slider.
   */
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
            mask.style.zIndex = 1;
            mask.style.width = "100%";
            mask.style.height = handleHeight + "px";
            mask.style.top = yOffset + "px";
            mask.style.left = -(handleWidth/2) + "px";
            var m2 = mask.cloneNode();
            m2.style.top = "";
            m2.style.left = "";
            m2.style.right = -(handleWidth/2) + "px";
            mask.appendChild(m2);

            outerDiv.insertBefore(mask, outerDiv.firstChild);
        }
    };


  //**************************************************************************
  //** isEnabled
  //**************************************************************************
  /** Returns true if the slider is enabled.
   */
    this.isEnabled = function(){
        return !me.isDisabled();
    };


  //**************************************************************************
  //** isDisabled
  //**************************************************************************
  /** Returns true if the slider is disabled.
   */
    this.isDisabled = function(){
        if (mask){
            if (mask.style.visibility !== "hidden") return true;
        }
        return false;
    };


  //**************************************************************************
  //** onRender
  //**************************************************************************
  /** Called after the slider has been added to the DOM
   */
    this.onRender = function(){};


  //**************************************************************************
  //** onDrag
  //**************************************************************************
  /** Called whenever the slider handle is dragged by the user.
   */
    this.onDrag = function(val){};


  //**************************************************************************
  //** onChange
  //**************************************************************************
  /** Called whenever the position of the slider handle has changed.
   */
    this.onChange = function(val){};


  //**************************************************************************
  //** getValue
  //**************************************************************************
  /** Returns the value of the slider.
   *  @param returnPercentage Optional. If true, returns a percentage value.
   *  Otherwise, returns the current position of the slider in pixels.
   */
    this.getValue = function(returnPercentage){
        var w = me.getWidth();

        var val = value;
        if (val>=(w-(handleWidth/2))) val = w;

        if (returnPercentage===true){
            var p = Math.round((val/w) * 100) / 100;
            if (p>1) p = 1;
            if (p<0) p = 0;
            return p;
        }
        else{
            return val;
        }
    };


  //**************************************************************************
  //** getWidth
  //**************************************************************************
  /** Returns the width of the slider. This, together with the getValue()
   *  method, can be used to compute a percentage value.
   */
    this.getWidth = function(){
        return getWidth(slider)-(handleWidth/2);
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
  /** Used to set the position of the slider.
   *  @param x Accepts a number representing pixels from the left or a string
   *  representing a percentage value (e.g. '50%')
   *  @param silent If true, will not fire the onChange event
   */
    this.setValue = function(x, silent){

        if (javaxt.dhtml.utils.isString(x)){
            if (x.lastIndexOf("%")===x.length-1){
                x = parseInt(x.substring(0,x.length-1));
                if (isNaN(x) || x<0 || x>100) return;
                x = me.getWidth() * (x/100);
            }
        }

        if (javaxt.dhtml.utils.isNumber(x)){
            x = parseFloat(x);
        }
        else {
            return;
        }

        handle.style.left = (x-(handleWidth/2)) + 'px';
        updateSlider(x, silent);
    };


  //**************************************************************************
  //** getStyle
  //**************************************************************************
  /** Returns the computed style for a given element.
   */
    var getStyle = function(element){
        return document.defaultView.getComputedStyle(element, null);
    };


  //**************************************************************************
  //** getProperty
  //**************************************************************************
    var getProperty = function(style, property){
        return style.getPropertyValue(property.toLowerCase());
    };


  //**************************************************************************
  //** updateSlider
  //**************************************************************************
  /** Updates the background of the slider and fires the onChange event.
   *  @param silent If true, will not fire the onChange event
   */
    var updateSlider = function(x, silent){
        if (x===value) return;

        value = x;

        var sz = (x+(handleWidth/2)) + "px " + sliderHeight + "px, 100% " + sliderHeight + "px";
        slider.style.MozBackgroundSize = sz; //-moz-background-size
        slider.style.backgroundSize = sz; //background-size

        if (silent!==true) me.onChange(value);
    };


  //**************************************************************************
  //** getWidth
  //**************************************************************************
    var getWidth = function(slider){
        var style = getStyle(slider);
        var sliderWidth = parseInt(getProperty(style, "width"));
        var padding = parseInt(getProperty(style, "padding-right"));
        var border = parseInt(getProperty(style, "border-right-width"));
        sliderWidth -= padding;
        sliderWidth -= border;
        return sliderWidth;
    };



  //**************************************************************************
  //** Drag
  //**************************************************************************
  /** Class used to manage the slider. */

    var Drag = {

        // The current element being dragged.
        obj: null,

        // The initalization function for the object to be dragged.
        // elem is an element to use as a handle while dragging (optional).
        // elemParent is the element to be dragged, if not specified,
        // the handle will be the element dragged.
        // minX, maxX, minY, maxY  are the min and max coordinates
        // allowed for the element while dragging.
        // bSwapHorzRef will toggle the horizontal coordinate system from referencing
        // the left of the element to the right of the element.
        // bSwapVertRef will toggle the vertical coordinate system from referencing
        // the top of the element to the bottom of the element.
        init: function(elem, elemParent, minX, maxX, minY, maxY, bSwapHorzRef, bSwapVertRef) {

            // Watch for the drag event to start.
            elem.onmousedown = Drag.start;
            // Figure out which coordinate system is being used.
            elem.hmode = bSwapHorzRef ? false : true ;
            elem.vmode = bSwapVertRef ? false : true ;
            // Figure out which element is acting as the draggable "handle."
            elem.root = elemParent && elemParent != null ? elemParent : elem ;

            var style = getStyle(elem.root);

            // Initalize the specified coordinate system.
            // In order to keep track of the position of the dragged element,
            // we need to query the inline position values.
            // Therefore we query the element's style properties
            // to get those values and attach them inline on the element.
            if (elem.hmode && isNaN(parseInt(elem.root.style.left ))) {
               elem.root.style.left = getProperty(style, "left");
            }
            if (elem.vmode && isNaN(parseInt(elem.root.style.top ))) {
               elem.root.style.top = getProperty(style, "top");
            }
            if (!elem.hmode && isNaN(parseInt(elem.root.style.right ))) {
               elem.root.style.right = getProperty(style, "right");
            }
            if (!elem.vmode && isNaN(parseInt(elem.root.style.bottom))) {
               elem.root.style.bottom = getProperty(style, "bottom");
            }
            // Look to see if the user provided min/max x/y coordinates.
            elem.minX = typeof minX != 'undefined' ? minX : null;
            elem.minY = typeof minY != 'undefined' ? minY : null;
            elem.maxX = typeof maxX != 'undefined' ? maxX : null;
            elem.maxY = typeof maxY != 'undefined' ? maxY : null;

            // Add methods for user-defined functions.
            elem.root.onDragStart = new Function();
            elem.root.onDragEnd  = new Function();
            // The following will fire continuously while the element
            // is being dragged. Useful if you want to create a slider that
            // can update some type of data as it is being dragged.
            elem.root.onDrag = new Function();
        },

        start: function(e) {
            // Figure out which object is being dragged.
            var elem = Drag.obj = this;
            // Normalize the event object.
            e = Drag.fixE(e);
            // Get the current x and y coordinates.
            Drag.y = parseInt(elem.vmode ? elem.root.style.top  : elem.root.style.bottom);
            Drag.x = parseInt(elem.hmode ? elem.root.style.left : elem.root.style.right );
            // Call the user's function with the current x and y coordinates.
            elem.root.onDragStart(Drag.x, Drag.y);
            // Remember the starting mouse position.
            elem.lastMouseX = e.clientX;
            elem.lastMouseY = e.clientY;
            // Do the following if the CSS coordinate system is being used.
            if (elem.hmode) {
                    // Set the min and max coordiantes, where applicable.
                    if (elem.minX != null) elem.minMouseX    = e.clientX - Drag.x + elem.minX;
                    if (elem.maxX != null) elem.maxMouseX    = elem.minMouseX + elem.maxX - elem.minX;
            // Otherwise, use a traditional mathematical coordinate system.
            } else {
                    if (elem.minX != null) elem.maxMouseX = -elem.minX + e.clientX + Drag.x;
                    if (elem.maxX != null) elem.minMouseX = -elem.maxX + e.clientX + Drag.x;
            }
            // Do the following if the CSS coordinate system is being used.
            if (elem.vmode) {
                    // Set the min and max coordiantes, where applicable.
                    if (elem.minY != null) elem.minMouseY    = e.clientY - Drag.y + elem.minY;
                    if (elem.maxY != null) elem.maxMouseY    = elem.minMouseY + elem.maxY - elem.minY;
            // Otherwise, we're using a traditional mathematical coordinate system.
            } else {
                    if (elem.minY != null) elem.maxMouseY = -elem.minY + e.clientY + Drag.y;
                    if (elem.maxY != null) elem.minMouseY = -elem.maxY + e.clientY + Drag.y;
            }
            // Watch for "drag" and "end" events.
            document.onmousemove = Drag.drag;
            document.onmouseup = Drag.end;
            return false;
        },

        // A function to watch for all movements of the mouse during the drag event.
        drag: function(e) {
            // Normalize the event object.
            e = Drag.fixE(e);
            // Get our reference to the element being dragged.
            var elem = Drag.obj;
            // Get the position of the mouse within the window.
            var ey = e.clientY;
            var ex = e.clientX;
            // Get the current x and y coordinates.
            Drag.y = parseInt(elem.vmode ? elem.root.style.top  : elem.root.style.bottom);
            Drag.x = parseInt(elem.hmode ? elem.root.style.left : elem.root.style.right );
            var nx, ny;
            // If a minimum X position was set, make sure it doesn't go past that.
            if (elem.minX != null) ex = elem.hmode ?
                    Math.max(ex, elem.minMouseX) : Math.min(ex, elem.maxMouseX);
            // If a maximum X position was set, make sure it doesn't go past that.
            if (elem.maxX != null) ex = elem.hmode ?
                    Math.min(ex, elem.maxMouseX) : Math.max(ex, elem.minMouseX);
            // If a minimum Y position was set, make sure it doesn't go past that.
            if (elem.minY != null) ey = elem.vmode ?
                    Math.max(ey, elem.minMouseY) : Math.min(ey, elem.maxMouseY);
            // If a maximum Y position was set, make sure it doesn't go past that.
            if (elem.maxY != null) ey = elem.vmode ?
                    Math.min(ey, elem.maxMouseY) : Math.max(ey, elem.minMouseY);
            // Figure out the newly translated x and y coordinates.
            nx = Drag.x + ((ex - elem.lastMouseX) * (elem.hmode ? 1 : -1));
            ny = Drag.y + ((ey - elem.lastMouseY) * (elem.vmode ? 1 : -1));
            // Set the new x and y coordinates onto the element.
            Drag.obj.root.style[elem.hmode ? "left" : "right"] = nx + "px";
            Drag.obj.root.style[elem.vmode ? "top" : "bottom"] = ny + "px";
            // Remember  the last position of the mouse.
            Drag.obj.lastMouseX = ex;
            Drag.obj.lastMouseY = ey;
            // Call the user's onDrag function with the current x and y coordinates.
            Drag.obj.root.onDrag(nx, ny);
            return false;
        },

        // Function that handles the end of a drag event.
        end: function() {
            // No longer watch for mouse events (as the drag is done).
            document.onmousemove = null;
            document.onmouseup = null;
            // Call our special onDragEnd function with the x and y coordinates
            // of the element at the end of the drag event.
            Drag.obj.root.onDragEnd(
                    parseInt(Drag.obj.root.style[Drag.obj.hmode ? "left" : "right"]),
                    parseInt(Drag.obj.root.style[Drag.obj.vmode ? "top" : "bottom"]));
            // No longer watch the object for drags.
            Drag.obj = null;
        },

        // A function for normalizing the event object.
        fixE: function(e) {
            // If the element's properties aren't set, get the values from the equivalent offset properties.
            if (typeof e.elemX == 'undefined') e.elemX = e.offsetX;
            if (typeof e.elemY == 'undefined') e.elemY = e.offsetY;
            return e;
        }
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var onRender = javaxt.dhtml.utils.onRender;
    var createElement = javaxt.dhtml.utils.createElement;

    init();
};