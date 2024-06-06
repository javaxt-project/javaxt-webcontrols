if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  TabPanel
//******************************************************************************
/**
 *   Standard tab control used to show/hide individual panels.
 *
 ******************************************************************************/

javaxt.dhtml.TabPanel = function(parent, config) {
    this.className = "javaxt.dhtml.TabPanel";

    var me = this;
    var tabList;
    var tabContent;

    var defaultConfig = {

      /** If true, will insert a "close" icon into the tab that will allow
       *  users to close/remove the tab from the tab panel.
       */
        closable: false,

      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style : {
            tabBar: {
                border: "1px solid #ccc",
                backgroundColor: "#eaeaea",
                height: "30px",
                borderBottom: "0px"
            },
            activeTab: {
                lineHeight: "30px",
                padding: "0 7px",
                backgroundColor: "#fafafa",
                cursor: "default",
                borderRight: "1px solid #ccc",
                borderBottom: "1px solid #fafafa"
            },
            inactiveTab: {
                lineHeight: "30px",
                padding: "0 7px",
                cursor: "pointer",
                borderRight: "1px solid #ccc",
                borderBottom: "0px"
            },
            tabBody: {
                border: "1px solid #ccc",
                verticalAlign: "top"
            },
            closeIcon: {

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


      //Create main table
        var table = createTable(parent);
        table.setAttribute("desc", me.className);



      //Row 1
        var td = table.addRow().addColumn();
        setStyle(td, "tabBar");
        td.style.width = "100%";

        tabList = createElement("ul", td, {
            listStyle: "none outside none",
            height: "100%",
            padding: 0,
            margin: 0
        });



      //Row 2
        var td = table.addRow().addColumn();
        setStyle(td, "tabBody");
        td.style.width = "100%";
        td.style.height = "100%";

        tabContent = createElement("div", td, {
            width: "100%",
            height: "100%",
            position: "relative"
        });


        me.el = table;
    };


  //**************************************************************************
  //** addTab
  //**************************************************************************
  /** Used to add a new tab to the panel.
   *  @param label Tab title.
   *  @param el Tab contents. Rendered when the tab is active. Accepts strings,
   *  DOM elements, and nulls
   */
    this.addTab = function(label, el){

        var div = createElement("div", tabContent, {
            width: "100%",
            height: "100%",
            position: "absolute"
        });


        if (el==null) div.innerHTML = "";
        else{
            if (isElement(el)){
                var p = el.parentNode;
                if (p) p.removeChild(el);
                div.appendChild(el);
            }
            else{
                if (typeof el === "string"){
                    div.innerHTML = el;
                }
            }
        }


        var tab = createElement("li", tabList);
        setStyle(tab, "inactiveTab");
        tab.style.position = "relative";
        tab.style.float = "left";
        tab.style.height = "100%";
        tab.innerHTML = label;
        tab.el = div;
        tab.onclick = function(){
            raiseTab(this);
        };
        tab.onselectstart = function () {return false;};
        tab.onmousedown = function () {return false;};
        for (var i=0; i<tabList.childNodes.length; i++){
            var t = tabList.childNodes[i];
            if (t!==tab){
                setStyle(t, "inactiveTab");
                t.style.position = "relative";
                t.style.float = "left";
                t.style.height = "100%";
                t.el.style.display = 'none';
            }
        }

        div.style.display='none'; //<-- style used to test whether the tab is visible (see raiseTab)

        raiseTab(tab);
    };


  //**************************************************************************
  //** getTabs
  //**************************************************************************
  /** Returns an of tabs in the tab panel. Each entry in the array will
   *  include the following:
   *  <ul>
   *  <li>name: Name of the tab and tab label</li>
   *  <li>header: DOM element for the tab header</li>
   *  <li>body: DOM element for the tab content</li>
   *  <li>hidden: Boolean</li>
   *  <li>active: Boolean</li>
   *  </ul>
   */
    this.getTabs = function(){
        var tabs = [];
        for (var i=0; i<tabList.childNodes.length; i++){
            var tab = tabList.childNodes[i];
            tabs.push(getTabInfo(tab));
        }
        return tabs;
    };


  //**************************************************************************
  //** raiseTab
  //**************************************************************************
  /** Used to raise a tab
   *  @param id Accepts a tab index (stating at 0) or a tab name
   */
    this.raiseTab = function(id){
        var tab = findTab(id);
        if (tab) raiseTab(tab);
    };


    var raiseTab = function(tab){

        if (tab.style.display === 'none') return; //tab is hidden

        if (tab.el.style.display === 'none'){

          //Find current tab
            var currTab = null;
            for (var i=0; i<tabList.childNodes.length; i++){
                var t = tabList.childNodes[i];
                if (t.el.style.display === 'block'){
                    currTab = t;
                    break;
                }
            }


          //Make tab active
            setStyle(tab, "activeTab");
            tab.style.position = "relative";
            tab.style.float = "left";
            tab.style.height = "100%";
            tab.el.style.display = '';


          //Make other tabs inactive
            for (var i=0; i<tabList.childNodes.length; i++){
                var t = tabList.childNodes[i];
                if (t!==tab){
                    if (t.style.display !== 'none'){
                        setInactive(t);
                    }
                }
            }


          //Display tab content
            tab.el.style.display = 'block';


          //Call onTabChange
            me.onTabChange(getTabInfo(tab), getTabInfo(currTab));
        }
    };


  //**************************************************************************
  //** getTabInfo
  //**************************************************************************
    var getTabInfo = function(tab){
        if (tab==null) return null;

        var hidden = (tab.style.display === 'none');
        var active = (tab.el.style.display !== 'none');
        return {
            name: tab.innerText,
            el: tab.el, //should be renamed to body or content
            header: tab,
            body: tab.el,
            hidden: hidden,
            active: active
        };
    };


  //**************************************************************************
  //** setActiveTab
  //**************************************************************************
  /** Same as raiseTab()
   *  @param id Accepts a tab index (stating at 0) or a tab name
   */
    this.setActiveTab = this.raiseTab;


  //**************************************************************************
  //** onTabChange
  //**************************************************************************
  /** Called whenever a tab is raised.
   */
    this.onTabChange = function(currTab, prevTab){};


  //**************************************************************************
  //** removeTab
  //**************************************************************************
  /** Used to remove a tab from the tab panel.
   *  @param id Accepts a tab index (stating at 0) or a tab name
   */
    this.removeTab = function(id){
        var tab = findTab(id);
        if (tab){
            var nextTab = tab.nextSibling;
            if (!nextTab) nextTab = tab.previousSibling;

            tabContent.removeChild(tab.el);
            tabList.removeChild(tab);

            if (nextTab) raiseTab(nextTab);
        }
    };


  //**************************************************************************
  //** hideTab
  //**************************************************************************
  /** Used to hide a tab in the tab panel. Unlike the removeTab() method, the
   *  tab will remain in the tab panel, but in a hidden state.
   *  @param id Accepts a tab index (stating at 0) or a tab name
   */
    this.hideTab = function(id){
        var tab = findTab(id);
        if (tab){
            if (tab.style.display === 'none') return;

            var nextTab = tab.nextSibling;
            if (!nextTab) nextTab = tab.previousSibling;

            setInactive(tab);
            tab.style.display = 'none';
            tab.el.style.display = 'none';


            if (nextTab) raiseTab(nextTab);
        }
    };


  //**************************************************************************
  //** showTab
  //**************************************************************************
  /** Used to make a hidden tab visible. See hideTab()
   *  @param id Accepts a tab index (stating at 0) or a tab name
   */
    this.showTab = function(id){
        var tab = findTab(id);
        if (tab) tab.style.display = '';
    };


  //**************************************************************************
  //** findTab
  //**************************************************************************
    var findTab = function(id){
        if (isNaN(id)){
            if (typeof id === "string"){
                for (var i=0; i<tabList.childNodes.length; i++){
                    var t = tabList.childNodes[i];
                    if (t.innerHTML === id ){
                        return t;
                    }
                }
            }
        }
        else{
            if (id<tabList.childNodes.length){
                return tabList.childNodes[id];
            }
        }
        return null;
    };


  //**************************************************************************
  //** setInactive
  //**************************************************************************
  /** Updated the style of a given tab and hides its contents.
   */
    var setInactive = function(tab){
        setStyle(tab, "inactiveTab");
        tab.style.position = "relative";
        tab.style.float = "left";
        tab.style.height = "100%";
        tab.el.style.display = 'none';
    };




  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;
    var createElement = javaxt.dhtml.utils.createElement;
    var isElement = javaxt.dhtml.utils.isElement;
    var setStyle = function(el, style){
        javaxt.dhtml.utils.setStyle(el, config.style[style]);
    };

    init();
};