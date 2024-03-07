if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Checkbox Class
//******************************************************************************
/**
 *   Form input that can be either checked or unchecked. The input consists of
 *   a square box with a checkmark when activated and text label.
 *
 ******************************************************************************/

javaxt.dhtml.Checkbox = function(parent, config) {
    this.className = "javaxt.dhtml.Checkbox";

    var me = this;
    var outerDiv;
    var box, check, mask, label;


    var defaultConfig = {

      /** Label for the checkbox (optional). Accepts either a string or a DOM
       *  element.
       */
        label: null,


      /** Value associated with the checkbox (optional). Note that this is
       *  different than the checkbox state. Use the isChecked() method to
       *  determine whether the checkbox is checked.
       */
        value: null,


      /** If true, the checkbox will initially render with a check. Default is
       *  false.
       */
        checked: false,


      /** If true, the component will be disabled when rendered. Default is
       *  false.
       */
        disabled: false,


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style:{

            panel: {
                display: "inline-block",
                position: "relative"
            },

            box: {
                width: "13px",
                height: "13px",
                border: "1px solid #cccccc",
                borderRadius: "3px",
                backgroundColor: "#F6F6F6",
                cursor: "pointer",
                margin: "0px",
                color: "#2b2b2b"
            },

            label: {
                fontFamily: "helvetica,arial,verdana,sans-serif",
                fontSize: "14px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                padding: "1px 0 0 5px"
            },

            check: {
                content: "",
                display: "block",
                width: "3px",
                height: "6px",
                border: "solid #ffffff",
                borderWidth: "0 2px 2px 0",
                transform: "rotate(45deg)",
                margin: "1px 0 0 4px"
            },

            select: {
                backgroundColor: "#007FFF",
                border: "1px solid #003EFF",
                color: "#FFFFFF"
            },

            disable: {
                backgroundColor: "#ffffff",
                border: "1px solid #ffffff",
                borderRadius: "3px",
                cursor: "pointer",
                opacity: "0.5"
            },

            hover: {
                backgroundColor: "#ededed"
            }
        }
    };


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


      //Create container
        outerDiv = createElement('div', parent, config.style.panel);
        if (config.display){
            console.warn(
            "The 'display' config in the javaxt.dhtml.Checkbox " +
            "class has been deprecated. Use panel style instead");
            outerDiv.style.display = config.display;
        }
        me.el = outerDiv;
        addShowHide(me);


      //Create checkbox
        if (config.label){

          //Create table with 2 columns - one for the checkbox
          //and a column for the checkbox label.
            var table = createTable(outerDiv);
            table.style.fontFamily = "inherit";
            table.style.textAlign = "inherit";
            table.style.color = "inherit";
            var tr = table.addRow();


            box = createElement('div', tr.addColumn(), config.style.box);
            label = createElement("div", tr.addColumn(), config.style.label);
            if (isElement(config.label)){
                label.appendChild(config.label);
            }
            else{
                label.innerHTML = config.label;
            }

            addEventHandlers(table);
        }
        else{

          //Create checkbox with no label
            box = createElement('div', outerDiv, config.style.box);
            addEventHandlers(box);
        }


      //Set button state
        if (config.disabled===true) me.disable();
        if (config.checked===true) me.select();
    };


  //**************************************************************************
  //** addEventHandlers
  //**************************************************************************
    var addEventHandlers = function(div){

      //Disable text selection
        div.unselectable="on";
        div.onselectstart=function(){return false;};


        div.onmousedown=function(){
            addStyle(box, "select");
            return false;
        };


      //Create onclick function
        var onclick = function(){
            if (config.sound!=null) config.sound.play();
            me.toggle();
            me.onClick(box.checked);
        };


      //Create logic to process touch events
        var touchStartTime;
        var touchEndTime;
        var x1, x2, y1, y2;
        var isTouch = false;

        div.ontouchstart = function(e) {
            isTouch = true;

            e.preventDefault();
            x1 = e.changedTouches[0].pageX;
            y1 = e.changedTouches[0].pageY;
            touchStartTime = new Date().getTime();
            touchEndTime = null;

            if (box.checked!==true){
                addStyle(box, "hover");
            }
        };

        div.ontouchend = function(e) {

            touchEndTime= new Date().getTime();
            x2 = e.changedTouches[0].pageX;
            y2 = e.changedTouches[0].pageY;

            var distance = Math.sqrt( (x2-=x1)*x2 + (y2-=y1)*y2 );
            if (distance<0) distance = -distance;
            var duration = touchEndTime - touchStartTime;

            if ((duration <= 500 && distance <= 10) || //Quick tap
                (duration > 500 && distance <= 10)) {  //Long press
                onclick();
            }
        };



      //Logic to process mouse events
        div.onclick = function(){
            if (!isTouch) onclick();
        };
        div.onmouseover = function(){

            if (box.checked!==true){
                addStyle(box, "hover");
            }

        };
        div.onmouseout = function(){

            if (box.checked!==true){
                setStyle(box, "box");
            }

        };
    };


  //**************************************************************************
  //** onClick
  //**************************************************************************
  /** Called whenever the checkbox is clicked.
   */
    this.onClick = function(checked){};


  //**************************************************************************
  //** onChange
  //**************************************************************************
  /** Called whenever the checkbox value is changed.
   */
    this.onChange = function(checked){};


  //**************************************************************************
  //** enable
  //**************************************************************************
  /** Used to enable the checkbox.
   */
    this.enable = function(){
        mask.style.visibility = "hidden";
    };


  //**************************************************************************
  //** disable
  //**************************************************************************
  /** Used to disable the checkbox.
   */
    this.disable = function(){

        if (mask){
            mask.style.visibility = "visible";
        }
        else{

            mask = createElement('div', config.style.disable);
            mask.style.position = "absolute";
            mask.style.zIndex = "1";
            mask.style.width = "100%";
            mask.style.height = "100%";

            var outerDiv = me.el;
            outerDiv.insertBefore(mask, outerDiv.firstChild);
        }
    };


  //**************************************************************************
  //** select
  //**************************************************************************
  /** Used to add a check to the checkbox.
   */
    this.select = function(silent){
        if (box.checked===true) return;
        box.checked = true;
        addStyle(box,"select");

        if (check){
            check.style.visibility = "visible";
        }
        else{
            check = createElement('div', box, config.style.check);
        }

        if (silent===true) return;
        me.onChange(true);
    };


  //**************************************************************************
  //** deselect
  //**************************************************************************
  /** Used to remove the check from the checkbox.
   */
    this.deselect = function(silent){
        if (box.checked===true){
            box.checked = false;
            setStyle(box,"box");
            check.style.visibility = "hidden";

            if (silent===true) return;
            me.onChange(false);
        }
    };


  //**************************************************************************
  //** toggle
  //**************************************************************************
  /** Used to toggle the checkbox state.
   */
    this.toggle = function(){
        if (box.checked===true){
            me.deselect();
        }
        else{
            me.select();
        }
    };


  //**************************************************************************
  //** getValue
  //**************************************************************************
  /** Returns the value associated with the checkbox. Note that this is
   *  different than the checkbox state. Use the isChecked() method to
   *  determine whether the checkbox is checked. The value is defined in
   *  the config used to instantiate this class.
   */
    this.getValue = function(){
        if (config.value==null) return me.isChecked();
        return config.value;
    };


  //**************************************************************************
  //** isChecked
  //**************************************************************************
  /** Returns true if the checkbox is checked.
   */
    this.isChecked = function(){
        return box.checked===true;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var isElement = javaxt.dhtml.utils.isElement;
    var merge = javaxt.dhtml.utils.merge;

    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };
    var addStyle = function(el, style){
        javaxt.dhtml.utils.addStyle(el, config.style[style]);
    };


    init();
};