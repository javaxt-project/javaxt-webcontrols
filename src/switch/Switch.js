if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Switch
//*****************************************************************************/
/**
 *   Basic on/off toggle switch
 *
 ******************************************************************************/

javaxt.dhtml.Switch = function(parent, config) {

    var me = this;
    var defaultConfig = {

      /** If true, the slider will be set to the on position.
       */
        value: true,

      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {
            groove: {
                backgroundColor: "#dcdcdc",
                width: "40px",
                height: "24px",
                borderRadius: "12px",
                position: "relative"
            },
            handle: {
                width: "20px",
                height: "20px",
                backgroundColor: "#fff",
                borderRadius: "10px",
                position: "absolute",
                margin: "2px",
                boxShadow: "0px 3px 4px rgba(0, 0, 0, 0.2)"
            },
            grooveActive: {
                backgroundColor: "#4bd763",
                width: "40px",
                height: "24px",
                borderRadius: "12px",
                position: "relative"
            },
            handleActive: {
                width: "20px",
                height: "20px",
                backgroundColor: "#fff",
                borderRadius: "10px",
                position: "absolute",
                margin: "2px",
                boxShadow: "0px 3px 4px rgba(0, 0, 0, 0.2)"
            }
        }
    };
    var groove, handle, value;


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


        groove = document.createElement("div");
        setStyle(groove, config.style.groove);
        parent.appendChild(groove);
        groove.onclick = function(){
            me.setValue(!me.getValue());
        };

        handle = document.createElement("div");
        setStyle(handle, config.style.handle);
        groove.appendChild(handle);
        me.setValue(config.value, true);
        me.el = groove;

      //Add public show/hide methods
        addShowHide(me);
    };


  //**************************************************************************
  //** getValue
  //**************************************************************************
  /** Returns true on the slider is set to the on/active position. Otherwise
   *  returns false.
   */
    this.getValue = function(){
        return value;
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
  /** Used to set the slider to the on or off position.
   *  @param b If true, sets the slider to the on position. Otherwise, the
   *  slider will be set to the off position.
   *  @param silent By default, this slider will fire the onChange event
   *  whenever the value is changed. When silent is set to true, the slider
   *  will NOT fire the onChange event. This parameter is optional.
   */
    this.setValue = function(b, silent){
        if (b===true || b===false){
            if (b===value) return;
            if (b===true){
                setStyle(groove, config.style.grooveActive);
                setStyle(handle, config.style.handleActive);
                handle.style.left = "";
                handle.style.right = 0;
            }
            else{
                setStyle(groove, config.style.groove);
                setStyle(handle, config.style.handle);
                handle.style.right = "";
                handle.style.left = 0;
            }
            value = b;
            if (silent===true){}
            else me.onChange(value);
        }
    };


  //**************************************************************************
  //** onChange
  //**************************************************************************
  /** Called when the input value changes
   */
    this.onChange = function(value){};


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var setStyle = javaxt.dhtml.utils.setStyle;
    var addShowHide = javaxt.dhtml.utils.addShowHide;

    init();
};