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
    var defaultConfig = {


      /** Style for individual elements within the component. The nodes and
       *  leaves in the tree are constructed using "ul" and "li" elements.
       *  Note that unlike most of the other components, you should provide
       *  CSS class names nodes, leaves, and path.
       */
        style:{

            rowHeight: "20px",
            colWidth: "21px",
            backgroundColor: "white",
            cursor: "default",
            padding: 0,

            li: "",

            label: {

            },


          //The following style are for icons that appear in the tree

            leaf: "leaf",

            node: {
                open: "node_open",
                closed: "node"
            },

            root: {
                open: "root",
                closed: "root"
            },

            path: {

                node: {

                    open: {
                        middle: "join_node_middle_open",
                        last: "join_node_bottom_open"
                    },
                    closed: {
                        middle: "join_node_middle",
                        last: "join_node_bottom"
                    }
                },

                leaf: {
                    middle: "join_leaf_middle",
                    last: "join_leaf_bottom"
                },

                line: "join_line"

            }
        }
    };


  /** The following sets up the "display" style for the li and ul elements.
   *  This was added in 2024, after the tree demo stopped working on chrome.
   */
    var display = {
        ul: "grid",
        li: "inline-table"
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



      //Create main ul
        var ul = createUL(parent);
        ul.style.cursor = config.style.cursor;
        ul.style.padding = config.style.padding;
        ul.onselectstart = function () {return false;};
        ul.onmousedown = function () {return false;};
        ul.setAttribute("desc", me.className);
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

                  //Set className to display the join icon
                    li.className = style;

                  //Set padding to make the join icon visible
                    li.style.paddingLeft = config.style.colWidth;
                }
            }
            else{
              //Root nodes don't need a join icon
                li.style.padding = 0;
                li.style.background = "none";
            }




          //Select icon to use in the label
            var icon;
            if (nodeType=="leaf"){
                icon = config.style.leaf;
            }
            else{
                icon = config.style[nodeType].open;
            }




          //Add icon and label
            createLabel(node.name, icon, li);




            if (children){

                if (nodeType!=="root"){
                    ul.style.paddingLeft = config.style.colWidth;
                }


                var expand = false;
                if (node.expand===true) expand = true;
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

    };


  //**************************************************************************
  //** addLine
  //**************************************************************************
  /** Used to add "join_line" to previous ul.
   */
    var addLine = function(li){
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
            if (style) li.className = style;
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
            if (style) li.className = style;
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

        var outerDiv = createElement("div", li);
        outerDiv.style.width = "100%";
        outerDiv.style.backgroundColor = config.style.backgroundColor;
        outerDiv.style.position = "relative";
        outerDiv.style.overflow = "hidden";
        outerDiv.style.height = config.style.rowHeight;


        var iconDiv;
        if (icon){
            iconDiv = createElement("div", outerDiv, icon);
            iconDiv.style.display = "inline-block";
            iconDiv.style.position = "absolute";
        }

        var labelDiv;
        if (label){
            var labelDiv = createElement("div", outerDiv, config.style.label);
            labelDiv.style.display = "inline-block";
            labelDiv.style.position = "absolute";
            labelDiv.style.paddingLeft = config.style.colWidth;
            labelDiv.style.lineHeight = config.style.rowHeight;
            labelDiv.innerHTML = label.replace(/^\s*/, "").replace(/\s*$/, ""); //trim()
        }


        li.setIcon = function(icon){
            if (iconDiv) iconDiv.className = icon;
        };


        li.getText = function(){
            return labelDiv.innerText;
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


            if (typeof style === "string"){
                return style;
            }
            else{
                //TODO: Create style? We cannot rely on setStyle b/c we need
                //to update the style whenever we expand/collapse the node.
            }

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
            display: display.ul,
            backgroundColor: config.style.backgroundColor
        });
    };


  //**************************************************************************
  //** createLI
  //**************************************************************************
  /** Used to create a "li" element for the tree
   */
    var createLI = function(parent){
        var li = createElement("li", parent, config.style.li);
        li.style.width = "100%";
        li.style.display = display.li;
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
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var addStyle = javaxt.dhtml.utils.addStyle;
    var isArray = javaxt.dhtml.utils.isArray;
    var isString = javaxt.dhtml.utils.isString;
    var createElement = javaxt.dhtml.utils.createElement;

    init();
};