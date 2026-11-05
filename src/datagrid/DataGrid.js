if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  DataGrid
//******************************************************************************
/**
 *   Scrollable table with a fixed header. Supports remote loading, sorting,
 *   and infinite scroll via HTTP.
 *   <br/>
 *   Here's a simple example of how to instantiate a DataGrid that will render
 *   a list of users returned from a REST endpoint:
 <pre>
    var grid = new javaxt.dhtml.DataGrid(parent, {

      //Set style
        style: config.style.table,

      //Define columns
        columns: [
            {header: 'ID', hidden:true},
            {header: 'Name', width:'100%'},
            {header: 'Role', width:'240'},
            {header: 'Enabled', width:'75', align:'center'},
            {header: 'Last Active', width:'175', align:'right'}
        ],

      //Set path to REST endpoint to get list of users
        url: "/manage/users",

      //Define function used to parse the response
        parseResponse: function(request){
            return JSON.parse(request.responseText);
        },

      //Define function used to render data for individual rows
        update: function(row, user){
            row.set('Name', user.fullname);
            row.set('Role', user.role);
            var status = user.status;
            if (status===1){
                row.set('Enabled', createElement("i", "fas fa-check"));
            }
        },

      //Set flag to automatically load data once the component is rendered
        autoload: true
    });
 </pre>
 *   Once the grid is instantiated you can call any of the public methods. You
 *   can also add event listeners by overriding any of the public "on" or
 *   "before" methods like this:
 <pre>
    grid.onRowClick = function(row, e){
        console.log(row.record);
    };
 </pre>
 *
 ******************************************************************************/

javaxt.dhtml.DataGrid = function(parent, config) {
    this.className = "javaxt.dhtml.DataGrid";

    var me = this;
    var table;
    var mask;

    var currPage = 1;
    var eof = false;
    var pageRequests = {};
    var loading = false;

  //Paging variables used to keep track of changes to the grid
    var lastPage = 0; //highest page loaded from the server
    var offsetShift = 0; //adjustment to the server offset (<=0) for removed rows
    var removedKeys = {}; //keys of records removed from the grid
    var requestID = 0; //incremented whenever the grid is cleared (see load)

    var checkboxHeader;
    var checkAnchor = null; //last row whose checkbox was clicked (start of a shift+click range)
    var checkedTimer; //used to coalesce onCheckedChange events
    var columns;
    var rowHeight; //<-- Assumes all the rows are the same height!


  //Legacy config parameters
    var filterName, filter;



  //Create default style
    var defaultStyle = {};
    if (javaxt.dhtml.style){
        if (javaxt.dhtml.style.default){
            var tableStyle = javaxt.dhtml.style.default.table;
            if (tableStyle){
                defaultStyle = tableStyle;
                var checkboxStyle = javaxt.dhtml.style.default.checkbox;
                defaultStyle.checkbox = checkboxStyle;
            }
        }
    }



  //Set default config
    var defaultConfig = {


      /** Style config. See default styles in javaxt.dhtml.Table for a list of
       *  options. In addition to the table styles, you can also specify a
       *  checkbox style.
       */
        style: defaultStyle,

      /** Used to define columns to display. Each entry in the array should
       *  include a "header" label (see example above) along with a "width".
       *  Note that one of the columns should have a width of 100%. Additional
       *  options include "align" and "field". If a "field" is provided it will
       *  be used to construct a "fields" parameter to that is sent to the
       *  server (see "fields" config). You can also specify a checkbox column
       *  (e.g. header: 'x') to support multi-select operations.
       */
        columns: [],

      /** The URL endpoint that this component uses to fetch records
       */
        url: "",

      /** JSON object with key/value pairs that are appended to the URL
       */
        params: null,

      /** Data to send in the body of the request. This parameter is optional.
       *  If payload is not null, the component executes a POST request.
       */
        payload: null,

      /** If true, and if the payload is empty, will sent params as a URL
       *  encoded string in a POST request. Otherwise the params will be
       *  appended to the query string in the request URL. Default is false.
       */
        post: false,

      /** Used to specify the page size (i.e. the maximum number records to
       *  fetch from the server at a time). Default is 50.
       */
        limit: 50,

      /** If true, the server will be asked to return a total record count by
       *  setting the "count" parameter to true when requesting the first page.
       *  Otherwise, the count parameter is set to false. Note that the count
       *  is NOT required for pagination and is not used internally in any way.
       *  Rather it is for informational purposes only. Default is false.
       */
        count: false,

      /** If true, the grid will automatically fetch records from the server
       *  on start-up. Default is false.
       */
        autoload: false,

      /** If true, the grid will sort values in the grid locally using whatever
       *  data is available. If fetching data from a remote server, recommend
       *  setting localSort to false (default)
       */
        localSort: false,

      /** Optional list of field names used to specify which database fields
       *  should be returned from the server. If not provided, uses the "field"
       *  attributes in the column definition. If both are provided, the list
       *  of fields are merged into a unique list.
       */
        fields: [],

      /** If true, will hide the header row. Default is false.
       */
        hideHeader: false,

      /** If true, the table will allow users to select multiple rows using
       *  control or shift key. Default is false (only one row is selected at
       *  a time).
       */
        multiselect: false,

      /** Default method used to get responses from the server. Typically, you
       *  do not need to override this method.
       */
        getResponse: function(url, payload, callback){


          //Transform GET request into POST request if possible. This will
          //tidy up the URLs and reduce log size
            var contentType;
            if (!payload && config.post==true){
                contentType = "application/x-www-form-urlencoded";
                var idx = url.indexOf("?");
                if (idx>-1){
                    payload = url.substring(idx+1);
                    url = url.substring(0, idx);
                }
            }


          //Get response
            javaxt.dhtml.utils.get(url, {
                payload: payload,
                contentType: contentType,
                success: function(text, xml, url, request){
                    callback.apply(me, [request]);
                },
                failure: function(request){
                    callback.apply(me, [request]);
                }
            });
        },

      /** Default method used to parse responses from the server. Should return
       *  an array of rows with an array of values in each row. Example:
       *  [["Bob","12/30","$5.25"],["Jim","10/28","$7.33"]]
       */
        parseResponse: function(request){
            return [];
        },

      /** Default method used to update a row with values. This method can be
       *  overridden to render values in a variety of different ways (e.g.
       *  different fonts, links, icons, etc). The row.set() method accepts
       *  strings, numbers, and DOM elements.
       */
        update: function(row, record){
            for (var i=0; i<record.length; i++){
                row.set(i, record[i]);
            }
        },

      /** DOM element with custom show() and hide() methods. The mask is
       *  typically rendered over the grid control to prevent users from
       *  interacting with the grid during load events. It is rendered before
       *  load and is hidden after data is rendered. If a mask is not defined,
       *  a simple mask will be created automatically using the "mask" style
       *  config.
       */
        mask: null,

      /** Name of a field used to uniquely identify records. The given key is
       *  used to deduplicate rows. If a key is not provided or if records
       *  returned from the server don't include a matching key, rows will be
       *  blindly added to the grid (no deduplication). Default is "id".
       */
        key: "id"
    };



  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Merge config with default config
        config = merge(config, defaultConfig);



      //Extract required config variables
        filterName = config.filterName;
        if (config.sort==="local") config.localSort = true;
        if (config.fields){
            if (!isArray(config.fields)){
                config.fields = config.fields.split(",");
            }
        }
        else{
            config.fields = [];
        }


      //Parse column config
        var multiselect = config.multiselect;
        columns = [];
        for (var i=0; i<config.columns.length; i++){
            var column = config.columns[i];


          //Set "fields" class variable
            if (column.field){
                var addField = true;
                for (var j=0; j<config.fields.length; j++){
                    if (config.fields[j]==column.field){
                        addField = false;
                        break;
                    }
                }
                if (addField) config.fields.push(column.field);
            }
            else{
              //Don't allow remote sorting on columns without a field name
                if (config.localSort!==true){
                    column.sortable = false;
                }
            }


          //Clone the column config
            var clone = {};
            for (var p in column) {
                if (column.hasOwnProperty(p)) {
                    clone[p] = column[p];
                }
            }


          //Update "header" setting in the column config
            var header = column.header;
            if (header==='x' && !checkboxHeader){
                clone.sortable = false;
                clone.align = "center";
                clone.header = createCheckbox();
                var checkbox = clone.header.checkbox;
                checkboxHeader = {
                    idx: i,
                    isChecked: checkbox.isChecked,
                    check: checkbox.select,
                    uncheck: checkbox.deselect
                };
            }
            else{
                clone.header = createHeader(header, column.sortable);
            }

            columns.push(clone);
        }




      //Update column config using the "sort" filter
        setFilter(config.filter);



      //Create table
        table = new javaxt.dhtml.Table(parent, {
            multiselect: multiselect,
            hideHeader: config.hideHeader,
            columns: columns,
            style: config.style
        });
        table.el.className = "javaxt-datagrid";
        me.el = table.el;


      //Handle clicks in the checkbox column (see onCheckboxCellClick). The
      //listeners use the capture phase so they run before the checkbox and
      //the table's row selection logic.
        if (checkboxHeader){
            me.el.addEventListener("click", onCheckboxCellClick, true);
            me.el.addEventListener("mousedown", function(e){
              //Prevent shift+click from selecting text across rows
                if (e.shiftKey && getCheckboxCellRow(e.target)) e.preventDefault();
            }, true);
            me.el.addEventListener("touchend", function(e){
              //The checkbox toggles itself on touchend. Let the click that
              //follows toggle it instead (see onCheckboxCellClick).
                if (getCheckboxCellRow(e.target)) e.stopPropagation();
            }, true);
        }


      //Get mask
        mask = config.mask;
        if (!mask) mask = table.getMask();


      //Add load function to the table
        table.load = function(records, append){
            if (!append) me.clear();
            var rows = table.addRows(records.length);
            var isDataStore = (records instanceof javaxt.dhtml.DataStore);
            for (var i=0; i<rows.length; i++){
                initRow(rows[i], isDataStore ? records.get(i) : records[i]);
            }
            if (!append) table.update();
            if (checkboxHeader) checkedChange();
        };


      //Watch for selection change events
        table.onSelectionChange = function(rows){

          //Restore the "checkedRow" style
            if (rows){
                for (var i=0; i<rows.length; i++){
                    updateCheckedStyle(rows[i]);
                }
            }

          //Fire selection change event
            me.onSelectionChange();
        };


      //Watch for scroll events
        table.onScroll = function(y, maxY, h){

          //Calculate start and end rows
            var startRow = Math.ceil(y/rowHeight);
            if (startRow==0) startRow = 1;
            var endRow = Math.ceil((y+h)/rowHeight);


            var prevPage = currPage;
            setPage(Math.ceil(endRow/config.limit));

            //console.log(startRow + "/" + endRow + " (Page: " + currPage + ")");


          //Load the next page when the user scrolls to the bottom of the grid.
          //Note that we use the last page loaded instead of the current page
          //since rows may have been inserted or removed from the grid.
            var d = Math.abs(maxY-y);
            if (d<rowHeight){ //if (y===maxY){
                if (!eof) load(lastPage+1);
            }

            me.onScroll();
        };


      //Watch for header click events
        table.onHeaderClick = sort;


      //Watch for row click events
        table.onRowClick = function(row, e){
            me.onRowClick(row, e);
        };


      //Watch for key events
        table.onKeyEvent = function(keyCode, modifiers){
            me.onKeyEvent(keyCode, modifiers);
        };



      //Load records
        if (config.autoload===true) load();

    };


  //**************************************************************************
  //** initRow
  //**************************************************************************
  /** Used to assign a record to a row in the table, add custom methods to
   *  the row (e.g. update), and render the row using the update function
   *  defined in the config.
   *  @param select Optional. If true, the row is checked (see "x" column).
   *  By default, rows are checked if the checkbox in the header is checked
   *  (e.g. rows loaded after a user clicks "select all").
   */
    var initRow = function(row, record, select){

      //Check whether new rows should be checked (see "x" column)
        if (typeof select === "undefined"){
            select = checkboxHeader ? checkboxHeader.isChecked() : false;
        }


      //Assign the record to the row
        row.record = record;


      //Override the update method
        row.update = function(){
            config.update(this, this.record);

          //Fill in any empty cells using the column config. Columns
          //with a "field" attribute are populated using values from
          //the record. This also ensures that the checkbox column is
          //rendered, even if the update function never called
          //row.set('x').
            for (var j=0; j<config.columns.length; j++){
                var col = this.childNodes[j];
                if (col.getContent()) continue;

                if (config.columns[j].header==='x'){
                    this.set('x');
                }
                else{
                    var field = config.columns[j].field;
                    if (field){
                        var val = this.record[field];
                        if (val!=null) this.set(j, val);
                    }
                }
            }
        };


      //Override the native "set" method on the row
        row._set = row.set;
        row.set = function(key, val){
            if (key==='x'){

              //Create checkbox
                for (var j=0; j<config.columns.length; j++){
                    if (config.columns[j].header==='x'){
                        var field = config.columns[j].field;

                        var col = this.childNodes[j];
                        var obj = col.getContent();
                        if (obj){
                            //Column has a checkbox already?
                        }
                        else{
                            val = field  ? this.record[field] : this.record;
                            var checkboxDiv = createCheckbox(val, this);
                            var checkbox = checkboxDiv.checkbox;
                            if (select) checkbox.select();
                            this._set(j, checkboxDiv);
                        }
                        return;
                    }
                }
            }
            else{

              //Resolve the key to a column index. Numeric keys are
              //used as-is. Otherwise, exact header matches take
              //precedence. If no header matches, use the first
              //non-checkbox column with a matching "field" attribute.
                var idx = -1;
                if (typeof key === "number"){
                    if (key>=0 && key<config.columns.length) idx = key;
                }
                else{
                    for (var j=0; j<config.columns.length; j++){
                        if (key===config.columns[j].header){
                            idx = j;
                            break;
                        }
                    }
                    if (idx<0){
                        for (var j=0; j<config.columns.length; j++){
                            var column = config.columns[j];
                            if (column.header!=='x' && key===column.field){
                                idx = j;
                                break;
                            }
                        }
                    }
                }


                if (idx>-1){

                  //Wrap value in an overflow div as requested
                    if (config.columns[idx].wrap===true) val = wrap(val);

                    this._set(idx, val);
                }
                else{

                  //Pass the key through as-is and let the underlying
                  //table try to resolve it (e.g. numeric strings)
                    this._set(key, val);
                }
            }
        };



      //Update the row
        row.update();
    };


  //**************************************************************************
  //** setFilter
  //**************************************************************************
  /** Used to update the filter with new params
   *  @deprecated The filter object is a legacy feature and will be removed
   */
    this.setFilter = function(newFilter){
        console.warn(
        "The filter object in the javaxt.dhtml.DataGrid class is a legacy " +
        "feature and will be removed in the future.");
        setFilter(newFilter);
    };

    var setFilter = function(newFilter){
        if (!newFilter) newFilter = {};
        if (!filter) filter = newFilter;


      //Remove duplicates from newFilter
        removeDuplicateParams(newFilter);


        for (var key in newFilter) {
            if (newFilter.hasOwnProperty(key)) {
                filter[key] = newFilter[key];
            }
        }

        var deletions = [];
        for (var key in filter) {
            if (filter.hasOwnProperty(key)) {
                if (newFilter[key]===null || newFilter[key]==='undefined'){
                    deletions.push(key);
                }
            }
        }

        for (var i=0; i<deletions.length; i++){
            var key = deletions[i];
            delete filter[key];
        }


        for (var j=0; j<columns.length; j++){
            columns[j].sort = null;
            var colHeader = columns[j].header;
            if (colHeader.setSortIndicator) colHeader.setSortIndicator(null);
        }


        if (filter.orderby){
            var arr = filter.orderby.split(",");
            for (var i=0; i<arr.length; i++){
                var field = arr[i].trim();
                if (field.length>0){

                    var fieldName, sortDirection;
                    field = field.toUpperCase();
                    if (field.endsWith(" ASC") || field.endsWith(" DESC")){
                        var x = field.lastIndexOf(" ");
                        fieldName = field.substring(0, x).trim();
                        sortDirection = field.substring(x).trim();
                    }
                    else{
                        fieldName = field;
                        sortDirection = "ASC";
                    }



                    for (var j=0; j<columns.length; j++){
                        if (columns[j].field){
                            if (columns[j].field.toUpperCase() === fieldName){
                                columns[j].sort = sortDirection;
                                var colHeader = columns[j].header;
                                if (colHeader.setSortIndicator){
                                    colHeader.setSortIndicator(sortDirection);
                                }
                                break;
                            }
                        }
                    }

                }
            }

        }
    };


  //**************************************************************************
  //** getFilter
  //**************************************************************************
  /** Returns the current filter
   *  @deprecated The filter object is a legacy feature and will be removed
   */
    this.getFilter = function(){
        console.warn(
        "The filter object in the javaxt.dhtml.DataGrid class is a legacy " +
        "feature and will be removed in the future.");
        return filter;
    };


  //**************************************************************************
  //** getParams
  //**************************************************************************
    this.getParams = function(){
        return config.params;
    };


  //**************************************************************************
  //** setPage
  //**************************************************************************
  /** Used to set the currPage variable and call the onPageChange method.
   */
    var setPage = function(page){
        if (isNaN(page) || page<1) page = 1;
        if (page!=currPage){
            var prevPage = currPage;
            currPage = page;
            me.onPageChange(currPage, prevPage);
        }
    };


  //**************************************************************************
  //** getCurrPage
  //**************************************************************************
  /** Returns the current page number
   */
    this.getCurrPage = function(){
        return currPage;
    };


  //**************************************************************************
  //** getScrollInfo
  //**************************************************************************
  /** Returns scroll position and dimenstions for the visible area.
   */
    this.getScrollInfo = function(){
        return table.getScrollInfo();
    };


  //**************************************************************************
  //** enableScroll
  //**************************************************************************
  /** Used to enable scrolling.
   */
    this.enableScroll = function(){
        table.enableScroll();
    };


  //**************************************************************************
  //** disableScroll
  //**************************************************************************
  /** Used to disable scrolling.
   */
    this.disableScroll = function(){
        table.disableScroll();
    };


  //**************************************************************************
  //** isScrollEnabled
  //**************************************************************************
  /** Returns true if scrolling is enabled.
   */
    this.isScrollEnabled = function(){
        return table.isScrollEnabled();
    };


  //**************************************************************************
  //** Events
  //**************************************************************************

    /** Called whenever the client scrolls within the table. */
    this.onScroll = function(){};

    /** Called whenever the table advances to the next page of records or
     *  scrolls to a previous page. */
    this.onPageChange = function(currPage, prevPage){};

    /** Called whenever a row in the grid is selected or deselected. */
    this.onSelectionChange = function(){};

    /** Called immediately before fetching records from the server. */
    this.beforeLoad = function(page){};

    /** Called immediately after fetching records from the server. */
    this.onLoad = function(){};

     /** Called whenever there is an issue fetching records from the server. */
    this.onError = function(request){};

    /** Called whenever the client clicks or taps on a row in the table. */
    this.onRowClick = function(row, e){};

    /** Called whenever a keyboard event is initiated from the table. */
    this.onKeyEvent = function(keyCode, modifiers){};

    /** Called whenever a client clicks on a checkbox in a checkbox column. */
    this.onCheckbox = function(value, checked, checkbox){};

    /** Called after an individual checkbox or range of checkboxes have changed state. */
    this.onCheckedChange = function(records){};

    /** Called whenever a client clicks on a header. */
    this.onSort = function(idx, sortDirection){};


  //**************************************************************************
  //** forEachRow
  //**************************************************************************
  /** Used to traverse all the rows in the table using a callback function.
   *  The first argument in the callback is a DOM element with a record.
   *  Example:
   <pre>
    grid.forEachRow(function(row){
        console.log(row, row.record);
    });
   </pre>
   *
   *  Note that you can return true in the callback function if you wish to
   *  stop processing rows. Example:
   <pre>
    grid.forEachRow(function(row, content){
        //Do something with the row

        //Stop iterating once some contition is met
        if (1>0) return true;
    });
   </pre>
   */
    this.forEachRow = function(callback){
        table.forEachRow(callback);
    };


  //**************************************************************************
  //** getRowCount
  //**************************************************************************
  /** Returns the number of rows in the grid. Note that this is the number of
   *  rows loaded in the grid, not the total number of records on the server.
   */
    this.getRowCount = function(){
        return table.getRowCount();
    };


  //**************************************************************************
  //** showColumn
  //**************************************************************************
  /** Used to render a column if it is hidden (e.g. a checkbox column)
   *  @param idx Column index (integer). Invalid indexes are ignored.
   */
    this.showColumn = function(idx){
        table.showColumn(idx);
    };


  //**************************************************************************
  //** hideColumn
  //**************************************************************************
  /** Used to hide a column (e.g. a checkbox column)
   *  @param idx Column index (integer). Invalid indexes are ignored.
   */
    this.hideColumn = function(idx){
        table.hideColumn(idx);
    };


  //**************************************************************************
  //** select
  //**************************************************************************
  /** Used to select a given row in the grid
   */
    this.select = function(row){
        table.select(row);
        updateCheckedStyle(row);
    };


  //**************************************************************************
  //** selectAll
  //**************************************************************************
  /** Selects all the rows in the grid
   */
    this.selectAll = function(){
        table.selectAll();
    };


  //**************************************************************************
  //** deselectAll
  //**************************************************************************
  /** Deselects all the rows in the grid
   */
    this.deselectAll = function(){
        table.deselectAll();
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
  /** Removes all the rows from the grid
   */
    this.clear = function(){
        table.clear();
        currPage = 1;
        pageRequests = {};
        lastPage = 0;
        offsetShift = 0;
        removedKeys = {};
        if (checkboxHeader){
            checkboxHeader.uncheck();
            checkAnchor = null;
            checkedChange();
        }


      //Ignore responses for pages that are still loading (see load). This
      //allows the grid to be refreshed while a page is loading.
        requestID++;
        if (loading){
            loading = false;
            mask.hide();
        }
    };


  //**************************************************************************
  //** remove
  //**************************************************************************
  /** Removes a row from the grid
   *  @param row Either a row index (integer) or a row in the grid (DOM
   *  element)
   *  @return The row (DOM element) that was removed from the grid or null if
   *  the row was not found
   */
    this.remove = function(row){
        var rows = me.removeRows(row);
        return rows.length>0 ? rows[0] : null;
    };


  //**************************************************************************
  //** removeRows
  //**************************************************************************
  /** Removes rows from the grid. Example:
   <pre>
    grid.removeRows(0); //remove the first row
    grid.removeRows([row1, row2]); //remove multiple rows
   </pre>
   *  Note that rows are only removed from the grid, not the remote store.
   *  <p/>
   *  If records are loaded from a server one page at a time, the grid assumes
   *  that the removed records were also deleted on the server (e.g. a user
   *  deleted records in the grid) and adjusts the offset of subsequent page
   *  requests so that no records are skipped. Records that are still on the
   *  server will not reappear in the grid as long as they have a key (see
   *  "key" config). If the grid is no longer full after the rows are removed,
   *  the next page is loaded automatically.
   *  @param rows A row index (integer), a row in the grid (DOM element), or an
   *  array of either. Indexes refer to row positions before any rows are
   *  removed.
   *  @return An array of rows (DOM elements) that were removed from the grid
   */
    this.removeRows = function(rows){
        rows = table.removeRows(rows);


      //Update paging variables. Each removed record shifts subsequent records
      //on the server up by one (assuming the record was deleted on the
      //server). If the record wasn't deleted, the next page will overlap with
      //records that are already in the grid. These records are ignored (see
      //filterRecords) so it's safer to overlap than to skip records.
        for (var i=0; i<rows.length; i++){
            var record = rows[i].record;
            if (typeof record === "undefined") continue;
            offsetShift--;
            var key = getKey(record);
            if (key!=null) removedKeys[key] = true;
        }


      //Clear the shift+click anchor if it was removed and update the
      //checkbox in the header (e.g. all the remaining rows are checked)
        if (rows.length>0 && checkboxHeader){
            if (checkAnchor && rows.indexOf(checkAnchor)>-1) checkAnchor = null;
            checkedChange();
        }


      //Load more records if the grid is no longer full
        if (rows.length>0) loadMore();

        return rows;
    };


  //**************************************************************************
  //** insertRow
  //**************************************************************************
  /** Inserts a record into the grid at a given index or before a given row.
   *  The row is rendered using the update function defined in the config.
   *  Example:
   <pre>
    grid.insertRow(0, {id: 1, name: "Bob"}); //insert at the top
    grid.insertRow(row, {id: 2, name: "Jim"}); //insert before a row
   </pre>
   *  @param index Either a row index (integer) or a row in the grid (DOM
   *  element). See insertRows() for more information.
   *  @param record A record to insert. The record is assigned to the new row
   *  (row.record)
   *  @return The row (DOM element) that was added to the grid
   */
    this.insertRow = function(index, record){
        return me.insertRows(index, [record])[0];
    };


  //**************************************************************************
  //** insertRows
  //**************************************************************************
  /** Inserts records into the grid at a given index or before a given row.
   *  Rows below the insertion point are pushed down. Each record is assigned
   *  to a new row and rendered using the update function defined in the
   *  config. Example:
   <pre>
    grid.insertRows(0, [
        {id: 1, name: "Bob"},
        {id: 2, name: "Jim"}
    ]);
   </pre>
   *  Note that records are only added to the grid, not the remote store.
   *  <p/>
   *  If records are loaded from a server one page at a time, and the inserted
   *  records are also on the server, subsequent pages may include records
   *  that are already in the grid (e.g. an inserted record or records that
   *  were pushed down to the next page). These records are ignored as long
   *  as they have a key (see "key" config).
   *  <p/>
   *  If the grid has a checkbox column, inserted rows are not checked. If the
   *  checkbox in the header is checked ("select all"), it is unchecked.
   *  @param index Either a row index (integer) or a row in the grid (DOM
   *  element). Row indexes start at 0. If the index is null or greater than
   *  the number of rows in the grid, the records are appended to the end of
   *  the grid. If a DOM element is given that is not a row in this grid, no
   *  records are inserted.
   *  @param records An array of records or a javaxt.dhtml.DataStore
   *  @return An array of rows (DOM elements) that were added to the grid
   */
    this.insertRows = function(index, records){
        if (!records) return [];
        var isDataStore = (records instanceof javaxt.dhtml.DataStore);
        if (!isDataStore && !isArray(records)) return [];

        var rows = table.insertRows(index, records.length);
        for (var i=0; i<rows.length; i++){
            var record = isDataStore ? records.get(i) : records[i];

          //Render the row. Note that inserted rows are never checked, even if
          //the checkbox in the header is checked ("select all"). Otherwise,
          //users might act on records they haven't seen (e.g. new mail).
            initRow(rows[i], record, false);

          //If the record was removed earlier, it's back in the grid now
            var key = getKey(record);
            if (key!=null) delete removedKeys[key];
        }


      //Uncheck the checkbox in the header since not all the rows are checked
        if (rows.length>0 && checkboxHeader) checkedChange();

        calculateRowHeight();
        table.update();
        return rows;
    };


  //**************************************************************************
  //** show
  //**************************************************************************
  /** Used to unhide the grid if it is hidden
   */
    this.show = function(){
        table.show();
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
  /** Used to hide the grid
   */
    this.hide = function(){
        table.hide();
    };


  //**************************************************************************
  //** focus
  //**************************************************************************
  /** Used to set browser focus on the table.
   */
    this.focus = function(){
        table.focus();
    };


  //**************************************************************************
  //** refresh
  //**************************************************************************
  /** Used to clear the grid and reload the first page.
   *  @param callback Optional callback function called after the grid has
   *  been refreshed and loaded with data.
   */
    this.refresh = function(callback){
        me.clear();
        //eof = false;
        setPage(1);
        load(1, callback);
    };


  //**************************************************************************
  //** load
  //**************************************************************************
  /** Used to load records from the remote store. Optionally, you can pass an
   *  array of records, along with a page number, to append rows to the table.
   */
    this.load = function(){

        if (arguments.length>0){

            var records = arguments[0];
            var page = 1;
            if (arguments.length>1) page = parseInt(arguments[1]);
            if (isNaN(page) || page<1) page = 1;


            if (isArray(records) || records instanceof javaxt.dhtml.DataStore){
                me.beforeLoad(page);
                table.load(records, page>1);
                lastPage = page;
                setPage(page);
                calculateRowHeight();


                if (arguments.length===1){
                    eof = true;
                }
                else{ //caller provided a page number
                    if (records.length<config.limit) eof = true;
                }

                me.onLoad();
            }
        }
        else{
            load();
        }
    };


  //**************************************************************************
  //** setLimit
  //**************************************************************************
  /** Used to update the number of records to load per page.
   */
    this.setLimit = function(limit){
        config.limit = limit;
    };


  //**************************************************************************
  //** scrollTo
  //**************************************************************************
  /** Scrolls to the top of a page or to a row in the table
   *  @param obj Page number (integer) or row in the grid (DOM element)
   */
    this.scrollTo = function(obj){

        if (isElement(obj)){
            var y = 0;
            table.forEachRow(function (row) {

                if (row==obj){
                    return true;
                }

                y += row.offsetHeight;

            });
            table.scrollTo(0, y);
            return;
        }

        if (!isNumber(obj)) return;
        var page = parseInt(obj);


      //Calculate scroll
        var y = ((page-1)*config.limit)*rowHeight;
        if (y<0) y = 0;


      //Check whether the page is already loaded in the grid
        var numPagesInGrid = Math.ceil(table.getRowCount()/config.limit);
        if (page>numPagesInGrid){

            if (page==numPagesInGrid+1){

              //Caller wants to jumpt to the next available page.
              //Load the page and scroll when ready.
                load(page, function(){
                    table.scrollTo(0, y);
                });
            }
            else{
              //Caller wants to skip several pages ahead...
                console.log("Fetch pages! " + numPagesInGrid + " page loaded. Caller wants page " + page + "...");
                return;
            }
        }
        else{
            table.scrollTo(0, y);
        }
    };



  //**************************************************************************
  //** getNextOffset
  //**************************************************************************
  /** Returns the server offset for the next page of records. The offset is
   *  adjusted for rows that were removed from the grid (see removeRows).
   */
    var getNextOffset = function(){
        return Math.max(0, lastPage*config.limit + offsetShift);
    };


  //**************************************************************************
  //** hasKey
  //**************************************************************************
  /** Returns true if a key is defined in the config (see "key" config). A
   *  null or empty key disables de-duplication.
   */
    var hasKey = function(){
        return config.key!=null && config.key!=="";
    };


  //**************************************************************************
  //** getKey
  //**************************************************************************
  /** Returns the key for a given record as a string (see "key" config), or
   *  null if the record doesn't have a key.
   */
    var getKey = function(record){
        if (!hasKey() || record==null || typeof record !== "object") return null;
        var key = record[config.key];
        if (key==null) return null;
        return key+"";
    };


  //**************************************************************************
  //** filterRecords
  //**************************************************************************
  /** Returns records that are not in the grid and have not been removed from
   *  the grid. Records are identified using the "key" config. Records
   *  without a key are always returned.
   */
    var filterRecords = function(records){
        if (!hasKey() || !isArray(records)) return records;

        var keys = {};
        table.forEachRow(function(row){
            var key = getKey(row.record);
            if (key!=null) keys[key] = true;
        });

        var arr = [];
        for (var i=0; i<records.length; i++){
            var key = getKey(records[i]);
            if (key!=null){
                if (keys[key] || removedKeys[key]) continue;
                keys[key] = true;
            }
            arr.push(records[i]);
        }
        return arr;
    };


  //**************************************************************************
  //** loadMore
  //**************************************************************************
  /** Loads the next page of records from the server if the grid isn't full
   *  or if the grid is scrolled to the bottom. This is called after a page is
   *  loaded (e.g. if records were ignored because they were already in the
   *  grid) and after rows are removed (e.g. if all the rows were removed, the
   *  grid can't be scrolled to load more records).
   */
    var loadMore = function(){
        if (eof || loading || !config.url) return;
        var scrollInfo = table.getScrollInfo();
        if (!scrollInfo.h) return; //grid is not visible
        var d = scrollInfo.maxY - scrollInfo.y;
        if (d<(rowHeight || 1)) load(lastPage+1);
    };


  //**************************************************************************
  //** calculateRowHeight
  //**************************************************************************
    var calculateRowHeight = function(){
        if (!rowHeight){
            table.forEachRow(function (row, content) {
                rowHeight = row.offsetHeight;
                return;
            });
        }
    };


  //**************************************************************************
  //** getCheckedRecords
  //**************************************************************************
  /** Returns the records of the rows that are checked in the checkbox column
   *  (see "columns" config). Unlike getSelectedRecords(), rows that are only
   *  selected (e.g. clicked) are not included, and records that haven't been
   *  loaded yet are never fetched.
   *  @return An array of records (empty if the grid has no checkbox column)
   */
    this.getCheckedRecords = function(){
        var records = [];
        if (!checkboxHeader) return records;
        table.forEachRow(function(row, content){
            var checkbox = getCheckbox(content[checkboxHeader.idx]);
            if (checkbox && checkbox.isChecked() && row.record) records.push(row.record);
        });
        return records;
    };


  //**************************************************************************
  //** getSelectedRecords
  //**************************************************************************
  /** Returns an array of selected records from the grid. If the grid has a
   *  checkbox column, both checked rows and selected (e.g. clicked) rows are
   *  returned. Use getCheckedRecords() to get just the checked rows.
   *  @param key Optional field name or index (e.g. 'id' or 0). If given, the
   *  output array will only contain values for the given key. This can be
   *  useful for limiting the amount of data returned in the array. For
   *  example, you might only need selected IDs instead of a full record.
   *  @param callback Callback function. If the table has a checkbox header,
   *  and the check box is checked, then the user expects to get back ALL
   *  "selected" records, even those that have yet to load. In this case, we
   *  will fetch records from the server and invoke the callback with
   *  additional data.
   */
    this.getSelectedRecords = function(key, callback){


      //Map key to a column id as needed
        var colID;
        if (key){
            if (typeof key === "string"){
                for (var i=0; i<config.fields.length; i++){
                    if (key === config.fields[i]){
                        colID = i;
                        break;
                    }
                }
                if (!colID){
                    for (var i=0; i<config.columns.length; i++){
                        var column = config.columns[i];
                        if (key === column.header){
                            colID = i;
                            break;
                        }
                    }
                }
            }
        }
        if (!colID) colID = 0;



      //Special case for tables with checkbox headers. Check whether the
      //checkbox in the header is selected
        var useCheckbox = false;
        var selectAll = false;
        if (checkboxHeader){
            if (checkboxHeader.idx === colID){
                useCheckbox = true;
                if (checkboxHeader.isChecked()){
                    selectAll = true;
                }
            }
        }


      //Get selected records from the table
        var arr = [];
        table.forEachRow(function (row, content) {
            if (key){
                if (useCheckbox){
                    var checkbox = getCheckbox(content[colID]);
                    if (checkbox && checkbox.isChecked()) arr.push(checkbox.getValue());
                }
                else{
                    if (row.selected) arr.push(row.record[key]);
                }
            }
            else{
                var checked = false;
                if (useCheckbox){
                    var checkbox = getCheckbox(content[colID]);
                    if (checkbox) checked = checkbox.isChecked();
                }
                if (checked || row.selected) arr.push(row.record);
            }
        });


      //Fetch additional records from the server as needed
        if (callback && selectAll && !eof){


          //Generate list of fields
            var fieldNames = "";
            if (key){
                fieldNames = config.columns[colID].field;
            }
            else{
                for (var i=0; i<config.fields.length; i++){
                    if (i>0) fieldNames += ",";
                    fieldNames += config.fields[i];
                }
            }


          //Build URL using the shared buildURL function so that the params,
          //filter, and orderby are identical to the URLs used by load().
          //A consistent orderby is particularly important here because we
          //use an offset to fetch records beyond what has been loaded.
            var url = buildURL({
                fields: fieldNames,
                count: false,
                offset: getNextOffset()
            });


          //Execute service request and process response
            config.getResponse(url, config.payload, function(request){
                if (request.status===200){
                    var arr = [];
                    var records = config.parseResponse.apply(me, [request]);

                  //Ignore records that are already in the grid (e.g. if rows
                  //were removed from the grid but not the server)
                    records = filterRecords(records);

                    for (var i=0; i<records.length; i++){
                        var record = records[i];
                        if (key){

                          //Return just the key values. Records may be arrays
                          //(see parseResponse comments) or objects (custom
                          //parseResponse implementations). Note that in the
                          //array case, we only requested a single field from
                          //the server so there should only be one value per
                          //record.
                            var val = isArray(record) ? record[0] : record[fieldNames];
                            if (val!=null) arr.push(val);
                        }
                        else{

                          //Return the entire record
                            arr.push(record);
                        }
                    }
                    if (callback) callback.apply(me, [arr]);
                }
                else{
                    me.onError(request);
                }
            });
        }

        return arr;
    };


  //**************************************************************************
  //** createHeader
  //**************************************************************************
    var createHeader = function(label, sortable){
        var div = createElement("div");
        if (sortable===false){
            div.style.cursor = "default";
        }

        var span = createElement("span", div);
        span.innerHTML = label;

        var iconDiv = createElement("div", div, {
            position: "relative",
            display: "inline-block"
        });


        var icon = createElement("div", iconDiv);
        div.sortIndicator = icon;

        div.setSortIndicator = function(sortDirection){
            var className = "";
            if (sortDirection){
                if (typeof sortDirection === "string"){
                    sortDirection = sortDirection.toUpperCase().trim();
                    if (sortDirection=="ASC"){
                        className = config.style.ascendingSortIcon;
                    }
                    else if (sortDirection=="DESC"){
                        className = config.style.descendingSortIcon;
                    }
                }
            }
            this.sortIndicator.className = className;
        };


        return div;
    };


  //**************************************************************************
  //** createCheckbox
  //**************************************************************************
    var createCheckbox = function(value, row){

        var div = createElement('div', {
            display: "inline-block",
            position: "relative"
        });

        var checkbox = new javaxt.dhtml.Checkbox(div, {
            value: value,
            style: config.style.checkbox
        });


        if (typeof value !== 'undefined'){ //regular row

            checkbox.onClick = function(checked){
                var value = this.getValue();
                me.onCheckbox(value, checked, this);
            };


          //Style the row whenever the checkbox is checked or unchecked (see
          //"checkedRow" style). The select and deselect methods are wrapped,
          //rather than using the onChange event, so that the row is styled
          //for every change: clicks, the checkbox header, programmatic and
          //silent calls (e.g. checkbox.select(true)). Note that the Checkbox
          //calls these methods on itself when it is clicked.
            if (row){
                var _select = checkbox.select;
                var _deselect = checkbox.deselect;
                checkbox.select = function(){
                    _select.apply(checkbox, arguments);
                    setCheckedStyle(row, checkbox.isChecked());
                };
                checkbox.deselect = function(){
                    _deselect.apply(checkbox, arguments);
                    setCheckedStyle(row, checkbox.isChecked());
                };
            }
        }
        else{ //checkbox header

          //Check or uncheck every row in the grid. Note that checking rows
          //doesn't select them (see onCheckboxCellClick). Fires onCheckbox
          //for each row that changed, then onCheckedChange once.
            checkbox.onClick = function(checked){
                table.forEachRow(function (row, content) {
                    var checkbox = getCheckbox(content[checkboxHeader.idx]);
                    if (!checkbox || checkbox.isChecked()===checked) return;
                    if (checked) checkbox.select(true);
                    else checkbox.deselect(true);
                    me.onCheckbox(checkbox.getValue(), checked, checkbox);
                });
                checkAnchor = null;
                checkedChange();
            };
        }


        div.checkbox = checkbox;
        return div;
    };


  //**************************************************************************
  //** getCheckbox
  //**************************************************************************
  /** Returns the checkbox associated with the content of a cell. Returns
   *  null if the cell is empty or does not contain a checkbox (e.g. the
   *  update function never called row.set('x') for the checkbox column).
   *  Note that cell content may be a string or null (see getContent in the
   *  Table class) so we need to check for the checkbox property carefully.
   */
    var getCheckbox = function(content){
        if (content && content.checkbox) return content.checkbox;
        return null;
    };


  //**************************************************************************
  //** setCheckedStyle
  //**************************************************************************
  /** Adds or removes the "checkedRow" style (see config.style) to/from a row.
   *  Rows are styled whenever their checkbox is checked or unchecked (see
   *  createCheckbox). Only class names are supported (e.g. "table-row-checked").
   *  @param row A row in the grid (DOM element)
   *  @param checked If true, adds the style. Otherwise, removes it.
   */
    var setCheckedStyle = function(row, checked){
        var style = config.style.checkedRow;
        if (!row || !row.classList || typeof style !== "string") return;
        var classNames = style.split(/\s+/);
        for (var i=0; i<classNames.length; i++){
            if (!classNames[i]) continue;
            if (checked) row.classList.add(classNames[i]);
            else row.classList.remove(classNames[i]);
        }
    };


  //**************************************************************************
  //** updateCheckedStyle
  //**************************************************************************
  /** Updates the "checkedRow" style of a row to match the state of the row's
   *  checkbox. Called after rows are selected or deselected since the Table
   *  resets the row's className when it does that.
   */
    var updateCheckedStyle = function(row){
        if (!checkboxHeader || !row || !row.childNodes) return;
        var cell = row.childNodes[checkboxHeader.idx];
        if (!cell || !cell.getContent) return;
        var checkbox = getCheckbox(cell.getContent());
        if (checkbox) setCheckedStyle(row, checkbox.isChecked());
    };


  //**************************************************************************
  //** onCheckboxCellClick
  //**************************************************************************
  /** Handles a click anywhere in a row's checkbox cell (see "columns"
   *  config). A plain click toggles the row's checkbox. A shift+click applies
   *  the clicked row's new state to every row between it and the row that
   *  was clicked last. Clicks in the checkbox cell never select the row or
   *  fire onRowClick: checking and selecting are separate (see
   *  getCheckedRecords and getSelectedRecords).
   */
    var onCheckboxCellClick = function(e){
        var row = getCheckboxCellRow(e.target);
        if (!row) return;

      //Handled here: don't toggle the checkbox again or select the row. Note
      //that stopImmediatePropagation also stops other click listeners on the
      //grid (e.g. apps that implemented this behaviour themselves before it
      //was added to the DataGrid), which would toggle the checkbox back.
        e.stopImmediatePropagation();
        e.preventDefault();

        var checkbox = getRowCheckbox(row);
        if (!checkbox) return;
        var checked = !checkbox.isChecked();

        var rows = [row];
        var anchor = checkAnchor;
        if (e.shiftKey && anchor && anchor!==row && anchor.parentNode===row.parentNode){
            var siblings = row.parentNode.childNodes;
            var a = -1, b = -1;
            for (var i=0; i<siblings.length; i++){
                if (siblings[i]===anchor) a = i;
                if (siblings[i]===row) b = i;
            }
            if (a>-1 && b>-1){
                rows = [];
                for (var j=Math.min(a,b); j<=Math.max(a,b); j++) rows.push(siblings[j]);
            }
        }

        for (var i=0; i<rows.length; i++){
            var cb = getRowCheckbox(rows[i]);
            if (!cb || cb.isChecked()===checked) continue;
            if (checked) cb.select(true);
            else cb.deselect(true);
            me.onCheckbox(cb.getValue(), checked, cb);
        }

        checkAnchor = row;
        checkedChange();
    };


  //**************************************************************************
  //** getCheckboxCellRow
  //**************************************************************************
  /** Returns the row if the given element is inside the checkbox cell of a
   *  row with a record. Returns null for anything else (e.g. the header or
   *  rows without a record).
   */
    var getCheckboxCellRow = function(el){
        if (!checkboxHeader) return null;
        var node = el;
        while (node && node!==me.el){
            var parent = node.parentNode;
            if (parent && parent.record && parent.update){ //node is a cell in a row
                return parent.childNodes[checkboxHeader.idx]===node ? parent : null;
            }
            node = parent;
        }
        return null;
    };


  //**************************************************************************
  //** getRowCheckbox
  //**************************************************************************
  /** Returns the checkbox in a given row, or null if there isn't one
   */
    var getRowCheckbox = function(row){
        if (!checkboxHeader || !row || !row.childNodes) return null;
        var cell = row.childNodes[checkboxHeader.idx];
        return (cell && cell.getContent) ? getCheckbox(cell.getContent()) : null;
    };


  //**************************************************************************
  //** checkedChange
  //**************************************************************************
  /** Called whenever the checked rows may have changed. Checks the checkbox
   *  in the header if every row is checked (and unchecks it otherwise), then
   *  fires onCheckedChange. The event is coalesced (fired once, after the
   *  current call stack) so several changes in a row fire one event.
   */
    var checkedChange = function(){
        if (!checkboxHeader) return;

      //Update the checkbox in the header
        var total = 0, checked = 0;
        table.forEachRow(function(row, content){
            var checkbox = getCheckbox(content[checkboxHeader.idx]);
            if (!checkbox) return;
            total++;
            if (checkbox.isChecked()) checked++;
        });
        if (total>0 && checked===total){
            if (!checkboxHeader.isChecked()) checkboxHeader.check(true);
        }
        else{
            if (checkboxHeader.isChecked()) checkboxHeader.uncheck(true);
        }

      //Fire onCheckedChange event
        if (checkedTimer) return;
        checkedTimer = setTimeout(function(){
            checkedTimer = null;
            me.onCheckedChange(me.getCheckedRecords());
        }, 0);
    };


  //**************************************************************************
  //** buildURL
  //**************************************************************************
  /** Used to construct a URL to fetch records from the server. Merges the
   *  given params with config.params and the current filter.
   */
    var buildURL = function(params){
        if (!params) params = {};


      //Add config.params to the querystring as needed
        if (config.params){
            for (var key in config.params) {
                if (config.params.hasOwnProperty(key)) {
                    if (!hasParam(key, params)){
                        if (key.toLowerCase()!=='orderby'){
                            params[key] = config.params[key];
                        }
                    }
                }
            }
        }


      //Add filter to the querystring
        var orderby = "";
        if (filter){
            for (var key in filter) {
                if (filter.hasOwnProperty(key)) {
                    if (key.toLowerCase()==='orderby'){
                        if (!hasParam(key, params)){
                            orderby = filter[key];
                            orderby = ((orderby!=null && orderby!="") ? "&orderby=" + encodeURIComponent(orderby) : "");
                        }
                    }
                    else{
                        var val = filter[key];
                        if (!isArray(val)){
                            val = (val+"").trim();
                        }
                        if (val.length>0){
                            if (!hasParam(key, params)){
                                params[key] = val;
                            }
                        }
                    }
                }
            }
        }


      //Get orderby from config.params only if it is not found in the filter
        if (orderby.length===0){
            if (config.params){
                for (var key in config.params) {
                    if (config.params.hasOwnProperty(key)) {
                        if (key.toLowerCase()==='orderby'){
                            orderby = config.params[key];
                            orderby = ((orderby!=null && orderby!="") ? "&orderby=" + encodeURIComponent(orderby) : "");
                        }
                    }
                }
            }
        }


      //Build URL
        var url = config.url;
        if (url.indexOf("?")==-1) url+= "?";
        url += encodeParams(params);
        url += orderby;
        return url;
    };


  //**************************************************************************
  //** load
  //**************************************************************************
    var load = function(page, callback){

        if (pageRequests[page+""]) return;
        if (loading) return;
        loading = true;

        mask.show();
        pageRequests[page+""] = page;


      //Parse page
        if (page){
            page = parseInt(page);
            if (isNaN(page) || page<1) page = 1;
        }
        else{
            page = 1;
        }
        if (page==1) eof = false;


      //Generate list of fields
        var fieldNames = "";
        for (var i=0; i<config.fields.length; i++){
            if (i>0) fieldNames += ",";
            fieldNames += config.fields[i];
        }


      //Fire "beforeLoad" event
        me.beforeLoad(page);



      //Create params for the querystring
        var params = {
            page: page,
            limit: config.limit,
            fields: fieldNames
        };


      //Add count to the querystring
        if (config.count==true && page==1) params.count = true;
        else params.count = false;


      //Add offset to the querystring if rows have been removed from the grid.
      //The server should use the offset instead of the page to find records.
        if (page>1 && offsetShift!==0) params.offset = getNextOffset();


      //Build URL
        var url = buildURL(params);


      //Keep track of the state of the grid when the request is sent. The
      //state may change before the response is received (see below).
        var id = requestID;
        var shift = offsetShift;


      //Function called when a request fails
        var onError = function(request){
            delete pageRequests[page+""]; //allow the page to be requested again
            loading = false;
            mask.hide();
            me.onError(request);
        };



      //Execute service request and process response
        config.getResponse(url, config.payload, function(request){


          //Ignore the response if the grid was cleared or refreshed while
          //the request was in flight
            if (id!==requestID) return;


          //If rows were removed while the request was in flight, the server
          //may have processed the request before or after the records were
          //deleted. We can't tell which so we request the page again using
          //the updated offset. Any overlap is ignored (see filterRecords).
            if (page>1 && shift!==offsetShift){
                delete pageRequests[page+""];
                loading = false;
                load(page, callback);
                return;
            }


            if (request.status===200){


              //Parse response
                var records;
                try{
                    records = config.parseResponse.apply(me, [request]);
                }
                catch(e){
                    onError(request);
                    throw e;
                }
                if (records.length<config.limit) eof = true;


              //Update the grid
                if (page===1){
                    if (records.length===0) me.clear();
                    else table.load(records, false);
                }
                else{

                  //Ignore records that are already in the grid or have been
                  //removed from the grid
                    records = filterRecords(records);
                    if (records.length>0) table.load(records, true);
                }
                lastPage = Math.max(lastPage, page);
                if (records.length>0){
                    setPage(page);
                    calculateRowHeight();
                }


                if (callback) callback.apply(me, []);
                loading = false;
                mask.hide();
                me.onLoad();


              //Load more records if the grid isn't full
                loadMore();
            }
            else{
                onError(request);
            }
        });
    };


  //**************************************************************************
  //** hasParam
  //**************************************************************************
  /** Performs case-insensitve search for a parameter. Returns true if a
   *  parameter exists for a given key
   */
    var hasParam = function(key, params){
        for (var k in params) {
            if (params.hasOwnProperty(k)) {
                if (k.toLowerCase()===key.toLowerCase()){
                    return true;
                }
            }
        }
        return false;
    };


  //**************************************************************************
  //** encodeParams
  //**************************************************************************
    var encodeParams = function(params){
        var url = "";
        if (params){
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var val = params[key];
                    if (isArray(val)){
                        for (var i=0; i<val.length; i++){
                            var v = val[i];
                            if (typeof v === "string") v = v.trim();
                            url += "&" + key + "=" + encodeURIComponent(v);
                        }
                    }
                    else{
                        if (typeof val === "string") val = val.trim();
                        url += "&" + key + "=" + encodeURIComponent(val);
                    }
                }
            }
        }
        return url;
    };


  //**************************************************************************
  //** removeDuplicateParams
  //**************************************************************************
  /** Performs a case-insensitve search for unique keys and removes duplicates
   *  (e.g OrderBy == orderBy == orderby). Alters the given parameters instead
   *  or returning a new parameter map..
   */
    var removeDuplicateParams = function(params){

        var uniqueProperties = {};
        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                if (!hasParam(key, uniqueProperties)){
                    uniqueProperties[key] = params[key];
                }
            }
        }

        var deletions = [];
        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                if (!uniqueProperties.hasOwnProperty(key)){
                    deletions.push(key);
                }
            }
        }

        for (var i=0; i<deletions.length; i++){
            var key = deletions[i];
            delete params[key];
        }
    };


  //**************************************************************************
  //** setSortIndicator
  //**************************************************************************
  /** Used to update the sort indicator for a given column
   *  @param idx Column number, starting with 0
   *  @param sortDirection "ASC" or "DESC"
   */
    this.setSortIndicator = function(idx, sortDirection){
        for (var i=0; i<columns.length; i++){
            var colHeader = columns[i].header;
            if (colHeader.setSortIndicator){
                if (i===idx){
                    colHeader.setSortIndicator(sortDirection);
                    columns[i].sort = sortDirection;
                }
                else{
                    colHeader.setSortIndicator(null);
                    columns[i].sort = null;
                }
            }
        }
    };


  //**************************************************************************
  //** sort
  //**************************************************************************
  /** Called whenever a client clicks on a header.
   */
    var sort = function(idx, colConfig, cell, event){
        if (colConfig.sortable!==true) return;

      //Get sort direction
        var sort = colConfig.sort;
        if (sort=="DESC") sort = "";
        else sort = "DESC";
        colConfig.sort = sort;


      //Update sort indicator
        var sortDirection = sort.length==0 ? "ASC" : "DESC";
        me.setSortIndicator(idx, sortDirection);


      //Sort records
        if (config.localSort){

            if (typeof config.localSort === "function"){
                //TODO: allow users to implement thier own sorting function
            }


            var arr = [];
            var rows = [];

          //Collect column content to sort
            table.forEachRow(function (row) {

                var content = row.get(idx);
                var data = row.record[idx];
                if (content){
                    if (content.nodeType===1) content = content.innerText;
                    content = content.trim();
                }
                else{
                    content = "";
                }
                arr.push(content);
                row.sortKey = content;
                rows.push(row);
            });

            if (rows.length === 0) return;


          //Analyze and update the sort keys
            var dates = 0;
            var numbers = 0;
            var nulls = [];
            for (var i=0; i<arr.length; i++){
                var val = arr[i];

                var f = parseFloat(val.replace(/[^0-9\.]+/g,""));
                if (!isNaN(f)){
                    numbers++;
                }
                else{

                    if (typeof val === "string"){
                        if (val=="" || val=="-" || val=="n/a"){
                            nulls.push(i);
                        }
                        else{
                            var d = new Date(val).getTime();
                            if (!isNaN(d)){
                                dates++;
                            }
                        }
                    }
                }
            }


            var numericSort = false;

          //Sort by numbers if possible
            if ((numbers+nulls.length)===rows.length){ //numeric sort
                numericSort = true;
                for (var i=0; i<arr.length; i++){
                    var isNull = false;
                    for (var j=0; j<nulls.length; nulls++){
                        if (nulls[j]===i){
                            isNull = true;
                            break;
                        }
                    }

                    var val = arr[i];
                    var f = isNull ? 0 : parseFloat(val.replace(/[^0-9\.]+/g,""));
                    arr[i] = f;
                    rows[i].sortKey = f;
                }
            }

          //Sort by dates if possible
            if ((dates+nulls.length)===rows.length){
                numericSort = true;
                for (var i=0; i<arr.length; i++){
                    var isNull = false;
                    for (var j=0; j<nulls.length; nulls++){
                        if (nulls[j]===i){
                            isNull = true;
                            break;
                        }
                    }

                    var val = arr[i];
                    var f = isNull ? 0 : new Date(val).getTime();
                    arr[i] = f;
                    rows[i].sortKey = f;
                }
            }


          //Sort the values
            if (numericSort){
                if (sort == "DESC"){
                    arr.sort(function(a, b){return b - a;});
                }
                else{
                    arr.sort(function(a, b){return a - b;});
                }
            }
            else{
                arr.sort();
                if (sort == "DESC"){
                    arr.reverse();
                }
            }


          //Remove unsorted rows
            var parent = rows[0].parentNode;
            for (var i=0; i<rows.length; i++){
                parent.removeChild(rows[i]);
            }


          //Insert sorted rows
            for (var i=0; i<arr.length; i++){
                var key = arr[i];
                for (var j=0; j<rows.length; j++){
                    var row = rows[j];
                    if (row.sortKey == key){
                        row.sortKey = null;
                        parent.appendChild(row);
                        rows.splice(j, 1);
                        break;
                    }
                }
            }


          //Insert unsorted rows
            for (var i=0; i<rows.length; i++){
                parent.appendChild(rows[i]);
            }


          //Fire onSort event
            me.onSort(idx, sortDirection);

        }
        else{
            if (colConfig.field!=null){
                me.clear();
                if (!filter) filter = {};
                filter.orderby = (colConfig.field + " " + sort).trim();
                me.onSort(idx, sortDirection);
                load();
            }
        }

    };


  //**************************************************************************
  //** wrap
  //**************************************************************************
  /** Used to wrap an html element or plain text string in a div. If the width
   *  if the given object exceeds the available width in a column, the content
   *  will be partially hidden from view. When a client hovers over the cell,
   *  the full content will become visible.
   */
    var wrap = function(obj){
        if (obj==null) return;

        var div = createElement("div", {
            height: "100%"
        });

        var maxWidth = 300;

        var content;
        if (typeof obj === "string"){
            content = createElement("span");
            content.innerHTML = obj;
        }
        else{
            content = createElement("div");
            content.style.display = "inline-block";
            content.appendChild(obj);
        }
        div.onmousemove = function(){
            var content = this.firstChild;
            var parent = this.parentNode;
            if (content.offsetWidth>parent.offsetWidth){

              //Update the height of the content
                if (content.offsetWidth>maxWidth){
                    content.style.width = maxWidth+ "px";
                    content.style.minHeight = "115px";
                    content.style.maxHeight = maxWidth+ "px";
                    content.style.whiteSpace = "normal";
                    content.style.lineHeight = "18px";
                    content.style.display = "block";
                    content.style.overflowY = "auto";
                    content.style.overflowX = "hidden";
                }


                parent.className = "grid-overflow-popup";
                parent.style.width = "";
                parent.style.height = "";
                parent.onmouseout = function(e){

                    var el = e.toElement || e.relatedTarget;
                    if (el.parentNode == this || el == this) {
                        return;
                    }
                    while (el.parentNode){
                        if (el.parentNode == this.firstChild) return;
                        el = el.parentNode;
                    }

                    content.style = "";
                    content.style.display = "inline-block";
                    this.className = "";
                    this.style.width = "100%";
                    this.style.height = "100%";
                };
            }

        };

        div.appendChild(content);
        return div;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var isArray = javaxt.dhtml.utils.isArray;
    var isNumber = javaxt.dhtml.utils.isNumber;
    var isElement = javaxt.dhtml.utils.isElement;
    var createElement = javaxt.dhtml.utils.createElement;

    init();
};