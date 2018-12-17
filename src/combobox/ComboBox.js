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
    var input, button;
    var menuDiv, menuOptions, newOption;
    
    var defaultConfig = {

        placeholder: false,

        maxVisibleRows: 5, //number of menu items before overflow
        scrollbar: false, //true to show the vertical scrollbar
        showMenuOnFocus: true,
        typeAhead: true,
        
        addNewOption: false,
        addNewOptionText: "Add New...",
        
        style: {
            
            input: {
                color: "#363636",
                fontSize: "14px",
                height: "22px",
                lineHeight: "22px",
                padding: "0px 4px",
                verticalAlign: "middle",
                transition: "border 0.2s linear 0s, box-shadow 0.2s linear 0s",
                backgroundColor: "#fff",
                border: "1px solid #ccc",
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
            }
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


      //Create main div
        var mainDiv = document.createElement("div");
        mainDiv.setAttribute("desc", me.className);
        mainDiv.style.width = "100%";
        parent.appendChild(mainDiv);
        me.el = mainDiv;
        
        
      //Create table with 2 columns
        var table = createTable();
        table.style.height = "";
        var tbody = table.firstChild;       
        var tr = document.createElement('tr');
        tbody.appendChild(tr);        
        mainDiv.appendChild(table);
        
        
      //Create input in the first column
        var td = document.createElement('td');
        td.style.width="100%";
        input = document.createElement('input');
        input.type = "text";
        setStyle(input, "input");
        input.style.width="100%";
        td.appendChild(input);
        tr.appendChild(td);
        
        input.onkeydown = function(e){
            if (e.keyCode===9){ 
                e.preventDefault();
            }
        };
        
        input.onkeyup = function(e){
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
                me.filter();
            }
        };
        
        input.oninput = function(){
            
            var foundMatch = false;
            var filter = input.value.replace(/^\s*/, "").replace(/\s*$/, "").toLowerCase();
            for (var i=0; i<menuOptions.childNodes.length; i++){
                var div = menuOptions.childNodes[i];
                if (div.innerHTML.toLowerCase()===filter){
                    foundMatch = true;
                    input.data = div.value;
                    break;
                }
            }
            if (!foundMatch) input.data = null;

            me.onChange(input.value, input.data);
        };
        input.onpaste = input.oninput;
        input.onpropertychange = input.oninput;
        
        if (config.showMenuOnFocus){
            input.onclick = function(){
                me.showMenu(true);
                scroll();
                this.focus();
            };
        }



      //Create button in the second column
        td = document.createElement('td');
        button = document.createElement('button');
        //button.type = "button";
        setStyle(button, "button");
        td.appendChild(button);
        tr.appendChild(td);
        button.onclick = function(){
            if (menuDiv.style.visibility === "hidden"){
                me.showMenu(true);
                scroll();
            }
            else{
                me.hideMenu();
            }
        };

        

      //Create menu
        var div = document.createElement('div');
        div.style.position = "relative";
        div.style.width = "100%";
        mainDiv.appendChild(div);

        menuDiv = document.createElement('div');
        menuDiv.setAttribute("desc", "menuDiv");
        setStyle(menuDiv, "menu");
        menuDiv.style.position = "absolute";
        menuDiv.style.visibility = "hidden";
        menuDiv.style.display = "block"; //<--Required to get size
        menuDiv.style.width = "100%";
        menuDiv.style.zIndex = 1;
        menuDiv.style.boxSizing = "border-box";
        div.appendChild(menuDiv);
        

        
        if (config.addNewOption===true){
            
            var menuTable = createTable();
            menuTable.style.height = "";
            tr = document.createElement("tr");
            menuTable.firstChild.appendChild(tr);
            td = document.createElement("td");
            td.style.width = "100%";
            td.style.height = "100%";
            td.style.verticalAlign = "top";
            tr.appendChild(td);

            var outerDiv = document.createElement("div");
            outerDiv.style.position = "relative";
            outerDiv.style.width = "100%";
            outerDiv.style.height = "100%";
            td.appendChild(outerDiv);

            var innerDiv = outerDiv.cloneNode();
            innerDiv.style.position = "absolute";
            innerDiv.style.overflowX = 'hidden';
            innerDiv.style.overflowY = 'hidden';
            outerDiv.appendChild(innerDiv);
            menuOptions = innerDiv;            
            
            tr = document.createElement("tr");
            menuTable.firstChild.appendChild(tr);
            td = document.createElement("td");
            tr.appendChild(td);
            
            newOption = document.createElement('div');
            setStyle(newOption, "newOption");
            newOption.innerHTML = config.addNewOptionText;
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
                    
            td.appendChild(newOption);
            
            menuDiv.appendChild(menuTable);
        }
        else{
            menuDiv.style.overflowX = 'hidden';
            menuDiv.style.overflowY = 'hidden';
            menuOptions = menuDiv;
        }
        
        
        

      //Add event listener to hide menu if the client clicks outside of the menu div
        var hideMenu = function(e){
            if (!mainDiv.contains(e.target)){
                me.hideMenu();
            }
        };
        if (document.addEventListener) { // For all major browsers, except IE 8 and earlier
            document.addEventListener("click", hideMenu);
        } 
        else if (document.attachEvent) { // For IE 8 and earlier versions
            document.attachEvent("onclick", hideMenu);
        }
    };


  //**************************************************************************
  //** reset
  //**************************************************************************
    this.reset = function(){
        me.setValue(null);
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
  /** Used to set the value for the input. 
   */
    this.setValue = function(val){
        
        if (val==null || val=="") {
            input.value = "";
            input.data = null;
            return;
        };
        
        
      //Try to match the val to one of the menu items using the menu data
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            if (div.value===val){
                input.value = div.innerHTML;
                input.data = div.value;
                return;
            }
        }

      //Try to match the val to one of the menu items using the menu text
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            if (div.innerHTML.toLowerCase() === getText(val).toLowerCase()){
                input.value = div.innerHTML;
                input.data = div.value;
                return;
            }
        }

        
        //input.value = getText(val);
        //input.data = val;
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
  /** Returns a list of all the options currently available in the comboxbox.
   */
    this.getOptions = function(){
        var arr = [];
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            arr.push({
                text: div.innerHTML, 
                value: div.value
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
    this.onChange = function(text, value){};


  //**************************************************************************
  //** onAddNewOption
  //**************************************************************************
  /** Called when a user clicks on the new menu option 
   */
    this.onAddNewOption = function(){};
    
    
  //**************************************************************************
  //** onAddNewOption
  //**************************************************************************
  /** Called when a user attempts to render the context menu on a menu option
   */
    this.onMenuContext = function(text, value, el){};


  //**************************************************************************
  //** filter
  //**************************************************************************
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
            
            if (div.innerHTML.toLowerCase().indexOf(filter) === 0) {
                div.style.display = "";
                numVisibleItems++;
                h = Math.max(div.offsetHeight, h);
            } 
            else {
                div.style.display = "none";
            }
        }
        
      //Resize menu
        resizeMenu(numVisibleItems, h);
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
  /** Clears the input and removes all items from the menu.
   */
    this.clear = function(){
        input.value = "";
        input.data = null;
        me.hideMenu();
        removeOverflow();
        menuDiv.style.height = '';
    };
    

  //**************************************************************************
  //** showMenu
  //**************************************************************************
  /** Renders the menu if it is hidden.
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
                

              //Show the menu
                menuDiv.style.visibility = '';
            

              //Hide bottom border
                input.style.borderBottomColor = 
                button.style.borderBottomColor = "rgba(0,0,0,0)";
            }
        }
    };


  //**************************************************************************
  //** hideMenu
  //**************************************************************************
    this.hideMenu = function(){
        
        if (menuDiv.style.visibility !== "hidden"){
            input.style.borderBottomColor =
            button.style.borderBottomColor = '';
            setStyle(input, "input");
            setStyle(button, "button");
            input.style.width="100%";
            menuDiv.style.visibility = "hidden";
            input.focus();
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
                    menuOptions.parentNode.style.height = 
                    menuOptions.style.height = height + "px";
                }
                else{
                    menuOptions.style.height =
                    menuDiv.style.height = height + "px";
                }
            }
            else{
                removeOverflow();
                menuOptions.parentNode.style.height = 
                menuOptions.style.height =
                menuDiv.style.height = '';
            }
        }
    };
    
    var addOverflow = function(){
        menuOptions.style.position = "absolute";
        if (config.scrollbar===true){
            menuOptions.style.overflowY = 'scroll';
        }
        else{
            menuOptions.style.overflowY = 'hidden';
        }
    };
    
    var removeOverflow = function(){
        if (config.addNewOption===true){ //remove overflow if we have a table menu
            menuOptions.style.position = "relative";
            menuOptions.style.overflowY = '';
        }
    };


  //**************************************************************************
  //** scroll
  //**************************************************************************
  /** Scrolls menu to the input value
   */
    var scroll = function(){
        
      //Scroll to a menu item that matches the text in the input
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            if (div.innerHTML===input.value){
                menuOptions.scrollTop = div.offsetTop;
                div.focus();
                return;
            }
        }
        
      //If we're still here, we didn't find an exact match so we'll do a fuzzy search
        var a = input.value;
        var div = null;
        var max = 0;
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var b = menuOptions.childNodes[i].innerHTML;
            var x = 0;
            for (var j=0; j<Math.min(a.length, b.length); j++) {
                if (a.charAt(j) !== b.charAt(j)){
                    break;
                }
                x++;
            }
            if (x>max){
                div = menuOptions.childNodes[i];
                max = x;
            }
        }
        
        if (div){
            menuOptions.scrollTop = div.offsetTop;
            div.focus();
            return;
        }
    };
    
    
  //**************************************************************************
  //** add
  //**************************************************************************
  /** Used to add an entry to the menu.
   *  @param text Text to display in the input when selected.
   *  @param value Value associated with the input.
   */
    this.add = function(text, value){
        var div = document.createElement('div');
        setStyle(div, "option");
        div.innerHTML = getText(text);
        div.value = value;
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
            var el = this;
            me.onMenuContext(el.innerHTML, el.value, el);
        };
        
        menuOptions.appendChild(div);
    };


  //**************************************************************************
  //** remove
  //**************************************************************************
  /** Removes an entry from the menu.
   */
    this.remove = function(name){
        var arr = [];
        for (var i=0; i<menuOptions.childNodes.length; i++){
            var div = menuOptions.childNodes[i];
            if (div.innerHTML === getText(name)){
                arr.push(div);
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
            if (typeof name === 'string' || name instanceof String){
                //keep the string as is
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
    var select = function(div, _focusNext){
        
        if (div){
            
          //Set input value and hide menu
            input.value = div.innerHTML;
            input.data = div.value;
            me.hideMenu();
            me.onChange(input.value, input.data);
            
            
          //Focus on the next input in the form
            if (_focusNext){
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
  //** setStyle
  //**************************************************************************
  /** Used to set the style for a given element. Styles are defined via a CSS 
   *  class name or inline using the config.style definitions. 
   */
    var setStyle = function(el, style){
        
        style = config.style[style];
        if (style===null) return;
        
        el.style = '';
        el.removeAttribute("style");
        
        
        if (typeof style === 'string' || style instanceof String){
            el.className = style;
        }
        else{    
            for (var key in style){
                var val = style[key];
                if (key==="content"){
                    el.innerHTML = val;
                }
                else{
                    el.style[key] = val;
                }
            }
        }
    };


  //**************************************************************************
  //** createTable
  //**************************************************************************
    var createTable = function(){
        var table = document.createElement('table');
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.width = "100%";
        table.style.height = "100%";
        table.style.margin = 0;
        table.style.padding = 0;
        table.style.borderCollapse = "collapse";
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        return table;
    };


  //**************************************************************************
  //** merge
  //**************************************************************************
  /** Used to merge properties from one json object into another. Credit:
   *  https://github.com/stevenleadbeater/JSONT/blob/master/JSONT.js
   */
    var merge = function(settings, defaults) {
        for (var p in defaults) {
            if ( defaults.hasOwnProperty(p) && typeof settings[p] !== "undefined" ) {
                if (p!=0) //<--Added this as a bug fix
                merge(settings[p], defaults[p]);
            }
            else {
                settings[p] = defaults[p];
            }
        }
    };
    

    
    init();
};