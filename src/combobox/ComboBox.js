if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  ComboBox Class
//******************************************************************************
/**
 *   Form input with a pulldown list of options. By default, the options are
 *   accessed via a button or a "down arrow" key press. The list of options
 *   are automatically filtered as a user types in a value in the input field.
 *
 ******************************************************************************/

javaxt.dhtml.ComboBox = function(parent, config) {
    this.className = "javaxt.dhtml.ComboBox";

    var me = this;
    var input, button, mask;
    var menuDiv, menuOptions, newOption;
    var overflowDiv, overflowContainer;

    var defaultConfig = {

      /** Placeholder text to display in the input. No placeholder text is set
       *  by default.
       */
        placeholder: false,

      /** If true, the browser will spellcheck text in the input field. Default
       *  is false.
       */
        spellcheck: false,

      /** The number of menu items to that appear in the dropdown menu before
       *  overflow. Default is 5.
       */
        maxVisibleRows: 5,

      /** If true, will display a vertical scrollbar in the dropdown menu.
       *  Default is true.
       */
        scrollbar: true,

      /** If true, will display the dropdown menu whenever the input has focus
       *  (e.g. on mouse click). Default is true.
       */
        showMenuOnFocus: true,

      /** If true, the list of options in the dropdown menu are automatically
       *  filtered as a user types in a value in the input field. Default is
       *  true.
       */
        typeAhead: true,

      /** If true, will prevent user from typing or copy/pasting values in the
       *  input field. Default is false.
       */
        readOnly: false,


      /** A static list of options to put in the dropdown menu. Example:
       <pre>
        [
            {
                label: "Previous Year",
                value: "prevYear"
            },
            {
                label: "Current Year",
                value: "currYear"
            },
            {
                label: "Next Year",
                value: "nextYear"
            }
        ]
       </pre>
       *  Use the add() method to add items dynamically.
       */
        options: [],


      /** If true, will display a static menu item at the bottom of the drop
       *  down menu. This extra menu option is commonly used to render a popup
       *  menu/dialog. The onAddNewOption() method can be overridden to handle
       *  when this item is selected. The addNewOptionText config option is
       *  used to set the text/label for this menu option. Default is false.
       */
        addNewOption: false,

      /** Text to display in the extra menu option when addNewOption is set to
       *  true. Default is "Add New..."
       */
        addNewOptionText: "Add New...",

      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {
            width: "100%",

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
                backgroundColor: "#ffffff",
                border: "1px solid #ccc",
                marginTop: "-1px",
                overflow: "hidden",
                boxShadow: "0 1px 4px 0 rgba(0, 0, 0, 0.15)"
            },

            option: {
                color: "#363636",
                whiteSpace: "nowrap",
                height: "22px",
                lineHeight: "22px",
                padding: "0px 4px",
                cursor: "default"
            },

            newOption: {
                borderTop: "1px solid #ccc",
                color: "#363636",
                whiteSpace: "nowrap",
                height: "24px",
                lineHeight: "24px",
                padding: "0px 4px",
                cursor: "default"
            },

          /** If null or false, uses inline style. If "custom", uses,
           *  "iScrollHorizontalScrollbar", "iScrollVerticalScrollbar", and
           *  "iScrollIndicator" classes. You can also define custom class
           *  names by providing a style map like this:
           <pre>
            iscroll: {
                horizontalScrollbar: "my-iScrollHorizontalScrollbar",
                verticalScrollbar: "my-iScrollVerticalScrollbar",
                indicator: "my-iScrollIndicator"
            }
           </pre>
           */
            iscroll: null
        }
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        if (isString(parent)) parent = document.getElementById(parent);
        if (!parent) return;


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Add noselect css rule before creating/styling any elements
        javaxt.dhtml.utils.addNoSelectRule();


      //Create main div
        var mainDiv = createElement("div", parent);
        mainDiv.setAttribute("desc", me.className);
        mainDiv.style.width = config.style.width;
        mainDiv.style.position = "relative";
        me.el = mainDiv;


      //Create table with 2 columns
        var table = createTable(mainDiv);
        table.style.height = "";
        var tr = table.addRow();


      //Create input in the first column
        var td = tr.addColumn();
        td.style.width="100%";
        input = createElement('input', td);
        input.type = "text";
        setStyle(input, "input");
        if (config.readOnly===true){
            config.spellcheck = false;
            config.typeAhead = false;
            input.setAttribute("readonly", "true");
        }
        if (config.spellcheck===true){} else input.setAttribute("spellcheck", "false");
        if (config.placeholder) input.setAttribute("placeholder", config.placeholder);

        input.onkeydown = function(e){
            if (e.keyCode===9){
                e.preventDefault();
            }
        };

        input.onkeyup = function(e){
            if (config.readOnly===true) return;
            if (e.keyCode===9){ //tab
                var d;
                if (menuDiv.style.visibility !== "hidden"){
                    d = getFirstOption();
                }
                if (d) select(d, true);
                else focusNext();
            }
            else if (e.keyCode===40){ //down arrow
                me.showMenu();
                var d = getFirstOption();
                if (d) d.focus();
            }
            else{
                if (config.typeAhead===true){
                    me.filter();
                }
            }
        };

        input.oninput = function(){
            if (me.isDisabled()===true) return;
            //if (config.readOnly===true) return;

            var orgLabel = input.value;
            var orgVal = input.data;

            var foundMatch = false;
            var filter = input.value.replace(/^\s*/, "").replace(/\s*$/, "").toLowerCase();
            for (var i=0; i<menuOptions.childNodes.length; i++){
                var div = menuOptions.childNodes[i];
                var text = div.text;
                if (!text) text = div.innerText;
                if (isString(text)) text = text.toLowerCase();
                if (text===filter){
                    foundMatch = true;
                    input.data = div.value;
                    break;
                }
            }
            if (!foundMatch) input.data = null;

            me.onChange(input.value, input.data, orgLabel, orgVal);
        };
        input.onpaste = input.oninput;
        input.onpropertychange = input.oninput;
        addShowHide(input);

        if (config.showMenuOnFocus){
            input.onclick = function(){
                if (me.isDisabled()===true) return;
                me.showMenu(true);
                scroll();
                this.focus();
            };
        }



      //Create button in the second column
        button = createElement('button', tr.addColumn());
        //button.type = "button";
        setStyle(button, "button");

        button.onclick = function(e){
            button.blur();
            e.preventDefault();
            if (menuDiv.style.visibility === "hidden"){
                me.showMenu(true);
                scroll();
            }
            else{
                me.hideMenu();
            }
        };



      //Create menu
        var div = createElement('div', mainDiv, {
            position: "relative",
            width: "100%"
        });


        menuDiv = createElement('div', div);
        menuDiv.setAttribute("desc", "menuDiv");
        setStyle(menuDiv, "menu");
        menuDiv.style.position = "absolute";
        menuDiv.style.visibility = "hidden";
        menuDiv.style.display = "block"; //<--Required to get size
        menuDiv.style.width = "100%";
        menuDiv.style.zIndex = 1;
        menuDiv.style.boxSizing = "border-box";


      //Create overflow divs
        overflowContainer = createElement("div", {
            position: "relative",
            width: "100%",
            height: "100%"
        });

        overflowDiv = overflowContainer.cloneNode();
        overflowDiv.style.position = "absolute";
        overflowDiv.style.overflow = "hidden";
        overflowContainer.appendChild(overflowDiv);


      //Create menu options
        menuOptions = createElement("div", overflowDiv, {
            position: "relative",
            width: "100%"
        });

        if (config.options){
            for (var i=0; i<config.options.length; i++){
                var o = config.options[i];
                me.add(o.label, o.value);
            }
        }


        if (config.addNewOption===true){

            var menuTable = createTable(menuDiv);
            menuTable.style.height = "";
            tr = menuTable.addRow();
            td = tr.addColumn({
                width: "100%",
                height: "100%",
                verticalAlign: "top"
            });
            td.appendChild(overflowContainer);



            td = menuTable.addRow().addColumn();

            newOption = createElement('div', td);
            setStyle(newOption, "newOption");
            var text = getText(config.addNewOptionText);
            newOption.text = text;
            newOption.innerHTML = text;
            newOption.tabIndex = -1; //allows the div to have focus
            var selectNewOption = function(){
                me.hideMenu();
                me.onAddNewOption();
            };
            newOption.onclick = selectNewOption;
            newOption.onkeydown = function(e){
                if (e.keyCode===9){
                    e.preventDefault();
                }
            };
            newOption.onkeyup = function(e){
                if (e.keyCode===9  || e.keyCode===13){ //tab or enter
                    selectNewOption();
                }
                else if (e.keyCode===38){ //up arrow
                    var previousSibling;
                    for (var i=menuOptions.childNodes.length-1; i>-1; i--){
                        var div = menuOptions.childNodes[i];
                        if (div.style.display !== "none"){
                            previousSibling = div;
                            break;
                        }
                    }
                    if (previousSibling) previousSibling.focus();
                }
            };

            newOption.onselectstart = function () {return false;};
            newOption.onmousedown = function () {return false;};

            newOption.onmouseover = function(){
                var div = this;
                me.onMenuHover(text, div.value, div);
            };
        }
        else{
            menuDiv.appendChild(overflowContainer);
        }




      //Add event listener to hide menu if the client clicks outside of the menu div
        var hideMenu = function(e){
            if (!mainDiv.contains(e.target)){
                me.hideMenu(false);
            }
        };
        if (document.addEventListener) { // For all major browsers, except IE 8 and earlier
            document.addEventListener("click", hideMenu);
        }
        else if (document.attachEvent) { // For IE 8 and earlier versions
            document.attachEvent("onclick", hideMenu);
        }


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
  //** reset
  //**************************************************************************
  /** Similar to the clear() method, this will clears the input value. However,
   *  unlike the clear() method, this method will retain all the items in the
   *  dropdown menu.
   */
    this.reset = function(){

      //Remove everything that's not an input
        var a = [];
        var p = input.parentElement;
        var c = p.childNodes;
        for (var i=0; i<c.length; i++) if (c[i]!=input) a.push(c[i]);
        for (var i=0; i<a.length; i++) p.removeChild(a[i]);

      //Reset input
        input.value = "";
        input.data = null;

      //Ensure the input is visible
        input.show();

    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
  /** Used to set the value for the input.
   *  @param value A label or value found in the dropdown menu. This parameter
   *  is required.
   *  @param silent By default, if the input value is changed, it will fire.
   *  the onChange event. When silent is set to true, the input will NOT fire
   *  the onChange event. This parameter is optional.
   */
    this.setValue = function(value, silent){

        var setValue = function(text, value, div){
            if (isElement(text)){
                select(div, false, silent);
            }
            else{
                input.value = text;
                input.data = value;
                if (silent===true) return;
                input.oninput();
            }
        };

        if (value==null || value==="") {
            setValue("", null);
            return;
        };


      //Try to match the value to one of the menu items using the menu data
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            if (div.value===value){
                var text = div.text;
                if (!text) text = div.innerText;
                setValue(text, div.value, div);
                return;
            }
        }


      //Try to match the value to one of the menu items using the menu text
        var filter = getText(value).toLowerCase();
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            var text = div.text;
            if (!text) text = div.innerText;
            if ((isString(text) && text.toLowerCase() === filter) || text === filter){
                setValue(text, div.value, div);
                return;
            }
        }
    };


  //**************************************************************************
  //** getValue
  //**************************************************************************
  /** Returns the selected value associated with the input.
   */
    this.getValue = function(){
        return input.data;
    };


  //**************************************************************************
  //** getText
  //**************************************************************************
  /** Returns the text displayed in the input.
   */
    this.getText = function(){
        return input.value;
    };


  //**************************************************************************
  //** getOptions
  //**************************************************************************
  /** Returns an array of all the menu options currently available in the
   *  dropdown menu. Elements in the array will include a "text", "value",
   *  and "el" for each entry. Example:
   <pre>
    [
      {
        text: "United States",
        value: "US",
        el: div
      },
      {
        text: "Mexico",
        value: "MX",
        el: div
      },
      ...
    ]
   </pre>
   */
    this.getOptions = function(){
        var arr = [];
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            var text = div.text;
            if (!text) text = div.innerText;
            arr.push({
                text: text,
                value: div.value,
                el: div
            });
        }
        return arr;
    };


  //**************************************************************************
  //** getInput
  //**************************************************************************
  /** Returns the DOM element for the input.
   */
    this.getInput = function(){
        return input;
    };


  //**************************************************************************
  //** getButton
  //**************************************************************************
  /** Returns the DOM element for the button.
   */
    this.getButton = function(){
        return button;
    };


  //**************************************************************************
  //** onChange
  //**************************************************************************
  /** Called when the input value changes
   */
    this.onChange = function(label, value, prevLabel, prevValue){};


  //**************************************************************************
  //** onAddNewOption
  //**************************************************************************
  /** Called when a user clicks on the "new" menu option that appears at the
   *  bottom of the dropdown menu. See addNewOption config option.
   */
    this.onAddNewOption = function(){};


  //**************************************************************************
  //** onMenuShow
  //**************************************************************************
  /** Called when the menu is made visible
   */
    this.onMenuShow = function(){};


  //**************************************************************************
  //** onMenuHide
  //**************************************************************************
  /** Called when the menu is hidden
   */
    this.onMenuHide = function(){};


  //**************************************************************************
  //** onMenuContext
  //**************************************************************************
  /** Called when a user attempts to render the context menu on a menu option
   */
    this.onMenuContext = function(label, value, el){};


  //**************************************************************************
  //** onMenuHover
  //**************************************************************************
  /** Called when a user hovers over an item in the dropdown menu
   */
    this.onMenuHover = function(label, value, el){};


  //**************************************************************************
  //** filter
  //**************************************************************************
  /** Used to filter items in the dropdown menu that start with the text in
   *  the input.
   */
    this.filter = function(){

      //Show menu
        me.showMenu();

      //Get input value
        var filter = input.value.replace(/^\s*/, "").replace(/\s*$/, "").toLowerCase();

      //Filter menu items
        var numVisibleItems = 0;
        var h = 0;
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            var text = div.text;
            if (!text) text = div.innerText;


            if (isElement(text)){
                if (isElement(input.text)){
                    //TODO: compare DOM elements
                    div.style.display = "none";
                }
                else{
                    div.style.display = "none";
                }
            }
            else{
                if (text.toLowerCase().indexOf(filter) === 0) {
                    div.style.display = "";
                    numVisibleItems++;
                    h = Math.max(div.offsetHeight, h);
                }
                else {
                    div.style.display = "none";
                }
            }
        }

      //Resize menu
        resizeMenu(numVisibleItems, h);
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
  /** Clears the input and removes all items from the dropdown menu.
   */
    this.clear = function(){
        me.reset();
        me.hideMenu();
        removeOverflow();
        menuDiv.style.height = "";
        menuOptions.innerHTML = "";
    };


  //**************************************************************************
  //** showMenu
  //**************************************************************************
  /** Renders the dropdown menu if it is hidden.
   *  @param removeFilter If true, expand the list and view all the options.
   */
    this.showMenu = function(removeFilter){

        if (menuDiv.style.visibility === "hidden"){


          //Unhide all the options as needed
            if (removeFilter===true){
                for (var i=0; i<menuOptions.childNodes.length; i++){
                    menuOptions.childNodes[i].style.display = '';
                }
            }


          //Check to see if the menu has anything to display
            var numVisibleItems = 0;
            var h = 0;
            for (var i=0; i<menuOptions.childNodes.length; i++){
                var div = menuOptions.childNodes[i];
                if (div.style.display !== "none"){
                    numVisibleItems++;
                    h = Math.max(div.offsetHeight, h);
                }
            }
            if (config.addNewOption===true){
                numVisibleItems++;
                h = Math.max(newOption.offsetHeight, h);
            }


            if (numVisibleItems>0){

              //Update menu size
                resizeMenu(numVisibleItems, h);


              //Set zIndex
                var highestElements = getHighestElements();
                var zIndex = highestElements.zIndex;
                if (!highestElements.contains(menuDiv)) zIndex++;
                menuDiv.style.zIndex = zIndex;


              //Show the menu
                menuDiv.style.visibility = '';


              //Hide bottom border
                input.style.borderBottomColor =
                button.style.borderBottomColor = "rgba(0,0,0,0)";


              //Scroll to top
                if (me.iScroll){
                    setTimeout(function () {
                        me.iScroll.scrollTo(0,0);
                        me.iScroll.refresh();
                    }, 0);
                }
                else{
                    overflowDiv.scrollTop = 0;
                }


              //Fire event
                me.onMenuShow();
            }
        }
    };


  //**************************************************************************
  //** hideMenu
  //**************************************************************************
  /** Hides the dropdown menu if it is visible.
   */
    this.hideMenu = function(){

        if (menuDiv.style.visibility !== "hidden"){
            var hideInput = !input.isVisible();

          //Restore input and button styles
            input.style.borderBottomColor =
            button.style.borderBottomColor = '';
            setStyle(input, "input");
            setStyle(button, "button");
            input.style.width="100%";


          //Hide menu
            menuDiv.style.visibility = "hidden";
            menuDiv.style.zIndex = 1;


          //Focus or hide input
            if (hideInput){
                input.hide();
            }
            else{
                if (arguments[0]!==false) input.focus();
            }

          //Fire event
            me.onMenuHide();
        }
    };


  //**************************************************************************
  //** resizeMenu
  //**************************************************************************
    var resizeMenu = function(numVisibleItems, h){
        if (numVisibleItems>0){

            if (numVisibleItems>config.maxVisibleRows){
                addOverflow();
                var height = config.maxVisibleRows*h;
                if (newOption){
                    menuDiv.style.height = height + "px";
                    height = height-newOption.offsetHeight;
                    overflowContainer.style.height =
                    //menuOptions.style.height =
                    height + "px";
                }
                else{
                    //menuOptions.style.height =
                    menuDiv.style.height = height + "px";
                }
            }
            else{
                removeOverflow();
                overflowContainer.style.height = "100%"; //?
                //menuOptions.style.height =
                menuDiv.style.height = '';
            }

        }
        else{

            removeOverflow();
            overflowContainer.style.height = "100%"; //?
            //menuOptions.style.height =
            menuDiv.style.height = '';
        }
        if (me.iScroll) me.iScroll.refresh();
    };


  //**************************************************************************
  //** addOverflow
  //**************************************************************************
    var addOverflow = function(){

        overflowDiv.style.position = "absolute";
        if (config.scrollbar===true){
            if (typeof IScroll !== 'undefined'){
                if (!me.iScroll){
                    overflowDiv.style.overflowY = 'hidden';
                    me.iScroll = new IScroll(overflowDiv, {
                        scrollbars: config.style.iscroll ? "custom" : true,
                        mouseWheel: true,
                        fadeScrollbars: false,
                        hideScrollbars: false
                    });
                    if (config.style.iscroll) setStyle(me.iScroll, "iscroll");
                }
                if (me.iScroll) me.iScroll.refresh();
            }
            else{
                overflowDiv.style.overflowY = 'scroll';
            }
        }
        else{
            overflowDiv.style.overflowY = 'hidden';
        }

    };


  //**************************************************************************
  //** removeOverflow
  //**************************************************************************
    var removeOverflow = function(){
        overflowDiv.style.position = "relative";

        if (config.addNewOption===true){
            if (typeof IScroll !== 'undefined'){
                //console.log("removeOverflow?");
            }
            else{
                overflowDiv.style.overflowY = '';
            }
        }
    };


  //**************************************************************************
  //** scroll
  //**************************************************************************
  /** Scrolls menu to the input value
   */
    var scroll = function(){


        var scrollToElement = function(el){
            if (true) return;
            if (me.iScroll){
                setTimeout(function () {
                    me.iScroll.scrollToElement(el);
                    me.iScroll.refresh();
                    el.focus();
                }, 100);
            }
            else{
                overflowDiv.scrollTop = el.offsetTop;
                el.focus();
            }
        };


      //Scroll to a menu item that matches the text in the input
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            var text = div.text;
            if (!text) text = div.innerText;
            if (text===input.value){
                scrollToElement(div);
                return;
            }
        }

      //If we're still here, we didn't find an exact match so we'll do a fuzzy search
        var a = input.value;
        var d = null;
        var max = 0;
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            var text = div.text;
            if (!text) text = div.innerText;
            var x = 0;
            for (var j=0; j<Math.min(a.length, text.length); j++) {
                if (a.charAt(j) !== text.charAt(j)){
                    break;
                }
                x++;
            }
            if (x>max){
                d = div;
                max = x;
            }
        }

        if (d){
            scrollToElement(d);
            return;
        }
    };


  //**************************************************************************
  //** add
  //**************************************************************************
  /** Used to add an entry to the dropdown menu. Returns the new menu item as
   *  a DOM element with custom methods like setLabel()
   *  @param label Text or element to display in the dropdown menu. The label
   *  will appear in the input when menu item is selected. This parameter is
   *  required.
   *  @param value Value associated with the input. This parameter is optional.
   *  If undefined, the label will be used as the value.
   */
    this.add = function(label, value){
        var div = createElement('div', menuOptions);
        setStyle(div, "option");

        div.setLabel = function(label){
            if (isElement(label)){
                div.appendChild(label);
            }
            else{
                label = getText(label);
                div.innerHTML = label;
            }
            div.text = label;
            return label;
        };
        div.setText = div.setLabel;

        label = div.setLabel(label);

        div.value = (typeof value === "undefined") ? label : value;
        div.tabIndex = -1; //allows the div to have focus
        div.onclick = function(){
            select(this);
        };
        div.onkeydown = function(e){
            if (e.keyCode===9){
                e.preventDefault();
            }
        };
        div.onkeyup = function(e){
            if (e.keyCode===9 || e.keyCode===13){ //tab or enter
                select(this, true);
            }
            else if (e.keyCode===38){ //up arrow
                var previousSibling = this.previousSibling;
                if (previousSibling) previousSibling.focus();
            }
            else if (e.keyCode===40){ //down arrow
                var nextSibling = this.nextSibling;
                if (nextSibling) nextSibling.focus();
                else{
                    if (newOption) newOption.focus();
                }
            }
        };


        div.onselectstart = function () {return false;};
        div.onmousedown = function () {return false;};

        div.oncontextmenu = function(){
            var div = this;
            var text = div.text;
            if (!text) text = div.innerText;
            me.onMenuContext(text, div.value, div);
        };

        div.onmouseover = function(){
            var div = this;
            var text = div.text;
            if (!text) text = div.innerText;
            me.onMenuHover(text, div.value, div);
        };

        return div;
    };


  //**************************************************************************
  //** remove
  //**************************************************************************
  /** Removes an entry from the menu.
   */
    this.remove = function(value){

      //Try to match the value to one of the menu items using the menu data
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            if (div.value===value){
                menuOptions.removeChild(div);
                if (me.getValue()===value){
                    me.setValue("", true);
                }
                return;
            }
        }


      //Try to match the value to the menu items using the menu text
        var filter = getText(value).toLowerCase();
        var arr = [];
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            var text = div.text;
            if (!text) text = div.innerText;
            if (isString(text)) text = text.toLowerCase();
            if (text === filter){
                arr.push(div);
                if (me.getValue()===div.value){
                    me.setValue("", true);
                }
            }
        }
        for (i=0; i<arr.length; i++){
            menuOptions.removeChild(arr[i]);
        }
    };


  //**************************************************************************
  //** removeAll
  //**************************************************************************
  /** Removes all entries from the menu.
   */
    this.removeAll = function(){
        menuOptions.innerHTML = "";
        //Don't resize the menu div!
    };


  //**************************************************************************
  //** getText
  //**************************************************************************
  /** Formats a given item into a string that can be rendered in the input or
   *  as an entry in the menu.
   */
    var getText = function(name){
        if (name){
            if (isString(name) || isElement(name)){
                //keep name as is
            }
            else{
                name += "";
            }
        }
        else{
            name = "";
        }
        return name;
    };


  //**************************************************************************
  //** select
  //**************************************************************************
  /** Used to select a given div in the menu.
   */
    var select = function(div, _focusNext, silent){

        if (div){

          //Set input value and hide menu
            var orgVal = input.data;
            var newVal = div.value;
            var orgLabel = input.value;
            var newLabel = div.text;
            if (!newLabel) newLabel = div.innerText;
            input.value = newLabel;
            input.data = newVal;
            me.hideMenu();

            if (newVal!==orgVal){
                if (orgLabel!==newLabel){


                  //Rseset the input
                    me.reset();
                    input.value = newLabel;
                    input.data = newVal;


                  //Update input area
                    if (isElement(newLabel)){
                        var menuItem = createElement("div", input.parentElement);
                        menuItem.className = input.className;
                        menuItem.style.width = "100%";
                        var el = newLabel.cloneNode(true);
                        menuItem.appendChild(el);
                        if (config.showMenuOnFocus){
                            menuItem.onclick = function(){
                                input.onclick();
                            };
                        }
                        input.hide(); //do last
                    }
                    else{
                        input.show();
                    }


                  //Fire onChange event
                    if (silent!==true){
                        me.onChange(input.value, input.data, orgLabel, orgVal);
                    }
                }
            }

          //Focus on the next input in the form
            if (_focusNext===true){
                focusNext();
            }

        }
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
  //** getFirstItem
  //**************************************************************************
  /** Returns the first visible menu item.
   */
    var getFirstOption = function(){
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            if (div.style.display !== "none"){
                return div;
            }
        }
        return null;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var isString = javaxt.dhtml.utils.isString;
    var isElement = javaxt.dhtml.utils.isElement;
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var getHighestElements = javaxt.dhtml.utils.getHighestElements;
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
        if (el.type === "text"){
            el.style.width="100%";
            if (config.readOnly===true){
                el.className += " javaxt-noselect";
                el.style.cursor = "default";
            }
        }
    };


    init();
};