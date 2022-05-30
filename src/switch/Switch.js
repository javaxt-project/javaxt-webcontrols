if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Slider
//*****************************************************************************/
/**
 *   Basic toggle switch
 *
 ******************************************************************************/

javaxt.dhtml.Switch = function(parent, config) {

    var me = this;
    var defaultConfig = {
        value: true,
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
        
        me.setValue(config.value);
        me.el = groove;
        
      //Add public show/hide methods
        addShowHide(me);
    };
    
    
  //**************************************************************************
  //** getValue
  //**************************************************************************
    this.getValue = function(){
        return value;
    };
    
    
  //**************************************************************************
  //** setValue
  //**************************************************************************
    this.setValue = function(b, silent){
        if (b===true || b===false){
            if (b===value) return;
            if (value===true){
                setStyle(groove, config.style.groove);
                setStyle(handle, config.style.handle);
                handle.style.right = "";
                handle.style.left = 0;
            }
            else{
                setStyle(groove, config.style.grooveActive);
                setStyle(handle, config.style.handleActive);
                handle.style.left = "";
                handle.style.right = 0;
            }
            value = b;
            if (silent===true){}
            else me.onChange(value);
        }
    };
    
    
  //**************************************************************************
  //** onChange
  //**************************************************************************
    this.onChange = function(){};
    
    
  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var setStyle = javaxt.dhtml.utils.setStyle;
    var addShowHide = javaxt.dhtml.utils.addShowHide;

    init();
};