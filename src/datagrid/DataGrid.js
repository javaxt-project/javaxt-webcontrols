if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  DataGrid
//******************************************************************************
/**
 *   Custom grid control based on javaxt.dhtml.Table. Supports remote loading,
 *   sorting, and infinite scroll.
 *
 ******************************************************************************/

javaxt.dhtml.DataGrid = function(parent, config) {
    this.className = "javaxt.dhtml.DataGrid";

    var me = this;
    var table;
    var currPage;
    var savePreferences = false;
    var fields = "";
    var eof = false;
    var checkboxHeader;

    var rowHeight; //<-- Assumes all the rows are the same height!


  //Legacy config parameters
    var preferences, filterName, filter;


  //Optional config parameters
    var defaultConfig = {
        //style: javaxt.dhtml.style.table
        url: "",
        params: null,
        payload: null,
        limit: 50,
        count: false,
        autoload: false,
        localSort: false,

      /** Default method used to get responses from the server. Typically, you
       *  do not need to override this method.
       */
        getResponse: function(url, payload, callback){
            var request = new XMLHttpRequest();
            var method = payload ? "POST" : "GET";
            request.open(method, url);
            request.onreadystatechange = function(){
                if (request.readyState === 4) {
                    callback.apply(me, [request]);
                }
            };
            if (payload){
                request.send(payload);
            }
            else{
                request.send();
            }
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
        }
    };



  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Merge config with default config
        config = merge(config, defaultConfig);



      //Extract required config variables
        preferences = config.preferences;
        filterName = config.filterName;
        filter = config.filter;
        if (config.sort==="local") config.localSort = true;



      //Parse column config
        var multiselect = config.multiselect;
        var columns = [];
        for (var i=0; i<config.columns.length; i++){
            var column = config.columns[i];


          //Set "fields" class variable
            if (column.field){
                if (fields.length>0) fields += ",";
                fields += column.field;
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
                multiselect = true;
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
        if (filter){
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
                            if (columns[j].field.toUpperCase() === fieldName){
                                columns[j].sort = sortDirection;
                                columns[j].header.setSortIndicator(sortDirection);
                                break;
                            }
                        }

                    }
                }

            }
        }


      //Create table
        table = new javaxt.dhtml.Table(parent, {
            multiselect: multiselect,
            columns: columns,
            style: config.style
        });


      //Add load function to the table
        table.load = function(records, append){
            if (!append) table.clear();
            var rows = table.addRows(records.length);


            var select = false;
            if (checkboxHeader){
                select = checkboxHeader.isChecked();
            }


            for (var i=0; i<rows.length; i++){

              //Assign the record to the row
                rows[i].record = records[i];


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
                                    val = this.record[field];
                                    var checkboxDiv = createCheckbox(val);
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


                  //Check if the client clicked inside a checkbox
                    if (checkboxHeader){
                        var checkboxCol = this.childNodes[checkboxHeader.idx];
                        var checkboxDiv = checkboxCol.getContent();
                        var rect = _getRect(checkboxDiv);
                        var clientX = e.clientX;
                        var clientY = e.clientY;


                      //If the client clicked inside a checkbox, select/deslect
                      //the row as needed.
                        if (clientX>=rect.left && clientX<=rect.right){
                            if (clientY>=rect.top && clientY<=rect.bottom){

                                if (this.selected){
                                    table.deselect(this);
                                    //checkboxHeader.uncheck();
                                }
                                else{
                                    //table.select(this);
                                }

                                return;
                            }
                        }

                    }


                    this._onclick(e);
                };


              //Update the row
                rows[i].update();
            }

        };


      //Watch for selection change events
        table.onSelectionChange = function(rows){


          //Update checkboxes
            if (checkboxHeader){
                for (var i=0; i<rows.length; i++){
                    var row = rows[i];

                    var checkboxCol = row.childNodes[checkboxHeader.idx];
                    var checkboxDiv = checkboxCol.getContent();
                    var checkbox = checkboxDiv.checkbox;


                    if (row.selected){
                        checkbox.select();
                    }
                    else{
                        checkbox.deselect();
                    }
                }
            }


            me.onSelectionChange();
        };


      //Watch for scroll events
        table.onScroll = function(y, maxY, h){

          //Calculate start and end rows
            var startRow = Math.ceil(y/rowHeight);
            if (startRow==0) startRow = 1;
            var endRow = Math.ceil((y+h)/rowHeight);


            setPage(Math.ceil(endRow/config.limit));

            //console.log(startRow + "/" + endRow + " (Page: " + currPage + ")");


            if (y===maxY){
                if (!eof) load(currPage);
            }

            me.onScroll();
        };


      //Watch for header click events
        table.onHeaderClick = sort;


      //Expose the forEachRow method of the table as a public method of this class
        me.forEachRow = table.forEachRow;


      //Load records
        if (config.autoload===true) load();


      //Start saving preferences
        savePreferences = true;
    };


  //**************************************************************************
  //** setPage
  //**************************************************************************
  /** Used to set the currPage variable and call the onPageChange method.
   */
    var setPage = function(page){
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
    this.getScrollInfo = function(){
        return table.getScrollInfo();
    };


  //**************************************************************************
  //** Events
  //**************************************************************************
    this.onScroll = function(){};
    this.onPageChange = function(currPage, prevPage){};
    this.onSelectionChange = function(){};
    this.beforeLoad = function(){};
    this.onLoad = function(){};
    this.onError = function(request){};


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        table.clear();
    };


  //**************************************************************************
  //** refresh
  //**************************************************************************
    this.refresh = function(){
        savePreferences = false;
        //eof = false;
        setPage(0);
        load();
        savePreferences = true;
    };


  //**************************************************************************
  //** load
  //**************************************************************************
  /** Used to load records from the remote store. Optionally, you can pass an
   *  array of records, along with a page count, to append rows to the table.
   *  Example: [["Bob","12/30","$5.25"],["Jim","10/28","$7.33"]]
   */
    this.load = function(){

        if (arguments.length>0){

            var records = arguments[0];
            if (isArray(records)){
                me.beforeLoad();
                table.addRows(records);
                calculateRowHeight();
                if (records.length<config.limit) eof = true;

                var page = 1;
                if (arguments.length>1) page = arguments[1];
                setPage(page);

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
  /** Used to update the number of records to lead per page.
   */
    this.setLimit = function(limit, update){
        config.limit = limit;
    };


  //**************************************************************************
  //** scrollTo
  //**************************************************************************
  /** Scrolls to the top of a given page.
   */
    this.scrollTo = function(page){

        if (page instanceof Element){ //TODO: tighten up the logic...
            var r = page;
            var y = 0;
            table.forEachRow(function (row) {

                if (row==r){
                    return true;
                }

                y += row.offsetHeight;

            });
            table.scrollTo(0, y);
            return;
        }


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
    this.getSelectedRecords = function(key){


      //Update key to id as needed
        if (key){
            if (typeof key === "string"){
                for (var i=0; i<config.columns.length; i++){
                    var column = config.columns[i];
                    if (key === column.field){
                        key = i;
                        break;
                    }
                }
                for (var i=0; i<config.columns.length; i++){
                    var column = config.columns[i];
                    if (key === column.header){
                        key = i;
                        break;
                    }
                }
            }
        }
        else{
            key = 0;
        }


      //Special case for tables with checkbox headers
        var useCheckbox = false;
        var selectAll = false;
        if (checkboxHeader){
            if (checkboxHeader.idx === key){
                useCheckbox = true;
                if (checkboxHeader.isChecked()){
                    selectAll = true;
                }
            }
        }


      //Get selected records
        var arr = [];
        table.forEachRow(function (row, content) {

            if (useCheckbox){
                var checkboxDiv = content[key];
                var checkbox = checkboxDiv.checkbox;
                if (checkbox.isChecked()) arr.push(checkbox.getValue());
            }
            else{
                if (row.selected){
                    arr.push(content[key]);
                }
            }

        });


      //If the table has a checkbox header, and the check box is checked, then
      //the user expects to get back ALL "selected" records, even those that
      //have yet to load. In this case, we need to fetch records from the server
        if (selectAll && !eof){


          //Build URL
            var fieldName = config.columns[key].field;

            var url = config.url;
            if (url.indexOf("?")==-1) url+= "?";
            url += "fields=" + fieldName + "&count=false&offset=" + (currPage*config.limit);


          //Add query params
            var params = config.params;
            if (params){
                for (var key in params) {
                    if (params.hasOwnProperty(key)) {
                        var str = encodeURIComponent(params[key].trim());
                        url += "&" + key + "=" + str;
                    }
                }
            }


          //Add filter
            if (filter){
                for (var key in filter) {
                    if (filter.hasOwnProperty(key)) {
                        if (key!=='orderby'){
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
                    var records = config.parseResponse.apply(me, [request]);
                    for (var i=0; i<records.length; i++){
                        var val = records[i][fieldName];
                        if (val) arr.push(val);
                    }
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
        var div = document.createElement("div");
        if (sortable===false){
            //div.style.cursor = "not-allowed";
            div.style.cursor = "default";
        }

        var span = document.createElement("div");
        span.innerHTML = label;
        div.appendChild(span);

        var iconDiv = document.createElement("div");
        iconDiv.style.position = "absolute";
        iconDiv.style.width = "7px";
        iconDiv.style.height = "7px";
        iconDiv.style.top = "7px";
        iconDiv.style.right = "0px";
        div.appendChild(iconDiv);

        var icon = document.createElement("div");
        iconDiv.appendChild(icon);
        div.sortIndicator = icon;

        div.setSortIndicator = function(sortDirection){
            var className = "";
            if (sortDirection){
                if (typeof sortDirection === "string"){
                    sortDirection = sortDirection.toUpperCase().trim();
                    if (sortDirection=="ASC"){
                        className = "ascendingSortIcon";
                    }
                    else if (sortDirection=="DESC"){
                        className = "descendingSortIcon";
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
    var createCheckbox = function(value){
        var div = document.createElement('div');
        div.style.display = "inline-block";
        div.style.position = "relative";
        div.style.padding = "9px 0 0 1px";
        var checkbox = new javaxt.dhtml.Checkbox(div,{
            value: value,
            style: {
                box: "table-checkbox"
            }
        });
        checkbox.onClick = function(checked){
            var value = this.getValue();
            if (value){

            }
            else{ //checkbox header

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

                });
            }


            me.onSelectionChange();
        };
        div.checkbox = checkbox;
        return div;
    };




  //**************************************************************************
  //** load
  //**************************************************************************
    var load = function(page, callback){

      //Parse page
        if (page){
            page = parseInt(page);
            if (isNaN(page) || page<1) page = 1;
        }
        else{
            page = 1;
        }
        if (page==1) eof = false;





      //Fire "beforeLoad" event
        me.beforeLoad(page);


      //Build URL
        var url = config.url;
        if (url.indexOf("?")==-1) url+= "?";
        url += "&page=" + page + "&limit=" + config.limit + "&fields=" + fields;

      //Request count
        if (config.count==true && page==1) url += "&count=true";
        else url += "&count=false";



      //Add query params
        var params = config.params;
        if (params){
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var str = (params[key]+"").trim();
                    url += "&" + key + "=" + str;
                }
            }
        }


      //Add filter and order by
        var orderby = "";
        if (filter){
            for (var key in filter) {
                if (filter.hasOwnProperty(key)) {
                    if (key==='orderby'){
                        orderby = filter[key];
                        orderby = (orderby!=null && orderby!="" ? "&orderby=" + orderby : "");
                    }
                    else{
                        var str = filter[key];
                        str = str+"";
                        str = str.trim();
                        if (str.length>0){
                            url += "&" + key + "=" + encodeURIComponent(str);
                        }
                    }
                }
            }
        }
        url += orderby;



      //Execute service request and process response
        config.getResponse(url, config.payload, function(request){
            if (request.status===200){

              //Save preferences
                if (page===1 && savePreferences){
                    if (filterName && preferences) preferences.set(filterName, JSON.stringify(filter));
                }


              //Parse response
                var records = config.parseResponse.apply(me, [request]);
                if (records.length===0){
                    table.clear();
                    eof = true;
                }
                else{
                    if (records.length<config.limit) eof = true;

                    table.load(records, page>1);
                    setPage(page);
                    calculateRowHeight();

                    if (records.length===config.limit && !table.hasOverflow()){
                        load(page+1);
                        return;
                    }
                }

                if (callback) callback.apply(me, []);

                me.onLoad();
            }
            else{
                me.onError(request);
            }
        });
    };



  //**************************************************************************
  //** sort
  //**************************************************************************
  /** Called whenever a client clicks on a header.
   */
    var sort = function(idx, colConfig, cell, event){
        if (colConfig.sortable!==false){
            table.clear();
            var sort = colConfig.sort;
            if (sort=="DESC") sort = "";
            else sort = "DESC";
            colConfig.sort = sort;
            filter.orderby = (colConfig.field + " " + sort).trim();


          //Update sort indicator
            var row = cell.parentNode;
            for (var i=0; i<row.childNodes.length; i++){
                if (row.childNodes[i].getContent){
                    var headerCell = row.childNodes[i].getContent();
                    if (headerCell.setSortIndicator){
                        if (row.childNodes[i]==cell){
                            headerCell.setSortIndicator(sort.length==0 ? "ASC" : "DESC");
                        }
                        else{
                            headerCell.setSortIndicator(null);
                        }
                    }
                }
            }


          //Sort records
            if (config.localSort){


                var arr = [];
                var rows = [];

              //Collect column content to sort
                table.forEachRow(function (row) {
                    var content = row.get(idx);
                    if (content){
                        if (content.nodeType===1) content = content.innerText;

                        var f = parseFloat(content);
                        if (!isNaN(f)){
                            numbers++;
                        }
                        else if (typeof content === "string"){

                        }
                        else{

                        }
                    }
                    else{
                        content = "";
                    }
                    arr.push(content);
                    row.sortKey = content;
                    rows.push(row);
                });

                if (rows.length == 0) return;


              //Analyze and update the sort keys
                var numericSort = false;
                var numbers = 0;
                var dashes = 0;
                for (var i=0; i<arr.length; i++){
                    var key = arr[i];
                    var f = parseFloat(key);
                    if (!isNaN(f)){
                        numbers++;
                    }
                    else if (typeof key === "string"){
                        if (key=="-") dashes++;
                        /*
                        else{
                            var s = key.split(" ");
                            if (s.length==2){
                                var t = parseInt(s[0]);
                                if (!isNaN(t)){
                                    var u = s[1];
                                    if (u.substring(u.length-1)=="s") u = u.substring(0, u.length-1);
                                    if (u=="day" || u=="hour" || u=="minute" || u=="second"){
                                        numbers++;
                                        if (u=="minute") t = t*60;
                                        if (u=="hour") t = (t*60)*60;
                                        if (u=="day") t = ((t*24)*60)*60;
                                    }
                                }
                            }
                        }
                        */
                    }
                }
                if ((numbers+dashes)==rows.length){
                    numericSort = true;
                    for (var i=0; i<arr.length; i++){
                        if (arr[i]=="-") arr[i] = 0;
                        var f = parseFloat(arr[i]);
                        arr[i] = f;
                        rows[i].sortKey = f;
                    }
                }


              //Sort the values
                if (numericSort){
                    console.log("All numbers!");

                    if (sort == "DESC"){
                        arr.sort(function(a, b){return b - a});
                    }
                    else{
                        arr.sort(function(a, b){return a - b});
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

            }
            else{
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
        var div = document.createElement("div");
        div.style.height = "100%";
        var maxWidth = 300;

        var content;
        if (typeof obj === "string"){
            content = document.createElement("span");
            content.innerHTML = obj;
        }
        else{
            content = document.createElement("div");
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

    init();
};