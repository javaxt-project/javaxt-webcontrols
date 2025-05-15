if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Panel
//******************************************************************************
/**
 *   General purpose container with an optional header, toolbar, and footer.
 *
 ******************************************************************************/


javaxt.dhtml.Panel = function (parent, config) {

    var me = this;
    var defaultConfig = {

      /** CSS class name for the container.
       */
        className: null,

      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {
            header: {},
            toolbar: {},
            body: {},
            footer: {}
        }
    };

    var table, header, toolbar, body, footer;


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


      //Create main div
        var mainDiv = createElement("div", parent, {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        mainDiv.className = "javaxt-panel";
        if (config.className) mainDiv.className += " " + config.className;

        me.el = mainDiv;
        addShowHide(me);


      //Create body
        table = createTable(mainDiv);
        body = table.addRow().addColumn(config.style.body);
        body.style.height = "100%";
    };


  //**************************************************************************
  //** getHeader
  //**************************************************************************
  /** Returns the header element.
   */
    this.getHeader = function(){
        if (!header){

            var tr = createElement("tr");
            if (toolbar){
                var tbody = toolbar.parentNode.parentNode;
                tbody.insertBefore(tr, toolbar.parentNode);
            }
            else{
                var tbody = body.parentNode.parentNode;
                tbody.insertBefore(tr, body.parentNode);
            }


            header = createElement("td", tr, config.style.header);
        }
        return header;
    };


  //**************************************************************************
  //** getToolbar
  //**************************************************************************
  /** Returns the toolbar element.
   */
    this.getToolbar = function(){
        if (!toolbar){
            var tr = createElement("tr");
            var tbody = body.parentNode.parentNode;
            tbody.insertBefore(tr, body.parentNode);
            toolbar = createElement("td", tr, config.style.toolbar);
        }
        return toolbar;
    };


  //**************************************************************************
  //** getBody
  //**************************************************************************
  /** Returns the body element.
   */
    this.getBody = function(){
        return body;
    };


  //**************************************************************************
  //** getFooter
  //**************************************************************************
  /** Returns the footer element.
   */
    this.getFooter = function(){
        if (!footer){
            footer = table.addRow().addColumn(config.style.footer);
        }
        return footer;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;

    init();
};