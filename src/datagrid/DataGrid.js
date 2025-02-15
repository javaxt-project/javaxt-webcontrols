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

    var checkboxHeader;
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
       *  server (see "fields" config). Fially, you can specify a checkbox
       *  column by setting the "header" to "x" (e.g. header: 'x'). If a
       *  checkbox column is defined, a checkbox will be created in the header
       *  and in individual rows. The checkbox is typically used to support
       *  multi-select operations.
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
        mask: null
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


      //Get mask
        mask = config.mask;
        if (!mask) mask = table.getMask();


      //Add load function to the table
        table.load = function(records, append){
            if (!append) me.clear();
            var rows = table.addRows(records.length);


            var select = false;
            if (checkboxHeader){
                select = checkboxHeader.isChecked();
            }

            var isDataStore = (records instanceof javaxt.dhtml.DataStore);

            for (var i=0; i<rows.length; i++){

              //Assign the record to the row
                rows[i].record = isDataStore ? records.get(i) : records[i];


              //Override the update method
                rows[i].update = function(){
                    config.update(this, this.record);
                };


              //Override the native "set" method on the row
                rows[i]._set = rows[i].set;
                rows[i].set = function(key, val){
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

                      //Wrap value in an overflow div as requested
                        for (var j=0; j<config.columns.length; j++){
                            if (config.columns[j].header===key && config.columns[j].wrap===true){
                                val = wrap(val);
                                break;
                            }
                        }

                        this._set(key, val);
                    }
                };



              //Override the native "onclick" method on the row
                rows[i]._onclick = rows[i].onclick;
                rows[i].onclick = function(e){


                  //Special case for columns with checkboxes
                    if (checkboxHeader){

                      //Check if the client clicked inside a checkbox
                        var insideCheckbox = false;
                        var checkboxCol = this.childNodes[checkboxHeader.idx];
                        var checkbox = checkboxCol.getContent().checkbox;
                        var rect = _getRect(checkbox.el);
                        var clientX = e.clientX;
                        var clientY = e.clientY;
                        if (clientX>=rect.left && clientX<=rect.right){
                            if (clientY>=rect.top && clientY<=rect.bottom){
                                insideCheckbox = true;
                            }
                        }


                        if (insideCheckbox){

                          //Update checkbox header
                            if (checkbox.isChecked()){

                              //Count number of rows that are selected
                                var numRows = 0;
                                var checkedItems = 0;
                                var rows = this.parentNode.childNodes;
                                for (var i=1; i<rows.length; i++){ //skip phantom row
                                    numRows++;
                                    var checkboxCol = rows[i].childNodes[checkboxHeader.idx];
                                    if (checkboxCol.getContent().checkbox.isChecked()){
                                        checkedItems++;
                                    }
                                }

                              //Check the checkbox header as needed
                                if (checkedItems===numRows){
                                    checkboxHeader.check();
                                }

                            }
                            else{

                              //Uncheck the checkbox header
                                checkboxHeader.uncheck();
                            }

                        }
                        else{

                            if (!e.ctrlKey && !e.shiftKey){
                                var numSelectedRows = 0;
                                table.forEachRow(function (row) {
                                    if (row.selected){
                                        numSelectedRows++;
                                        if (numSelectedRows>1){

                                          //Update the click event to simulate a ctrl+click
                                            e = new MouseEvent("click", {
                                                isTrusted: e.isTrusted,
                                                view: e.view,
                                                bubbles: e.bubbles,
                                                cancelable: e.cancelable,
                                                clientX: e.clientX,
                                                clientY: e.clientY,
                                                screenX: e.screenX,
                                                screenY: e.screenY,
                                                altKey: e.altKey,
                                                ctrlKey: true
                                            });


                                          //Exit forEachRow
                                            return true;
                                        }
                                    }
                                });
                            }
                        }
                    }


                    this._onclick(e);
                };


              //Update the row
                rows[i].update();
            }

            if (!append) table.update();
        };


      //Watch for selection change events
        table.onSelectionChange = function(rows){
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


            var d = Math.abs(maxY-y);
            if (d<rowHeight){ //if (y===maxY){
                if (!eof){
                    if (currPage===prevPage) setPage(currPage+1);
                    load(currPage);
                }
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

    /** Called whenever a client clicks on a checkbox, either in the header or
     *  one of the rows. Columns with checkboxes are defined in the "columns"
     *  config (e.g. header: 'x'),
     */
    this.onCheckbox = function(value, checked, checkbox){};

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
  //** select
  //**************************************************************************
  /** Used to select a given row in the grid
   */
    this.select = function(row){
        table.select(row);
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
        if (checkboxHeader) checkboxHeader.uncheck();
    };


  //**************************************************************************
  //** remove
  //**************************************************************************
  /** Removes a row from the grid
   */
    this.remove = function(row){
        table.removeRow(row);
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
  //** getSelectedRecords
  //**************************************************************************
  /** Returns an array of selected records from the grid.
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
                    var checkboxDiv = content[colID];
                    var checkbox = checkboxDiv.checkbox;
                    if (checkbox.isChecked()) arr.push(checkbox.getValue());
                }
                else{
                    if (row.selected) arr.push(row.record[key]);
                }
            }
            else{
                if (row.selected) arr.push(row.record);
            }
        });


      //Fetch additional records from the server as needed
        if (callback && selectAll && !eof){


          //Build URL
            var url = config.url;
            if (url.indexOf("?")==-1) url+= "?";


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


            url += "fields=" + fieldNames + "&count=false&offset=" + (currPage*config.limit);


          //Add query params
            url += encodeParams(config.params);


          //Add filter
            if (filter){
                for (var key in filter) {
                    if (filter.hasOwnProperty(key)) {
                        if (key.toLowerCase()!=='orderby'){
                            var str = filter[key];
                            if (str){
                                str = str.trim();
                                if (str.length>0){
                                    url += "&" + key + "=" + str;
                                }
                            }
                        }
                    }
                }
            }


          //Execute service request and process response
            config.getResponse(url, config.payload, function(request){
                if (request.status===200){
                    var arr = [];
                    var records = config.parseResponse.apply(me, [request]);
                    for (var i=0; i<records.length; i++){
                        var val = records[i][fieldName];
                        if (val) arr.push(val);
                    }
                    if (callback) callback.apply(me, arr);
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

        }
        else{ //checkbox header

            checkbox.onClick = function(checked){

              /*
              //Method 1: Select/deselect using the table control. This will
              //highlight the rows and the onSelectionChange listener will
              //update the checkboxes.
                if (checked) {
                    table.selectAll();
                }
                else{
                    table.deselectAll();
                }
                */


              //Method 2: Select/deselect manually. No rows will highlight.
                table.forEachRow(function (row, content) {

                    var checkboxDiv = content[checkboxHeader.idx];
                    var checkbox = checkboxDiv.checkbox;
                    if (checked) {
                        checkbox.select();
                    }
                    else{
                        checkbox.deselect();
                    }

                    me.onCheckbox(row.record, checked, checkbox);

                });
                //me.onSelectionChange();

            };
        }


        div.checkbox = checkbox;
        return div;
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


      //Add count to the querystring
        if (config.count==true && page==1) params.count = true;
        else params.count = false;


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



      //Execute service request and process response
        config.getResponse(url, config.payload, function(request){
            if (request.status===200){


              //Parse response
                var records = config.parseResponse.apply(me, [request]);
                if (records.length===0){
                    if (page===1) table.clear();
                    eof = true;
                }
                else{
                    if (records.length<config.limit) eof = true;

                    table.load(records, page>1);
                    setPage(page);
                    calculateRowHeight();
                }

                if (callback) callback.apply(me, []);
                loading = false;
                mask.hide();
                me.onLoad();
            }
            else{
                loading = false;
                mask.hide();
                me.onError(request);
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
    var _getRect = javaxt.dhtml.utils.getRect;
    var isArray = javaxt.dhtml.utils.isArray;
    var isNumber = javaxt.dhtml.utils.isNumber;
    var isElement = javaxt.dhtml.utils.isElement;
    var createElement = javaxt.dhtml.utils.createElement;

    init();
};