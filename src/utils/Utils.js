if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Utils
//*****************************************************************************/
/**
 *   Common functions and utilities used by the webcontrols
 *
 ******************************************************************************/

javaxt.dhtml.utils = {


  //**************************************************************************
  //** get
  //**************************************************************************
  /** Used to execute an HTTP GET request. Example:
  <pre>
    get(url + "?filter=" + encodeURIComponent(filter), {
        success: function(text){
            var arr = JSON.parse(text).records;
        },
        failure: function(request){
            alert(request.status);
        }
    });
   </pre>
   *  @param url Required.
   *  @param config Optional. Common config settings include a "success"
   *  callback function, "failure" callback function, and "payload". Note that
   *  if a payload is given, an HTTP POST request will be executed. See the
   *  http() method for a full range of options.
   */
    get: function(url, config){

        if (config.payload!=null){ //convert to post request
            var payload = config.payload;
            delete config.payload;
            return javaxt.dhtml.utils.post(url, payload, config);
        }

        var settings = {
            method: "GET",
            payload: null
        };
        javaxt.dhtml.utils.merge(settings, config);
        return javaxt.dhtml.utils.http(url, settings);
    },


  //**************************************************************************
  //** post
  //**************************************************************************
  /** Used to execute an HTTP POST request.
   */
    post: function(url, payload, config){
        var settings;
        if (payload.payload){
            settings = payload;
            settings.method = "POST";
        }
        else{
            var settings = {
                method: "POST",
                payload: payload
            };
            javaxt.dhtml.utils.merge(settings, config);
        }
        return javaxt.dhtml.utils.http(url, settings);
    },


  //**************************************************************************
  //** delete
  //**************************************************************************
  /** Used to execute an HTTP DELETE request.
   */
    delete: function(url, config){
        config.method = "DELETE";
        return javaxt.dhtml.utils.http(url, config);
    },


  //**************************************************************************
  //** http
  //**************************************************************************
  /** Used to execute an HTTP request.
   */
    http: function(url, config){

        var cache = false; //no caching by default!
        if (config.cache){
            if (config.cache==true) cache = true;
        }
        if (!cache){
            if (url.indexOf("?")==-1) url += "?";
            url += "&_=" + new Date().getTime();
        }


        var method = config.method;
        var success = config.success;
        var scope = config.scope;
        var async = true;
        if (config.async){
            if (config.async!=false) async = true;
        }
        var failure = config.failure;
        if (typeof failure === "undefined") failure = function(request){
            if (request.status!==0){
                alert(request);
            }
        };



        var request = new XMLHttpRequest();
        if (config.username && config.password){
            request.open(method, url, async, config.username, config.password);
            request.setRequestHeader("Authorization", "Basic " + btoa(config.username + ":" + config.password)); //<-- Needed to add this sometime in mid 2018...
        }
        else{
            request.open(method, url, async);
        }

        if (!cache) request.setRequestHeader("Cache-Control", "no-cache, no-transform");


        if (config.contentType){ //Example: 'application/x-www-form-urlencoded'
            request.setRequestHeader("Content-Type", config.contentType);
        }


        request.onreadystatechange = function(){
            if (request.readyState === 4) {
                if (request.status>=200 && request.status<300){

                    if (success) success.apply(scope, [request.responseText, request.responseXML, request.responseURL, request]);

                }
                else{
                    if (failure) failure.apply(scope, [request]);
                }

                if (config.finally) config.finally.apply(scope, [request]);
            }
        };

        if (config.payload){
            var payload = config.payload;

          //Stringify the payload as needed
            if (javaxt.dhtml.utils.isArray(payload)){
                payload = JSON.stringify(payload);
            }
            else{
                if (payload != null && typeof payload == 'object'){
                    payload = JSON.stringify(payload);
                }
            }

            request.send(payload);
        }
        else request.send();
        return request;
    },


  //**************************************************************************
  //** getParameter
  //**************************************************************************
  /** Returns the value of a given parameter name in a URL querystring
   *  @param name Parameter name
   *  @param url URL (e.g. window.location.href)
   */
    getParameter: function(name, url){
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        if (!url) url = window.location.href;
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec(url);
        if (results == null) return "";
        else return results[1];
    },


  //**************************************************************************
  //** merge
  //**************************************************************************
  /** Used to merge properties from one json object into another. Credit:
   *  https://github.com/stevenleadbeater/JSONT/blob/master/JSONT.js
   */
    merge: function(settings, defaults) {
        var merge = function(settings, defaults) {
            if (settings==null) return;

          //Check if the settings is an array. Do not merge arrays!
            if (javaxt.dhtml.utils.isArray(settings)){
                return;
            }

            for (var p in defaults) {
                if (defaults.hasOwnProperty(p) && typeof settings[p] !== "undefined") {
                    if (p!=0) //<--Added this as a bug fix
                    merge(settings[p], defaults[p]);
                }
                else {
                    settings[p] = defaults[p];
                }
            }
        };
        merge(settings, defaults);
        return settings;
    },


  //**************************************************************************
  //** clone
  //**************************************************************************
  /** Used to clone a json object
   */
    clone: function(obj){
        return javaxt.dhtml.utils.merge({}, obj);
    },


  //**************************************************************************
  //** isDirty
  //**************************************************************************
  /** Returns true if the given json object differs from the original.
   */
    isDirty: function(obj, org){
        var isEmpty = javaxt.dhtml.utils.isEmpty;
        var a = isEmpty(obj);
        var b = isEmpty(org);
        if ((a==true && b==false) || (b==true && a==false)) return true;

        var d = javaxt.dhtml.utils.diff(obj, org);
        return !isEmpty(d);
    },


  //**************************************************************************
  //** diff
  //**************************************************************************
  /** Used to compare 2 json objects. Returns a json object with differences.
   *  Credit: https://stackoverflow.com/a/13389935/
   */
    diff: function(obj1, obj2){

        var isEmpty = javaxt.dhtml.utils.isEmpty;
        var merge = javaxt.dhtml.utils.merge;

        var diff = function(obj1, obj2){
            var ret = {},rett;
            for (var i in obj2) {
                rett = {};
                if (typeof obj2[i] === 'object'){

                    if (obj1.hasOwnProperty(i)){
                        rett = diff(obj1[i], obj2[i]);
                        if (!isEmpty(rett) ){
                            ret[i]= rett;
                        }
                    }
                    else{
                        ret[i] = obj2[i];
                    }
                }
                else{
                    if (!obj1 || !obj1.hasOwnProperty(i) || obj2[i] !== obj1[i]) {
                        ret[i] = obj2[i];
                    }
                }
            }
            return ret;
        };

        var d1 = diff(obj1, obj2);
        var d2 = diff(obj2, obj1);

        return merge(d1,d2);
    },


  //**************************************************************************
  //** isEmpty
  //**************************************************************************
  /** Returns true if the given json object has no key/value pairs.
   */
    isEmpty: function(obj){
        return JSON.stringify(obj) === "{}";
    },


  //**************************************************************************
  //** isArray
  //**************************************************************************
  /** Used to check whether a given object is an array. Note that this check
   *  does not use the "instanceof Array" approach because of issues with
   *  frames.
   */
    isArray: function(obj){
        return (Object.prototype.toString.call(obj)==='[object Array]');
    },


  //**************************************************************************
  //** isString
  //**************************************************************************
  /** Return true if a given object is a string.
   */
    isString: function(obj){
        return (typeof obj === "string"); // || obj instanceof String)
    },


  //**************************************************************************
  //** isNumber
  //**************************************************************************
  /** Return true if a given object is a number or can be parsed into a number.
   */
    isNumber: function(n) {
        if (typeof n === "number") return true;
        if (typeof n !== "string") n = ""+n;
        return !isNaN(parseFloat(n)) && !isNaN(n - 0);
    },


  //**************************************************************************
  //** isDate
  //**************************************************************************
  /** Return true if a given object can be parsed into a date. Returns false
   *  if the object is a number (e.g. "3", "1.2")
   */
    isDate: function(d) {

      //Don't pass numbers to Date.parse
        if (typeof d === "string" || typeof d === "number"){
            var n = (d+"").replace(/[^-+0-9,.]+/g,"");
            if (d===n){
                return false;
            }
        }

        return !isNaN(Date.parse(d));
    },


  //**************************************************************************
  //** isElement
  //**************************************************************************
  /** Return true if a given object is a DOM element.
   */
    isElement: function(obj){
        return (obj instanceof Element); //TODO: tighten up the logic...
    },


  //**************************************************************************
  //** setStyle
  //**************************************************************************
  /** Used to set the style for a given element, replacing whatever style was
   *  there before.
   *  @param el DOM element.
   *  @param style If a string is provided, assumes that the string represents
   *  a CSS class name update "class" attribute of given element. If a JSON
   *  object is provided, will assign the key/value pairs to the "style"
   *  attribute of the node.
   */
    setStyle: function(el, style){
        if (el===null || el===0) return;
        if (style===null) return;


      //Special case for iScroll
        if (typeof IScroll !== 'undefined'){
            if (el instanceof IScroll){

                var indicators = el.indicators;
                if (indicators){
                    var indicatorClass = "iScrollIndicator";
                    if (style.indicator) indicatorClass = style.indicator;

                    for (var i=0; i<indicators.length; i++){
                        var indicator = indicators[i].indicator;
                        indicator.className = indicatorClass;
                        var scrollbar = indicator.parentNode;

                        if (scrollbar.className.indexOf("iScrollVerticalScrollbar")){
                            if (style.verticalScrollbar){
                                scrollbar.className = scrollbar.className.replace("iScrollVerticalScrollbar", style.verticalScrollbar);
                            }
                        }
                        else{
                            if (style.horizontalScrollbar){
                                scrollbar.className = scrollbar.className.replace("iScrollHorizontalScrollbar", style.horizontalScrollbar);
                            }
                        }
                    }
                }
                return;
            }
        }


        //el.style = '';
        el.removeAttribute("style");


        if (javaxt.dhtml.utils.isString(style)){
            el.className = style;
        }
        else{
            for (var key in style){
                if (style.hasOwnProperty(key)){
                    var val = style[key];
                    if (key==="content"){
                        el.innerHTML = val;
                    }
                    else{
                        el.style[key] = val;
                    }
                }
            }
        }
    },


  //**************************************************************************
  //** addStyle
  //**************************************************************************
  /** Used to add style to a given element.
   *  @param el DOM element.
   *  @param style If a string is provided, assumes that the string represents
   *  a CSS class name update "class" attribute of given element. If a JSON
   *  object is provided, will assign the key/value pairs to the "style"
   *  attribute of the node.
   */
    addStyle: function(el, style){
        if (el===null || el===0) return;
        if (style===null) return;

        if (javaxt.dhtml.utils.isString(style)){
            style = style.replace(/^\s*/, "").replace(/\s*$/, "");
            if (el.hasAttribute("class")){
                var arr = el.className.split(" ");
                for (var i=0; i<arr.length; i++){
                    var className = arr[i].replace(/^\s*/, "").replace(/\s*$/, "");
                    if (className===style) return;
                }
                el.className += " " + style;
            }
            else{
                el.className = style;
            }
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
    },


  //**************************************************************************
  //** hasStyleRule
  //**************************************************************************
  /** Returns true if there is a style rule defined for a given selector.
   *  @param selector CSS selector (e.g. ".deleteIcon", "h2", "#mid")
   */
    hasStyleRule: function(selector) {

        var hasRule = function(selector, rules){
            if (!rules) return false;
            for (var i=0; i<rules.length; i++) {
                var rule = rules[i];
                if (rule.selectorText){
                    var arr = rule.selectorText.split(',');
                    for (var j=0; j<arr.length; j++){
                        if (arr[j].indexOf(selector) !== -1){
                            var txt = trim(arr[j]);
                            if (txt===selector){
                                return true;
                            }
                            else{
                                var colIdx = txt.indexOf(":");
                                if (colIdx !== -1){
                                    txt = trim(txt.substring(0, colIdx));
                                    if (txt===selector){
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return false;
        };

        var trim = function(str){
            return str.replace(/^\s*/, "").replace(/\s*$/, "");
        };

        for (var i=0; i<document.styleSheets.length; i++){
            var rules;
            try{
                rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules;
                if (hasRule(selector, rules)){
                    return true;
                }
            }
            catch(e){
                //Security error, typically occurs when running on the local file system (vs web server)
            }

            var imports = document.styleSheets[i].imports;
            if (imports){
                for (var j=0; j<imports.length; j++){
                    rules = imports[j].rules || imports[j].cssRules;
                    if (hasRule(selector, rules)) return true;
                }
            }
        }

        return false;
    },


  //**************************************************************************
  //** addNoSelectRule
  //**************************************************************************
  /** Inserts the "javaxt-noselect" class into the document if it is not
   *  present.
   */
    addNoSelectRule: function(){
        var hasStyleRule = javaxt.dhtml.utils.hasStyleRule;
        if (!hasStyleRule(".javaxt-noselect")){
            var head = document.head || document.getElementsByTagName('head')[0];
            var sheet = document.createElement('style');
            sheet.innerHTML = ".javaxt-noselect {\n";
            var arr = ["-webkit-","-moz-","-o-","-ms-","-khtml-",""];
            for (var i=0; i<arr.length; i++){
                sheet.innerHTML += arr[i] + "user-select: none;\n";
            }
            sheet.innerHTML += "}";
            head.appendChild(sheet);
        }
    },


  //**************************************************************************
  //** createElement
  //**************************************************************************
  /** Used to create a DOM element
   *  @param type Node type (string). Example "div". This field is required.
   *  @param obj Optional. If a DOM element is provided, will append the newly
   *  created node into the element. Otherwise, will assume that the object is
   *  a style.
   *  @param style Optional. If a string is provided, assumes that the string
   *  represents a CSS class name update "class" attribute of the newly created
   *  node. If a JSON object is provided, will assign the key/value pairs to
   *  the "style" attribute.
   */
    createElement: function(type, obj, style){
        var setStyle = javaxt.dhtml.utils.setStyle;


        var el = document.createElement(type);

        if (obj){
            if (javaxt.dhtml.utils.isElement(obj)){
                setStyle(el, style);
                obj.appendChild(el);
            }
            else{
              //Shift args (2nd arg might be a style)
                if (!style) style = obj;
                setStyle(el, style);
            }
        }
        else{
            setStyle(el, style);
        }

        return el;
    },


  //**************************************************************************
  //** createTable
  //**************************************************************************
  /** Used to create a table element.
   *  @param parent DOM element to append to (optional)
   *  @returns Table element (DOM object) with custom methods
   */
    createTable: function(parent){
        var createElement = javaxt.dhtml.utils.createElement;


        var table = createElement('table', parent, {
            width: "100%",
            height: "100%",
            margin: 0,
            padding: 0,
            borderCollapse: "collapse"
        });
        table.cellSpacing = 0;
        table.cellPadding = 0;


        var tbody = createElement('tbody', table);

        table.addRow = function(style){
            var tr = createElement("tr", tbody, style);
            tr.addColumn = function(style){
                return createElement("td", tr, style);
            };
            return tr;
        };

        table.removeRow = function(tr){
            if (!tr) return;
            tbody.removeChild(tr);
        };

        table.getRows = function(){
            return tbody.childNodes;
        };

        table.clear = function(){
            tbody.innerHTML = "";
        };

        if (parent) parent.appendChild(table);

        return table;
    },


  //**************************************************************************
  //** createClipboard
  //**************************************************************************
  /** Used to create a hidden clipboard in a given parent. Text and other data
   *  can be inserted into the clipboard via the insert() method on the DOM
   *  object returned by this method. Once data is inserted into the clipboard,
   *  clients can retrieve the data via the browser "paste" event (e.g. ctrl+v
   *  on windows).
   *  @param parent DOM element used to hold the clipboard (required)
   *  @returns DOM object (dov) with a custom insert() method
   */
    createClipboard: function(parent){
        var createElement = javaxt.dhtml.utils.createElement;

        var clipboard = createElement("textarea");
        clipboard.insert = function(str){
            clipboard.value = str;
            clipboard.select();
            clipboard.setSelectionRange(0, 99999);
            document.execCommand('copy');
        };
        var clipboardDiv = createElement("div", parent, {
            position: "absolute",
            left: "-9999px",
            width: "0px",
            height: "0px"
        });
        clipboardDiv.appendChild(clipboard);
        return clipboard;
    },


  //**************************************************************************
  //** getSuggestedColumnWidths
  //**************************************************************************
  /** Used to analyze a given dataset and suggest column widths for a table or
   *  a datagrid
   *  @param records A two-dimensional array representing rows and columns
   *  @param pixelsPerChar Approximate, average width of a character
   *  @param maxWidth Optional. The available width for the table/grid control
   *  @returns JSON object with various stats and suggestedWidths
   */
    getSuggestedColumnWidths: function(records, pixelsPerChar, maxWidth){

        var widths = [];
        var zscores = [];
        var totalWidth = 0;
        var headerWidth = 0;
        var suggestedWidths = [];

        var columns = records[0];

        if (columns.length>1){

            for (var i=0; i<columns.length; i++){
                var len = 0;
                var column = columns[i];
                if (column!=null) len = (column+"").length;
                widths.push(len);
                headerWidth+=len*pixelsPerChar;
            }


            for (var i=0; i<records.length; i++){
                var record = records[i];
                for (var j=0; j<record.length; j++){
                    var rec = record[j];
                    var len = 0;
                    if (rec!=null){
                        var str = rec+"";
                        var r = str.indexOf("\r");
                        var n = str.indexOf("\n");
                        if (r==-1){
                            if (n>-1) str = str.substring(0, n);
                        }
                        else{
                            if (n>-1){
                                str = str.substring(0, Math.min(r,n));
                            }
                            else str = str.substring(0, r);
                        }

                        len = str.length*pixelsPerChar;
                    }
                    widths[j] = Math.max(widths[j], len);
                }
            }


          //Get total width
            for (var i=0; i<widths.length; i++){
                totalWidth += widths[i];
            }


          //Check if any columns are super wide (or very narrow) using z-scores
            var outliers = [];
            zscores = javaxt.dhtml.utils.getZScores(widths, true);
            for (var i=0; i<zscores.length; i++){
                if (zscores[i]>1) outliers.push(i);
            }


          //Compute suggestedWidths. If we have one column that's really wide,
          //we'll make it 100% and use pixels for the other columns. Otherwise,
          //we'll use percentages for everything
            var usePercentages = true;
            if (outliers.length===1){

                var outlier = outliers[0];
                var outlierWidth = widths[outlier];


              //Check if the outlier is really wider than all the other fields
                var updateOutlier = true;
                for (var i=0; i<widths.length; i++){
                    if (i===outlier) continue;
                    if (widths[i]>outlierWidth){
                        updateOutlier = false;
                        break;
                    }
                }


              //Check if the outlier should be converted to 100% width
                if (updateOutlier){
                    maxWidth = parseFloat(maxWidth+"");
                    if (!isNaN(maxWidth)){

                        if (totalWidth-outlierWidth>maxWidth){

                          //If all the other columns add up to more than the
                          //available area, don't use 100%
                            updateOutlier = false;

                        }
                        else{

                          //If the column were to be set to 100%, compute the
                          //max width that would be allotted. If the computed
                          //width is less than one of the other columns, don't
                          //use 100%
                            var r = maxWidth-(totalWidth-outlierWidth);
                            for (var i=0; i<widths.length; i++){
                                if (i===outlier) continue;
                                if (widths[i]>r){
                                    updateOutlier = false;
                                    break;
                                }
                            }

                        }
                    }
                }



              //Set outlier to 100% width and use pixels for the other columns
                if (updateOutlier){
                    usePercentages = false;
                    for (var i=0; i<widths.length; i++){
                        var colWidth = i==outlier ? "100%" : widths[i] + "px";
                        suggestedWidths.push(colWidth);
                    }
                }

            }

            if (usePercentages) {

              //Use percentages for all the fields
                for (var i=0; i<widths.length; i++){
                    var colWidth = ((widths[i]/totalWidth)*100)+"%";
                    suggestedWidths.push(colWidth);
                }

            }


        }
        else{
            widths.push(1);
            totalWidth = 1;
            suggestedWidths.push("100%");
        }




        return {
            widths: widths,
            zscores: zscores,
            totalWidth: totalWidth,
            headerWidth: headerWidth,
            suggestedWidths: suggestedWidths
        };
    },


  //**************************************************************************
  //** onRender
  //**************************************************************************
  /** Used to check whether DOM element has been added to the document. Calls
   *  a callback if it exists or when it is added.
   */
    onRender: function(el, callback){
        var w = el.offsetWidth;
        if (w===0 || isNaN(w)){
            var timer;

            var checkWidth = function(){
                var w = el.offsetWidth;
                if (w===0 || isNaN(w)){
                    timer = setTimeout(checkWidth, 100);
                }
                else{
                    clearTimeout(timer);
                    if (callback) callback.apply(el, [el]);
                }
            };

            timer = setTimeout(checkWidth, 100);
        }
        else{
            if (callback) callback.apply(el, [el]);
        }
    },


  //**************************************************************************
  //** updateDOM
  //**************************************************************************
  /** Used to update the default befaviour of the browser to prevent things
   *  like right mouse click, scrolling beyond a page, and drag and drop.
   */
    updateDOM: function(){

        if (document.javaxt) return;

      //Disable right-click context menu
        document.oncontextmenu = function(e){
            return false;
        };


      //Add logic to prevent touch devices like iPad from scrolling beyond the document
      //http://stackoverflow.com/a/26853900
        var firstMove;
        window.addEventListener('touchstart', function (e) {
            firstMove = true;
        });
        window.addEventListener('touchmove', function (e) {
            if (firstMove) {
                e.preventDefault();

                firstMove = false;
            }
        });



      //Watch for drag and drop events
        if (!document.body) document.body = document.getElementsByTagName("body")[0];
        var body = document.body;
        body.addEventListener('dragover', function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }, false);
        body.addEventListener('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }, false);


        document.javaxt = {};
    },


  //**************************************************************************
  //** getRect
  //**************************************************************************
  /** Returns the geometry of a given element.
   */
    getRect: function(el){

        if (el.getBoundingClientRect){
            return el.getBoundingClientRect();
        }
        else{
            var x = 0;
            var y = 0;
            var w = el.offsetWidth;
            var h = el.offsetHeight;

            function isNumber(n){
               return n === parseFloat(n);
            }

            var org = el;

            do{
                x += el.offsetLeft - el.scrollLeft;
                y += el.offsetTop - el.scrollTop;
            } while ( el = el.offsetParent );


            el = org;
            do{
                if (isNumber(el.scrollLeft)) x -= el.scrollLeft;
                if (isNumber(el.scrollTop)) y -= el.scrollTop;
            } while ( el = el.parentNode );


            return{
                x: x,
                y: y,
                left: x,
                right: x+w,
                top: y,
                bottom: y+h,
                width: w,
                height: h
            };
        }
    },


  //**************************************************************************
  //** intersects
  //**************************************************************************
  /** Used to test whether two rectangles intersect.
   */
    intersects: function(r1, r2) {
      return !(r2.left > r1.right ||
               r2.right < r1.left ||
               r2.top > r1.bottom ||
               r2.bottom < r1.top);
    },


  //**************************************************************************
  //** getAreaOfIntersection
  //**************************************************************************
  /** Returns the area of intersection between 2 rectangles.
   */
    getAreaOfIntersection: function(r1, r2){

        var minX = r2.left;
        var maxX = r2.right;
        var minY = r2.top;
        var maxY = r2.bottom;

        var left = r1.left;
        var right = r1.right;
        var top = r1.top;
        var bottom = r1.bottom;

        if (left<minX) left=minX;
        if (right>maxX) right=maxX;
        if (top<minY) top=minY;
        if (bottom>maxY) bottom=maxY;

        var w = right-left;
        var h = bottom-top;
        return w*h;
    },


  //**************************************************************************
  //** getZScores
  //**************************************************************************
  /** Returns z-scores for a given set of values
   *  @param values An array of numbers
   *  @param normalize If true, will return positive values for z-scores
   *  @returns An array of decimal values representing z-scores
   */
    getZScores: function(values, normalize){

      //Sum all the values
        var total = 0;
        for (var i=0; i<values.length; i++){
            total+=values[i];
        }


      //Work out the Mean (the simple average of the numbers)
        var numSamples = values.length;
        var mean = total / numSamples;


      //Then for each number: subtract the Mean and square the result
        var sum = 0.0;
        for (var i=0; i<values.length; i++){
            var x = values[i];
            sum += Math.pow(x - mean, 2);
        }


      //Then compute the square root of the mean of the squared differences
        var std = Math.sqrt(sum/numSamples);



      //Calculate z-scores
        var zScores = [];
        for (var i=0; i<values.length; i++){
            var x = values[i];
            var z = (x - mean)/std;

            if (z<0 && normalize) z = -z;
            zScores.push(z);
        }

        return zScores;
    },


  //**************************************************************************
  //** initDrag
  //**************************************************************************
  /** Used to update a DOM element and enable dragging. It is up to the caller
   *  to process the drag events and update the DOM element via event handlers
   *  defined in the config. Example:
   <pre>
    initDrag(div, {
        onDragStart: function(mouseX, mouseY){
            //Do something, like compute x/y offsets, update cursor, etc
        },
        onDrag: function(mouseX, mouseY){
            this.style.left = x + 'px';
            this.style.top = y + 'px';
        },
        onDragEnd: function(){
            //Do something, like repost position, update cursor, etc
        }
    });
   </pre>
   */
    initDrag : function(dragHandle, config){
        javaxt.dhtml.utils.addNoSelectRule();

        if (!config) config = {};
        var holdDelay = config.holdDelay;
        if (isNaN(holdDelay)) holdDelay = 50;

        var cursor = dragHandle.style.cursor;
        if (!cursor) cursor = "default";


      //This timeout, started on mousedown, triggers the beginning of a hold
        var holdStarter = null;


      //This flag indicates the user is currently holding the mouse down
        var holdActive = false;


      //OnClick
        //div.onclick = NOTHING!! not using onclick at all - onmousedown and onmouseup take care of everything


      //MouseDown
        dragHandle.onmousedown = function(e){


          //Set the holdStarter and wait for the predetermined delay, and then begin a hold
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;


              //Initiate drag
                startDrag(e);


              //Add event listeners
                if (document.addEventListener) {
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                }
                else if (document.attachEvent) {
                    document.attachEvent("onmousemove", onMouseMove);
                    document.attachEvent("onmouseup", onMouseUp);
                }

            }, holdDelay);

        };



      //MouseUp
        var onMouseUp = function(e){



          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);


                //simple click
            }

          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;

              //Remove event listeners
                if (document.removeEventListener) {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                } else if (document.detachEvent) {
                    document.detachEvent("onmousemove", onMouseMove);
                    document.detachEvent("onmouseup", onMouseUp);
                }

              //Update cursor
                dragHandle.style.cursor = cursor;

                if (config.onDragEnd)
                config.onDragEnd.apply(dragHandle, [e]);


              //Remove the "javaxt-noselect" class
                var body = document.getElementsByTagName('body')[0];
                setTimeout(function() {
                body.className = body.className.replace( /(?:^|\s)javaxt-noselect(?!\S)/g , '' );
                }, 800);
            }
        };


        dragHandle.onmouseup = onMouseUp;



      //Start touch (similar to "onmousedown")
        dragHandle.ontouchstart = function(e) {

            e.preventDefault();
            var touch = e.touches[0];
            var x = touch.pageX;
            var y = touch.pageY;




          //Set the holdStarter and wait for the holdDelay before starting the drag
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;

              //Initiate drag
                startDrag({
                    clientX: x,
                    clientY: y
                });


              //Add "touchmove" event listener
                if (document.removeEventListener) {
                    dragHandle.addEventListener("touchmove", onTouchMove);
                }
                else if (document.detachEvent) {
                    dragHandle.attachEvent("ontouchmove", onTouchMove);
                }


            }, holdDelay);
        };

      //End touch (similar to "onmouseup")
        dragHandle.ontouchend = function(e) {


          //Remove "touchmove" event listener
            if (document.removeEventListener) {
                dragHandle.removeEventListener("touchmove", onTouchMove);
            }
            else if (document.detachEvent) {
                dragHandle.detachEvent("ontouchmove", onTouchMove);
            }



          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);
                //Click Event!
            }

          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;
                //End drag!
            }

        };



        var onMouseMove = function(e){
            var x = e.clientX;
            var y = e.clientY;

            if (config.onDrag)
            config.onDrag.apply(dragHandle, [x,y]);
        };

        var onTouchMove = function(e) {
            e.preventDefault();
            var touch = e.touches[0];
            var x = touch.pageX;
            var y = touch.pageY;

            onMouseMove({
                clientX: x,
                clientY: y
            });
        };


        var startDrag = function(e){
            var x = e.clientX;
            var y = e.clientY;

            if (config.onDragStart)
            config.onDragStart.apply(dragHandle, [x,y,e]);


          //Disable text selection in the entire document - very important!
            var body = document.getElementsByTagName('body')[0];
            if (!body.className.match(/(?:^|\s)javaxt-noselect(?!\S)/) ){
                body.className += (body.className.length==0 ? "" : " ") + "javaxt-noselect";
            }

        };
    },


  //**************************************************************************
  //** addResizeListener
  //**************************************************************************
  /** Used to watch for resize events for a given element.
   */
    addResizeListener: function(element, fn){

        /* This is a really old hack from 2013 when there were limited
         * cross-browser options to watch for resize events. The code was
         * lifted directly from this link:
         * http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
         */


        var destroy, isDestroyed = false;

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
            var el = e.target || e.srcElement;
            if (el.raf) cancelFrame(el.raf);
            el.raf = requestFrame(function(){
                if (isDestroyed) return;
                fn.call(el.resizeTrigger, e);
            });
        };


        if (document.attachEvent) { //non-standard JS function implemented in IE8 and below
            element.resizeTrigger = element;
            var f = function(e){
                resizeListener(e, fn);
            };
            element.attachEvent('onresize', f);
            destroy = function(){
                element.detachEvent('onresize', f);
            };
        }
        else {
            if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
            var obj = element.resizeTrigger = document.createElement('object');
            obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
            obj.resizeElement = element;
            obj.onload = function(e){
                this.contentDocument.defaultView.resizeTrigger = this.resizeElement;
                this.contentDocument.defaultView.addEventListener('resize', function(e){
                    resizeListener(e, fn);
                });
            };
            var isIE = navigator.userAgent.match(/Trident/);
            obj.type = 'text/html';
            if (isIE) element.appendChild(obj);
            obj.data = 'about:blank';
            if (!isIE) element.appendChild(obj);
            destroy = function(){
                element.removeChild(obj);
            };
        }


        return {
            destroy: function(){
                try{ destroy(); } catch(e){}
                isDestroyed = true;
            }
        };
    },


  //**************************************************************************
  //** getHighestElements
  //**************************************************************************
  /** Returns an array of elements at the highest z-index in the document
   */
    getHighestElements: function(obj){
        var arr = [];
        var highestIndex = 0;
        var currentIndex = 0;
        var elArray = Array();
        if(obj){elArray = obj.getElementsByTagName('*');}else{elArray = document.getElementsByTagName('*');}
        for (var i=0; i < elArray.length; i++){
            var el = elArray[i];
            if (el.currentStyle){
                currentIndex = parseFloat(el.currentStyle['zIndex']);
            }
            else if(window.getComputedStyle){
                currentIndex = parseFloat(document.defaultView.getComputedStyle(el,null).getPropertyValue('z-index'));
            }
            if(!isNaN(currentIndex)){
                if (currentIndex > highestIndex){
                    highestIndex = currentIndex;
                    arr = [];
                    arr.push(el);
                }
                else if (currentIndex===highestIndex){
                    arr.push(el);
                }
            }
        }
        return {
            zIndex: highestIndex,
            elements: arr,
            contains: function(el){
                for (var i=0; i<arr.length; i++){
                    if (arr[i]===el) return true;
                }
                return false;
            }
        };
    },


  //**************************************************************************
  //** getNextHighestZindex
  //**************************************************************************
  /** Returns an integer represeting the highest z-value of all the DOM
   *  elements that appear with the given object + 1
   */
    getNextHighestZindex: function(obj){
        var highestIndex = javaxt.dhtml.utils.getHighestElements(obj).zIndex;
        return(highestIndex+1);
    },


  //**************************************************************************
  //** addShowHide
  //**************************************************************************
  /** Adds show/hide methods to a DOM element or javaxt component
   */
    addShowHide: function(el){
        if (el.el){ //Special case for javaxt components
            var me = el;
            me.show = function(){
                me.el.style.visibility = '';
                me.el.style.display = '';
            };
            me.hide = function(){
                me.el.style.visibility = 'hidden';
                me.el.style.display = 'none';
            };
            me.isVisible = function(){
                return !(me.el.style.visibility === 'hidden' && me.el.style.display === 'none');
            };
        }
        else{
            el.show = function(){
                this.style.visibility = '';
                this.style.display = '';
            };
            el.hide = function(){
                this.style.visibility = 'hidden';
                this.style.display = 'none';
            };
            el.isVisible = function(){
                return !(this.style.visibility === 'hidden' && this.style.display === 'none');
            };
        }
    },


  //**************************************************************************
  //** destroy
  //**************************************************************************
  /** Used to help destroy javaxt components
   */
    destroy: function(me){
        if (!me.el) return;

        me.el.innerHTML = "";
        var parent = me.el.parentNode;
        if (parent) parent.removeChild(me.el);

        var props = [];
        for (var key in me) {
            if (me.hasOwnProperty(key)){
                props.push(key);
            }
        }

        for (var i=0; i<props.length; i++){
            var key = props[i];
            me[key] = null;
            delete me[key];
        }
        props = null;
    },


  //**************************************************************************
  //** round
  //**************************************************************************
  /** Rounds decimal to the nearest 10ths place.
   */
    round : function(number, decimalPlaces){
        if (decimalPlaces){
            var n = Math.pow(10, decimalPlaces);
            return Math.round( number * n ) / n;
        }
        else{
            return Math.round(number);
        }
    },


  //**************************************************************************
  //** alert
  //**************************************************************************
  /** Used to render an alert dialog using the javaxt.dhtml.Window class.
   *  @param msg Message to display in the alert. Supports strings and XHR
   *  responses with "responseText".
   *  @param config Optional config used to instantiate the
   *  javaxt.dhtml.Window class.
   */
    alert: function(msg, config){
        var win = javaxt.dhtml.utils.Alert;
        if (win && win.isOpen()) return;


        if (msg==null) msg = "";


      //Special case for ajax request
        if (!(typeof(msg) === 'string' || msg instanceof String)){
            if (typeof msg.responseText !== 'undefined'){
                msg = (msg.responseText.length>0 ? msg.responseText : msg.statusText);
                if (!msg) msg = "Unknown Server Error";
            }
        }


        var win = javaxt.dhtml.utils.Alert;
        if (!win){
            var createElement = javaxt.dhtml.utils.createElement;


            var outerDiv = createElement('div', {
                position: "relative",
                width: "100%",
                height: "100%",
                cursor: "inherit"
            });

            var innerDiv = createElement('div', outerDiv, {
                position: "absolute",
                width: "100%",
                height: "100%",
                overflowX: "hidden",
                cursor: "inherit"
            });


            if (!config) config = {};
            javaxt.dhtml.utils.merge(config, {
                width: 450,
                height: 200,
                valign: "top",
                modal: true,
                title: "Alert",
                body: outerDiv,
                style: {
                    panel: "window",
                    header: "window-header alert-header",
                    title: "window-title",
                    buttonBar: "window-header-button-bar",
                    button: "window-header-button",
                    body: "window-body alert-body"
                }
            });


            win = new javaxt.dhtml.Window(document.body, config);
            win.div = innerDiv;
            javaxt.dhtml.utils.Alert = win;
        }


        win.div.innerHTML = msg;

        win.show();
        return win;
    },


  //**************************************************************************
  //** confirm
  //**************************************************************************
  /** Used to render a confirm dialog using the javaxt.dhtml.Window class.
   *  Example:
   <pre>
    javaxt.dhtml.utils.confirm({
        title: "Quit Game?",
        text: "Are you sure you want to quit the game?",
        leftButton: {
            label: "Yes",
            value: true
        },
        rightButton: {
            label: "No",
            value: false
        },
        callback: function(answer){
            if (answer===true) console.log("quit game");
            else console.log("continue game");
        }
    });
   </pre>
    @param msg String with question/prompt or a JSON config like the example
    above. If passing a string, a default config is used which can be
    overridden using the optional "config" parameter.
    @param config JSON config like the example above. This parameter is
    optional.
   */
    confirm: function(msg, config){
        var win = javaxt.dhtml.utils.Confirm;
        if (win && win.isOpen()) return;


        if (!(typeof(msg) === 'string' || msg instanceof String)){
            config = msg;
        }

        if (!config) config = {};
        javaxt.dhtml.utils.merge(config, {
            title: "Confirm",
            text: msg
        });


      //Create new window as needed
        if (!win){
            var createElement = javaxt.dhtml.utils.createElement;


            var buttonDiv = createElement("div", "button-div");


            var createButton = function(label, result){
                var input = createElement("input", buttonDiv, "form-button");
                input.type = "button";

                input.onclick = function(){
                    win.result = this.result;
                    win.close();
                };
                input.setLabel = function(label){
                    if (label) this.name = this.value = label;
                };
                input.setValue = function(b){
                    if (b===true || b===false) this.result = b;
                };
                input.update = function(config){
                    if (config){
                        this.setLabel(config.label);
                        this.setValue(config.value);
                    }
                };
                input.setLabel(label);
                input.setValue(result);
                return input;
            };


            win = new javaxt.dhtml.Window(document.body, {
                width: 450,
                height: 150,
                valign: "top",
                modal: true,
                footer: buttonDiv,
                style: {
                    panel: "window",
                    header: "window-header",
                    title: "window-title",
                    buttonBar: "window-header-button-bar",
                    button: "window-header-button",
                    body: "window-body confirm-body"
                }
            });
            javaxt.dhtml.utils.Confirm = win;


            win.leftButton = createButton("OK", true);
            win.rightButton = createButton("Cancel", false);
        }


        win.setTitle(config.title);
        win.setContent(config.text.replace("\n","<p></p>"));
        win.leftButton.update(config.leftButton);
        win.rightButton.update(config.rightButton);
        win.result = false;
        win.onClose = function(){
            var callback = config.callback;
            if (callback) callback.apply(win, [win.result]);
        };
        win.show();
        return win;
    }

};