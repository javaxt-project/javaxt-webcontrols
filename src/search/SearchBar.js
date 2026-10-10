if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};


//******************************************************************************
//**  SearchBar
//******************************************************************************
/**
 *   Text input used to search or filter records. Shows a search icon while
 *   the input is empty and a clear button once the user starts typing. Fires
 *   an onSearch event once the user pauses typing, or right away when the
 *   user presses the enter or tab key. The input is cleared via the clear
 *   button or an escape key press. Example:
 <pre>
    var search = new javaxt.dhtml.SearchBar(div, {
        placeholder: "Search contacts",
        style: javaxt.dhtml.style.default.searchBar
    });
    search.onSearch = function(q){
        //q is the trimmed input value, or null if the input is empty
    };
    search.onClear = function(){
        //the clear button was clicked or the escape key was pressed
    };
 </pre>
 *
 ******************************************************************************/

javaxt.dhtml.SearchBar = function (parent, config) {
    this.className = "javaxt.dhtml.SearchBar";

    var me = this;
    var outerDiv, input, searchIcon, clearButton;
    var timer = null;
    var lastSearch = null; //value passed to the last onSearch event
    var basePaddingLeft;   //left padding of the input when the search icon is hidden

    var defaultConfig = {

      /** Placeholder text to display in the input. Default is "Search".
       */
        placeholder: "Search",

      /** Number of milliseconds to wait after the user stops typing before
       *  firing the onSearch event. Default is 500. Set to null or a
       *  negative number to only search when the user presses the enter or
       *  tab key.
       */
        delay: 500,

      /** If true, the browser will spellcheck text in the input field. Default
       *  is false.
       */
        spellcheck: false,

      /** If true, the browser may show its own autocomplete suggestions under
       *  the input (e.g. previous searches). Default is false
       *  (autocomplete="off").
       */
        autocomplete: false,

      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions (see
       *  "searchBar" in javaxt.dhtml.style.default). The icons are
       *  positioned over the input, so the input needs enough padding on the
       *  right for the clear button. The padding on the left is set
       *  automatically while the search icon is visible.
       */
        style: {

          /** Width of the component. Default is 100% of the parent.
           */
            width: "100%",

            input: {
                color: "#363636",
                fontSize: "14px",
                height: "28px",
                lineHeight: "28px",
                padding: "0 28px 0 8px",
                boxSizing: "border-box",
                borderRadius: "4px",
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                boxShadow: "0 1px 1px rgba(0, 0, 0, 0.075) inset",
                outline: "0 none",
              //padding-left slides the text when the search icon hides/shows
                transition: "border 0.2s linear 0s, box-shadow 0.2s linear 0s, " +
                            "padding-left 0.2s ease-in-out"
            },

          /** Magnifying glass shown on the left side of the input while it's
           *  empty. Rendered at 32x32 for high-DPI screens, displayed at
           *  16x16.
           */
            searchIcon: {
                left: "8px",
                width: "16px",
                height: "16px",
                backgroundImage: "url(data:image/png;base64,"+
                "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABVElEQVR42tWX7Q2E"+
                "IAyGHYERHIERGMERGMER2MARyDuBI9wIjuAIjnB3Jr2ENHq02Iu5H/0hQd6nH1Do"+
                "AHR3WvePAD2AwOznALtoBrACeJ7YDGCwBnAk/FTYAsBbAPgDj/fvCcBIoY/vuYlE"+
                "OUi8ArCLb0w4CtI0ayHOwl56nmlMmtfIIAYtQGbiLdVdQmzfHDgKYxl2d2GLTcVa"+
                "SQqQtUVU2UFb4YwIYK39cCEKoQZQhn8yAgi1NJxNHo0AXM2pM4Bg2HA+az40APEH"+
                "ALMGIBmJe00NdKyhWACMtRORD5RneW8AUB7pTgIw1HLWeBxnTS9YDIqxZ9201wD4"+
                "lr7OxBdpQUtb6iRsTJF5XnVA09c3AgkMxlO1f7svxtY74XDgkcTSgQOx9VbsaMFV"+
                "IJxZwVUhWrpbolQ8aKsmipQTpjLe8TLiEP6Op1m8G+CzY/zfP05N7QVPY1L/pI/W"+
                "eQAAAABJRU5ErkJggg=="+
                ")",
                backgroundSize: "16px 16px",
                backgroundRepeat: "no-repeat",
                transition: "opacity 0.2s cubic-bezier(0.39, 0.575, 0.565, 1)" //ease-out
            },

          /** Clear button ("x") shown on the right side of the input while
           *  there's text.
           */
            clearButton: {
                right: "6px",
                width: "16px",
                height: "16px",
                cursor: "pointer",
                backgroundImage: "url(data:image/png;base64,"+
                "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAmklEQVR42u2WsQ3A"+
                "IAwEPYJLb80sTMJIRJFIg4DET/GJ4sLl+w8SP5ZsJsySAAiANwNoNkutFGj+SL9q"+
                "cAprq+KE0Ka59GkXwAPRm8MAo0Z3EG4NcppZQwRYBLzSvjFk7hnDlQFs7s2BmRFs"+
                "jgTRCKJujCuUhDOIggTW5wCon4D6E1LHkBpE1CimP0b055i+kNBXstiKA+AfAAf2"+
                "3yHRWpuTEwAAAABJRU5ErkJggg=="+
                ")",
                backgroundSize: "16px 16px",
                backgroundRepeat: "no-repeat"
            }
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


      //Create main div
        outerDiv = createElement("div", parent, {
            position: "relative",
            width: config.style.width
        });
        outerDiv.className = "javaxt-searchbar";
        me.el = outerDiv;


      //Create input
        input = createElement("input", outerDiv, config.style.input);
        input.type = "text";
        basePaddingLeft = input.style.paddingLeft; //inline padding, "" with css classes
        input.style.width = "100%";
        input.style.display = "block";
        if (config.placeholder) input.setAttribute("placeholder", config.placeholder);
        if (config.spellcheck!==true) input.setAttribute("spellcheck", "false");
        if (config.autocomplete!==true) input.setAttribute("autocomplete", "off");


      //Create search icon. Clicks pass through to the input.
        searchIcon = createElement("div", outerDiv, config.style.searchIcon);
        centerVertically(searchIcon);
        searchIcon.style.pointerEvents = "none";


      //Create clear button
        clearButton = createElement("div", outerDiv, config.style.clearButton);
        centerVertically(clearButton);
        clearButton.setAttribute("title", "Clear");
        clearButton.onmousedown = function(e){
            e.preventDefault(); //keep the focus in the input
        };
        clearButton.onclick = function(){
            me.clear();
        };


      //Watch for input events
        input.oninput = function(){
            update();
            me.onChange(me.getValue());
            if (timer) clearTimeout(timer);
            timer = null;
            if (config.delay!=null && config.delay>=0){
                timer = setTimeout(search, config.delay);
            }
        };

        input.onkeydown = function(e){
            if (e.key==="Enter" || e.keyCode===13){
                search();
            }
            else if (e.key==="Tab" || e.keyCode===9){
                search(); //the focus moves on as usual
            }
            else if (e.key==="Escape" || e.keyCode===27){
                if (input.value.length>0) me.clear();
                input.blur();
            }
        };


      //Set the initial padding/icon state without animating it (transitions
      //would otherwise slide the placeholder in from the left on load)
        input.style.transition = searchIcon.style.transition = "none";
        update();
        input.offsetWidth; //apply the styles before re-enabling transitions
        input.style.transition = searchIcon.style.transition = "";
        if (!isString(config.style.input)) setTransition(input, config.style.input);
        if (!isString(config.style.searchIcon)) setTransition(searchIcon, config.style.searchIcon);

        addShowHide(me);
    };


  //**************************************************************************
  //** getValue
  //**************************************************************************
  /** Returns the trimmed input value, or null if the input is empty.
   */
    this.getValue = function(){
        var q = input.value.replace(/^\s*/, "").replace(/\s*$/, "");
        return q.length>0 ? q : null;
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
  /** Used to set the input value.
   *  @param q Search text. Null or an empty string clears the input.
   *  @param silent If true, will not fire the onSearch event. The value is
   *  treated as already searched (pressing enter won't search it again).
   */
    this.setValue = function(q, silent){
        cancelTimer();
        input.value = (q==null) ? "" : q+"";
        update();
        if (silent===true) lastSearch = me.getValue();
        else search();
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
  /** Clears the input and fires the onClear event (unless "silent" is true).
   */
    this.clear = function(silent){
        cancelTimer();
        input.value = "";
        lastSearch = null;
        update();
        if (silent!==true) me.onClear();
    };


  //**************************************************************************
  //** focus
  //**************************************************************************
    this.focus = function(){
        input.focus();
    };


  //**************************************************************************
  //** blur
  //**************************************************************************
    this.blur = function(){
        input.blur();
    };


  //**************************************************************************
  //** getInput
  //**************************************************************************
  /** Returns the input element.
   */
    this.getInput = function(){
        return input;
    };


  //**************************************************************************
  //** onChange
  //**************************************************************************
  /** Called after every change to the input value (e.g. each keystroke).
   *  @param q Trimmed input value, or null if the input is empty.
   */
    this.onChange = function(q){};


  //**************************************************************************
  //** onSearch
  //**************************************************************************
  /** Called when the user pauses typing (see "delay" config), or presses the
   *  enter or tab key. Not called again for the same value.
   *  @param q Trimmed input value, or null if the input is empty.
   */
    this.onSearch = function(q){};


  //**************************************************************************
  //** onClear
  //**************************************************************************
  /** Called when the input is cleared via the clear button, the escape key,
   *  or the clear() method.
   */
    this.onClear = function(){};


  //**************************************************************************
  //** search
  //**************************************************************************
  /** Fires the onSearch event, unless the value was already searched.
   */
    var search = function(){
        cancelTimer();
        var q = me.getValue();
        if (q===lastSearch) return;
        lastSearch = q;
        me.onSearch(q);
    };


  //**************************************************************************
  //** cancelTimer
  //**************************************************************************
    var cancelTimer = function(){
        if (timer){
            clearTimeout(timer);
            timer = null;
        }
    };


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Shows the search icon while the input is empty, and the clear button
   *  while there's text. While the search icon is visible, the left padding
   *  of the input is increased so the text (placeholder) starts after the
   *  icon. Uses the computed style of the icon, so it works with inline
   *  styles and CSS classes (and while the component is hidden).
   */
    var update = function(){
        var hasText = input.value.length>0;

        clearButton.style.display = hasText ? "" : "none";
        searchIcon.style.opacity = hasText ? 0 : "";

        input.style.paddingLeft = basePaddingLeft; //from the input style (if any)
        if (!hasText){
            var cs = getComputedStyle(searchIcon);
            var left = parseFloat(cs.left), width = parseFloat(cs.width);
            if (!isNaN(left) && !isNaN(width)){
                var padding = parseFloat(getComputedStyle(input).paddingLeft) || 0;
                input.style.paddingLeft = Math.max(padding, left + width + 6) + "px";
            }
        }
    };


  //**************************************************************************
  //** setTransition
  //**************************************************************************
  /** Restores the inline transition of an element (inline style config) */
    var setTransition = function(el, style){
        if (style && style.transition) el.style.transition = style.transition;
    };


  //**************************************************************************
  //** centerVertically
  //**************************************************************************
  /** Positions an icon over the input, centered vertically.
   */
    var centerVertically = function(el){
        el.style.position = "absolute";
        el.style.top = "50%";
        el.style.transform = "translateY(-50%)";
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var isString = javaxt.dhtml.utils.isString;
    var merge = javaxt.dhtml.utils.merge;


    init();
};
