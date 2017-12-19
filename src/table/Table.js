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
    var header, body; //tbody elements
    var bodyDiv; //overflow div
    var prevSelection;
    

    var defaultConfig = {

        multiselect: false,

        style: {

            
            headerRow: {
                height: "20px"
            },
            
            headerColumn: {
                
            },
            
            row: {
                height: "20px"
            },
            
            column: {
                
            },
            
            select: {
                backgroundColor: "#FFFFB1"
            }
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



      //Create main table
        var div, table, tbody, tr, td;
        tbody = createTable();
        table = tbody.parentNode;
        table.setAttribute("desc", me.className);
        parent.appendChild(table);
        me.el = table;
        
        
        
      //Create header
        tr = document.createElement("tr");
        tr.setAttribute("desc", "Header Row");
        setStyle(tr, "headerRow");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "inherit";
        tr.appendChild(td);
        header = createTable();
        td.appendChild(header.parentNode);

        
        
      //Create body
        tr = document.createElement("tr");
        tr.setAttribute("desc", "Body Row");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);  
        
        bodyDiv = document.createElement('div');
        bodyDiv.setAttribute("desc", "body-div"); 
        bodyDiv.style.width = "100%";
        bodyDiv.style.height = "100%";
        bodyDiv.style.position = "relative";
        td.appendChild(bodyDiv);
        div = document.createElement('div');
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.position = "absolute";
        div.style.overflow = 'scroll';
        div.style.overflowX = 'hidden';
        bodyDiv.appendChild(div);
        bodyDiv = div;
        
        body = createTable();
        body.parentNode.style.height = '';
        div.appendChild(body.parentNode);
        
        
        
      //Populate header
        tr = createPhantomRow(header, 1);
        td = document.createElement("td");
        tr.appendChild(td);
        var spacerUR = document.createElement('div');
        td.appendChild(spacerUR);
        
        tr = document.createElement("tr");
        header.appendChild(tr);
        for (var i=0; i<config.columns.length; i++){
            var columnConfig = config.columns[i];
            var clonedColumnConfig = {};
            merge(clonedColumnConfig, columnConfig);
            //right aligned columns have center align headers
            if (clonedColumnConfig.align=="right") clonedColumnConfig.align = "center"; 
            
            var cell = createCell(clonedColumnConfig, true, i<config.columns.length-1);
            cell.setContent(columnConfig.header);
            cell.colID = i;
            cell.onclick = function(event){
                var colID = this.colID;
                var colConfig = config.columns[colID];
                me.onHeaderClick(colID,colConfig,this,event);
                if (colConfig!=null){
                    var callback = colConfig.onHeaderClick;
                    if (callback!=null){
                        callback.apply(me, [i,cell,event]);
                    }
                }
            };
            tr.appendChild(cell);
        }
        tr.appendChild(document.createElement("td")); //cell under the spacer
        

        
        
      //Populate body
        createPhantomRow(body, 1);




      //Function called after the table has been added to the DOM
        var onRender = function(){
            
            
          //Configure iScroll as needed and watch for scroll events
            if (typeof IScroll !== 'undefined'){ 
                bodyDiv.style.overflowY = 'hidden';
                me.iScroll = new IScroll(bodyDiv, {

                    scrollbars: true,
                    fadeScrollbars: false,
                    hideScrollbars: false,

                    onScrollStart : function(e) {
                        //document.onselectstart = new Function ("return false");
                        //document.onmousedown = function(e){return false;};
                        //me.body.onselectstart='return false;'
                    }
                });
            }
            else{
                bodyDiv.onscroll = function(){
                    var maxScrollPosition = bodyDiv.scrollHeight - bodyDiv.clientHeight;
                    me.onScroll(bodyDiv.scrollTop, maxScrollPosition);
                };
            }
            
            
          //Update the spacer in the right column of the header
            var bodyWidth = bodyDiv.offsetWidth;
            var tableWidth = body.parentNode.offsetWidth;
            var scrollWidth = Math.abs(bodyWidth-tableWidth);
            spacerUR.style.width = scrollWidth + "px";


          //Watch for resize events
            addResizeListener(parent, function(){
                me.update();
            });
        };




      //Check whether the table has been added to the DOM
        var w = bodyDiv.offsetWidth;
        if (w===0 || isNaN(w)){
            var timer;
            
            var checkWidth = function(){ 
                var w = bodyDiv.offsetWidth;
                if (w===0 || isNaN(w)){
                    timer = setTimeout(checkWidth, 100);
                }
                else{
                    clearTimeout(timer);
                    onRender();
                }
            };
            
            timer = setTimeout(checkWidth, 100);
        }
        else{
            onRender();
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

    var createCell = function(columnConfig, isHeader, addHandle){

        var cell = document.createElement('td');
        if (isHeader===true){
            setStyle(cell, "headerColumn");
        }
        else{
            setStyle(cell, "column");
        }

        cell.style.textAlign = columnConfig.align;
        
        
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

        

        var outerDiv = document.createElement("div");
        outerDiv.style.position = "relative";
        outerDiv.style.height = "100%";
        outerDiv.style.cursor = "inherit";
        cell.appendChild(outerDiv);

        var innerDiv = document.createElement("div");
        innerDiv.style.position = "absolute";
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.overflow = "hidden";
        innerDiv.style.whiteSpace = 'nowrap';
        innerDiv.style.cursor = "inherit";
        outerDiv.appendChild(innerDiv);
        cell.innerDiv = innerDiv;
        cell.setContent = setContent;
        cell.getContent = getContent;


        if (isHeader===true && addHandle===true){
            var handle = document.createElement("div");
            handle.style.position = "absolute";
            handle.style.right = 0;
            handle.style.top = 0;
            handle.style.width = "5px";
            handle.style.height = "100%"; //<-- this might be too big!
            handle.style.cursor = "col-resize";
            outerDiv.appendChild(handle);
        }

        return cell;
    };



  //**************************************************************************
  //** addRows
  //**************************************************************************
  /** Appends multiple rows to the table. On some browsers (e.g. iPad) this
   *  method is significantly faster than calling addRow() multiple times.
   *  Example: table.addRows([["Bob","12/30","$5.25"],["Jim","10/28","$7.33"]]);
   */
    this.addRows = function(rows){
        
      //Check if rows is a number
        if (!isArray(rows)){
            rows = parseInt(rows);
            if (isNaN(rows)) return;
            else{
                var numRows = rows;
                rows = [];
                var data = [];
                for (var i=0; i<config.columns.length; i++){
                    data.push("");
                }
                for (var i=0; i<numRows; i++){
                    rows.push(data);
                }
            }
        }
        
        
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
        row.selected = false;
        setStyle(row, "row");
        
        
      //Row operations
        row.set = setRowContent;
        row.onclick = selectRows;


      //Insert cells
        for (var i=0; i<config.columns.length; i++){
            var columnConfig = config.columns[i];
            var clonedColumnConfig = {};
            merge(clonedColumnConfig, columnConfig);
            var cell = createCell(clonedColumnConfig);
            cell.setContent(data[i]);
            row.appendChild(cell);
        }
        body.appendChild(row);


      //Update table as needed
        if (!deferUpdate) me.update();


        return row;
    };
    
    
  //**************************************************************************
  //** setContent
  //**************************************************************************
  /** Used to set the content of a cell.
   */
    var setContent = function(content){
        if (content==null){
            this.innerDiv.innerHTML = "";
        }
        else{
            if (typeof content === "string"){
                this.innerDiv.innerHTML = content;
            }
            else{
                this.innerDiv.innerHTML = "";
                try{
                    this.innerDiv.appendChild(content);
                }
                catch(e){
                }
            }
        }
    };
    
    
  //**************************************************************************
  //** getContent
  //**************************************************************************
  /** Returns the content of a cell.
   */
    var getContent = function(){
        if (this.innerDiv.childNodes){
            if (this.innerDiv.childNodes.length>0){
                var content = this.innerDiv.childNodes[0];
                if (content.nodeType===1) return content;
                else return this.innerDiv.innerHTML;
            }
        }
        return null;
    };


  //**************************************************************************
  //** setRowContent
  //**************************************************************************
  /** Used to set the content of a cell using a column name or index.
   */
    var setRowContent = function(key, val){
        var id = parseInt(key);
        if (isNaN(id)){
            for (var i=0; i<config.columns.length; i++){
                var columnConfig = config.columns[i];
                if (columnConfig.header===key){
                    this.childNodes[i].setContent(val);
                    return;
                }
            }
        }
        else{
            this.childNodes[id].setContent(val);
        }
    };


  //**************************************************************************
  //** selectRows
  //**************************************************************************
  /** Private method used to select rows in the grid.
   */
    var selectRows = function(event){
        var row = this;
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
            if (row.selected) { //then the row is already selected
                deselect(row);
            }
            else{ //then the row is not already selected
               select(row);
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
                    select(tr);
                }
            }
        
            me.onSelectionChange();
        
        }
        else{
            if (!row.selected){
                for (var i=1; i<body.childNodes.length; i++){
                    var tr = body.childNodes[i];
                    if (tr.selected){
                        deselect(tr);
                    }
                }

                select(row);
                me.onSelectionChange();
            }
        }
        
        prevSelection = row;
        
    };


  //**************************************************************************
  //** select
  //**************************************************************************
  /** Used to select a given row.
   */
    var select = function(row){
        row.selected=true;
        setStyle(row, "select");
    };


  //**************************************************************************
  //** deselect
  //**************************************************************************
  /** Used to deselect a given row.
   */
    var deselect = function(row){
        row.selected=false;
        setStyle(row, "row");
    };


  //**************************************************************************
  //** selectAll
  //**************************************************************************
  /** Selects all the rows in the table.
   */
    this.selectAll = function(){
        var selectionChanged = false;
        if (config.multiselect === true){
            for (var i=1; i<body.childNodes.length; i++){
                var tr = body.childNodes[i];
                if (!tr.selected){
                    select(tr);
                    selectionChanged=true;
                }
            }
            prevSelection = null;
            if (selectionChanged) me.onSelectionChange();
        }
    };


  //**************************************************************************
  //** deselectAll
  //**************************************************************************
  /** Deselects all the rows in the table.
   */
    this.deselectAll = function(){
        var selectionChanged = false;
        for (var i=1; i<body.childNodes.length; i++){
            var tr = body.childNodes[i];
            if (tr.selected){
                deselect(tr);
                selectionChanged=true;
            }
        }
        prevSelection = null;
        if (selectionChanged) me.onSelectionChange();
    };


  //**************************************************************************
  //** onSelectionChange
  //**************************************************************************
  /** Called whenever a row in the grid is selected or deselected. Selected 
   *  rows can be retrieved using the forEachRow method. Example:
      table.forEachRow(function (row, content) {
          if (row.selected) {
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
        while (body.childNodes.length>1){
            var row = body.childNodes[1];
            body.removeChild(row);
        }
        me.update();
    };


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Called whenever rows are added or removed from the table.
   */
    this.update = function(){
        
        
        me.onOverflow(me.hasOverflow());

        
        if (me.iScroll) me.iScroll.refresh();
    };
    

  //**************************************************************************
  //** hasOverflow
  //**************************************************************************
  /** Returns true if the table is overflowing. 
   */
    this.hasOverflow = function(){
        return (bodyDiv.offsetHeight < bodyDiv.scrollHeight ||
        bodyDiv.offsetWidth < bodyDiv.scrollWidth);
    };
    
    
  //**************************************************************************
  //** onOverflow
  //**************************************************************************
  /** Called whenever the table overflow status changes. 
   */
    this.onOverflow = function(hasOverflow){};


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
        bodyDiv.scrollTop = y;
    };


  //**************************************************************************
  //** getRowCount
  //**************************************************************************
  /** Returns the total number of rows in the table.
   */
    this.getRowCount = function(){
        return body.childNodes.length-1; //skip phantom row!
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

        for (var i=1; i<body.childNodes.length; i++){ //skip phantom row!
            var row = body.childNodes[i];
            var content = [];
            for (var j=0; j<row.childNodes.length; j++){ 
                var col = row.childNodes[j];
                content.push(col.getContent());
            }

            var b = callback.apply(me, [row, content]);
            if (b===true) return;
        }
    };


  //**************************************************************************
  //** updateRow
  //**************************************************************************
  /** Used to update contents of a given row.
   */
    this.updateRow = function(row, data){
        for (var i=0; i<row.childNodes.length; i++){
            var col = row.childNodes[i];
            col.setContent(data[i]);
        }
    };


  //**************************************************************************
  //** getColumnWidth
  //**************************************************************************
  /** Returns the width of a given column
   */
    this.getColumnWidth = function(index){
        return body.childNodes[0].childNodes[index].offsetWidth;
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
  //** createTable
  //**************************************************************************
    var createTable = function(){
        var table = document.createElement('table');        
        table.style.width = "100%";
        table.style.height = "100%";
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.borderCollapse = "collapse";
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        return tbody;
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