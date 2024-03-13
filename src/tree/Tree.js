if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Tree View
//******************************************************************************
/**
 *   Used to create a simple tree control.
 *
 ******************************************************************************/

javaxt.dhtml.Tree = function (parent, config) {
    this.className = "javaxt.dhtml.Tree";

    var me = this;


    var defaultConfig = {

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
        var ul = createUL();
        ul.style.cursor = config.style.cursor;
        ul.style.padding = config.style.padding;
        ul.onselectstart = function () {return false;};
        ul.onmousedown = function () {return false;};
        parent.appendChild(ul);
        ul.setAttribute("desc", me.className);
        me.el = ul;


      //Add nodes
        if (config.nodes){
            me.addNodes(config.nodes);
        }
    };


  //**************************************************************************
  //** addNodes
  //**************************************************************************
    this.addNodes = function(nodes){
        var hiddenNodes = [];
        addNodes(nodes, me.el, hiddenNodes);
        for (var i=0; i<hiddenNodes.length; i++){
            hide(hiddenNodes[i]);
        }
    };


  //**************************************************************************
  //** Events
  //**************************************************************************

    this.onClick = function(item){};
    this.onExpand = function(item){};
    this.onCollapse = function(item){};


  //**************************************************************************
  //** getItem
  //**************************************************************************
  /** Returns an item in a given path.
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
                    if (nodes[i].tagName.toLowerCase()==="li"){
                        var li = nodes[i];
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
                    if (nextSibling){ //check if ul?
                        nodes = nextSibling.childNodes;
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
                if (nextNode.tagName.toLowerCase()=="ul"){
                    show(nextNode);
                }
            }


          //Check if the node is visible
            if (li.offsetParent===null && ul!==me.el){

              //Move up the tree
                while (li.offsetParent===null){
                    ul = ul.parentNode;
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
            var li = item.el;
            if (li){
                var ul = li.parentNode;

                while (ul!==me.el){
                    li = ul.previousSibling;
                    if (li){
                        arr.push(getItem(li));
                        ul = li.parentNode;
                    }
                    else{
                        break;
                    }
                }
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
    var addNodes = function(nodes, parent, hiddenNodes){
        for (var i=0; i<nodes.length; i++){
            var node = nodes[i];
            var children = node.nodes;


          //Create node
            var li = createElement("li", parent, config.style.li);
            li.node = node;
            li.onclick = function(){
                if (this.nextSibling){
                    var nextNode = this.nextSibling;
                    var tagName = nextNode.tagName.toLowerCase();
                    if (tagName==="ul"){
                        var ul = nextNode;
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
            if (children){
                var ul = createUL();
                ul.style.width = "100%";
                ul.style.height = "100%";
                parent.appendChild(ul);

              //Add "join_line" to previous ul
                var previousSibling = ul.previousSibling;
                while (previousSibling){
                    if (previousSibling.tagName.toLowerCase()==="ul"){
                        addStyle(previousSibling, config.style.path.line);
                        break;
                    }
                    previousSibling = previousSibling.previousSibling;
                }
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
            li.style.width = "100%"; //<-- For label
            if (typeof node === "string"){
                createLabel(node, icon, li);
            }
            else{
                var name = node.name;
                createLabel(name, icon, li);
            }



          //Add children
            if (children){
                var ul = li.nextSibling;

                if (nodeType!=="root"){
                    ul.style.paddingLeft = config.style.colWidth;
                }


                var expand = false;
                if (node.expand===true) expand = true;
                if (!expand) hiddenNodes.push(ul); //hide(ul);


                addNodes(children, ul, hiddenNodes);
            }
        }
    };


  //**************************************************************************
  //** showNode
  //**************************************************************************
  /** Used to expand a node and make its contents visible.
   */
    var show = function(ul){

        if (ul===me.el) return;

        ul.style.visibility = "";
        ul.style.display = "";

      //Update icons
        var li = ul.previousSibling;
        if (li){
            var nodeType = getNodeType(li);
            var style = getJoinStyle(nodeType, true, isLast(li));
            if (style) li.className = style;
            if (nodeType!=="leaf") li.setIcon(config.style[nodeType].open);
            me.onExpand(getItem(li));
        }
    };


  //**************************************************************************
  //** hideNode
  //**************************************************************************
  /** Used to collapse a node and hide its contents.
   */
    var hide = function(ul){

        if (ul===me.el) return;

        ul.style.visibility = "hidden";
        ul.style.display = "none";


      //Update icons
        var li = ul.previousSibling;
        if (li){
            var nodeType = getNodeType(li);
            var style = getJoinStyle(nodeType, false, isLast(li));
            if (style) li.className = style;
            if (nodeType!=="leaf") li.setIcon(config.style[nodeType].closed);
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
                if (li.nextSibling.tagName.toLowerCase()==="ul"){
                    hasChildren = true;
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
                    if (siblings[j].tagName.toLowerCase()==="li"){
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
    var createUL = function(){
        return createElement("ul", {
            listStyleType: "none",
            padding: 0,
            margin: 0,
            backgroundColor: config.style.backgroundColor
        });
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var addStyle = javaxt.dhtml.utils.addStyle;
    var isArray = javaxt.dhtml.utils.isArray;
    var createElement = javaxt.dhtml.utils.createElement;

    init();
};