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
    var template;
    var cntrlIsPressed = false;
    var shiftIsPressed = false;
    var altIsPressed = false;

    var defaultConfig = {

        multiselect: false,
        overflow: true,

        style: {

            table: {
                width:  "100%",
                height:  "100%",
                margin:  0,
                padding:  0,
                borderCollapse:  "collapse"
            },

            headerRow: {
                height: "35px",
                borderBottom: "1px solid #8f8f8f",
                background: "#eaeaea"
            },

            headerColumn: {
                lineHeight: "35px",
                borderLeft: "1px solid #cccccc",
                borderRight: "1px solid #cccccc",
                padding: "0 5px",
                color: "#272727",
                cursor: "pointer",
                whiteSpace: "nowrap"
            },

            row: {
                height: "35px",
                borderBottom: "1px solid #cccccc"
            },

            column: {
                height: "35px",
                lineHeight: "35px",
                borderLeft: "1px solid #cccccc",
                borderRight: "1px solid #cccccc",
                padding: "0 5px",
                color: "#272727",
                cursor: "default",
                whiteSpace: "nowrap"
            },

            selectedRow: {
                height: "35px",
                borderBottom: "1px solid #cccccc",
                backgroundColor: "#FFFFB1"
            },

            resizeHandle: {
                width: "5px",
                cursor: "col-resize",
                marginRight: "-2px"
            },


            iscroll: null //If null or false, uses inline style. If "custom",
            //uses, "iScrollHorizontalScrollbar", "iScrollVerticalScrollbar",
            //and "iScrollIndicator" classes. You can also define custom class
            //names by providing a style map like this:
            /*
            iscroll: {
                horizontalScrollbar: "my-iScrollHorizontalScrollbar",
                verticalScrollbar: "my-iScrollVerticalScrollbar",
                indicator: "my-iScrollIndicator"
            }
            */
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
        setStyle(table, "table");
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
        bodyDiv.tabIndex = -1; //allows the div to have focus
        bodyDiv.onmouseover = function(){
            this.focus();
        };
        bodyDiv.addEventListener("keydown", function(e){
            if (e.keyCode===16){
                shiftIsPressed = true;
            }

            if (e.keyCode===17){
                cntrlIsPressed = true;
            }

            if (e.keyCode===18){
                altIsPressed = true;
            }
        });
        bodyDiv.addEventListener("keyup", function(e){
            if (e.keyCode===16){
                shiftIsPressed = false;
            }

            if (e.keyCode===17){
                cntrlIsPressed = false;
            }

            if (e.keyCode===18){
                altIsPressed = false;
            }

            if (e.keyCode===38 || e.keyCode===40){

                var lastSelectedRow, lastRow;
                var selectPrevious = function(){
                    var prevRow = lastSelectedRow.previousSibling;
                    if (prevRow) prevRow.click();
                };
                me.forEachRow(function (row) {
                    if (row.selected){
                        lastSelectedRow = row;
                    }
                    else{
                        if (lastSelectedRow){
                            if (e.keyCode===40){ //down arrow
                                row.click();
                            }
                            else{ //up arrow
                                selectPrevious();
                            }
                            return true;
                        }
                    }
                    lastRow = row;
                });

                if (e.keyCode===38 && lastRow===lastSelectedRow){
                    selectPrevious();
                }
            }

            me.onKeyEvent(e.keyCode, {
                shift: shiftIsPressed,
                ctrl: cntrlIsPressed,
                alt: altIsPressed
            });
        });
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

          //Update right aligned columns to have center align headers
            var align = columnConfig.align;
            if (align=="right") columnConfig.align = "center";

          //Create cell
            var cell = createCell(columnConfig, true, i);

          //Reset alignment in the config
            columnConfig.align = align;

          //Set content
            cell.setContent(columnConfig.header);

          //Create label/alias (see setRowContent)
            if (typeof columnConfig.header === "string"){
                columnConfig.label = columnConfig.header;
            }
            else{
                columnConfig.label = columnConfig.header.innerText;
            }

          //OnClick events
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
        tr.appendChild(document.createElement("td")); //<-- add cell under the spacer




      //Populate body
        createPhantomRow(body, 1);




      //Function called after the table has been added to the DOM
        onRender(bodyDiv, function(){

            var onScroll = function(scrollTop){
                var maxScrollPosition = bodyDiv.scrollHeight - bodyDiv.clientHeight;
                me.onScroll(scrollTop, maxScrollPosition, bodyDiv.offsetHeight);
            };


          //Configure iScroll as needed and watch for scroll events
            if (typeof IScroll !== 'undefined'){
                bodyDiv.style.overflowY = 'hidden';
                me.iScroll = new IScroll(bodyDiv, {
                    scrollbars: config.style.iscroll ? "custom" : true,
                    mouseWheel: true, //enable scrolling with mouse wheel
                    fadeScrollbars: false,
                    hideScrollbars: false
                });
                if (config.style.iscroll) setStyle(me.iScroll, "iscroll");



                me.iScroll.on('scrollEnd', function(){
                    onScroll(-me.iScroll.y);
                });
            }
            else{
                if (config.overflow===false) bodyDiv.style.overflowY = 'hidden';
                bodyDiv.onscroll = function(){
                    onScroll(bodyDiv.scrollTop);
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
        });
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

    var createCell = function(columnConfig, isHeader, idx){

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


      //Create overflow divs
        var outerDiv = document.createElement("div");
        outerDiv.style.position = "relative";
        outerDiv.style.height = "100%";
        //outerDiv.style.cursor = "inherit";
        cell.appendChild(outerDiv);

        var innerDiv = document.createElement("div");
        innerDiv.style.position = "absolute";
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.overflow = "hidden";
        //innerDiv.style.whiteSpace = "inherit";
        //innerDiv.style.cursor = "inherit";
        outerDiv.appendChild(innerDiv);


      //Add resize handle
        if (columnConfig.resizable===true){
            if (isHeader && idx<config.columns.length-1){
                var handle = document.createElement("div");
                setStyle(handle, "resizeHandle");
                handle.style.position = "absolute";
                handle.style.right = 0;
                handle.style.top = 0;
                handle.style.height = "100%";
                outerDiv.appendChild(handle);
            }
        }


      //Set custom properties on the cell. Note that these
      //properties will be lost if the cell is cloned.
        cell.innerDiv = innerDiv;
        cell.setContent = setContent;
        cell.getContent = getContent;

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
   *  Note that this method also accepts an array of values.
   *  Example: table.addRow(["Bob","12/30","$5.25"]);
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


      //Add custom functions to the row
        row.get = getRowContent;
        row.set = setRowContent;
        row.onclick = selectRows;


      //Create template as needed. The template is a collection of cells that
      //are cloned whenever a new row is added. This approach results in faster
      //row rendering.
        if (!template){
            template = [];
            for (var i=0; i<config.columns.length; i++){
                var columnConfig = config.columns[i];
                var clonedColumnConfig = {};
                merge(clonedColumnConfig, columnConfig);
                var cell = createCell(clonedColumnConfig);
                template.push(cell);
            }
        }


      //Insert cells
        for (var i=0; i<config.columns.length; i++){
            var cell = template[i].cloneNode(true);
            cell.innerDiv = cell.firstChild.firstChild;
            cell.setContent = setContent;
            cell.getContent = getContent;
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
        if (content==null || typeof content === "undefined"){
            this.innerDiv.innerHTML = "";
        }
        else{

            if (isElement(content)){
                this.innerDiv.innerHTML = "";
                try{
                    this.innerDiv.appendChild(content);
                    return;
                }
                catch(e){
                }
            }

            this.innerDiv.innerHTML = content;
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
  //** getRowContent
  //**************************************************************************
  /** Returns the content of a cell using a column name or index.
   */
    var getRowContent = function(key){
        var id = parseInt(key);
        if (isNaN(id)){
            for (var i=0; i<config.columns.length; i++){
                var columnConfig = config.columns[i];
                var label = columnConfig.label;
                if (label===key){
                    return this.childNodes[i].getContent();
                }
            }
        }
        else{
            return this.childNodes[id].getContent();
        }
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
                var label = columnConfig.label;
                if (label===key){
                    this.childNodes[i].setContent(val);
                    return;
                }
            }
        }
        else{
            if (id<0 || id>config.columns.length-1) return;
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
        me.onRowClick(row, event);
        var rows = [row];

        var selectRow = function(){
            for (var i=1; i<body.childNodes.length; i++){
                var tr = body.childNodes[i];
                if (tr.selected){
                    me.deselect(tr);
                    rows.push(tr);
                }
            }
            me.select(row);
        };


        //config.multiselect = false;
        if (config.multiselect === true){

            var e;
            if (event) e = event;
            else{ if (window.event) e = window.event; }


            if (row.selected){
                if (e.ctrlKey){
                    me.deselect(row);
                    for (var i=1; i<body.childNodes.length; i++){
                        var tr = body.childNodes[i];
                        if (tr.selected && tr!=row){
                            rows.push(tr);
                        }
                    }
                }
                else{
                    var selectedRows = 0;
                    for (var i=1; i<body.childNodes.length; i++){
                        var tr = body.childNodes[i];
                        if (tr.selected){
                            if (tr!=row) {
                                me.deselect(tr);
                                rows.push(tr);
                                selectedRows++;
                            }
                        }
                    }
                    if (selectedRows===0) me.deselect(row);
                }
            }
            else{
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

                    var selectedRows = [];
                    for (var i = Math.min(currID, prevID); i <= Math.max(currID, prevID); i++){
                        var tr = tbody.childNodes[i];
                        me.select(tr);
                        if (tr!=row){
                            rows.push(tr);
                        }
                        selectedRows.push(tr);
                    }
                    for (var i=1; i<body.childNodes.length; i++){
                        var tr = body.childNodes[i];
                        if (tr.selected){
                            var deselect = true;
                            for (var j=0; j<selectedRows.length; j++){
                                var selectedRow = selectedRows[j];
                                if (tr==selectedRow){
                                    deselect = false;
                                }
                            }
                            if (deselect){
                                me.deselect(tr);
                                rows.push(tr);
                            }
                        }
                    }
                }
                else{
                    if (e.ctrlKey){
                        me.select(row);
                        for (var i=1; i<body.childNodes.length; i++){
                            var tr = body.childNodes[i];
                            if (tr.selected && tr!=row){
                                rows.push(tr);
                            }
                        }
                    }
                    else{
                        selectRow();
                    }
                }
            }
        }
        else{
            if (row.selected){
                me.deselect(row);
            }
            else {
                selectRow();
            }
        }


        me.onSelectionChange(rows);
        prevSelection = row;
    };


  //**************************************************************************
  //** select
  //**************************************************************************
  /** Used to select a given row.
   */
    this.select = function(row){
        if (row.selected) return;
        row.selected=true;
        setStyle(row, "selectedRow");
    };


  //**************************************************************************
  //** deselect
  //**************************************************************************
  /** Used to deselect a given row.
   */
    this.deselect = function(row){
        if (row.selected){
            row.selected=false;
            setStyle(row, "row");
        }
    };


  //**************************************************************************
  //** selectAll
  //**************************************************************************
  /** Selects all the rows in the table.
   */
    this.selectAll = function(){
        var rows = [];
        if (config.multiselect === true){
            for (var i=1; i<body.childNodes.length; i++){
                var tr = body.childNodes[i];
                if (!tr.selected){
                    me.select(tr);
                    rows.push(tr);
                }
            }
            prevSelection = null;
            if (rows.length) me.onSelectionChange(rows);
        }
    };


  //**************************************************************************
  //** deselectAll
  //**************************************************************************
  /** Deselects all the rows in the table.
   */
    this.deselectAll = function(){
        var rows = [];
        for (var i=1; i<body.childNodes.length; i++){
            var tr = body.childNodes[i];
            if (tr.selected){
                me.deselect(tr);
                rows.push(tr);
            }
        }
        prevSelection = null;
        if (rows.length>0) me.onSelectionChange(rows);
    };


  //**************************************************************************
  //** onSelectionChange
  //**************************************************************************
  /** Called whenever a row in the grid is selected or deselected. Contents of
   *  the selected rows can be retrieved using the getContent method. Example:
    <pre>
        table.onSelectionChange = function(rows){
            for (var i=0; i<rows.length; i++){
                var row = rows[i];
                if (row.selected){

                  //Get content of the first cell
                    var cells = row.childNodes;
                    var cell = cells[0].getContent();

                  //Alternatively, get content via the row.get() method
                    var cell = row.get(0);
                }
                else{

                }
            }
        };
    </pre>
    @param rows An array of rows that have had thier selection changed
   */
    this.onSelectionChange = function(rows){};



  //**************************************************************************
  //** onRowClick
  //**************************************************************************
  /** Called whenever a row in the table is clicked. Use the onSelectionChange
   *  event listener to determine whether selection has changed.
   */
    this.onRowClick = function(row, e){};


  //**************************************************************************
  //** onHeaderClick
  //**************************************************************************
  /** Called whenever a header cell is clicked.
   */
    this.onHeaderClick = function(idx, colConfig, cell, event){};


  //**************************************************************************
  //** onKeyEvent
  //**************************************************************************
    this.onKeyEvent = function(keyCode, modifiers){};


  //**************************************************************************
  //** focus
  //**************************************************************************
    this.focus = function(){
        bodyDiv.parentNode.focus();
    };


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
    this.onScroll = function(y, maxY, h){};


  //**************************************************************************
  //** scrollTo
  //**************************************************************************
    this.scrollTo = function(x, y){
        bodyDiv.scrollTop = y;

        var maxScrollPosition = bodyDiv.scrollHeight - bodyDiv.clientHeight;
        me.onScroll(y, maxScrollPosition, bodyDiv.offsetHeight);
    };


  //**************************************************************************
  //** getScrollInfo
  //**************************************************************************
    this.getScrollInfo = function(){
        return {
            y: bodyDiv.scrollTop,
            h: bodyDiv.offsetHeight,
            maxY: bodyDiv.scrollHeight - bodyDiv.clientHeight
        };
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
  //** removeRow
  //**************************************************************************
  /** Used to remove a row from the table and update the scroll.
   */
    this.removeRow = function(row){
        var scrollInfo = me.getScrollInfo();
        var x = scrollInfo.x;
        var y = scrollInfo.y;
        var h = row.offsetHeight;
        body.removeChild(row);
        me.update();
        me.scrollTo(x, y-h);
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
  //** showColumn
  //**************************************************************************
  /** Used to render a column if it is hidden
   */
    this.showColumn = function(idx){
        var numColumns = header.childNodes[0].childNodes.length;
        if (idx>=numColumns) return;
        //if (header.childNodes[0].childNodes[idx].style.display!="none") return;
        var rows = nodeListToArray(header.childNodes);
        rows = rows.concat(nodeListToArray(body.childNodes));
        for (var i=0; i<rows.length; i++){
            var cols = rows[i].childNodes;
            cols[idx].style.visibility = "";
            cols[idx].style.display = "";
        }
    };


  //**************************************************************************
  //** hideColumn
  //**************************************************************************
  /** Used to hide column
   */
    this.hideColumn = function(idx){
        var numColumns = header.childNodes[0].childNodes.length;
        if (idx>=numColumns) return;
        if (header.childNodes[0].childNodes[idx].style.display=="none") return;
        var rows = nodeListToArray(header.childNodes);
        rows = rows.concat(nodeListToArray(body.childNodes));
        for (var i=0; i<rows.length; i++){
            var cols = rows[i].childNodes;

            cols[idx].style.visibility = "hidden";
            cols[idx].style.display = "none";
        }
    };


  //**************************************************************************
  //** nodeListToArray
  //**************************************************************************
  /** Converts a nodelist into a standard javascript array.
   */
    var nodeListToArray = function(nodeList){
        var arr = [];
        for (var i=0; i<nodeList.length; i++){
            arr.push(nodeList[i]);
        }
        return arr;
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
        var table = javaxt.dhtml.utils.createTable();
        return table.firstChild;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var onRender = javaxt.dhtml.utils.onRender;
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;
    var isArray = javaxt.dhtml.utils.isArray;
    var isElement = javaxt.dhtml.utils.isElement;
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };


    init();
};
