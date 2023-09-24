if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  DateInput Class
//******************************************************************************
/**
 *   Form input used to specify a date. The input consists of a text field and
 *   a button. When the user clicks on the button, a javaxt.dhtml.DatePicker
 *   will appear below the input.
 *
 ******************************************************************************/

javaxt.dhtml.DateInput = function(parent, config) {
    this.className = "javaxt.dhtml.DateInput";


    var me = this;
    var datePicker, menu, input, button, mask;
    var formatDate;

    var defaultConfig = {


      /** Initial date/value for the input. Supports both strings and dates.
       */
        date: null,


      /** If true, the calendar menu will appear whenever the text field has
       *  focus (e.g. mouse click). Default is false.
       */
        showMenuOnFocus: false,


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {

            input: {
                color: "#363636",
                fontSize: "14px",
                height: "24px",
                lineHeight: "24px",
                padding: "0px 4px",
                verticalAlign: "middle",
                transition: "border 0.2s linear 0s, box-shadow 0.2s linear 0s",
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderRight: "0 none",
                boxShadow: "0 1px 1px rgba(0, 0, 0, 0.075) inset"
            },

            button: {
                color: "#363636",
                height: "24px",
                width: "24px",
                border: "1px solid #b4b4b4",
                cursor: "pointer",

                backgroundImage: "url(data:image/png;base64,iVBORw0KGgoAAAANSUh"+
                "EUgAAABAAAAAQCAYAAAAf8/9hAAAAlklEQVQ4jWNgGAUowNvbW9PBwUEAjxJGHx"+
                "8f/dDQUB4MGV9f3+TAwMD/AQEB97y8vOSxafb392+BqrlkbGzMhSLr7++/MTAw8"+
                "D8OQ+CaYdjb21sT3flKAQEBj7AYgqHZz8+vBqsHPT09ldENCQgImIysOSAgoBZP"+
                "GGEaQpJmfIYQrRmbITj9TAg4ODgIeHp6apGleegAAME5Y+rCcN+AAAAAAElFTkSuQmCC)",
                backgroundPosition: "3px 3px",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#e4e4e4"
            },

            menu: {
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderTop: "0 none"
            },

            datePicker: {

            }
        },

      /** Function used to format date for display. Returns "M/D/YYYY" by default.
       */
        formatDate: function(date){
            return (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
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


        formatDate = config.formatDate;


      //Create main div
        var mainDiv = createElement("div", parent, {
            position: "relative",
            display: "inline-block"
        });
        mainDiv.setAttribute("desc", me.className);
        me.el = mainDiv;


      //Create table with 2 columns
        var table = createTable(mainDiv);
        table.style.height = "";
        var tr = table.addRow();


      //Create input in the first column
        input = createElement('input', tr.addColumn({width: "100%"}), config.style.input);
        input.style.width="100%";
        input.type = "text";

        input.onkeydown = function(e){
            if (e.keyCode===9){
                e.preventDefault();
            }
        };
        input.onkeyup = function(e){
            if (e.keyCode===9){ //tab
                me.hideMenu();
                focusNext();
            }
            else if (e.keyCode===40){ //down arrow
                me.showMenu();
            }
        };

        if (config.showMenuOnFocus){
            input.onfocus = function(){
                me.showMenu();
            };
        }


        me.setDate(config.date, true);


        input.oninput = function(){
            if (me.isDisabled()===true) return;

            var val = this.value;
            if (isDate(val)){
                var date = new Date(val);
                if (menu){
                    if (menu.style.visibility === "hidden"){}
                    else{
                        datePicker.setDate(date);
                    }
                }
                me.onChange(date);
            }
        };
        input.onpaste = input.oninput;
        input.onpropertychange = input.oninput;




      //Create button in the second column
        button = createElement('input', tr.addColumn(), config.style.button);
        button.type = "button";
        button.onclick = function(){

            if (menu){
                if (menu.style.visibility === "hidden"){
                    me.showMenu();
                }
                else{
                    menu.style.visibility = "hidden";
                }
            }
            else{
                me.showMenu();
            }
        };


      //Add public show/hide methods
        addShowHide(me);
    };


  //**************************************************************************
  //** isDisabled
  //**************************************************************************
  /** Returns true if the compnentent has been disabled.
   */
    this.isDisabled = function(){
        return me.el.disabled;
    };


  //**************************************************************************
  //** enable
  //**************************************************************************
  /** Used to enable the input allowing users to interact with the component.
   */
    this.enable = function(){
        var outerDiv = me.el;
        if (mask){
            outerDiv.style.opacity = "";
            mask.style.visibility = "hidden";
        }
        outerDiv.disabled = false;
    };


  //**************************************************************************
  //** disable
  //**************************************************************************
  /** Used to disable the input preventing users from interacting with the
   *  component.
   */
    this.disable = function(){
        me.hideMenu();

        var outerDiv = me.el;
        outerDiv.style.opacity = "0.6";

        if (mask){
            mask.style.visibility = "visible";
        }
        else{
            mask = createElement('div', {
                width: "100%",
                height: "100%",
                position: "absolute",
                zIndex: 1
            });
            mask.setAttribute("desc", "mask");
            outerDiv.insertBefore(mask, outerDiv.firstChild);
        }
        outerDiv.disabled = true;
    };


  //**************************************************************************
  //** onChange
  //**************************************************************************
    this.onChange = function(currDate, prevDate){};


  //**************************************************************************
  //** showMenu
  //**************************************************************************
    this.showMenu = function(){

        var date = me.getValue();
        if (!date) date = new Date();

        if (datePicker){
            datePicker.setDate(date);
            menu.style.visibility = '';
        }
        else{

            var mainDiv = me.el;

            menu = createElement('div', mainDiv, config.style.menu);
            menu.setAttribute("desc", "menu");
            menu.style.width = "100%";
            menu.style.position = "absolute";
            menu.style.zIndex = 1;
            //menu.style.visibility = "hidden";




          //Hide menu if the client clicks outside of the menu
            var hideMenu = function(e){
                if (!mainDiv.contains(e.target)){
                    menu.style.visibility = "hidden";
                }
            };
            if (document.addEventListener) { // For all major browsers, except IE 8 and earlier
                document.addEventListener("click", hideMenu);
            }
            else if (document.attachEvent) { // For IE 8 and earlier versions
                document.attachEvent("onclick", hideMenu);
            }



            datePicker = new javaxt.dhtml.DatePicker(menu, {
                date: date,
                style: config.style.datePicker
            });
            datePicker.select();
            datePicker.onClick = function(date){
                me.hideMenu();
                me.setValue(date);
            };
        }


        //TODO: adjust position of the menu if it's not visible

    };


  //**************************************************************************
  //** hideMenu
  //**************************************************************************
    this.hideMenu = function(){
        if (menu) menu.style.visibility = "hidden";
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
    this.setValue = function(date, silent){
        var prevDate = me.getValue();

        if (isDate(date)){
            if (!date.getTime) date = new Date(date);
            input.value = formatDate(date);
        }
        else{
            date = null;
            input.value = "";
        }

        if (silent===true) return;
        me.onChange(date, prevDate);
    };


  //**************************************************************************
  //** getValue
  //**************************************************************************
    this.getValue = function(){
        var date = new Date(input.value);
        if (isNaN( date.getTime() )) date = null;
        return date;
    };


  //**************************************************************************
  //** setDate
  //**************************************************************************
    this.setDate = function(date, silent){
        me.setValue(date, silent);
    };


  //**************************************************************************
  //** getDate
  //**************************************************************************
    this.getDate = function(){
        me.getValue();
    };


  //**************************************************************************
  //** focusNext
  //**************************************************************************
  /** Used to focus on the next available form element.
   */
    var focusNext = function(){
        var form = input.form;
        if (form){
            for (var i=0; i<form.elements.length; i++){
                if (form.elements[i]===input && i<form.elements.length-2){
                    form.elements[i+2].focus();
                    return;
                }
            }
        }
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var isDate = javaxt.dhtml.utils.isDate;

    init();
};