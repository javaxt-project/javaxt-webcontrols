if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Tree View
//******************************************************************************
/**
 *   Used to create a hierarchical tree control with nodes and leaves. The
 *   nodes and leaves are "left-justified". Root nodes appear on the left and
 *   nested elements appear below and to the right of the parent nodes.
 *
 ******************************************************************************/

javaxt.dhtml.Tree = function (parent, config) {
    this.className = "javaxt.dhtml.Tree";
    var me = this;


  //SVG fragments for the default style config
    var cw = 21; //node width
    var rh = 20; //row height
    var connectorColor = "#cbd2d8"; //guide lines
    var nodeColor = "#5f7280";      //collapsed chevron
    var nodeOpenColor = "#3f5563";  //expanded chevron
    var leafColor = "#9aa8b2";      //leaf dot
    var mid = cw/2 - 1; //x-position of the vertical guide line (~center)
    var midY = rh/2;    //y-position of the horizontal branch
    var branchMiddle = '<path d="M' + mid + ' 0 V' + rh + ' M' + mid + ' ' + midY + ' H' + cw + '" stroke="' + connectorColor + '" stroke-width="1" fill="none"/>';
    var branchLast = '<path d="M' + mid + ' 0 V' + midY + ' H' + cw + '" stroke="' + connectorColor + '" stroke-width="1" fill="none"/>';
    var lineVertical = '<path d="M' + mid + ' 0 V' + rh + '" stroke="' + connectorColor + '" stroke-width="1" fill="none"/>';
    var chevronClosed = '<path d="M8 6 L13 10 L8 14 Z" fill="' + nodeColor + '"/>';
    var chevronOpen = '<path d="M6 8 L15 8 L10.5 13 Z" fill="' + nodeOpenColor + '"/>';
    var leafDot ='<circle cx="10.5" cy="' + midY + '" r="2.5" fill="' + leafColor + '"/>';
    var svg = function(inner){
        var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + cw + '" height="' + rh + '" viewBox="0 0 ' + cw + ' ' + rh + '">' + inner + '</svg>';
        return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
    };
    var join = function(inner, repeat){
        return {
            backgroundImage: svg(inner),
            backgroundRepeat: repeat===true ? "repeat-y" : "no-repeat",
            backgroundPosition: "left top"
        };
    };
    var icon = function(inner){
        return {
            width: cw + "px",
            height: rh + "px",
            backgroundImage: svg(inner),
            backgroundRepeat: "no-repeat",
            backgroundPosition: "left center"
        };
    };



    var defaultConfig = {


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style:{

          //Leaf icon. Leaves have no children.
            leaf: icon(leafDot),

          //Node icon. Nodes have children.
            node: {
                open: icon(chevronOpen),
                closed: icon(chevronClosed)
            },

          //Root icon. A top level node.
            root: {
                open: icon(chevronOpen),
                closed: icon(chevronClosed)
            },

          //Path icons
            path: {

                node: {

                    open: {
                        middle: join(branchMiddle),
                        last: join(branchLast)
                    },
                    closed: {
                        middle: join(branchMiddle),
                        last: join(branchLast)
                    }
                },

                leaf: {
                    middle: join(branchMiddle),
                    last: join(branchLast)
                },

                line: join(lineVertical, true)

            },

          //Row style. Rows span fron the node/leaf icon to the label.
            row: {
                height: rh + "px"
            },

          //Style for node and leaf labels
            label: {
                display: "inline-block",
                position: "absolute",
                paddingLeft: cw + "px",
                lineHeight: rh + "px",
                cursor: "default"
            }
        }
    };

  /** The following sets up the "display" style for the li and ul elements.
   *  This was added in 2024, after the tree demo stopped working on chrome.
   *  In 2026, changed the li from "inline-table" to "block". The "inline-table"
   *  value caused connector padding (paddingLeft) to collapse when the tree
   *  was rendered in a narrow, width-constrained container (e.g. facet panel).
   */
    var display = {
        ul: "grid",
        li: "block"
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


      //Remap user-provided legacy config
        if (config.style.li) config.style.row = config.style.li;


      //Create main ul
        var ul = createUL(parent);
        ul.className = "javaxt-tree";
        ul.onselectstart = function () {return false;};
        ul.onmousedown = function () {return false;};
        me.el = ul;


      //Add nodes
        if (config.nodes){
            me.addNodes(config.nodes);
        }
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
  /** Used to remove all the nodes in the tree
   */
    this.clear = function(){
        me.el.innerHTML = "";
    };


  //**************************************************************************
  //** addNodes
  //**************************************************************************
  /** Used to add nodes to the tree.
   *  @param An array of nodes (string or json with name, children, and
   *  expand properties) Example:
   <pre>
    var nodes = [
        {
            name: "javaxt-core", //root node
            nodes: [
                {
                    name: "javaxt.io",
                    nodes: ["Directory", "File", "Image", "Jar", "Shell"]
                },
                {
                    name: "javaxt.sql",
                    nodes:["Column", "Connection", "Recordset"],
                    expand: false
                }
            ]
        },
        {
            name: "javaxt-server", //root node
            nodes: [

            ]
        }
    ];
   </pre>
   *  @param expandAll If true, will render all the nodes and leaves. Default
   *  is false.
   */
    this.addNodes = function(nodes, expandAll){
        var hiddenNodes = [];
        addNodes(nodes, me.el, hiddenNodes);
        if (expandAll===true) return;
        for (var i=0; i<hiddenNodes.length; i++){
            hide(hiddenNodes[i], true);
        }
    };


  //**************************************************************************
  //** onClick
  //**************************************************************************
  /** Called whenever an item is clicked in the tree.
   *  @param item The item that was clicked. See getItem() for more
   *  information.
   */
    this.onClick = function(item){};


  //**************************************************************************
  //** onExpand
  //**************************************************************************
  /** Called whenever a node is expanded in the tree.
   *  @param item The node that was expanded. See getItem() for more
   *  information.
   */
    this.onExpand = function(item){};


  //**************************************************************************
  //** onCollapse
  //**************************************************************************
  /** Called whenever a node is collapsed in the tree.
   *  @param item The node that was collapsed. See getItem() for more
   *  information.
   */
    this.onCollapse = function(item){};


  //**************************************************************************
  //** getItem
  //**************************************************************************
  /** Returns a simple json object used to represent an item in the tree for a
   *  given path.
   *  <ul>
   *  <li>type: Item type (e.g. "node" or "leaf")</li>
   *  <li>name: Text/Label associated with the item</li>
   *  <li>el: DOM element used to render the item(e.g. "li")</li>
   *  </ul>
   *  @param path Path to an element in the tree, Accepts either a string
   *  array or a "/" delimited string.
   */
    this.getItem = function(path){

        if (!isArray(path)){
            if (typeof path === "string"){
                path = path.split("/");
            }
            else{
                return null;
            }
        }

        var findNode = function(key, nodes){
            if (nodes){
                for (var i=0; i<nodes.length; i++){
                    if (isLI(nodes[i])){
                        var li = nodes[i];

                        if (!li.getText){
                            continue;
                        }


                        if (key===li.getText()){
                            return li;
                        }
                    }
                }
            }
            return null;
        };



        var target;
        var nodes = me.el.childNodes;
        for (var i=0; i<path.length; i++){
            var key = path[i];
            var node = findNode(key, nodes);
            if (node){
                if (i==path.length-1) target = node;
                else{
                    var nextSibling = node.nextSibling;
                    if (nextSibling){
                        nodes = [];
                        for (var j=0; j<nextSibling.childNodes.length; j++){
                            var ul = nextSibling.childNodes[j];
                            if (isUL(ul)){
                                for (var k=0; k<ul.childNodes.length; k++){
                                    var li = ul.childNodes[k];
                                    if (isLI(li)){
                                        nodes.push(li);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else{
                return null;
            }
        }

        if (target){
            return getItem(target);
        }
        else{
            return null;
        }
    };


  //**************************************************************************
  //** show
  //**************************************************************************
  /** Used to expand a given item in the tree. If no item is specified, then
   *  the
   */
    this.show = function(item){
        if (item){
            var li = item.el;
            var ul = li.parentNode;
            show(ul);


          //If the item is a node, expand children
            if (getNodeType(li)!="leaf"){
                var nextNode = li.nextSibling;
                if (isUL(nextNode)){
                    show(nextNode);
                }
            }


          //Check if the node is visible
            if (li.offsetParent===null && ul!==me.el){

              //Move up the tree
                while (li.offsetParent===null){
                    ul = ul.parentNode;
                    if (isLI(ul)) ul = ul.parentNode;

                    show(ul);
                    if (me.el === ul){
                        break;
                    }
                }
            }
        }
        else{

          //Show the tree if it is hidden
            me.el.style.visibility = "";
            me.el.style.display = "";
        }
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
    this.hide = function(item){
        if (item){

        }
        else{

          //Hide the tree
            me.el.style.visibility = "hidden";
            me.el.style.display = "node";
        }
    };


  //**************************************************************************
  //** getPath
  //**************************************************************************
  /** Returns an array of parent nodes that form a path to the given item.
   */
    this.getPath = function(item){
        var arr = [];
        if (item){
            arr.push(item);

            var el = item.el;

            while (el!==me.el){
                el = el.parentNode;
                if (!el || el===me.el) break;

                if (isUL(el)){
                    el = el.parentNode.previousSibling;
                }
                if (!el || el===me.el) break;

                if (isLI(el)) arr.push(getItem(el));
            }
        }
        return arr;
    };


  //**************************************************************************
  //** getItem
  //**************************************************************************
  /** Returns a simple json object used to represent an item in the tree.
   */
    var getItem = function(li){
        return {
            type: getNodeType(li),
            name: li.getText(),
            node: li.node,
            el: li
        };
    };


  //**************************************************************************
  //** addNodes
  //**************************************************************************
  /** Used to add nodes under a given node (ul) in the tree. Node that this
   *  method will be called recursively for any nodes that have children.
   *  @param An array of nodes (string or json with name, children, and
   *  expand properties).
   *  @param parent DOM element. Accepts either "ul" (preferred) or "li".
   *  @param hiddenNodes An array of "ul" nodes to hide.
   */
    var addNodes = function(nodes, parent, hiddenNodes){
        if (!nodes || nodes.length===0) return;
        var lastNode;
        var paddingUpdates = [];

        for (var i=0; i<nodes.length; i++){

          //Get node
            var node = nodes[i];
            if (isString(node)){
                var name = node;
                node = {
                    name: name,
                    expand: false,
                    children: false
                };
            }


          //Get children
            var children = node.nodes;
            if (!children) children = node.leaves;


          //Create new parent as needed
            if (isLI(parent)) parent = createUL(parent);



          //Create node
            var li = createLI(parent);
            li.node = node;
            li.onclick = function(){
                var li = this;
                if (li.nextSibling){

                    var ul;
                    if (li.nextSibling){
                        for (var j=0; j<li.nextSibling.childNodes.length; j++){
                            if (isUL(li.nextSibling.childNodes[j])){
                                ul = li.nextSibling.childNodes[j];
                                break;
                            }
                        }
                    }


                    if (ul) {
                        if (ul.style.visibility === "hidden"){
                            show(ul);
                        }
                        else{
                            hide(ul);
                        }
                    }
                }
                me.onClick(getItem(this));
            };



          //Create container for child nodes as needed. Do this before calling
          //the getNodeType() method.
            var ul;
            if (children){
                ul = createUL(createLI(parent));
                ul.style.width = "100%";



              //Add "join_line" to previous ul
                addLine(ul.parentNode);
            }



          //Determine nodeType (for style purposes)
            var nodeType = getNodeType(li);


          //Set join icon style
            if (nodeType!=="root"){
                var style = getJoinStyle(nodeType, true, (i===nodes.length-1));
                if (style){

                  //Apply the join style (CSS class name or inline style)
                    applyStyle(li, style);

                  //Update padding to make the join icon visible
                    if (config.style.colWidth) li.style.paddingLeft = config.style.colWidth;
                    else paddingUpdates.push(li);
                }
            }
            else{
              //Root nodes don't need a join icon
                li.style.padding = 0;
                li.style.background = "none";
            }




          //A node is rendered "expanded" only if it has children and is set to
          //expand. Everything else (collapsed nodes and childless roots) is
          //rendered "closed" so the chevron points right until it is expanded.
            var expand = (children && node.expand===true);


          //Select icon to use in the label
            var icon;
            if (nodeType=="leaf"){
                icon = config.style.leaf;
            }
            else{
                icon = expand ? config.style[nodeType].open : config.style[nodeType].closed;
            }




          //Add icon and label
            createLabel(node.name, icon, li);




            if (children){

                if (nodeType!=="root"){
                    if (config.style.colWidth) ul.style.paddingLeft = config.style.colWidth;
                    else paddingUpdates.push(ul);
                }


                if (!expand) hiddenNodes.push(ul); //hide(ul);


                addNodes(children, ul, hiddenNodes);

            }


            lastNode = li;
        }



      //Special case for leaves that fall alongside nodes. Add "join_line"
      //to previous ul
        if (lastNode){
            var nodeType = getNodeType(lastNode);
            if (nodeType==="leaf"){
                addLine(lastNode);
            }
        }


      //Update padding when we can
        if (paddingUpdates.length>0){
            getColWidth(function(colWidth){
                for (var i=0; i<paddingUpdates.length; i++){
                    paddingUpdates[i].style.paddingLeft = colWidth;
                }
            });
        }
    };


  //**************************************************************************
  //** addLine
  //**************************************************************************
  /** Used to add "join_line" to previous ul. The join line is a vertical
   *  connector that continues down the left side of a node's subtree so it
   *  visually connects to a sibling below it. Root nodes are not drawn with
   *  connectors, so we skip the line at the root level (otherwise the line
   *  would extend down through the last root's subtree - see the Tree demo).
   */
    var addLine = function(li){
        if (li.parentNode===me.el) return; //root level, no connectors

        var previousSibling = li.previousSibling;
        while (previousSibling){

            for (var j=0; j<previousSibling.childNodes.length; j++){
                if (isUL(previousSibling.childNodes[j])){
                    var _ul = previousSibling.childNodes[j];
                    addStyle(_ul, config.style.path.line);
                    _ul.style.height = "100%";
                    break;
                }
            }

            previousSibling = previousSibling.previousSibling;
        }
    };


  //**************************************************************************
  //** showNode
  //**************************************************************************
  /** Used to expand a node and make its contents visible.
   */
    var show = function(ul, silent){

        if (ul===me.el) return;


        ul.parentNode.style.visibility = "";
        ul.parentNode.style.display = display.li;


        ul.style.visibility = "";
        ul.style.display = display.ul;



      //Update icons
        var li = ul.parentNode.previousSibling;
        if (li){
            var nodeType = getNodeType(li);
            var style = getJoinStyle(nodeType, true, isLast(ul.parentNode));
            if (style) applyStyle(li, style);
            if (nodeType!=="leaf") li.setIcon(config.style[nodeType].open);

          //Fire onExpand event
            if (silent===true) return;
            me.onExpand(getItem(li));
        }
    };


  //**************************************************************************
  //** hideNode
  //**************************************************************************
  /** Used to collapse a node and hide its contents.
   */
    var hide = function(ul, silent){

        if (ul===me.el) return;

        ul.style.visibility = "hidden";
        ul.style.display = "none";


        ul.parentNode.style.visibility = "hidden";
        ul.parentNode.style.display = "none";


      //Update icons
        var li = ul.parentNode.previousSibling;
        if (li){
            var nodeType = getNodeType(li);
            var style = getJoinStyle(nodeType, false, isLast(ul.parentNode));
            if (style) applyStyle(li, style);
            if (nodeType!=="leaf") li.setIcon(config.style[nodeType].closed);

          //Fire onCollapse event
            if (silent===true) return;
            me.onCollapse(getItem(li));
        }
    };


  //**************************************************************************
  //** createLabel
  //**************************************************************************
    var createLabel = function(label, icon, li){

        var row = createElement("div", li, config.style.row);

        var iconDiv;
        if (icon){
            iconDiv = createElement("div", row, icon);
            iconDiv.style.display = "inline-block";
            iconDiv.style.position = "absolute";

            if (!config.style.colWidth){
                onRender(iconDiv, function(el){
                    config.style.colWidth = (el.offsetWidth+1)+"px";
                });
            }
        }

        var labelDiv;
        if (label){
            var labelDiv = createElement("div", row, config.style.label);
            labelDiv.innerHTML = label.replace(/^\s*/, "").replace(/\s*$/, ""); //trim()
        }


        li.setIcon = function(icon){
            if (iconDiv) applyStyle(iconDiv, icon);
        };


        li.getText = function(){
            return labelDiv.innerText;
        };

        return {
            el: row,
            icon: iconDiv,
            label: labelDiv
        };
    };


  //**************************************************************************
  //** getNodeType
  //**************************************************************************
  /** Returns the type of node represented by a given li (e.g. root, node, or
   *  leaf).
   */
    var getNodeType = function(li){

        if (li.parentNode===me.el){
            return "root";
        }
        else{

            var hasChildren = false;
            if (li.nextSibling){
                for (var i=0; i<li.nextSibling.childNodes.length; i++){
                    if (isUL(li.nextSibling.childNodes[i])){
                        hasChildren = true;
                        break;
                    }
                }
            }

            if (hasChildren) return "node";
            else return "leaf";
        }
    };


  //**************************************************************************
  //** isLast
  //**************************************************************************
  /** Used to determine if an li has any siblings below it.
   */
    var isLast = function(li){
        var siblings = li.parentNode.childNodes;
        for (var i=0; i<siblings.length; i++){
            if (siblings[i]===li){
                var foundSibling = false;
                for (var j=i+1; j<siblings.length; j++){
                    if (isLI(siblings[j])){
                        foundSibling = true;
                        break;
                    }
                }
                if (foundSibling) return false;
            }
        }
        return true;
    };


  //**************************************************************************
  //** getJoinStyle
  //**************************************************************************
  /** Returns the join icon style/class for a given nodeType.
   */
    var getJoinStyle = function(nodeType, isOpen, isLast){

        if (nodeType!=="root"){
            var joinStyle = isLast ? "last" : "middle";


            var style = config.style.path[nodeType];
            if (nodeType!=="leaf"){
                if (isOpen) style = style.open;
                else style = style.closed;
            }
            style = style[joinStyle];


          //Return the join style. This can be either a CSS class name (string)
          //or an inline style definition (json). The applyStyle() method knows
          //how to handle both, and re-applies it whenever a node is
          //expanded/collapsed.
            if (style!=null) return style;

        }

        return null;
    };


  //**************************************************************************
  //** createUL
  //**************************************************************************
  /** Used to create a "ul" element for the tree
   */
    var createUL = function(parent){

        if (parent.tagName.toLowerCase()==="ul"){
            parent = createLI(parent);
        }

        return createElement("ul", parent, {
            listStyleType: "none",
            padding: 0,
            margin: 0,
            display: display.ul
        });
    };


  //**************************************************************************
  //** createLI
  //**************************************************************************
  /** Used to create a "li" element for the tree
   */
    var createLI = function(parent){
        var li = createElement("li", parent, {
            width: "100%",
            display: display.li
        });
        li.setIcon = function(icon){};
        li.getText = function(){};
        return li;
    };


    var isLI = function(el){
        return isTag(el, "li");
    };

    var isUL = function(el){
        return isTag(el, "ul");
    };

    var isTag = function(el, tag){
        return el.tagName.toLowerCase()===tag;
    };


  //**************************************************************************
  //** getColWidth
  //**************************************************************************
  /** Returns the colWidth style property. Normally this is set when rendering
   *  icons for nodes and leaves.
   */
    var getColWidth = function(callback){
        if (!config.style.colWidth){
            var timer;

            var checkWidth = function(){
                if (!config.style.colWidth){
                    timer = setTimeout(checkWidth, 100);
                }
                else{
                    clearTimeout(timer);
                    if (callback) callback.apply(me, [config.style.colWidth]);
                }
            };

            timer = setTimeout(checkWidth, 100);
        }
        else{
            if (callback) callback.apply(me, [config.style.colWidth]);
        }
    };


  //**************************************************************************
  //** applyStyle
  //**************************************************************************
  /** Used to apply a style to a given element. The style can be either a CSS
   *  class name (string) or an inline style definition (json).
   */
    var applyStyle = function(el, style){
        if (el==null || style==null) return;
        if (isString(style)){
            el.className = style;
        }
        else{
            addStyle(el, style);
        }
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var addStyle = javaxt.dhtml.utils.addStyle;
    var isArray = javaxt.dhtml.utils.isArray;
    var isString = javaxt.dhtml.utils.isString;
    var onRender = javaxt.dhtml.utils.onRender;
    var createElement = javaxt.dhtml.utils.createElement;

    init();
};