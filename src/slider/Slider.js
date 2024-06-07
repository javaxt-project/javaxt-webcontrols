if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Slider
//*****************************************************************************/
/**
 *   Horizontal slide control. Can be used as a range slider, play control, etc.
 *   <br/>
 *   Here's a simple example of how to instantiate the slider using an existing
 *   div (DOM element) and a minimal config. See config settings for a full
 *   range of options.
 <pre>
    var slider = new javaxt.dhtml.Slider(div, {
        units: "percent"
    });
 </pre>
 *   Once the slider is instantiated you can call any of the public methods.
 *   You can also add event listeners by overriding any of the public "on" or
 *   "before" methods like this:
 <pre>
    slider.onChange = function(value){
        console.log(Math.round(value)+"%");
    };
    slider.setValue("50%");
</pre>
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


      /** Used to define the unit of measure for values returned by the
       *  getValue(), onChange(), and onDrag() events. Options are "pixels"
       *  (default) and "percent".
       */
        units: "pixels",


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {
            groove: {
                position: "relative",
                display: "inline-block",

                backgroundColor: "#fff",
                backgroundImage: "linear-gradient(#4ea7ff, #6d72a5)",
                backgroundRepeat: "no-repeat",

                height: "9px",
                border: "1px solid #dcdcdc",
                borderRadius: "4px"
            },
            handle: {
                position: "absolute",
                display: "inline-block",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "#dcdcdc",
                backgroundImage: "linear-gradient(#aaa, #ddd, #ccc)"
            }
        }
    };


    var isRendered = false;
    var handle, slider, mask;
    var value; //number - leave undefined initially

    var sliderHeight = 0;
    var handleWidth = 0;
    var handleHeight = 0;


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
            sliderHeight = sliderRect.height;


            updateSlider(0, true);
            handle.style.left = -(handleWidth/2) + 'px';
            handle.style.top = (-(handleHeight/2) + (sliderHeight/2)) + 'px';


            var xOffset = 0;

            initDrag(handle, {
                onDragStart: function(mouseX, mouseY){
                    sliderRect = javaxt.dhtml.utils.getRect(slider);
                    handleRect = javaxt.dhtml.utils.getRect(handle);
                    xOffset = mouseX-handleRect.left;  //pixels from left side of handle
                },
                onDrag: function(mouseX, mouseY){

                    var w2 = handleWidth/2;
                    var minX = -w2;
                    var maxX = sliderRect.width-w2;


                    var x = (mouseX-sliderRect.left)-xOffset;
                    if (x<minX) x = minX;
                    else if (x>maxX) x = maxX;
                    this.style.left = x + 'px';


                  //Update the slider
                    var val = x+w2;
                    updateSlider(val);


                  //Fire the onDrag event
                    if (config.units==="percent") val = (value/sliderRect.width) * 100;
                    me.onDrag(val);
                },
                onDragEnd: function(){
                    this.style.cursor = 'default';
                }
            });


            if (config.disabled===true) me.disable();

            isRendered = true;
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

            mask = createElement('div');
            mask.setAttribute("desc", "mask");
            mask.style.position = "absolute";
            mask.style.zIndex = 1;
            mask.style.width = "100%";
            mask.style.height = handleHeight + "px";
            mask.style.top = handle.style.top;
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
   */
    this.getValue = function(){

        var returnPercentage =
            (arguments.length>0 && arguments[0]===true) ||
            config.units==="percent";

        if (returnPercentage===true){
            var w = me.getWidth();
            var p = (value/w) * 100;
            return p;
        }
        else{
            return value;
        }
    };


  //**************************************************************************
  //** getPosition
  //**************************************************************************
  /** Returns the current position of the slider, in pixels.
   */
    this.getPosition = function(){
        return value;
    };


  //**************************************************************************
  //** getWidth
  //**************************************************************************
  /** Returns the width of the slider, in pixels.
   */
    this.getWidth = function(){
        return javaxt.dhtml.utils.getRect(slider).width;
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
  /** Used to set the position of the slider.
   *  @param x A number or a string representing a percentage value (e.g. '50%').
   *  If a number is provided and the "units" config is set to "percent", then
   *  the number will be interpreted as a percent value from 0-100. Otherwise,
   *  the number will be interpreted as pixels from the left of the slider.
   *  @param silent If true, will not fire the onChange event
   */
    this.setValue = function(x, silent){

        if (!isRendered){
            config.value = x;
            return;
        }



        var setValue = function(x){
            handle.style.left = (x-(handleWidth/2)) + 'px';
            updateSlider(x, silent);
        };

        if (javaxt.dhtml.utils.isString(x)){
            if (x.lastIndexOf("%")===x.length-1){
                x = parseFloat(x.substring(0,x.length-1));
                if (isNaN(x) || x<0 || x>100) return;
                x = me.getWidth() * (x/100);
                setValue(x);
            }
        }
        else{
            x = parseFloat(x+"");
            if (x<0) return;
            if (config.units==="percent"){
                if (x>100) return;
                x = me.getWidth() * (x/100);
            }
            setValue(x);
        }

    };


  //**************************************************************************
  //** updateSlider
  //**************************************************************************
  /** Updates the background of the slider and fires the onChange event.
   *  @param x Pixels from the left side of the slider
   *  @param silent If true, will not fire the onChange event
   */
    var updateSlider = function(x, silent){
        if (x===value) return;
        value = x;


      //Update the position of the background image
        var w = me.getWidth();
        var p = (x/w)*100;
        var sz = p + "% auto, 100% auto";
        slider.style.MozBackgroundSize = sz; //-moz-background-size
        slider.style.backgroundSize = sz; //background-size


      //Fire onChange event as needed
        if (silent===true) return;
        var val = value;
        if (config.units==="percent") val = p;
        me.onChange(val);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var initDrag = javaxt.dhtml.utils.initDrag;
    var onRender = javaxt.dhtml.utils.onRender;
    var merge = javaxt.dhtml.utils.merge;


    init();
};