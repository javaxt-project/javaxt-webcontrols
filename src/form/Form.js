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

    var defaultConfig = {
        onsubmit: null,

      /** An array of items that make up the form (e.g. form inputs and labels).
       */
        items: [],


      /** An array of buttons that will be placed at the bottom of the form
       * (e.g. submit, cancel, reset).
       */
        buttons: [],


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
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

            checkbox: {
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


    var form;
    var outerTable;
    var formTable, buttonRow;
    var verticalSpacing;


    var inputs = [];
    var groups = [];
    var buttons = [];



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


      //Get cell padding
        verticalSpacing = config.style.spacing;



      //Create form
        form = createElement('form', parent, {
            padding: 0,
            margin: 0,
            height: "100%"
        });
        form.setAttribute("desc", me.className);
        if (config.onsubmit) form.onsubmit = config.onsubmit;
        else{
            form.onsubmit = function(e){
                e.preventDefault();
            };
        }
        me.el = form;



      //Create table to store the form and buttons (2 rows, 1 column)
        outerTable = createTable("100%", "100%", me.className);
        form.appendChild(outerTable);

        var formRow = outerTable.addRow();
        formRow.setAttribute("desc", "formRow");


        var formCell = formRow.addColumn(config.style.form);
        formCell.style.width = "100%";
        formCell.style.height = "100%";
        formCell.style.verticalAlign = "top";


      //Create table for the form inputs
        formTable = createTable("100%");
        formCell.appendChild(formTable);


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

        onRender(parent, me.resize);
    };


  //**************************************************************************
  //** onChange
  //**************************************************************************
  /** Called whenever a field changes value in the form
   */
    this.onChange = function(input, value){};


  //**************************************************************************
  //** onResize
  //**************************************************************************
  /** Called whenever the form is resized
   */
    this.onResize = function(){};


  //**************************************************************************
  //** resize
  //**************************************************************************
  /** Used to update the layout of all the elements in this component
   */
    this.resize = function(){
        for (var i=0; i<groups.length; i++){
            updateGroup(groups[i]);
        }
        me.onResize();
    };


  //**************************************************************************
  //** getForm
  //**************************************************************************
  /** Returns the "form" element underpinning this component
   */
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
  /** Used to add a button to the bottom of the form
   */
    this.addButton = function (name, enabled, onclick){


      //Create buttonRow as needed
        if (!buttonRow){

            buttonRow = outerTable.addRow(); //buttonRow is a global variable and is redefined below...
            buttonRow.setAttribute("desc", "buttonRow");

            var buttonCell = buttonRow.addColumn(config.style.buttons);


          //Create table for the buttons
            var buttonTable = createTable();
            var buttonDiv = createElement('div', buttonCell);
            buttonDiv.style.display = "inline-block";
            buttonDiv.appendChild(buttonTable);

            var align = config.style.buttons.textAlign;
            if (align===null) align = "right";
            else align = align.toLowerCase();

            if (align==="fit"){
                buttonTable.style.width = "100%";
            }
            else if (align==="right"){
                buttonTable.align = "right";
            }
            else if (align==="center"){
                buttonTable.align = "center";
            }

            buttonRow = buttonTable.addRow();
        }



        var td = buttonRow.addColumn();
        if (name.toLowerCase()==="spacer"){
            td.style.width="100%";
        }
        else{

            var input = createElement('input', td);
            input.type = "button";
            input.name = name;
            input.value = name;
            input.onclick = onclick;
            setStyle(input, "button");

            buttons.push(input);
        }
    };


  //**************************************************************************
  //** getButton
  //**************************************************************************
  /** Returns a button found at the bottom of the form
   *  @param name Name of the button (input.name)
   */
    this.getButton = function(name){
        for (var i=0; i<buttons.length; i++){
            if (buttons[i].name===name) return buttons[i];
        }
        return null;
    };


  //**************************************************************************
  //** getButtons
  //**************************************************************************
  /** Returns all the buttons found at the bottom of the form as an array
   */
    this.getButtons = function(){
        return buttons;
    };


  //**************************************************************************
  //** createTextInput
  //**************************************************************************
    var createTextInput = function(config){

        var type = config.type;
        var name = config.name;
        var label = config.label;
        var icon = config.icon;
        var value = config.value;

        var input;
        if (type=="textarea"){
            input = createElement('textarea');
            setStyle(input, "input"); //maybe we need a different style config for textareas?
            input.style.lineHeight = "normal";
            input.style.resize = "none";
            input.style.height = "100px";
            if (config.height) input.style.height = config.height;
            if (config.spellcheck===false) input.setAttribute("spellcheck", "false"); //<-- enable spellcheck by default
        }
        else{
            input = createElement('input');
            setStyle(input, "input");
            input.type = type;
            if (config.placeholder) input.setAttribute("placeholder", config.placeholder);
            if (config.spellcheck===true){} else input.setAttribute("spellcheck", "false"); //<-- disable spellcheck by default
        }
        input.name = name;
        if (value!=null) input.value = value;
        input.style.width = "100%";
        input.setAttribute("autocomplete", "off");



        var getValue = function(){
            return input.value;
        };
        var setValue = function(value, silent){
            if (typeof value === "undefined") value = "";
            var updateValue = input.value!=value;

          //Special case for zeros
            if (!updateValue){
                if (value===0 && parseInt(input.value+"")!==0){
                    updateValue = true;
                }
            }

            if (updateValue){
                input.value = value;
                if (silent===true) return;
                input.oninput(); //fire onchange event
            }
        };

        var formInput = addInput(name, label, input, getValue, setValue, icon);

        input.oninput = function(){
            me.onChange(formInput, input.value);
        };
        input.onpaste = input.oninput;
        input.onpropertychange = input.oninput;
    };


  //**************************************************************************
  //** createHiddenInput
  //**************************************************************************
    var createHiddenInput = function(name, value){
        var input = createElement('textarea', form);
        input.style.display = "none";
        input.name = name;
        if (value!=null) input.value = value;

        var getValue = function(){
            return input.value;
        };
        var setValue = function(value, silent){
            if (typeof value === "undefined") value = "";
            if (input.value!=value){
                input.value = value;
                if (silent===true) return;
                input.onchange(); //fire onchange event
            }
        };

        var formInput = {
            name: name,
            label: null,
            row: null,
            getValue: getValue,
            setValue: setValue
        };

        input.onchange = function(){
            me.onChange(formInput, input.value);
        };

        inputs.push(formInput);
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

        var table = createTable("100%");
        var tr;

        var arr = [];
        for (var i=0; i<options.length; i++){

            if (alignment=="vertical"){
                tr = table.addRow();
            }
            else{ //horizontal
                if (i==0){
                    tr = table.addRow();
                }
            }

            var td = tr.addColumn();

            var t = createTable();
            var r = t.addRow();
            var c1 = r.addColumn();
            var c2 = r.addColumn();
            td.appendChild(t);


            var input = createElement('input', c1, config.style.radio);
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


            var span = createElement('span', c2, config.style.label);
            span.innerHTML = options[i].label;
            span.input = input;
            span.onclick = function(){
                if (this.input.disabled==true) return;
                this.input.checked = true;
                this.input.focus();
                dispatchEvent(this.input, "change");
            };
        }




        var getValue = function(){
            for (var i=0; i<arr.length; i++){
                if (arr[i].checked) return arr[i].value;
            }
            return null;
        };

        var setValue = function(value, silent){
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
            if (silent===true) return;
            if (numChanges>0) me.onChange(formInput, getValue());
        };

        formInput = addInput(name, label, table, getValue, setValue, item.icon);

        formInput.enable = function(){
            for (var i=0; i<arr.length; i++) arr[i].disabled=false;
            var rows = table.getRows();
            for (var i=0; i<rows.length; i++) rows[i].style.opacity = "";
        };

        formInput.disable = function(){
            for (var i=0; i<arr.length; i++) arr[i].disabled=true;
            var rows = table.getRows();
            for (var i=0; i<rows.length; i++) rows[i].style.opacity = "0.6";
        };
    };


  //**************************************************************************
  //** createCheckboxInput
  //**************************************************************************
  /** Used to add checkbox inputs to the form. By default, the inputs are
   *  aligned vertically. This can be changed by specifying "horizontal"
   *  alignment
   */
    var createCheckboxInput = function(label, name, item){
        var formInput;
        var options = item.options;
        var alignment = item.alignment;

        var table = createTable("100%");
        var tr;

        var arr = [];
        for (var i=0; i<options.length; i++){

            if (alignment=="horizontal"){
                if (i==0){
                    tr = table.addRow();
                }
            }
            else{ //vertical
                tr = table.addRow();
            }

            var td = tr.addColumn();

            var t = createTable();
            var r = t.addRow();
            var c1 = r.addColumn();
            var c2 = r.addColumn();
            td.appendChild(t);


            var input = createElement('input', c1, config.style.checkbox);
            input.type = "checkbox";
            input.name = name;
            input.value = options[i].value;
            if (options[i].checked===true || options[i].selected==true){
                input.checked = true;
            }
            input.onchange = function(){
                me.onChange(formInput, getValue());
            };

            arr.push(input);


            var span = createElement('span', c2, config.style.label);
            span.innerHTML = options[i].label;
            span.input = input;
            span.onclick = function(){
                if (this.input.disabled==true) return;
                this.input.checked = !this.input.checked;
                //this.input.focus();
                dispatchEvent(this.input, "change");
            };
        }




        var getValue = function(){
            var values = "";
            for (var i=0; i<arr.length; i++){
                if (arr[i].checked){
                    if (values.length>0) values+=",";
                    values += arr[i].value;
                }
            }
            return values.length==0 ? null : values;
        };

        var setValue = function(value, silent){

          //Convert value to an array of values
            if (!value){
                value = [value];
            }
            else{
                if (!isArray(value)){
                    if (typeof value === "string"){
                        value = value.split(",");
                    }
                    else{
                        value = [value];
                    }
                }
            }

            var numChanges = 0;
            for (var i=0; i<arr.length; i++){
                var input = arr[i];


                var val = null;
                for (var x=0; x<value.length; x++){
                    if ((input.value+"")==(value[x]+"")){
                        val = value[x];
                        break;
                    }
                }

                if ((input.value+"")==(val+"")){
                    if (input.checked!==true) numChanges++;
                    input.checked = true;
                }
                else{
                    input.checked = false;
                    if (input.checked===true) numChanges++;
                }
            }
            if (silent===true) return;
            if (numChanges>0) me.onChange(formInput, getValue());
        };

        formInput = addInput(name, label, table, getValue, setValue, item.icon);

        formInput.enable = function(){
            for (var i=0; i<arr.length; i++) arr[i].disabled=false;
            var rows = table.getRows();
            for (var i=0; i<rows.length; i++) rows[i].style.opacity = "";
        };

        formInput.disable = function(){
            for (var i=0; i<arr.length; i++) arr[i].disabled=true;
            var rows = table.getRows();
            for (var i=0; i<rows.length; i++) rows[i].style.opacity = "0.6";
        };
    };


  //**************************************************************************
  //** addGroup
  //**************************************************************************
  /** Used to add a group of items. The items will be rendered inside a group
   *  box.
   */
    var addGroup = function(name, items, hidden){

      //Create new row for the groupbox
        var startGroup = formTable.addRow();
        startGroup.setAttribute("desc", "-- Group Start --");


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
        var td = startGroup.addColumn();
        td.style.padding = (parseInt(verticalSpacing)*2) + "px " + borderWidth + "px " + paddingTop + "px 0";
        td.colSpan = 3;
        var div = createElement('div', td);
        div.style.position = "relative";
        div.style.width = "100%";
        div.style.visibility = 'hidden';
        div.style.display = 'block';


      //Create groupbox
        var groupbox = createElement('div', div);
        setStyle(groupbox, "groupbox");
        groupbox.style.padding = 0; //padding is a placeholder...
        groupbox.style.position = "absolute";
        groupbox.style.width = "100%";
        groupbox.style.zIndex = -1;


      //Create label for the groupbox
        var label = createElement('div', div);
        setStyle(label, "grouplabel");
        label.style.position = "absolute";
        label.style.left = 0;
        label.style.top = -(paddingTop+borderHeight)+"px";
        label.innerHTML = name;
        label.style.zIndex = -1;


      //Add items to the form
        for (var i=0; i<items.length; i++){
            if (hidden===true) items[i].hidden = true;
            addItem(items[i]);
        }


      //Add row below the last input for padding
        var endGroup = formTable.addRow();
        endGroup.setAttribute("desc", "-- Group End --");
        var td = endGroup.addColumn();
        td.style.padding = (parseInt(verticalSpacing) + paddingBottom) + "px 0 0 0";
        td.colSpan = 3;




      //Generate list of rows associated with the groupbox
        var getRows = function(){
            var rows = [];
            var addRow = false;
            var childNodes = formTable.getRows();
            for (var i=0; i<childNodes.length; i++){
                var tr = childNodes[i];
                if (tr===startGroup) addRow = true;
                if (addRow){
                    rows.push(tr);
                    if (tr===endGroup){
                        addRow = false;
                        break;
                    }
                }
            }
            return rows;
        };


      //Set groupbox height
        var setHeight = function(h){

          //substract padding of last input
            h = h-parseInt(verticalSpacing);

          //add vertical padding for the groupbox
            h += (paddingTop + paddingBottom);

            groupbox.style.height = h + "px";
            div.style.visibility = '';
        };



      //Add padding to the inputs
        var rows = getRows();
        for (var i=1; i<rows.length-1; i++){
            var tr = rows[i];
            var cols = tr.childNodes;
            cols[0].style.paddingLeft = paddingLeft + "px";
            cols[cols.length-1].style.paddingRight = (paddingRight+borderWidth) + "px";
        }


        groups.push({
            name: name,
            getRows: getRows,
            setHeight: setHeight
        });


        showHideGroup(name, hidden);
    };


  //**************************************************************************
  //** getGroups
  //**************************************************************************
  /** Returns an array of groups found in the form. Each entry in the array
   *  has a name and custom methods for the group.
   */
    this.getGroups = function(){
        return groups;
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
            var rows = group.getRows();
            for (var i=0; i<rows.length; i++){
                var tr = rows[i];
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
                createTextInput(item);
            }
            else if (type==="radio"){
                createRadioInput(label, name, item);
            }
            else if (type==="checkbox"){
                createCheckboxInput(label, name, item);
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
                    setValue = function(value, silent){
                        if (typeof value === "undefined") value = "";
                        if (input.value!=value){
                            input.value = value;
                            if (silent===true) return;
                            input.onchange(); //fire onchange event
                        }

                    };
                    var formInput = addInput(name, label, el, getValue, setValue, icon);

                    input.onchange = function(){
                        me.onChange(formInput, input.value);
                    };

                }
            }
            else{
                if (input.el && input.getValue){ //hook for javaxt components (e.g. combobox)
                    var formInput = addInput(name, label, input.el, input.getValue, input.setValue, icon);
                    for (var key in input) {
                        if (input.hasOwnProperty(key)){
                            if (typeof input[key] === "function"){
                                formInput[key] = input[key];
                            }
                        }
                    }
                    input.onChange = function(){
                        me.onChange(formInput, input.getValue());
                    };
                }
            }
        }
    };


  //**************************************************************************
  //** addInput
  //**************************************************************************
    var addInput = function(name, label, el, getValue, setValue, icon){


      //Create new row
        var row = formTable.addRow();


      //Icon
        var td = row.addColumn();
        if (icon){
            setStyle(td, "icon");
            createElement('div', td, icon);
        }


      //Label
        row.appendChild(createLabel(label));


      //Input
        td = row.addColumn();
        td.style.width = "100%";
        td.style.paddingBottom=verticalSpacing;
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
  /** Used to create a column with a form label.
   */
    var createLabel = function(label){

        var td = createElement('td', config.style.label);
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
            for (var i=0; i<row.childNodes.length; i++){
                var cell = row.childNodes[i];
                var opacity = 1;
                if (i===2){
                    if (field.enable){
                        field.enable();
                        opacity = "";
                    }
                    else cell.childNodes[0].disabled=false;
                }
                cell.style.opacity = opacity;
            }
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
            for (var i=0; i<row.childNodes.length; i++){
                var cell = row.childNodes[i];
                var opacity = "0.6";
                if (i===2){
                    if (field.disable){
                        field.disable();
                        opacity = "";
                    }
                    else cell.childNodes[0].disabled=true;
                }
                cell.style.opacity = opacity;
            }

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


  //**************************************************************************
  //** showError
  //**************************************************************************
  /** Renders a popup error message over a given field
   */
    this.showError = function(errorMessage, field){
        if (!field) return;
        if (isString(field)){
            field = me.findField(field);
            if (!field) return;
        }

        var tr = field.row;
        var td;
        if (tr){
            if (tr.childNodes.length===1){//special case for inputs inserted into forms
                td = tr.childNodes[0];
            }
            else{
                td = tr.childNodes[2];
            }
        }
        else{
            td = field.el.parentNode;
        }

        if (td == null){
            td = field.el.parentNode;
        }

        var getRect = javaxt.dhtml.utils.getRect;
        var rect = getRect(td);

        var inputs = td.getElementsByTagName("input");
        if (inputs.length==0) inputs = td.getElementsByTagName("textarea");
        if (inputs.length>0){
            inputs[0].blur();
            var cls = "form-input-error";
            if (inputs[0].className){
                if (inputs[0].className.indexOf(cls)==-1) inputs[0].className += " " + cls;
            }
            else{
                inputs[0].className = cls;
            }
            rect = getRect(inputs[0]);
            field.resetColor = function(){
                if (inputs[0].className){
                    inputs[0].className = inputs[0].className.replace(cls,"");
                }
            };
        }

        var callout = javaxt.dhtml.Form.Error;
        if (!callout){
            callout = new javaxt.dhtml.Callout(document.body,{
                style:{
                    panel: "error-callout-panel",
                    arrow: "error-callout-arrow"
                }
            });
            javaxt.dhtml.Form.Error = callout;
        }

        callout.getInnerDiv().innerHTML = errorMessage;

        var x = rect.x + (rect.width/2);
        var y = rect.y;
        callout.showAt(x, y, "above", "center");
    };


  //**************************************************************************
  //** hideError
  //**************************************************************************
  /** Hides a popup error message over a given field
   */
    this.hideError = function(field){
        if (!field) return;
        if (isString(field)){
            field = me.findField(field);
            if (!field) return;
        }

        if (field.resetColor) field.resetColor();
        var callout = javaxt.dhtml.Form.Error;
        if (callout) callout.hide();
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




  //**************************************************************************
  //** getValue
  //**************************************************************************
  /** Returns the value for an input in the form.
   */
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
  /** Used to set the value for an input in the form.
   *  @param name Input name or label associated with the input.
   *  @param value A value for the input.
   *  @param silent By default, if the input value is changed, it will fire.
   *  the onChange event. When silent is set to true, the input will NOT fire
   *  the onChange event. This parameter is optional.
   */
    this.setValue = function(name, value, silent){
        var field = me.findField(name);
        if (field){
            field.setValue(value, silent);
            return true;
        }
        return false;
    };


  //**************************************************************************
  //** findField
  //**************************************************************************
  /** Used to find a row in the form.
   *  @param name Input name or label associated with the input.
   *  @return An object with the following properties:
   *  <ul>
   *  <li>name (string)</li>
   *  <li>label (string)</li>
   *  <li>row (DOM object)</li>
   *  <li>getValue (function)</li>
   *  <li>setValue (function)</li>
   *  </ul>
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
            var rows = group.getRows();
            for (var j=0; j<rows.length; j++){
                var tr = rows[j];
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
        var rows = group.getRows();
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
        var temp = createElement("div", config.style.groupbox);
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
        if (width) table.style.width = width;
        else table.style.width = '';
        if (height) table.style.height = height;
        else table.style.height = '';
        if (desc) table.setAttribute("desc", desc);
        return table;
    };


  //**************************************************************************
  //** setStyle
  //**************************************************************************
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var onRender = javaxt.dhtml.utils.onRender;
    var createElement = javaxt.dhtml.utils.createElement;
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;
    var isString = javaxt.dhtml.utils.isString;
    var isArray = javaxt.dhtml.utils.isArray;

    init();
};