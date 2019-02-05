if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  BarGraph
//******************************************************************************
/**
 *   Used to create a simple bar graph.
 *
 ******************************************************************************/

javaxt.dhtml.BarGraph = function (parent, config) {
    this.className = "javaxt.dhtml.BarGraph";
    
    var me = this;
    var chartRow, tickRow, labelRow;
    var innerTable, dataTable, yAxis, horizontalLines;
    var cellWidth;
    var values = [];
    var minValue = 0;
    var maxValue = 0;
    var template = {};
    
    
    var defaultConfig = {
        
        animate: false, //null or false to disable
        animationSteps: 750,
        
        maxHorizonalLabels: 3,
        
        style: {
            cell: {
                borderBottom: "1px solid #ccc",
                padding: "0 5px"
            },
            bar: {
                backgroundColor: "#7baaf7",
                borderRadius: "3px 3px 0 0",
                cursor: "pointer"
            },
            tick: {
                borderLeft: "1px solid #ccc",
                borderRight: "1px solid #ccc",
                height: "5px"
            },
            labelX: {
                textAlign: "center",
                color: "#757575",
                fontSize: "10px",
                height: "14px"
            },
            labelY: {
                textAlign: "right",
                color: "#757575",
                fontSize: "10px",
                padding: "0 5px 0 0",
                margin: "-5px 0 0 0"
            },            
            hline:{
                borderTop: "1px solid #ccc",
                opacity: 0.5,
                zIndex: 1
            },
            select:{
                backgroundColor: "orange"
            }
        }
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
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
        
        
      //Create relative div used to bound the horizontal bars
        var mainDiv = document.createElement('div');
        mainDiv.style.position = "relative";
        mainDiv.style.height = "100%";
        mainDiv.setAttribute("desc", me.className);
        me.el = mainDiv;
        parent.appendChild(mainDiv);

        
        
      //Create table with one cell with a "bottom" vertical alignment 
      //used for animation purposes
        var table = createTable();
        mainDiv.appendChild(table);
        var tbody = table.firstChild;
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var td = document.createElement('td');
        td.style.width = "100%";
        td.style.height = "100%";
        td.style.verticalAlign = "bottom";
        tr.appendChild(td);
        
        
      //Create table with 2 columns. The first column is used for y-axis labels
      //and the second column is used for the bar graphs and x-axis labels.
        innerTable = createTable();
        td.appendChild(innerTable);
        tbody = innerTable.firstChild;
        tr = document.createElement('tr');
        tbody.appendChild(tr);
        td = document.createElement('td');
        td.style.height = "100%";
        td.style.width = "1px";
        td.style.verticalAlign = "top";
        yAxis = createTable();
        yAxis.setAttribute("desc", "yAxis");
        td.appendChild(yAxis);
        tr.appendChild(td);
        td = document.createElement('td');
        td.style.height = "100%";
        td.style.width = "100%";
        tr.appendChild(td);
        
        
      //Create relative div for the second column
        var outerDiv = document.createElement('div');
        outerDiv.style.position = "relative";
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        td.appendChild(outerDiv);
        
        
      //Add horizontal lines in the second column as an absolute div
        var div = document.createElement('div');
        div.style.position = "absolute";
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.top = 0;
        div.style.overflow = 'hidden';
        div.style.padding = "0 1px"; //hack for chrome and safari
        outerDiv.appendChild(div);
        var innerDiv = document.createElement('div');
        innerDiv.style.position = "relative";
        innerDiv.style.width = "100%";
        div.appendChild(innerDiv);
        horizontalLines = createTable();
        innerDiv.appendChild(horizontalLines);          
        
        
        
      //Add vertical bars in the second column as an absolute div
        var div2 = document.createElement('div');
        div2.style.position = "absolute";
        div2.style.width = "100%";
        div2.style.height = "100%";
        div2.style.overflow = 'auto';
        div2.style.overflowY = 'hidden';
        div2.style.padding = "0 1px"; //hack for chrome and safari
        outerDiv.appendChild(div2);
        dataTable = createTable();
        dataTable.setAttribute("desc", "dataTable");
        var tbody = dataTable.firstChild;
        chartRow = document.createElement('tr');
        tbody.appendChild(chartRow);
        tickRow = document.createElement('tr');
        tbody.appendChild(tickRow);
        labelRow = document.createElement('tr');
        tbody.appendChild(labelRow);
        div2.appendChild(dataTable);

        

        if (config.animate===true){
            innerTable.style.height = 0;
        }
    };


  //**************************************************************************
  //** show
  //**************************************************************************
    this.show = function(){
        me.el.style.display = '';
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
    this.hide = function(){
        me.el.style.display = 'none';
    };
    
    
  //**************************************************************************
  //** add
  //**************************************************************************
  /** Used to add a value to the graph. Label is optional.
   */
    this.add = function(value, label){
        if (value==null) value=0;
        
        values.push(value);
        if (value>maxValue) maxValue = value;
        if (value<minValue) minValue = value;
        
        var td, bar;
        if (!template.cell){
       
        
          //Add column
            td = document.createElement('td');
            setStyle(td, "cell");
            td.style.height = "100%";
            td.style.verticalAlign = "bottom";
            
            var div = document.createElement('div');
            div.style.position = "relative";
            div.style.height = "100%";
            td.appendChild(div);
        
        
          //Add bar
            bar = document.createElement('div');
            setStyle(bar, "bar");
            bar.style.position = "absolute";
            bar.style.bottom = 0;
            bar.style.width = "100%";
            
            div.appendChild(bar);
            template.cell = td;
        }
        else{
            td = template.cell.cloneNode(true);
            bar = td.childNodes[0].childNodes[0];
        }
        
        bar.onclick = function(){
            var col = this.parentNode.parentNode;
            for (var i=0; i<chartRow.childNodes.length; i++){
                if (chartRow.childNodes[i]==col){
                    me.onClick(values[i], i, this);
                    break;
                }
            }
        };        
        
        
        td.onclick = function(){
            var col = this;
            for (var i=0; i<chartRow.childNodes.length; i++){
                if (chartRow.childNodes[i]==col){
                    me.onCellClick(i, col);
                    break;
                }
            }
        }; 
        
        
        chartRow.appendChild(td);

        
        
      //Update column and table width as needed
        if (config.style.cell.width){ 
            td.style.width = config.style.bar.width;
            td.childNodes[0].style.width = config.style.bar.width;
            cellWidth = parseInt(config.style.cell.width);
        }
        else{
            if (typeof config.style.cell === "string"){
                if (!cellWidth){
                    var temp = document.createElement("div");
                    setStyle(temp, "cell");
                    temp.style.position = "absolute";
                    temp.style.visibility = 'hidden';
                    temp.style.display = 'block';
                    var body = document.getElementsByTagName("body")[0];
                    body.appendChild(temp);
                    var style = temp.currentStyle || window.getComputedStyle(temp);
                    var getStyle = function(prop){
                        if (style.getPropertyValue){
                            var val = style.getPropertyValue(prop);
                            if (val && val.length>0) return val;
                            return style.getPropertyValue(prop);
                        }
                        else{
                            return style[prop];
                        }
                    };
                    cellWidth = parseInt(getStyle("width"));
                    body.removeChild(temp);
                    temp = null;
                }
            }
        }
        
        
      //Add tick
        var td = document.createElement('td');
        setStyle(td, "tick");
        tickRow.appendChild(td);        
        
        
      //Add label
        td = document.createElement('td');
        setStyle(td, "labelX");
        if (label!=null){
            
            var outerDiv = document.createElement('div');
            outerDiv.style.position = "relative";
            outerDiv.style.width = "100%";
            outerDiv.style.height = "100%";
            td.appendChild(outerDiv);

            var innerDiv = document.createElement('div');
            innerDiv.style.position = "absolute";
            innerDiv.style.width = "100%";
            innerDiv.style.height = "100%";
            outerDiv.appendChild(innerDiv);
            
            if (typeof label === "string" || isNumber(label)){
                innerDiv.innerHTML = label;
            }
            else if (label instanceof Function){
                label.apply(me, [innerDiv]);
            }
        }
        labelRow.appendChild(td);
    };
    
    
  //**************************************************************************
  //** setValue
  //**************************************************************************
    this.setValue = function(idx, value){
        values[idx] = value;
        if (value>maxValue) maxValue = value;
        if (value<minValue) minValue = value;        
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(callback){
        
      //Update heights of all the bars
        for (var i=0; i<values.length; i++){
            var div = chartRow.childNodes[i].childNodes[0].childNodes[0];
            if (div){
                var val = (values[i]/maxValue)*100;
                div.style.height = val + "%";
            }
        }
        
        
      //Update width of the data table
        if (!isNaN(cellWidth)){
            if (cellWidth>0){
                var width = (cellWidth*values.length) + "px";
                dataTable.style.width = width;
                horizontalLines.parentNode.style.width = width;
            }
        }


      //Calculate number of horizontal bars
        var numHorizonalLabels = yAxis.firstChild.childNodes.length;
        var maxHorizonalLabels = config.maxHorizonalLabels;
        var y = getUniqueValues(values).length;
        if (y<maxHorizonalLabels){
            maxHorizonalLabels = y;
        }
        var rowHeight = Math.round((1/maxHorizonalLabels)*100) + "%";
        
        
      //Update maxHorizonalLabels if all the values are 0
        if (y===1 && values[0]===0){ 
            rowHeight = "100%";
            maxHorizonalLabels = 0;
        }
        
        
        
      //Update numHorizonalLabels if the number is greater than maxHorizonalLabels 
        var t1 = yAxis.firstChild;
        var t2 = horizontalLines.firstChild;
        if (numHorizonalLabels>maxHorizonalLabels){
            while (t1.childNodes.length>0){
                t1.removeChild(t1.childNodes[0]);
            }   
            while (t2.childNodes.length>0){
                t2.removeChild(t2.childNodes[0]);
            }  
            numHorizonalLabels = 0;
        }
        
        
      //Add new horizonal bars and labels as needed
        for (var i=numHorizonalLabels; i<maxHorizonalLabels; i++){
            
            
          //Add label and tick on the y-axis
            var tr = document.createElement('tr');
            t1.appendChild(tr);
            
            
            var td = document.createElement('td');
            td.style.verticalAlign = "top";
            tr.appendChild(td);
            var div = document.createElement('div');
            setStyle(div, "labelY");
            td.appendChild(div);
            td.label = div;            
            
            var td = document.createElement('td');
            td.style.verticalAlign = "top";
            tr.appendChild(td);
           
            var div = document.createElement('div');
            setStyle(div, "hline");
            div.style.width = "100%";
            td.appendChild(div);
            
            
            
            
          //Add horizontal line
            tr = document.createElement('tr');
            t2.appendChild(tr);
            td = document.createElement('td');
            td.style.verticalAlign = "top";
            tr.appendChild(td);
            var div = document.createElement('div');
            setStyle(div, "hline");
            div.style.width = "100%";
            div.style.position = "absolute";
            td.appendChild(div);
        }
        
        
        
      //Update heights and labels
        for (var i=0; i<t1.childNodes.length; i++){
            var td = t1.childNodes[i].childNodes[0];
            td.style.height = rowHeight;
            
            
            var numRows = t1.childNodes.length;
            var idx = numRows-i;
            var stepSize = maxValue/maxHorizonalLabels;
            var val = stepSize*idx;
            
            me.createLabel(val, idx, numRows, td.label);
        }
        
        for (var i=0; i<t2.childNodes.length; i++){
            var td = t2.childNodes[i].childNodes[0];
            td.style.height = rowHeight;
        }



        if (config.animate===true){
            yAxis.style.display = 'none';
            animate(new Date().getTime(), config.animationSteps, function(){
                
                yAxis.style.display = '';
                yAxis.style.height = chartRow.offsetHeight + "px";
                horizontalLines.style.height = chartRow.offsetHeight + "px";
                
                
                if (callback!=null){
                    callback.apply(me, []);
                }
            });
        }
        else{
            
            yAxis.style.height = chartRow.offsetHeight + "px";
            horizontalLines.style.height = chartRow.offsetHeight + "px";
            
            if (callback!=null){
                callback.apply(me, []);
            }
        }

    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(saveColumns){
        
        minValue = 0;
        maxValue = 0;        
        
        if (saveColumns===true){
            for (var i=0; i<values.length; i++){
                values[i] = 0;
            }
            
          //me.update(); //<-- Do not use b/c it update labels. Instead do this:
            for (var i=0; i<values.length; i++){
                var div = chartRow.childNodes[i].childNodes[0].childNodes[0];
                div.style.height = "0%";
            }
        }
        else{
            values = [];

            
            while (chartRow.childNodes.length>1){
                chartRow.removeChild(chartRow.childNodes[1]);
                tickRow.removeChild(tickRow.childNodes[1]);
                labelRow.removeChild(labelRow.childNodes[1]);
            }


            dataTable.style.width = "100%";
            horizontalLines.parentNode.style.width = "100%";

            me.update();

        }
    };

   
  //**************************************************************************
  //** onClick
  //**************************************************************************
  /** Called whenever a bar in the graph is clicked.
   */
    this.onClick = function(val, idx, div){};
    
    
  //**************************************************************************
  //** onCellClick
  //**************************************************************************
  /** Called whenever a cell in the graph is clicked.
   */
    this.onCellClick = function(idx, cell){};


  //**************************************************************************
  //** getCell
  //**************************************************************************
  /** Returns a cell in the bargraph at a given index
   */
    this.getCell = function(idx){
        return chartRow.childNodes[idx];
    };


  //**************************************************************************
  //** select
  //**************************************************************************
  /** Used to "select" a bar in the graph by adding the select style to the 
   *  bar.
   */
    this.select = function(idx){
        var td = chartRow.childNodes[idx];
        if (td){
            var bar = td.childNodes[0].childNodes[0];
            addStyle(bar, "select");
        }
    };
    
    
  //**************************************************************************
  //** deselect
  //**************************************************************************
  /** Used to "deselect" a bar in the graph by removing the select style from
   *  the bar.
   */
    this.deselect = function(idx){
        var td = chartRow.childNodes[idx];
        if (td){
            var bar = td.childNodes[0].childNodes[0];
            var h = bar.style.height;
            setStyle(bar, "bar");
            bar.style.position = "absolute";
            bar.style.bottom = 0;
            bar.style.width = "100%";
            bar.style.height = h;
        }
    };
    
  //**************************************************************************
  //** selectAll
  //**************************************************************************
  /** Used to "select" all the bars in the graph by adding the select style to 
   *  the bars.
   */
    this.selectAll = function(){
        for (var i=0; i<chartRow.childNodes.length; i++){
            me.select(i);
        }
    };
    
    
  //**************************************************************************
  //** deselectAll
  //**************************************************************************
  /** Used to "deselect" all the bars in the graph by removing the select 
   *  style from all the bars.
   */
    this.deselectAll = function(){
        for (var i=0; i<chartRow.childNodes.length; i++){
            me.deselect(i);
        }
    };


  //**************************************************************************
  //** createLabel
  //**************************************************************************
  /** Default implementation. Users can override. 
   */
    this.createLabel = function(val, idx, max, div){    
        div.innerHTML = Math.round(val);
    };
    

  //**************************************************************************
  //** getCell
  //**************************************************************************
  /** Returns a cell in the graph at a given index.
   */
    this.getCell = function(idx){
        return chartRow.childNodes[idx];
    };
    
    
  //**************************************************************************
  //** getValues
  //**************************************************************************
    this.getValues = function(){
        var arr = [];
        for (var i=0; i<values.length; i++){
            arr.push(values[i]);
        }
        return arr;
    };
    
    
  //**************************************************************************
  //** getUniqueValues
  //**************************************************************************
    var getUniqueValues = function(arr) {
        var a = [];
        for (var i=0, l=arr.length; i<l; i++)
            if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
                a.push(arr[i]);
        return a;
    }; 
    
    
  //**************************************************************************
  //** isNumber
  //**************************************************************************
    var isNumber = function(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0); };


  //**************************************************************************
  //** addStyle
  //**************************************************************************
  /** Used to add style to a given element. Styles are defined via a CSS class
   *  name or inline using the config.style definitions. 
   */
    var addStyle = function(el, style){
        
        style = config.style[style];
        if (style===null) return;
        
        if (typeof style === 'string' || style instanceof String){
            if (el.className && el.className!=null) el.className += " " + style;
            else el.className = style;
        }
        else{
            for (var key in style){
                var val = style[key];

                el.style[key] = val;
                if (key==="transform"){
                    el.style["-webkit-" +key] = val;
                }
            }
        }
    };


  //**************************************************************************
  //** setStyle
  //**************************************************************************
  /** Used to set the style for a given element. Styles are defined via a CSS 
   *  class name or inline using the config.style definitions. 
   */
    var setStyle = function(el, style){
        if (el===null || el===0) return;
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
  //** animate
  //**************************************************************************
  /**  Used to adjust the hieght of the bar graph. 
   */
    var animate = function(lastTick, timeLeft, callback){
        
        var curTick = new Date().getTime();
        var elapsedTicks = curTick - lastTick;



      //If the animation is complete, ensure that the panel is completely open 
        if (timeLeft <= elapsedTicks){
            innerTable.style.height = "100%";
            
            if (callback!=null){
                callback.apply(me, []);
            }            
            return;
        }


        timeLeft -= elapsedTicks;
        var percentComplete = (timeLeft/config.animationSteps)*100;
        
        innerTable.style.height = (100-percentComplete) + "%";

        setTimeout(function(){
            animate(curTick, timeLeft, callback);
        }, 33);
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