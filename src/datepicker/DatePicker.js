if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  DatePicker Class
//******************************************************************************
/**
 *   Calendar component used select dates
 *
 ******************************************************************************/

javaxt.dhtml.DatePicker = function(parent, config) {
    this.className = "javaxt.dhtml.DatePicker";

    var me = this;
    var defaultConfig = {

      /** Used to set the initial view. All we need is a month and a year. 
       */
        date: new Date(),
        
      /** Used to set the selection mode. Options are "day" or "week".
       */
        selectionMode: "day",
        
        
      /** Day names or abbreviations to use in the column headers
       */
        daysOfWeek: ["S","M","T","W","T","F","S"],
        
        
      /** Month names or abbreviations used in the header
       */
        months : ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ],
        
        
      /** If true, allows users to deselect the current selection via mouse
       *  click
       */
        allowDeselect: true, 


      /** Style for individual elements within the component. Note that you can 
       *  provide CSS class names instead of individual style definitions.
       */
        style: {


          //Panel Style
            panel: {
                fontFamily: "helvetica,arial,verdana,sans-serif", 
                backgroundColor: "#ffffff",
                border: "1px solid #b4cbdd",
                display: "inline-block"
            },


            header: {
                backgroundColor: "#d9e7f8",
                height: "25px",
                lineHeight: "25px"
            },

          //Title area
            title: {
                position: "absolute",
                width: "100%",
                whiteSpace: "nowrap",
                //fontFamily: "helvetica,arial,verdana,sans-serif",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#555555",
                textAlign: "center",
                cursor: "pointer"
            },

            next: {
                float: "right",
                borderRight: "2px solid #5e8be0",
                borderBottom: "2px solid #5e8be0",
                width: "7px",
                height: "7px",
                transform: "rotate(-45deg)",
                margin: "7px 10px 0 0",
                cursor: "pointer"
            },

            back: {
                float: "left",
                borderRight: "2px solid #5e8be0",
                borderBottom: "2px solid #5e8be0",
                width: "7px",
                height: "7px",
                transform: "rotate(135deg)",
                margin: "7px 0 0 10px",
                cursor: "pointer"
            },


            cell: {
                width: "18px",
                height: "18px",
                lineHeight: "18px",
                textAlign: "right",
                padding: "2px 4px 1px 0px",
                fontSize: "11px",
                color: "#000000",
                cursor: "pointer",
                border: "1px solid #ffffff",
                margin: "1px"
            },


            cellHeader: { //overrides cell style for header cells
                color: "#233d6d",
                fontSize: "10px",
                lineHeight: "10px",
                paddingBottom: "0px",
                paddingTop: "0px",
                border: "0px",
                borderTop: "1px solid #bbccff",
                borderBottom: "1px solid #bbccff"
            },


            previousMonth: { //overrides cell style for previous month
                color: "#aaaaaa"
            },

            nextMonth: { //overrides cell style for next month
                color: "#aaaaaa"
            },

            today: {
                width: "22px",
                height: "21px",
                border: "1px solid #FF7373",
                top: "-1px",
                left: "-1px"
            },

            selected: {
                color: "#000000",
                fontWeight: "bold",
                backgroundColor: "#fff4bf",
                border: "1px solid #bfa52f"
            }

        }
    };
    
    var currDate;
    var startDate;
    var mainDiv;
    var todayHighlightDiv;
    var cells = [];
    var selectionMode;
    

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

      //Get selection mode
        selectionMode = config.selectionMode;


      //Create container
        mainDiv = document.createElement('div');
        addStyle(mainDiv, "panel");
        mainDiv.style.display = "table";
        parent.appendChild(mainDiv);
        me.el = mainDiv;


      //Disable text selection
        mainDiv.unselectable="on";
        mainDiv.onselectstart=function(){return false;};
        mainDiv.onmousedown=function(){return false;};


      //Create highlight div
        todayHighlightDiv = document.createElement('div');
        addStyle(todayHighlightDiv, "today");
        todayHighlightDiv.style.position = "absolute";


      //Render month
        me.setDate(config.date);
    };


  //**************************************************************************
  //** setDate
  //**************************************************************************
  /** Used to update the calendar and select the given date.
   */
    this.setDate = function(date){
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      //Render date
        me.render(date);

      //Deselect current selection
        me.deselect();

      //Select date
        for (var i=0; i<cells.length; i++){
            var d = cells[i].date;
            if (d.getTime()===date.getTime()){
                select(cells[i]);
                return;
            }
        }
    };


  //**************************************************************************
  //** render
  //**************************************************************************
  /** Used to update the calendar and render a given date.
   */
    this.render = function(date){

        date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        if (currDate && date.getTime()===currDate.getTime()) return;


      //Compute date range
        var range = computeRange(date);



      //Check whether we should render a new calendar
        if (startDate){
            if (startDate.getTime()===range.startDate.getTime()){

              //No need to re-render the calendar. Fire the onUpdate event
              //as needed and exit.
                if (currDate.getTime()!==date.getTime()){
                    currDate = date;
                    me.onUpdate(new Date(currDate));
                }
                return;
            }
        }



      //Set variables
        currDate = date;
        startDate = range.startDate;
        var currMonth = currDate.getMonth();
        var numWeeks = range.numWeeks;



      //Clear the current content
        mainDiv.innerHTML = "";


      //Create header
        var headerDiv = document.createElement('div');
        addStyle(headerDiv, "header");
        headerDiv.style.position = "relative";
        mainDiv.appendChild(headerDiv);

        var titleDiv = document.createElement('div');
        addStyle(titleDiv, "title");
        titleDiv.innerHTML = config.months[currMonth] + " " + currDate.getFullYear();
        titleDiv.onclick = function(e){
            me.onHeaderClick(headerDiv, e);
        };
        headerDiv.appendChild(titleDiv);

        var backDiv = document.createElement('div');
        addStyle(backDiv, "back");
        backDiv.onclick = function(){
            me.back();
        };
        headerDiv.appendChild(backDiv);

        var nextDiv = document.createElement('div');
        addStyle(nextDiv, "next");
        nextDiv.onclick = function(){
            me.next();
        };
        headerDiv.appendChild(nextDiv);



      //Create main table
        var table = createTable(mainDiv);
        table.style.fontFamily = "inherit";
        table.style.textAlign = "inherit";
        table.style.color = "inherit";


      //Add cell headers
        var tr = table.addRow();
        for (var i=0; i<7; i++){
            var td = tr.addColumn();
            td.style.fontFamily = "inherit";
            td.innerHTML = config.daysOfWeek[i];
            addStyle(td, "cell");
            addStyle(td, "cellHeader");
        }



      //Add cells
        cells = [];
        var d = new Date(startDate);
        for (var i=0; i<numWeeks; i++){

            tr = table.addRow();

            for (var j=0; j<7; j++){

              //Create new column
                var td = tr.addColumn();
                td.style.fontFamily = "inherit";


              //Create cell
                var cell = document.createElement('div');
                cell.style.position = "relative";
                cell.style.fontFamily = "inherit";
                cell.date = new Date(d);
                cell.selected = false;
                td.appendChild(cell);
                cells.push(cell);



              //Create div inside the cell to render the date
                var div1 = document.createElement('div');
                div1.style.fontFamily = "inherit";
                div1.innerHTML = d.getDate();
                cell.appendChild(div1);



              //Set style
                addStyle(cell, "cell");


              //Update style if prev or next month
                var month = d.getMonth();
                var monthOffset = 0;
                if (month!==currMonth){
                    if (i===0){
                        monthOffset = -1;
                        addStyle(cell, "previousMonth");
                    }
                    else{
                        monthOffset = 1;
                        addStyle(cell, "nextMonth");
                    }
                }
                cell.monthOffset = monthOffset;



              //On click event
                cell.onclick = function(e){
                    var cell = this;


                  //Select cell(s)
                    var dateRange = select(cell);


                  //Fire onClick event
                    me.onClick(new Date(cell.date), dateRange);

                };



                d.setDate(d.getDate()+1);
            }

        }



      //Highlight today's date
        highlightTodaysDate();


      //Create a task to highlight today's date at midnight
        function scheduledTask() {
            var now = new Date();
            var night = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1, // the next day, ...
                0, 0, 0 // ...at 00:00:00 hours
            );
            var msToMidnight = night.getTime() - now.getTime();

            setTimeout(function() {

              //Highlight Today's Date
                highlightTodaysDate();

              //Re-run the scheduled task for the next day
                scheduledTask();

            }, msToMidnight);
        }
        scheduledTask();


        me.onUpdate(new Date(currDate));
    };


  //**************************************************************************
  //** highlightTodaysDate
  //**************************************************************************
  /** Used to highlight today's date.
   */
    var highlightTodaysDate = function(){

        if (todayHighlightDiv.parentNode){
            var cell = todayHighlightDiv.parentNode;
            cell.removeChild(todayHighlightDiv);
        }


        var now = new Date();
        for (var x=0; x<cells.length; x++){
            var cell = cells[x];
            var d = cell.date;

            if (d.getFullYear()===now.getFullYear() &&
                d.getMonth()===now.getMonth() &&
                d.getDate()===now.getDate())
            cell.appendChild(todayHighlightDiv);

        }
    };


  //**************************************************************************
  //** select
  //**************************************************************************
  /** Used to select a cell that corresponds to the given date. If the
   *  selectionMode is set to week, an entire row will be selected.
   */
    this.select = function(date){
        if (!date) return;

      //Find cell that corresponds with the given date
        var cell;
        for (var x=0; x<cells.length; x++){
            var _cell = cells[x];
            var _date = _cell.date;
            if (_date.getDate()===date.getDate() &&
                _date.getMonth()===date.getMonth() &&
                _date.getFullYear()===date.getFullYear()){
                cell = _cell;
                break;
            }
        }


      //Select the cell
        if (cell) select(cell);
    };


  //**************************************************************************
  //** select
  //**************************************************************************
  /** Used to select a given cell. If the selectionMode is set to week, the
   *  entire row will be selected. Returns an array of dates that correspond
   *  to the selected cell(s).
   */
    var select = function(cell){

        if (selectionMode==="day"){

          //Get date
            var d = new Date(cell.date);


          //Deselect previous selection
            for (var x=0; x<cells.length; x++){
                var _cell = cells[x];
                if (_cell.selected){

                  //If a user clicked on a selected cell..
                    if (cell===_cell){
                        if (config.allowDeselect){
                            deselect(_cell);
                            return [];
                        }
                        else{
                            return [d];
                        }
                    }
                    else{

                      //Deselect previously selected cell
                        deselect(_cell);
                    }


                    break;
                }
            }



          //Highlight cell
            cell.selected=true;
            addStyle(cell, "selected");


          //Return selected date
            return [d];

        }
        else if (selectionMode==="week"){

          //Get start/end dates for the week
            var parentRow = cell.parentNode.parentNode;
            var d1 = new Date(parentRow.childNodes[0].childNodes[0].date);
            var d2 = new Date(parentRow.childNodes[parentRow.childNodes.length-1].childNodes[0].date);


          //Select row
            for (var x=0; x<cells.length; x++){
                var _cell = cells[x];
                if (_cell.parentNode.parentNode===parentRow){


                  //If a user clicked on a selected row...
                    if (_cell.selected){

                        if (config.allowDeselect){

                          //Deselect row
                            for (var y=0; y<cells.length; y++){
                                if (cells[y].selected) deselect(cells[y]);
                            }
                            return [];
                        }
                        else{

                          //Do nothing, the row is already selected
                            return [d1,d2];
                        }
                    }


                  //Highlight cell
                    _cell.selected=true;
                    addStyle(_cell, "selected");
                }
                else{

                  //Deselect previously selected row
                    if (_cell.selected) deselect(_cell);
                }
            }


          //Return selected date range
            return [d1,d2];
        }
        else{
            return [];
        }

    };


  //**************************************************************************
  //** deselect
  //**************************************************************************
  /** Used to deselect any selected cells in the calendar.
   */
    this.deselect = function(){

        for (var x=0; x<cells.length; x++){
            var _cell = cells[x];
            if (_cell.selected){

                if (config.allowDeselect){

                }

                deselect(_cell);
            }
        }
    };


  //**************************************************************************
  //** deselect
  //**************************************************************************
  /** Used to deselect a given cell.
   */
    var deselect = function(_cell){
        _cell.selected=false;
        _cell.style = '';
        _cell.className = '';
        _cell.removeAttribute("class");
        _cell.style.position = "relative";

        addStyle(_cell, "cell");

        switch(_cell.monthOffset){
            case -1:
                addStyle(_cell, "previousMonth");
                break;
            case 1:
                addStyle(_cell, "nextMonth");
                break;
        }
    };


  //**************************************************************************
  //** getSelectionMode
  //**************************************************************************
    this.getSelectionMode = function(){
      return selectionMode;
    };


  //**************************************************************************
  //** setSelectionMode
  //**************************************************************************
    this.setSelectionMode = function(str){
        selectionMode = str;
    };


  //**************************************************************************
  //** onClick
  //**************************************************************************
  /** Called when a cell in the calendar is clicked.
   *  @param date Date associated with the cell.
   *  @param dateRange An array representing the selected date range. If the
   *  selection mode is set to "week", the array will contain two entries: one
   *  for the start date and one for the end date. Otherwise, the array will
   *  contain only one entry.
   */
    this.onClick = function(date, dateRange){};


  //**************************************************************************
  //** onHeaderClick
  //**************************************************************************
  /** Called when the calendar title is clicked. Typically used to render
   *  a month and year selection menu.
   */
    this.onHeaderClick = function(headerDiv, e){};


  //**************************************************************************
  //** onUpdate
  //**************************************************************************
  /** Called when the date picker is first rendered or whenever the month is
   *  changed.
   */
    this.onUpdate = function(date){};


  //**************************************************************************
  //** back
  //**************************************************************************
  /** Used to render the previous month.
   */
    this.back = function(){

        var m = currDate.getMonth()-1;
        var d = currDate.getDate();
        var y = currDate.getFullYear();

        var x = new Date(y, m+1, 0).getDate();
        if (d>x) console.log(d + " vs " + x);
        if (d>x) d = x;

        me.render(new Date(y, m, d));
    };


  //**************************************************************************
  //** next
  //**************************************************************************
  /** Used to render the next month.
   */
    this.next = function(){

        var m = currDate.getMonth()+1;
        var d = currDate.getDate();
        var y = currDate.getFullYear();

        var x = new Date(y, m+1, 0).getDate();
        if (d>x) console.log(d + " vs " + x);
        if (d>x) d = x;

        me.render(new Date(y, m, d));
    };


  //**************************************************************************
  //** getMonth
  //**************************************************************************
  /** Returns the month rendered in the date picker (0-11)
   */
    this.getMonth = function(){
        return currDate.getMonth();
    };


  //**************************************************************************
  //** getYear
  //**************************************************************************
  /** Returns the year rendered in the date picker.
   */
    this.getYear = function(){
        return currDate.getFullYear();
    };


  //**************************************************************************
  //** computeRange
  //**************************************************************************
  /** Computes several key variables used to render the calndar including
   *  start/end date and the total number of rows to render. Credit:
   *  http://stackoverflow.com/a/2485172
   */
    var computeRange = function(d){

        var year = d.getFullYear();
        var month = d.getMonth()+1;
        var firstOfMonth = new Date(year, month-1, 1);
        var lastOfMonth = new Date(year, month, 0);
        var numWeeks = Math.ceil( (firstOfMonth.getDay() + lastOfMonth.getDate()) / 7);

        var startDate = new Date(firstOfMonth);
        startDate.setDate(startDate.getDate()-firstOfMonth.getDay());

        var endDate = new Date(lastOfMonth);
        endDate.setDate(endDate.getDate()+(6-lastOfMonth.getDay()));


        return {
            numWeeks: numWeeks,
            startDate: startDate,
            endDate: endDate
        };
    };




  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };
    var addStyle = function(el, style){
        javaxt.dhtml.utils.addStyle(el, config.style[style]);
    };



    init();
};