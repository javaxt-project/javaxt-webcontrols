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
    var mask;
    var prevSelection;
    var template;
    var cntrlIsPressed = false;
    var shiftIsPressed = false;
    var altIsPressed = false;

    var defaultConfig = {

      /** Column definitions for the table. This config is required. Example:
        <pre>
        columns: [
            {header: 'ID', hidden:true},
            {header: 'Name', width:'100%'},
            {header: 'Username', width:'150'},
            {header: 'Role', width:'100'},
            {header: 'Enabled', width:'80', align:'center'},
            {header: 'Last Active', width:'150', align:'right'}
        ]
        </pre>
        Column headers are used as labels in the header row. They are also
        used as column identifiers using the get and set methods for a row.
        <p/>
        Column widths can be defined using percentages (e.g. '100%') or in
        pixels (e.g. '100px' or '100' or 100). Normally, there should be one
        column with a width of '100%'. This will allow the column fill all
        available area not occupied by columns with fixed column widths. The
        only exception is to define multiple columns with percentages as long
        as all the percentages add up to 100%.
        <p/>
        Column alignment is used to set the alignment of the cells associated
        with the column. Options include 'left', 'right', and 'center'.
       */
        columns: [],


      /** If true, the table will allow users to select multiple rows using
       *  control or shift key. Default is false (only one row is selected at
       *  a time).
       */
        multiselect: false,


      /** If true, the table will render a vertical scrollbar, allowing users
       *  to scroll up/down and see rows that are out of view. If false, the
       *  scrollbar is hidden from view. Default is true.
       */
        overflow: true,


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
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

            mask: {
                backgroundColor: "rgba(0,0,0,0.5)"
            },

          /** Style for iScroll (if present). If the style is set to null or
           *  false, uses inline style. If a "custom" keyword is given, will
           *  use "iScrollHorizontalScrollbar", "iScrollVerticalScrollbar",
           *  and "iScrollIndicator" classes defined in your css. You can also
           *  define custom class names by providing a style map like this:
            <pre>
            iscroll: {
                horizontalScrollbar: "my-iScrollHorizontalScrollbar",
                verticalScrollbar: "my-iScrollVerticalScrollbar",
                indicator: "my-iScrollIndicator",
                columnWidth: "15px"
            }
            </pre>
           */
            iscroll: null
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


      //Parse config
        if (!config.columns || config.columns.length===0) return;
        if (typeof IScroll !== 'undefined'){
            var columnWidth = config.style.iscroll ? config.style.iscroll.columnWidth : null;
            if (!columnWidth) columnWidth = "15px";

            if (columnWidth<=0 || columnWidth==="0px" || columnWidth==="0%"){
                //Allow users to not have a spacer for iScroll
            }
            else{
                config.columns.push({header: '', width: columnWidth});
            }
        }


      //Create main table
        var table, tr, td;
        table = createTable(parent);
        table.setAttribute("desc", me.className);
        setStyle(table, "table");
        me.el = table;
        addShowHide(me);

        addMask(parent);


      //Create header
        tr = table.addRow();
        tr.setAttribute("desc", "Header Row");
        setStyle(tr, "headerRow");
        td = tr.addColumn();
        td.style.width = "100%";
        td.style.height = "inherit";
        header = createTable(td);



      //Create body
        tr = table.addRow();
        tr.setAttribute("desc", "Body Row");
        td = tr.addColumn({
            width: "100%",
            height: "100%"
        });


        bodyDiv = createElement('div', td, {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        bodyDiv.setAttribute("desc", "body-div");
        bodyDiv.tabIndex = -1; //allows the div to have focus
        bodyDiv.onmouseover = function(){
            var x = window.scrollX, y = window.scrollY;
            this.focus();
            window.scrollTo(x, y);
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


          //Prevent window from scrolling
            if (e.keyCode===38 || e.keyCode===40){
                e.preventDefault();
                e.stopPropagation();
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
                me.forEachRow(function (row) {
                    if (row.selected){
                        lastSelectedRow = row;
                    }
                    lastRow = row;
                });


                if (lastSelectedRow){
                    var row;
                    if (e.keyCode===40){ //down arrow
                        row = lastSelectedRow.nextSibling;
                    }
                    else{ //up arrow
                        row = lastSelectedRow.previousSibling;
                    }

                    if (row){
                        me.scrollTo(row);
                        row.click();
                    }
                }

            }

            me.onKeyEvent(e.keyCode, {
                shift: shiftIsPressed,
                ctrl: cntrlIsPressed,
                alt: altIsPressed
            });
        });



        bodyDiv = createElement('div', bodyDiv, {
            width: "100%",
            height: "100%",
            position: "absolute",
            overflow: "scroll",
            overflowX: "hidden"
        });
        body = createTable(bodyDiv);
        body.style.height = '';



      //Populate header
        tr = createPhantomRow(header, 1);
        var spacerUR = createElement('div', tr.addColumn());


        tr = header.addRow();
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
        tr.addColumn(); //<-- add cell under the spacer




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


                me.iScroll.on('scrollStart', function(){
                    onScroll(-me.iScroll.y);
                });

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
            var tableWidth = body.offsetWidth;
            var scrollWidth = Math.abs(bodyWidth-tableWidth);
            spacerUR.style.width = scrollWidth + "px";


          //Watch for resize events
            addResizeListener(parent, function(){
                mask.resize();
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
    var createPhantomRow = function(table, height){
        var row = table.addRow();
        for (var i=0; i<config.columns.length; i++){

            var columnConfig = config.columns[i];
            var clonedColumnConfig = {};
            merge(clonedColumnConfig, columnConfig);

            var cell = row.addColumn();
            cell.style.height = getPixels(height);


            if (columnConfig.hidden === true){
                cell.style.visibility = 'hidden';
                cell.style.display = 'none';
                cell.style.width = '0px';
            }
            else{
                var columnWidth = columnConfig.width;
                cell.style.width = getPixels((columnWidth==null) ? 25 : columnWidth);
                var minWidth = columnConfig.minWidth;
                if (minWidth) cell.style.minWidth = getPixels(minWidth);
            }

            var x = createElement("div", cell);
            x.style.width = getPixels(((columnWidth+"").indexOf("%")>-1) ? 25 : columnWidth);
            x.style.height = getPixels(height);
        }
        return row;
    };


  //**************************************************************************
  //** createCell
  //**************************************************************************

    var createCell = function(columnConfig, isHeader, idx){

        var cell = createElement('td');
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
        var outerDiv = createElement("div", cell, {
            position: "relative",
            height: "100%"
        });

        var innerDiv = createElement("div", outerDiv, {
            position: "absolute",
            width: "100%",
            height: "100%",
            overflow: "hidden"
        });


      //Add resize handle
        if (columnConfig.resizable===true){
            if (isHeader && idx<config.columns.length-1){
                var handle = createElement("div", outerDiv);
                setStyle(handle, "resizeHandle");
                handle.style.position = "absolute";
                handle.style.right = 0;
                handle.style.top = 0;
                handle.style.height = "100%";
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
   *  Example:
   <pre>
    table.addRows([
        ["Bob","12/30","$5.25"],
        ["Jim","10/28","$7.33"]
    ]);
   </pre>
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
   *  Example:
   <pre>
    table.addRow("Bob","12/30","$5.25");
   </pre>
   *  Note that this method also accepts an array of values. Example:
   <pre>
    table.addRow(["Bob","12/30","$5.25"]);
   </pre>
   */
    this.addRow = function(){

        var data = arguments;


      //Check if the first argument is an array. If so, use it.
      //Otherwise, we'll use all the arguments as data.
        if (isArray(data[0])) data = data[0];


      //Create row
        var row = body.addRow();
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
        var rows = [row];

        var selectRow = function(){
            var childNodes = body.getRows();
            for (var i=1; i<childNodes.length; i++){
                var tr = childNodes[i];
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
                    var childNodes = body.getRows();
                    for (var i=1; i<childNodes.length; i++){
                        var tr = childNodes[i];
                        if (tr.selected && tr!=row){
                            rows.push(tr);
                        }
                    }
                }
                else{
                    var selectedRows = 0;
                    var childNodes = body.getRows();
                    for (var i=1; i<childNodes.length; i++){
                        var tr = childNodes[i];
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
                    var childNodes = body.getRows();
                    for (var i=1; i<childNodes.length; i++){
                        var tr = childNodes[i];
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
                        var childNodes = body.getRows();
                        for (var i=1; i<childNodes.length; i++){
                            var tr = childNodes[i];
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


        me.onRowClick(row, event);
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
            var childNodes = body.getRows();
            for (var i=1; i<childNodes.length; i++){
                var tr = childNodes[i];
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
        var childNodes = body.getRows();
        for (var i=1; i<childNodes.length; i++){
            var tr = childNodes[i];
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
  /** Called whenever a keyboard event is initiated from the table.
   */
    this.onKeyEvent = function(keyCode, modifiers){};


  //**************************************************************************
  //** focus
  //**************************************************************************
  /** Used to set browser focus on the table.
   */
    this.focus = function(){
        var x = window.scrollX, y = window.scrollY;
        bodyDiv.parentNode.focus();
        window.scrollTo(x, y);
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
  /** Removes all the rows from the table
   */
    this.clear = function(){
        me.deselectAll();
        var childNodes = body.getRows();
        while (childNodes.length>1){
            body.removeRow(childNodes[1]);
            childNodes = body.getRows();
        }
        me.update();
    };


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to refresh the scroll bars. This method is called internally
   *  whenever rows are added or removed from the table.
   */
    this.update = function(){
        if (me.iScroll) me.iScroll.refresh();
        me.onOverflow(me.hasOverflow());
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
  /** Used to scroll to a specific x/y location when the table has an
   *  overflow.
   *  @param x Accepts an x position (integer) or a row in the table
   *  @param y Accepts a y position. Ignored if x is a row.
   */
    this.scrollTo = function(x, y){

        var bodyRect = javaxt.dhtml.utils.getRect(bodyDiv);


      //If x is a row, compute the y offset
        if (isElement(x)){

            var rowRect = javaxt.dhtml.utils.getRect(x);
            var padding = rowRect.height/2;
            var padRect = {
                left: bodyRect.left,
                right: bodyRect.right,
                top: bodyRect.top+padding,
                bottom: bodyRect.bottom-padding
            };


            if (!javaxt.dhtml.utils.intersects(padRect, rowRect)){

                var scrollInfo = me.getScrollInfo();
                var ry = rowRect.top + scrollInfo.y;

                if (ry>bodyRect.bottom){

                    //console.log("scroll down!");
                    y = ry+rowRect.height-bodyRect.bottom;

                }
                else if (ry+rowRect.height>bodyRect.top){

                    //console.log("scroll up!");
                    y = ry-bodyRect.top;

                }
                else{
                    //console.log("scroll?");
                }
            }
        }


        if (!isNumber(y)) return;


      //Update the scroll position
        if (me.iScroll){
            me.iScroll.scrollTo(0, -y);
        }
        else{
            bodyDiv.scrollTop = y;
        }


      //Fire the onScroll event
        var maxY = bodyDiv.scrollHeight - bodyDiv.clientHeight;
        me.onScroll(y, maxY, bodyRect.height);
    };


  //**************************************************************************
  //** getScrollInfo
  //**************************************************************************
  /** Returns scroll position and dimenstions for the visible area.
   */
    this.getScrollInfo = function(){
        return {
            x: me.iScroll ? -me.iScroll.x : bodyDiv.scrollLeft,
            y: me.iScroll ? -me.iScroll.y : bodyDiv.scrollTop,
            w: bodyDiv.offsetWidth,
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
        return body.getRows().length-1; //skip phantom row!
    };


  //**************************************************************************
  //** forEachRow
  //**************************************************************************
  /** Used to traverse all the rows in the table and extract contents of each
   *  cell. Example:
   <pre>
    table.forEachRow(function (row, content) {
        console.log(content);
    });
   </pre>
   *
   *  Optional: return true in the callback function if you wish to stop
   *  processing rows.
   */
    this.forEachRow = function(callback){
        if (callback==null) return;

        var childNodes = body.getRows();
        for (var i=1; i<childNodes.length; i++){ //skip phantom row!
            var row = childNodes[i];
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
        body.removeRow(row);
        me.update();
        me.scrollTo(x, y-h);
    };


  //**************************************************************************
  //** getColumnWidth
  //**************************************************************************
  /** Returns the width of a given column
   */
    this.getColumnWidth = function(index){
        var childNodes = body.getRows();
        return childNodes[0].childNodes[index].offsetWidth;
    };


  //**************************************************************************
  //** showColumn
  //**************************************************************************
  /** Used to render a column if it is hidden
   */
    this.showColumn = function(idx){
        var headerRows = header.getRows();
        var numColumns = headerRows[0].childNodes.length;
        if (idx>=numColumns) return;
        var childNodes = body.getRows();
        //if (readerRows[0].childNodes[idx].style.display!="none") return;
        var rows = nodeListToArray(headerRows);
        rows = rows.concat(nodeListToArray(childNodes));
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
        var headerRows = header.getRows();
        var numColumns = headerRows[0].childNodes.length;
        if (idx>=numColumns) return;
        var childNodes = body.getRows();
        if (childNodes[0].childNodes[idx].style.display=="none") return;
        var rows = nodeListToArray(headerRows);
        rows = rows.concat(nodeListToArray(childNodes));
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
  //** addMask
  //**************************************************************************
    var addMask = function(parent){

        mask = createElement("div", parent, config.style.mask);
        mask.style.position = "absolute";
        mask.style.top = 0;
        mask.style.left = 0;

        var resize = function(){
            var rect = javaxt.dhtml.utils.getRect(me.el);
            mask.style.top = rect.top;
            mask.style.left = rect.left;
            mask.style.width = rect.width + "px";
            mask.style.height = rect.height + "px";
        };

        mask.show = function(){
            resize();
            var highestElements = getHighestElements(parent);
            var zIndex = highestElements.zIndex;
            if (!highestElements.contains(mask)) zIndex++;
            mask.zIndex = zIndex;
            mask.style.visibility = '';
            mask.style.display = '';
        };
        mask.hide = function(){
            mask.style.visibility = 'hidden';
            mask.style.display = 'none';
        };
        mask.isVisible = function(){
            return !(mask.style.visibility === 'hidden' && mask.style.display === 'none');
        };
        mask.resize = function(){
            if (mask.isVisible()){
                resize();
            }
        };
        mask.hide();
    };


  //**************************************************************************
  //** getMask
  //**************************************************************************
  /** Returns the mask element associated with the table. A mask is a simple
   *  DOM element with custom show() and hide() methods and is rendered over
   *  the grid control. The mask is typically used to prevent users from
   *  interacting with the grid during load events (e.g. show mask before
   *  load and hide after data is rendered) or to indicate that the table is
   *  disabled.
   */
    this.getMask = function(){
        return mask;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var onRender = javaxt.dhtml.utils.onRender;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;
    var isArray = javaxt.dhtml.utils.isArray;
    var isNumber = javaxt.dhtml.utils.isNumber;
    var isElement = javaxt.dhtml.utils.isElement;
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var getHighestElements = javaxt.dhtml.utils.getHighestElements;

    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };


    init();
};
