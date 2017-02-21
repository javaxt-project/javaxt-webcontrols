if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Table Class
//******************************************************************************
/**
 *   Scrollable table with fixed header. Built-in support for iScroll (just
 *   include it - no configuration required).
 *
 ******************************************************************************/

javaxt.dhtml.Table = function(parent, config) {

    this.className = "javaxt.dhtml.Table";

    var me = this;
    var deferUpdate = false;

    var defaultConfig = {
        width: "100%",
        height: "100%",
        border: "1px solid #969696",

        headerStyle: {
            background: "#4F81BD",
            fontFamily: "tahoma,arial,verdana,sans-serif",
            fontSize: "11px",
            fontWeight: "Bold",
            color: "#FFFFFF",
            verticalAlign: "middle",
            textAlign: "center",
            height: 20,
            cursor: "default",
            padding: 5
        },
        
        rowStyle:{
            cursor: "default",
            fontFamily: "tahoma,arial,verdana,sans-serif",
            fontSize: "11px",
            color: "#656565",
            height: 20,
            padding: 5
        }
    };
    
    
  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class. */

    var init = function(){

      //Exit if no columns defined
        if (config==null || config.columns==null) return;


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Create outer table
        var table = document.createElement('table');
        table.style.width = getPixels(config.width);
        table.style.height = getPixels(config.height);
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.borderCollapse = "collapse";
        table.style.border = config.border;
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        var row = document.createElement('tr');
        var td = document.createElement('td');
        td.style.width="100%";
        td.style.height="100%";
        row.appendChild(td);
        tbody.appendChild(row);
        parent.appendChild(table);
        me.table = table;
        
      //Watch for resize events
        addResizeListener(parent, function(){
            me.update();
        });


      //Create relative div
        var div = document.createElement("div");
        div.style.width="100%";
        div.style.height = "100%";
        div.style.position = "relative";
        td.appendChild(div);
        
        if (div.offsetHeight===0){
            div.style.height = getPixels(td.offsetHeight);
            setTimeout(function () {
                div.style.height = "100%";
            }, 500);
        }
        

      //Create wrapper for the inner table
        var wrapper = document.createElement("div");
        wrapper.style.width="100%";
        wrapper.style.height = "100%"; //getPixels(td.offsetHeight); //<--Need to update on resize events!
        wrapper.style.position = "absolute";
        wrapper.style.left = 0;
        wrapper.style.top = 0;
        wrapper.style.overflow = "scroll";
        wrapper.style.overflowX = 'hidden';
        if (typeof IScroll !== 'undefined'){ 
            wrapper.style.overflowY = 'hidden';
        }
        else{
            wrapper.onscroll = function(){
                var maxScrollPosition = wrapper.scrollHeight - wrapper.clientHeight;
                me.onScroll(wrapper.scrollTop, maxScrollPosition);
            }
        }
        div.appendChild(wrapper);
        me.wrapper = wrapper;
        

      //Create header div
        var header = document.createElement('div');
        header.style.width="100%";
        header.style.height=getPixels(config.headerStyle.height);
        header.style.position = "absolute";
        header.style.left = 0;
        header.style.top = 0;
        header.style.overflowY = "hidden";
        div.appendChild(header);


      //Add header table
        table = document.createElement('table');
        table.style.width = "100%";
        table.style.height = "100%";
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.borderCollapse = "collapse";
        table.border = config.border;
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
        row = document.createElement('tr');
        tbody.appendChild(row);
        

        if (typeof config.headerStyle === 'string' || config.headerStyle instanceof String){
            row.className = config.headerStyle;
        }
        else{
            for (var o in config.headerStyle){
                var key = o;
                var val = config.headerStyle[o];

                if (key=="class") row.className = val;
                else row.style[key] = val;
            }
        }   
        for (var i=0; i<config.columns.length; i++){
            var columnConfig = config.columns[i];
            var clonedColumnConfig = {};
            merge(clonedColumnConfig, columnConfig);
            if (clonedColumnConfig.align!="center") clonedColumnConfig.align = "left";
            var cell = createCell(clonedColumnConfig, i<config.columns.length-1);
            cell.setAttribute("colID", i);
            cell.onclick = function(event){
                var colID = parseInt(this.getAttribute("colID"));
                var colConfig = config.columns[colID];
                me.onHeaderClick(colID,colConfig,this,event);
                if (colConfig!=null){
                    var callback = colConfig.onHeaderClick;
                    if (callback!=null){
                        callback.apply(me, [i,cell,event]);
                    }
                }
            }
            row.appendChild(cell);
        }
        createPhantomRow(tbody, 0);
        header.appendChild(table);
        me.header = table;
        updateCells(table);


      //Add content table
        table = document.createElement('table');
        table.style.width = "100%";
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.borderCollapse = "collapse";
        table.border = config.border;
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
        
        var headerRow = me.header.childNodes[0].childNodes[0];
        var headerHeight = headerRow.offsetHeight;        
        if (headerHeight===0){ 
            console.log("Warning: Cannot determine header height!");
            headerHeight = 40;
        }
        row = createPhantomRow(tbody, 1);
        row.style.height = getPixels(headerHeight);

        wrapper.appendChild(table);
        me.body = table;


        if (typeof IScroll !== 'undefined'){
            setTimeout(function () {
                me.iScroll = new IScroll(wrapper, {
                    
                    scrollbars: true,
                    fadeScrollbars: false,
                    hideScrollbars: false,
                    
                    onScrollStart : function(e) {
                        //document.onselectstart = new Function ("return false");
                        //document.onmousedown = function(e){return false;};
                        //me.body.onselectstart='return false;'
                    }
                });
            }, 100);
        }
    };


  //**************************************************************************
  //** createPhantomRow
  //**************************************************************************
  /** Insert phantom row into a given table. This helps the browser calculate
   *  column widths when columns are defined using percentages
   */
    var createPhantomRow = function(tbody, height){
        var row = document.createElement('tr');
        tbody.appendChild(row);
        for (var i=0; i<config.columns.length; i++){
            
            var columnConfig = config.columns[i];
            var clonedColumnConfig = {};
            merge(clonedColumnConfig, columnConfig);
            
            var cell = document.createElement('td');
            cell.style.height = getPixels(height);
            

            if (columnConfig.hidden === true){
                cell.style.visibility = 'hidden';
                cell.style.display = 'none';      
                cell.style.width = '0px';                
            }            
            else{
                var columnWidth = columnConfig.width;
                cell.style.width = getPixels((columnWidth==null) ? 25 : columnWidth);
            }
            
            var x = document.createElement("div");
            x.style.width = getPixels(((columnWidth+"").indexOf("%")>-1) ? 25 : columnWidth);
            x.style.height = getPixels(height);
            cell.appendChild(x);
            row.appendChild(cell);
        }
        return row;
    };


  //**************************************************************************
  //** createCell
  //**************************************************************************

    var createCell = function(columnConfig, addHandle){

        var cell = document.createElement('td');
        cell.style.font = "inherit";
        cell.style.padding = "0px"; //"inherit";
        cell.style.verticalAlign = "middle";
        
        var align = columnConfig.align==null ? "left" : columnConfig.align;
        if (align=="center") cell.style.paddingLeft = cell.style.paddingRight = 0;
        
        
      //Hide column as needed
        if (columnConfig.hidden === true){
            cell.style.visibility = 'hidden';
            cell.style.display = 'none';      
        }

      //Make column text unselectable
        if (columnConfig.selecttext === true){}
        else{
            cell.style.userSelect = "none";
            cell.style.webkitUserSelect = "none";
            cell.style.MozUserSelect = "none";
            cell.setAttribute("unselectable", "on"); // For IE and Opera
        }

        var div = document.createElement("div");
        div.style.position = "relative";
        div.style.textAlign = align;
        cell.appendChild(div);

        var wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.left = 0;
        wrapper.style.top = 0;
        wrapper.style.width = 0; //<--This gets updated by the updateCells() method
        wrapper.style.overflow = "scroll";
        wrapper.style.overflowX = 'hidden';
        wrapper.style.overflowY = 'hidden';
        div.appendChild(wrapper);
        wrapper.innerHTML = columnConfig.header;


        if (addHandle==true){
            var handle = document.createElement("div");
            handle.style.position = "absolute";
            handle.style.right = 0;
            handle.style.top = 0;
            handle.style.width = 5;
            handle.style.height = 15; //<-- this might be too big!
            handle.style.cursor = "col-resize";
            div.appendChild(handle);
        }

        return cell;
    };


  //**************************************************************************
  //** updateCells
  //**************************************************************************
  /** Used to update the width and height of the divs inside the table cells.
   */
    var updateCells = function(el){

      //Precompute column widths (optimization for iPad)
        var colWidths = [];
        var colHeaders = me.header.childNodes[0].childNodes[0].childNodes;
        for (var i=0; i<colHeaders.length; i++){
            colWidths.push(getPixels(colHeaders[i].offsetWidth));
        }


      //Find divs inside the table cells. We will defer updating the width and
      //height of the cells for performance reasons (optimization for Firefox)
        var divs = [];
        var colHeights = [];
        var getDivs = function(row){
            var colHeight = null;
            for (var j=0; j<row.childNodes.length; j++){
                var col = row.childNodes[j];
                if (colHeight==null) colHeight = parseInt(col.offsetHeight);
                if (col.childNodes[0].tagName.toLowerCase()=="div"){
                    divs.push(col.childNodes[0]);
                }                
            }
            colHeights.push(colHeight);
        };
        var tagName = el.tagName.toLowerCase();
        if (tagName=="tr"){
            getDivs(el);
        }
        else if (tagName=="table"){
            var tbody = el.childNodes[0];
            for (var i=0; i<tbody.childNodes.length; i++){
                var row = tbody.childNodes[i];
                getDivs(row);
            }
        }
        else{
            return;
        }


      //Update heights
        var x = 0;
        var y = 0;
        for (var i=0; i<divs.length; i++){
            var colHeight = colHeights[y];
            if (colHeight>0){
                divs[i].style.height = (colHeight-1) + "px"; 
            }
            x++;
            if (x===colWidths.length){ 
                x = 0;
                y++;
            }
        }
        


      //Update widths
        var j=0;
        for (var i=0; i<divs.length; i++){
            var div = divs[i];
            if (div.childNodes.length>0){
                if (div.childNodes[0].tagName.toLowerCase()=="div"){
                    var innerDiv = div.childNodes[0];
                    innerDiv.style.height="100%";
                    innerDiv.style.width=colWidths[j];
                }
            }
            j++;
            if (j===colWidths.length) j = 0;
        }
    };


  //**************************************************************************
  //** getColumnWidth
  //**************************************************************************
  /** Returns the width of a given column
   */
    this.getColumnWidth = function(index){
        return me.header.childNodes[0].childNodes[0].childNodes[index].offsetWidth;
    };


  //**************************************************************************
  //** addRows
  //**************************************************************************
  /** Appends multiple rows to the table. On some browsers (e.g. iPad) this
   *  method is significantly faster than calling addRow() multiple times.
   *  Example: table.addRows([["Bob","12/30","$5.25"],["Jim","10/28","$7.33"]]);
   */
    this.addRows = function(rows){
        deferUpdate = true;

        var arr = [];
        for (var i=0; i<rows.length; i++){
            arr.push(me.addRow(rows[i]));
        }

        deferUpdate = false;
        me.update();
        
        return arr;
    };


  //**************************************************************************
  //** addRow
  //**************************************************************************
  /** Appends a row to the table and populates the cells with given values.
   *  Example: table.addRow("Bob","12/30","$5.25");
   */
    this.addRow = function(){

        var data = arguments;


      //Check if the first argument is an array. If so, use it. 
      //Otherwise, we'll use all the arguments as data.
        if (isArray(data[0])) data = data[0];


      //Create row
        var row = document.createElement('tr');
        if (typeof config.rowStyle === 'string' || config.rowStyle instanceof String){
            row.className = config.rowStyle;
        }
        else{
            for (var o in config.rowStyle){
                var key = o;
                var val = config.rowStyle[o];
                if (key=="width" || key=="height") val = getPixels(val);
                
                if (key=="class") row.className = val;
                else row.style[key] = val;
            }
        }
        


        row.onclick = function(event){ selectRows(this,event); }



      //Insert cells
        for (var i=0; i<config.columns.length; i++){
            var columnConfig = config.columns[i];
            var clonedColumnConfig = {};
            merge(clonedColumnConfig, columnConfig);
            clonedColumnConfig.header = data[i];
            row.appendChild(createCell(clonedColumnConfig));
        }
        me.body.childNodes[0].appendChild(row);


      //Update table as needed
        if (!deferUpdate) me.update(row);


        return row;
    };
    

    var prevSelection;


  //**************************************************************************
  //** selectRows
  //**************************************************************************
  /** Private method used to select rows in the grid.
   */
    var selectRows = function(row, event){

        if (config.multiselect === true){
      
            var e;
            if (event) e = event;
            if (window.event) e = window.event;      


          //unselect all previously selected items
            if (!e.ctrlKey){
                var _prevSelection = prevSelection;
                me.deselectAll();
                prevSelection = _prevSelection;
            }


          //select row (change row color and set "selected" attribute)     
            if (row.getAttribute("selected")) { //then the row is already selected
                row.removeAttribute("selected");
            }
            else{ //then the row is not already selected
               row.setAttribute("selected","true");
            }


          //shift + select event (highlight multiple rows)
            if (e.shiftKey){
                var tbody = row.parentNode;
                var prevID, currID;
                for (var i=0; i<tbody.childNodes.length; i++){
                    var tr = tbody.childNodes[i];

                    if (tr===prevSelection){
                        prevID = i;
                    }

                    if (tr===row){
                        currID = i;
                    }
                }

                for (var i = Math.min(currID, prevID); i <= Math.max(currID, prevID); i++){
                    var tr = tbody.childNodes[i];
                    tr.setAttribute("selected","true");
                }
            }
        
        }
        else{
            me.deselectAll();
            row.setAttribute("selected","true");
        }
        
        prevSelection = row;
        me.onSelectionChange();
    };


  //**************************************************************************
  //** selectAll
  //**************************************************************************
  /** Selects all the rows in the table.
   */
    this.selectAll = function(){
        if (config.multiselect === true){
            var tbody = me.body.childNodes[0];
            for (var i=0; i<tbody.childNodes.length; i++){
                var tr = tbody.childNodes[i];
                tr.setAttribute("selected","true");
                prevSelection = row;
            }
            me.onSelectionChange();
        }
    };


  //**************************************************************************
  //** deselectAll
  //**************************************************************************
  /** Deselects all the rows in the table.
   */
    this.deselectAll = function(){
        var tbody = me.body.childNodes[0];
        for (var i=0; i<tbody.childNodes.length; i++){
            var tr = tbody.childNodes[i];
            if (tr.getAttribute("selected")){
                tr.removeAttribute("selected");
            }
        }
        prevSelection = null;
        me.onSelectionChange();
    };


  //**************************************************************************
  //** onSelectionChange
  //**************************************************************************
  /** Called whenever a row in the grid is selected or deselected. Selected 
   *  rows can be retrieved using the forEachRow method. Example:
      table.forEachRow(function (row, content) {
          if (row.getAttribute("selected")) {
              console.log(content);
          }
      });
   */
    this.onSelectionChange = function(){};


  //**************************************************************************
  //** onHeaderClick
  //**************************************************************************
  /** Called whenever a header cell is clicked.
   */
    this.onHeaderClick = function(idx, cell, event){};


  //**************************************************************************
  //** clear
  //**************************************************************************
  /** Removes all the rows from the table
   */
    this.clear = function(){
        me.deselectAll();
        var tbody = me.body.childNodes[0];
        while (tbody.childNodes.length>1){
            var row = tbody.childNodes[1];
            tbody.removeChild(row);
        }
        me.update();
    }


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to adjust the width of all the cells in the table and refresh the
   *  scroll.
   */
    this.update = function(row){

      //Adjust header width in case of overflow
        if (me.header.offsetWidth != me.body.offsetWidth){
            me.header.style.width = getPixels(me.body.offsetWidth);
            updateCells(me.header);
        }


      //Update cell widths in the given row. If no row is given,
      //adjust the width of all the rows in the body
        if (row==null) updateCells(me.body);
        else updateCells(row);


      //Update iScroll
        if (me.iScroll) me.iScroll.refresh();
    };


  //**************************************************************************
  //** getDOM
  //**************************************************************************
    this.getDOM = function(){
        return me.table;
    };


  //**************************************************************************
  //** onScroll
  //**************************************************************************
  /** Called whenever the table is scrolled. Implementations of this method 
   *  can be used, for example, to load records when a client scrolls to the
   *  bottom of the page. 
   */
    this.onScroll = function(y, maxY){};
    
    
  //**************************************************************************
  //** scrollTo
  //**************************************************************************
    this.scrollTo = function(x, y){
        me.wrapper.scrollTop = y;
    };
    

  //**************************************************************************
  //** forEachRow
  //**************************************************************************
  /** Used to traverse all the rows in the table and extract contents of each
   *  cell. Example:
   *  table.forEachRow(function (row, content) {
   *      console.log(content);
   *  });
   *  
   *  Optional: return true in the callback function if you wish to stop 
   *  processing rows.
   */
    this.forEachRow = function(callback){
        if (callback==null) return;
        var tbody = me.body.childNodes[0];
        for (var i=0; i<tbody.childNodes.length; i++){
            if (i>0){//skip phantom row!
                var row = tbody.childNodes[i];
                var content = [];
                for (var j=0; j<row.childNodes.length; j++){ //skip phantom row!
                    var col = row.childNodes[j];
                    if (col.childNodes[0].tagName.toLowerCase()=="div"){
                        var div = col.childNodes[0];
                        if (div.childNodes.length>0){
                            if (div.childNodes[0].tagName.toLowerCase()=="div"){
                                var innerDiv = div.childNodes[0];
                                content.push(innerDiv.innerHTML);
                            }
                        }
                    }
                }

                var b = callback.apply(me, [row, content]);
                if (b===true) return;
            }
        }
    };


  //**************************************************************************
  //** updateRow
  //**************************************************************************
  /** Used to update contents of a given row.
   */
    this.updateRow = function(row, data){
        var x = 0;
        for (var j=0; j<row.childNodes.length; j++){ //skip phantom row!
            var col = row.childNodes[j];
            if (col.childNodes[0].tagName.toLowerCase()=="div"){
                var div = col.childNodes[0];
                if (div.childNodes.length>0){
                    if (div.childNodes[0].tagName.toLowerCase()=="div"){
                        var innerDiv = div.childNodes[0];
                        innerDiv.innerHTML = data[x];
                        x++;
                    }
                }
            }
        }
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


  //**************************************************************************
  //** isArray
  //**************************************************************************
  /** Used to check whether a given object is an array. Note that this check
   *  does not use the "instanceof Array" approach because of issues with
   *  frames.
   */
    var isArray = function(obj){
        return (Object.prototype.toString.call(obj)==='[object Array]');
    };


  //**************************************************************************
  //** getPixels
  //**************************************************************************
  /** Appends "px" if the object does not end in "px" or "%".
   */
    var getPixels = function(obj){
        var str = obj+"";
        var x = str.substring(str.length-1).toLowerCase();
        if (x=="x" || x =="%") return str;
        
        x = parseFloat(obj);
        if (isNaN(x)) return obj;
        else return x + "px";
    };


  //**************************************************************************
  //** addResizeListener
  //**************************************************************************
  /** Used to watch for resize events for a given element. Credit:
   *  http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
   */
    var addResizeListener = function(element, fn){
        
        var attachEvent = document.attachEvent;
        var isIE = navigator.userAgent.match(/Trident/);
        
        var requestFrame = (function(){
            var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
            function(fn){ return window.setTimeout(fn, 20); };
            return function(fn){ return raf(fn); };
        })();

        var cancelFrame = (function(){
            var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
            window.clearTimeout;
            return function(id){ return cancel(id); };
        })();

        function resizeListener(e, fn){
            var win = e.target || e.srcElement;
            if (win.__resizeRAF__) cancelFrame(win.__resizeRAF__);
            win.__resizeRAF__ = requestFrame(function(){
                var trigger = win.__resizeTrigger__;
                fn.call(trigger, e);
            });
        };        
        

        if (attachEvent) {
            element.__resizeTrigger__ = element;
            element.attachEvent('onresize', function(e){
                resizeListener(e, fn);
            });
        }
        else {
            if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
            var obj = element.__resizeTrigger__ = document.createElement('object'); 
            obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
            obj.__resizeElement__ = element;
            obj.onload = function(e){
                this.contentDocument.defaultView.__resizeTrigger__ = this.__resizeElement__;
                this.contentDocument.defaultView.addEventListener('resize', function(e){
                    resizeListener(e, fn);
                });
            };
            obj.type = 'text/html';
            if (isIE) element.appendChild(obj);
            obj.data = 'about:blank';
            if (!isIE) element.appendChild(obj);
        }

    };

    
    
    init();
};