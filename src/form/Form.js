if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Form Class
//******************************************************************************
/**
 *   Used to create a container with form inputs
 *
 ******************************************************************************/

javaxt.dhtml.Form = function (parent, config) {
    this.className = "javaxt.dhtml.Form";

    var me = this;

    var form;
    var formTable, buttonRow;
    var verticalSpacing;


    var inputs = [];
    var groups = [];
    var buttons = [];



    var defaultConfig = {
        onsubmit: null,
        items: [],

        style:{

            spacing: "8px", //vertical spacing btw form inputs

            form: {
                padding: "5px 5px 0 5px"
            },


            label: {
                color: "#363636",
                whiteSpace: "nowrap",
                cursor: "default",
                paddingRight: "8px"
            },

            addColon: true, //indicate whether

            icon: {

            },

            input: {
                borderRadius: "4px",
                color: "#363636",
                display: "inline-block",
                fontSize: "14px",
                height: "26px",
                lineHeight: "26px",
                padding: "4px 6px",
                verticalAlign: "middle",


                transition: "border 0.2s linear 0s, box-shadow 0.2s linear 0s",


                backgroundColor: "#fff",
                border: "1px solid #ccc",
                boxShadow: "0 1px 1px rgba(0, 0, 0, 0.075) inset",


                boxSizing: "border-box" //important for inputs with 100% width
            },

            radio: {
                margin: 0,
                padding: 0
            },

          //Container for buttons (footer)
            buttons: {
                padding: "0px 5px 3px 5px",
                textAlign: "right" //<-- sets button alignment
            },


          //Style for individual buttons in the button bar (footer)
            button: {
                borderRadius: "3px",
                color: "#363636",
                display: "inline-block",
                fontSize: "14px",
                width: "80px",
                height: "26px",
                lineHeight: "26px",
                verticalAlign: "middle",
                textAlign: "center",
                backgroundColor: "#e4e4e4",
                border: "1px solid #b4b4b4",
                boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.2)",
                textShadow: "1px 1px 0px rgb(255, 255, 255)",
                cursor: "pointer",
                marginLeft: "7px"
            },


            groupbox: {
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "16px 8px 12px 13px"
            },

            grouplabel: {
                margin: "8px 0 0 7px",
                backgroundColor: "white",
                padding: "0 5px 0 5px",
                color: "rgb(0, 70, 138)"
            }
        }
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of the Form control. */

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


      //Get cell padding
        verticalSpacing = config.style.spacing;



      //Create form
        form = document.createElement('form');
        form.style.padding = 0;
        form.style.margin = 0;
        form.style.height = "100%";
        form.setAttribute("desc", me.className);
        if (config.onsubmit) form.onsubmit = config.onsubmit;
        me.el = form;



      //Create table to store the form and buttons (2 rows, 1 column)
        var outerTable = createTable("100%", "100%", me.className);
        form.appendChild(outerTable.parentNode);
        var formRow, formCell, buttonCell;
        formRow = document.createElement('tr');
        formCell = document.createElement('td');
        buttonRow = document.createElement('tr');  //buttonRow is a global variable and is redefined below...
        buttonCell = document.createElement('td');

        formRow.setAttribute("desc", "formRow");
        buttonRow.setAttribute("desc", "buttonRow");

        formRow.appendChild(formCell);
        outerTable.appendChild(formRow);
        buttonRow.appendChild(buttonCell);
        outerTable.appendChild(buttonRow);

        setStyle(formCell, "form");
        formCell.style.width = "100%";
        formCell.style.height = "100%";
        formCell.style.verticalAlign = "top";

        setStyle(buttonCell, "buttons");




      //Create table for the form inputs
        formTable = createTable("100%");
        formCell.appendChild(formTable.parentNode);



      //Create table for the buttons
        var buttonTable = createTable();
        var buttonDiv = document.createElement('div');
        buttonDiv.style.display = "inline-block";
        buttonCell.appendChild(buttonDiv);
        buttonDiv.appendChild(buttonTable.parentNode);

        var align = config.style.buttons.textAlign;
        if (align===null) align = "right";
        else align = align.toLowerCase();

        if (align==="fit"){
            buttonTable.parentNode.style.width = "100%";
        }
        else if (align==="right"){
            buttonTable.parentNode.align = "right";
        }
        else if (align==="center"){
            buttonTable.parentNode.align = "center";
        }

        buttonRow = document.createElement("tr");
        buttonTable.appendChild(buttonRow);


      //Add inputs defined in the config
        if (config.items){
            for (var i=0; i<config.items.length; i++){
                var item = config.items[i];
                if (item.group){
                    addGroup(item.group, item.items, item.hidden);
                }
                else{
                    addItem(item);
                }
            }
        }



      //Add buttons defined in the config
        if (config.buttons){
            for (var i=0; i<config.buttons.length; i++){

                var button = config.buttons[i];
                var name = button.name;
                var enabled = true;
                var onclick = button.onclick;

                me.addButton(name, enabled, onclick);
            }
        }



      //Watch for resize events
        addResizeListener(parent, function(){
            me.resize();
        });


        parent.appendChild(form);
    };


  //**************************************************************************
  //** resize
  //**************************************************************************
    this.resize = function(){
        for (var i=0; i<groups.length; i++){
            updateGroup(groups[i]);
        }
    };


  //**************************************************************************
  //** getForm
  //**************************************************************************
    this.getForm = function(){
        return form;
    };


  //**************************************************************************
  //** reset
  //**************************************************************************
  /** Resets all inputs in the form to thier original values.
   */
    this.reset = function(){
        form.reset();
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
  /** Clears all values in the form.
   */
    this.clear = function(){

      //Clear standard form inputs
        for (var i=0; i<form.elements.length; i++){
            var input = form.elements[i];
            var type = input.type;

            switch (type) {
                case 'text':
                case 'textarea':
                case 'password':
                case 'hidden':
                    input.value = '';
                    break;
                case 'radio':
                case 'checkbox':
                    input.checked = '';
                    break;
                case 'select-one':
                    input.options[0].selected = true;
                    break;
                case 'select-multiple':
                    for (var z = 0; z < input.options.length; z++) {
                        input.options[z].selected = false;
                    }
                    break;
            }
        }


      //Clear any custom form inputs (e.g. javaxt components)
        for (var i=0; i<inputs.length; i++){
            var input = inputs[i];
            if (input.clear) input.clear();
        }
    };



  //**************************************************************************
  //** getData
  //**************************************************************************
  /** Returns the values for all the form inputs in JSON notation. Note that
   *  if the form has multiple inputs with the same name, the associated value
   *  will be an array. You can test whether the value is an array using the
   *  "instanceof Array" operator.
   */
    this.getData = function(){

        var values = {};


        for (var i=0; i<inputs.length; i++){
            var input = inputs[i];

            var name = input.name;
            var value = input.getValue();


            var currVal = values[name];
            if (currVal){

                var arr = [];
                if (currVal instanceof Array){
                    arr = currVal;
                }
                arr.push(value);
                values[name] = arr;
            }
            else{
                values[name] = value;
            }

        }

        return values;
    };


  //**************************************************************************
  //** getFormData
  //**************************************************************************
  /** Returns the values for all the form inputs as a FormData object
   */
    this.getFormData = function(){

        var formData = new FormData();
        var data = me.getData();

        for (var key in data) {
            if (data.hasOwnProperty(key)){
                var val = data[key];
                if (val instanceof Array){
                    var arr = val;
                    for (var i=0; i<arr.length; i++){
                        formData.append(key, val);
                    }
                }
                else{
                    formData.append(key, val);
                }
            }
        }

        return formData;
    };


  //**************************************************************************
  //** addButton
  //**************************************************************************
    this.addButton = function (name, enabled, onclick){

        var td = document.createElement('td');
        if (name.toLowerCase()==="spacer"){
            td.style.width="100%";
        }
        else{

            var input = document.createElement('input');
            input.type = "button";
            input.name = name;
            input.value = name;
            input.onclick = onclick;
            setStyle(input, "button");

            buttons.push(input);
            td.appendChild(input);
        }

        buttonRow.appendChild(td);
    };




  //**************************************************************************
  //** createTextInput
  //**************************************************************************
    var createTextInput = function(label, name, value, type, icon){

        var input;
        if (type=="textarea"){
            input = document.createElement('textarea');
            setStyle(input, "input");
            input.style.resize = "none";
            input.style.height = "100px";
        }
        else{
            input = document.createElement('input');
            input.type = type;
            setStyle(input, "input");
        }
        input.name = name;
        if (value!=null) input.value = value;
        input.style.width = "100%";



        var getValue = function(){
            return input.value;
        };
        var setValue = function(value){
            if (typeof value === "undefined") value = "";
            input.value = value;
        };

        addInput(name, label, input, getValue, setValue, icon);
    };


  //**************************************************************************
  //** createHiddenInput
  //**************************************************************************
    var createHiddenInput = function(name, value){
        var input = document.createElement('input');
        input.type = "hidden";
        input.name = name;
        if (value!=null) input.value = value;

        var getValue = function(){
            return input.value;
        };
        var setValue = function(value){
            if (typeof value === "undefined") value = "";
            input.value = value;
        };

        //addInput(name, null, input, getValue, setValue);

        inputs.push({
            name: name,
            label: null,
            row: null,
            getValue: getValue,
            setValue: setValue
        });
        form.appendChild(input);
    };


  //**************************************************************************
  //** createRadioInput
  //**************************************************************************
  /** Used to add radio inputs to the form. By default, the inputs are aligned
   *  horizontally. This can be changed by specifying alignment: "vertical".
   */
    var createRadioInput = function(label, name, item){
        var formInput;
        var options = item.options;
        var alignment = item.alignment;

        var tbody = createTable("100%");
        var table = tbody.parentNode;
        var tr;

        var arr = [];
        for (var i=0; i<options.length; i++){

            if (alignment=="vertical"){
                tr = document.createElement('tr');
                tbody.appendChild(tr);
            }
            else{ //horizontal
                if (i==0){
                    tr = document.createElement('tr');
                    tbody.appendChild(tr);
                }
            }

            var td = document.createElement('td');
            tr.appendChild(td);

            var t = createTable();
            var r = document.createElement('tr');
            t.appendChild(r);
            var c1 = document.createElement('td');
            r.appendChild(c1);
            var c2 = document.createElement('td');
            r.appendChild(c2);
            td.appendChild(t.parentNode);


            var input = document.createElement('input');
            setStyle(input, "radio");
            input.type = "radio";
            input.name = name;
            input.value = options[i].value;
            if (options[i].checked===true || options[i].selected==true){
                input.checked = true;
            }
            input.onchange = function(){
                me.onChange(formInput, getValue());
            };

            arr.push(input);
            c1.appendChild(input);


            var span = document.createElement('span');
            setStyle(span, "label");
            span.innerHTML = options[i].label;
            span.input = input;
            span.onclick = function(){
                this.input.checked = true;
                this.input.focus();
                dispatchEvent(this.input, "change");
            };
            c2.appendChild(span);
        }




        var getValue = function(){
            for (var i=0; i<arr.length; i++){
                if (arr[i].checked) return arr[i].value;
            }
            return null;
        };

        var setValue = function(value){
            var numChanges = 0;
            for (var i=0; i<arr.length; i++){
                if ((arr[i].value+"")==(value+"")){
                    if (arr[i].checked!==true) numChanges++;
                    arr[i].checked = true;
                }
                else{
                    arr[i].checked = false;
                    if (arr[i].checked===true) numChanges++;
                }
            }
            if (numChanges>0) me.onChange(formInput, getValue());
        };

        formInput = addInput(name, label, table, getValue, setValue, item.icon);
    };




  //**************************************************************************
  //** addGroup
  //**************************************************************************
  /** Used to add a group of items. The items will be rendered inside a group
   *  box.
   */
    var addGroup = function(name, items, hidden){

      //Create new row for the groupbox
        var row = document.createElement('tr');
        row.setAttribute("desc", "-- Group Start --");
        formTable.appendChild(row);


      //Calculate padding and border width for the group box
        var paddingLeft,paddingRight,paddingTop,paddingBottom,borderWidth,borderHeight;
        var style = getGroupboxStyle();
        if (style){
            paddingLeft = style.paddingLeft;
            paddingRight = style.paddingRight;
            paddingTop = style.paddingTop;
            paddingBottom = style.paddingBottom;
            borderWidth = style.borderLeft + style.borderRight;
            borderHeight = style.borderTop + style.borderBottom;
        }
        else{
            paddingLeft = parseInt(verticalSpacing);
            paddingRight = paddingLeft;
            paddingTop = paddingLeft*2;
            paddingBottom = paddingTop;
            borderWidth = 2; //assumes border is 1 pixel on each side
            borderHeight = borderWidth;
        }



      //Add row for groupbox
        var td = document.createElement('td');
        td.style.padding = (parseInt(verticalSpacing)*2) + "px " + borderWidth + "px " + paddingTop + "px 0";
        td.colSpan = 3;
        row.appendChild(td);
        var div = document.createElement('div');
        div.style.position = "relative";
        div.style.width = "100%";
        div.style.visibility = 'hidden';
        div.style.display = 'block';
        td.appendChild(div);


      //Create groupbox
        var groupbox = document.createElement('div');
        setStyle(groupbox, "groupbox");
        groupbox.style.padding = 0; //padding is a placeholder...
        groupbox.style.position = "absolute";
        groupbox.style.width = "100%";
        groupbox.style.zIndex = -1;
        div.appendChild(groupbox);


      //Create label for the groupbox
        var label = document.createElement('div');
        setStyle(label, "grouplabel");
        label.style.position = "absolute";
        label.style.left = 0;
        label.style.top = -(paddingTop+borderHeight)+"px";
        label.innerHTML = name;
        label.style.zIndex = -1;
        div.appendChild(label);


      //Add items to the form
        for (var i=0; i<items.length; i++){
            if (hidden===true) items[i].hidden = true;
            addItem(items[i]);
        }


      //Generate list of rows associated with the groupbox
        var rows = [];
        for (var i=0; i<formTable.childNodes.length; i++){
            var tr = formTable.childNodes[i];
            if (tr===row){
                for (var j=i+1; j<formTable.childNodes.length; j++){
                    tr = formTable.childNodes[j];
                    rows.push(tr);
                }
                break;
            }
        }



      //Set groupbox height
        var setHeight = function(h){

          //substract padding of last input
            h = h-parseInt(verticalSpacing);

          //add vertical padding for the groupbox
            h += (paddingTop + paddingBottom);

            groupbox.style.height = h + "px";
            div.style.visibility = '';
        };
        getHeight(rows, setHeight);



      //Add padding to the inputs
        for (var i=0; i<rows.length; i++){
            var tr = rows[i];
            var cols = tr.childNodes;
            cols[0].style.paddingLeft = paddingLeft + "px";
            cols[cols.length-1].style.paddingRight = (paddingRight+borderWidth) + "px";
        }


      //Add row below the last input for padding
        var row = document.createElement('tr');
        row.setAttribute("desc", "-- Group End --");
        formTable.appendChild(row);
        var td = document.createElement('td');
        td.style.padding = (parseInt(verticalSpacing) + paddingBottom) + "px 0 0 0";
        td.colSpan = 3;
        row.appendChild(td);



      //Update groups variable
        var arr = [];
        for (var i=0; i<rows.length; i++){
            var tr = rows[i];
            if (i===0) arr.push(tr.previousSibling);
            arr.push(tr);
        }
        arr.push(row);
        groups.push({
            name: name,
            rows: arr,
            setHeight: setHeight
        });


        showHideGroup(name, hidden);
    };


  //**************************************************************************
  //** showGroup
  //**************************************************************************
  /** Used to display a hidden group.
   */
    this.showGroup = function(name){
        showHideGroup(name, false);
    };


  //**************************************************************************
  //** hideGroup
  //**************************************************************************
  /** Used to hide a group box.
   */
    this.hideGroup = function(name){
        showHideGroup(name, true);
    };


  //**************************************************************************
  //** showHideGroup
  //**************************************************************************
  /** Used to show or hide a group of inputs in the form.
   */
    var showHideGroup = function(groupName, hide){
        var group;
        for (var i=0; i<groups.length; i++){
            if (groups[i].name===groupName){
                group = groups[i];
                break;
            }
        }
        if (group){
            for (var i=0; i<group.rows.length; i++){
                var tr = group.rows[i];
                if (hide){
                    tr.style.visibility = 'hidden';
                    tr.style.display = 'none';
                }
                else{
                    tr.style.display = '';
                    tr.style.visibility = '';
                }
            }
        }
    };


  //**************************************************************************
  //** addItem
  //**************************************************************************

    var addItem = function(item){
        var type = item.type;
        var name = item.name;
        var label = item.label;
        var icon = item.icon;
        var value = item.value;

        if (typeof type === "string"){
            if (type==="text" || type==="password" || type==="textarea"){
                createTextInput(label, name, value, type, icon);
            }
            else if (type==="radio"){
                createRadioInput(label, name, item);
            }
            else if (type==="hidden"){
                createHiddenInput(name, value);
            }
        }
        else{

            var el;
            var getValue, setValue;
            var input = type;
            if (input.tagName){
                if (input.tagName.toLowerCase()==="input"){
                    el = input;
                    getValue = function(){
                        return input.value;
                    };
                    setValue = function(value){
                        input.value = value;
                    };
                }
            }
            else{
                if (input.el && input.getValue){ //hook for javaxt components
                    el = input.el;
                    getValue = function(){
                        return input.getValue();
                    };
                    setValue = function(value){
                        input.setValue(value);
                    };
                }
            }


            if (el){
                addInput(name, label, el, getValue, setValue, icon);
            }
        }
    };


  //**************************************************************************
  //** addInput
  //**************************************************************************

    var addInput = function(name, label, el, getValue, setValue, icon){


      //Create new row
        var row = document.createElement('tr');
        formTable.appendChild(row);


      //Icon
        var td = document.createElement('td');
        if (icon){
            setStyle(td, "icon");
            var iconDiv = document.createElement('div');
            iconDiv.className = icon;
            td.appendChild(iconDiv);
        }
        row.appendChild(td);


      //Label
        row.appendChild(createLabel(label));


      //Input
        td = document.createElement('td');
        td.style.width = "100%";
        td.style.paddingBottom=verticalSpacing;
        row.appendChild(td);
        td.appendChild(el);


        var input = {
            name: name,
            label: label,
            row: row,
            getValue: getValue,
            setValue: setValue
        };
        inputs.push(input);
        return input;
    };


  //**************************************************************************
  //** createLabel
  //**************************************************************************
  /** Used to create a column with a form label. */

    var createLabel = function(label){

        var td = document.createElement('td');
        setStyle(td, "label");
        td.style.paddingBottom=verticalSpacing;


        td.onselectstart = function () {return false;};
        td.onmousedown = function () {return false;};

        if (label!=null){
            label = label.replace(/^\s*/, "").replace(/\s*$/, ""); //trim
            if (label.length>0){
                if (label.indexOf(":")!=label.length && config.style.addColon===true) label+=": ";
                else label+=" ";
            }
        }
        if (label!=null) td.innerHTML = label;
        return td;
    };





  //**************************************************************************
  //** enableField
  //**************************************************************************
  /** Used to enable a form input. Returns true if the field was found and is
   *  enabled.
   */
    this.enableField = function(name){
        var field = me.findField(name);
        if (field){
            var row = field.row;
            row.style.opacity=1;
            row.style.filter = 'alpha(opacity=100)';
            row.childNodes[0].style.filter = row.childNodes[1].style.filter = row.style.filter;
            row.childNodes[1].childNodes[0].disabled=false;
            return true;
        }
        return false;
    };


  //**************************************************************************
  //** disableField
  //**************************************************************************
  /** Used to disable a form input. Returns true if the field was found and is
   *  disabled.
   */
    this.disableField = function(name){
        var field = me.findField(name);
        if (field){
            var row = field.row;
            row.style.opacity=0.6;
            row.style.filter = 'alpha(opacity=' + row.style.opacity*100 + ')';
            row.childNodes[0].style.filter = row.childNodes[1].style.filter = row.style.filter;
            row.childNodes[1].childNodes[0].disabled=true;
            return true;
        }
        return false;
    };


  //**************************************************************************
  //** hideField
  //**************************************************************************
  /** Used to hide a form input. Returns true if the field was found and
   *  hidden from view.
   */
    this.hideField = function(name){
        var field = me.findField(name);
        if (field){
            var row = field.row;

          //Update visibility
            row.style.visibility = 'hidden';
            row.style.display = 'none';

          //Check if the row is part of a group and update height as needed
            var group = findGroup(row);
            if (group) updateGroup(group);

            return true;
        }
        return false;
    };


  //**************************************************************************
  //** showField
  //**************************************************************************
  /** Used to unhide a form input. Returns true if the field was found and
   *  is visible.
   */
    this.showField = function(name){
        var field = me.findField(name);
        if (field){
            var row = field.row;

          //Update visibility
            row.style.visibility = '';
            row.style.display = '';

          //Check if the row is part of a group and update height as needed
            var group = findGroup(row);
            if (group) updateGroup(group);

            return true;
        }
        return false;
    };





//    this.submit = function(url, method){
//        this.setAction(url);
//        this.setMethod(method);
//        form.submit();
//    };
//
//
//    this.setTarget = function(target){
//        form.target = target;
//    };
//
//    this.setAction = function(url){
//        if (url!=null) form.action = url;
//    };
//
//    this.setMethod = function(method){
//        if (method!=null){
//            method = method.toString().toLowerCase();
//            if (method=="get" || method=="post") form.method = method;
//        }
//    };


    this.onChange = function(formField){};


  //**************************************************************************
  //** getValue
  //**************************************************************************
    this.getValue = function(name){
        var field = me.findField(name);
        if (field){
            return field.getValue();
        }
        return null;
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
    this.setValue = function(name, value){
        var field = me.findField(name);
        if (field){
            field.setValue(value);
            return true;
        }
        return false;
    };


  //**************************************************************************
  //** findField
  //**************************************************************************
  /** Used to find a row in the form.
   *  @param keyword Input name or label associated with the input.
   */
    this.findField = function(name){

        for (var i=0; i <inputs.length; i++){
            if (inputs[i].name===name) return inputs[i];
        }
        for (var i=0; i <inputs.length; i++){
            if (inputs[i].label===name) return inputs[i];
        }
        return null;
    };


  //**************************************************************************
  //** findGroup
  //**************************************************************************
  /** Used to find a groupbox associated with a given row. Returns null if the
   *  row is not part of a groupbox.
   */
    var findGroup = function(row){
        for (var i=0; i<groups.length; i++){
            var group = groups[i];
            for (var j=0; j<group.rows.length; j++){
                var tr = group.rows[j];
                if (tr===row) return group;
            }
        }
        return null;
    };


  //**************************************************************************
  //** updateGroup
  //**************************************************************************
  /** Used to update the hight of a given groupbox.
   */
    var updateGroup = function(group){
        var rows = group.rows;
        var setHeight = group.setHeight;
        var arr = [];
        for (var i=1; i<rows.length-1; i++){
            arr.push(rows[i]);
        }
        getHeight(arr, setHeight);
    };


  //**************************************************************************
  //** getGroupboxStyle
  //**************************************************************************
    var getGroupboxStyle = function(){

        if (config.groupbox) return config.groupbox;

      //Create temporary div to get groupbox style
        var temp = document.createElement("div");
        setStyle(temp, "groupbox");
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
                prop = prop.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
                return style.getPropertyValue(prop);
            }
            else{
                return style[prop];
            }
        };

        config.groupbox = {
            paddingTop: parseInt(getStyle("paddingTop")),
            paddingBottom: parseInt(getStyle("paddingBottom")),
            paddingLeft: parseInt(getStyle("paddingLeft")),
            paddingRight: parseInt(getStyle("paddingRight")),
            borderLeft: parseInt(getStyle("borderLeftWidth")),
            borderRight: parseInt(getStyle("borderRightWidth")),
            borderTop: parseInt(getStyle("borderTopWidth")),
            borderBottom: parseInt(getStyle("borderBottomWidth"))
        };

        body.removeChild(temp);
        temp = null;

        return config.groupbox;
    };


  //**************************************************************************
  //** getHeight
  //**************************************************************************
  /** Used to calculate the total height of a given list of rows. If the
   *  height is not immediately available, then the form's parent has not been
   *  added to the document. In this case, we will periodically check to see
   *  if the form's status changes so that we can set the height of the
   *  groupbox.
   */
    var getHeight = function(rows, callback){

        var _getHeight = function(){
            var h = 0;
            for (var i=0; i<rows.length; i++){
                if (rows[i].style.display !== 'none'){
                    h+= rows[i].offsetHeight;
                }
            }
            return h;
        };

        var h = _getHeight(rows);
        if (h===0 || isNaN(h)){

            var timer;

            var checkHeight = function(){
                var h = _getHeight();
                if (h===0 || isNaN(h)){
                    timer = setTimeout(checkHeight, 100);
                }
                else{
                    clearTimeout(timer);
                    callback.apply(me, [h]);
                }
            };

            timer = setTimeout(checkHeight, 100);
        }
        else{
            callback.apply(me, [h]);
        }
    };

  //**************************************************************************
  //** stringToFunction
  //**************************************************************************
  /** Converts a string to a function or class. Example:
   *  var DateInput = stringToFunction("javaxt.dhtml.DateInput");
   *  var dateInput = new DateInput(...);
   */
    var stringToFunction = function(str) {
      var arr = str.split(".");

      var fn = (window || this);
      for (var i = 0, len = arr.length; i < len; i++) {
        fn = fn[arr[i]];
      }

      if (typeof fn !== "function") {
        throw new Error("function not found");
      }

      return  fn;
    };


  //**************************************************************************
  //** dispatchEvent
  //**************************************************************************
    var dispatchEvent = function(el, event){
        if ("createEvent" in document) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent(event, false, true);
            el.dispatchEvent(evt);
        }
        else{
            el.fireEvent("on"+event);
        }
    };


  //**************************************************************************
  //** createTable
  //**************************************************************************
    var createTable = function(width, height, desc){
        var table = javaxt.dhtml.utils.createTable();
        var tbody = table.firstChild;
        if (width) table.style.width = width;
        else table.style.width = '';
        if (height) table.style.height = height;
        else table.style.height = '';
        if (desc) table.setAttribute("desc", desc);
        return tbody;
    };


  //**************************************************************************
  //** setStyle
  //**************************************************************************
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };



    var merge = javaxt.dhtml.utils.merge;
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;

    init();
};