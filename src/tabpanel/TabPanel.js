if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  TabPanel
//******************************************************************************
/**
 *   Standard tab control used to show/hide individual panels, one panel at a 
 *   time.
 *
 ******************************************************************************/


javaxt.dhtml.TabPanel = function(parent, config) {
    this.className = "javaxt.dhtml.TabPanel";
    
    var me = this;
    var tabList;
    var tabContent;
    
    var defaultConfig = {
        closable: false,
        style : {
            tabBar: {
                backgroundColor: "#eaeaea",
                height: "30px"
            },
            activeTab: {
                backgroundColor: "#fafafa"
            },
            inactiveTab: {
                
            },
            tabBody: {
                border: "1px solid #ccc"
            },
            closeIcon: {
                
            }
        }
    };


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

        
        
        var table = document.createElement('table');
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.width = "100%";
        table.style.height = "100%";
        table.style.borderCollapse = "collapse";
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);

      //Row 1
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var td = document.createElement('td');
        setStyle(td, "tabBar");
        td.style.width = "100%";
        tr.appendChild(td);
        
        tabList = document.createElement('ul');
        tabList.style.listStyle = "none outside none";
        tabList.style.padding = 0;
        tabList.style.margin = 0;
        tabList.style.height = "100%";
        td.appendChild(tabList);
        
        
      //Row 2
        tr = document.createElement('tr');
        tbody.appendChild(tr);
        var td = document.createElement('td');
        setStyle(td, "tabBody");
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);
        tabContent = td;
        
        parent.appendChild(table);
    };
    
    
  //**************************************************************************
  //** addTab
  //**************************************************************************
  /** Used to add a new tab to the panel. 
   *  @param name Title or name associated with the tab. 
   *  @param el DOM element rendered when the tab is active. 
   */
    this.addTab = function(name, el){
        var tab = document.createElement('li');
        setStyle(tab, "activeTab");
        tab.style.position = "relative";
        tab.style.float = "left";
        tab.style.height = "100%";
        tab.innerHTML = name;
        tab.el = el;
        tab.onclick = function(){
            raiseTab(this);
        };
        tab.onselectstart = function () {return false;};
        tab.onmousedown = function () {return false;};
        tabList.appendChild(tab);
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
        
        tabContent.appendChild(el);
    };


  //**************************************************************************
  //** getTabs
  //**************************************************************************
  /** Returns a list of tabs in the tab panel.
   */
    this.getTabs = function(){
        var tabs = [];
        for (var i=0; i<tabList.childNodes.length; i++){
            var tab = tabList.childNodes[i];
            var hidden = (tab.style.display === 'none');
            var active = (tab.el.style.display !== 'none');
            tabs.push({
                name: tab.innerHTML,
                el: tab.el,
                hidden: hidden,
                active: active
            });
        }
        return tabs;
    };


  //**************************************************************************
  //** raiseTab
  //**************************************************************************
    this.raiseTab = function(id){
        var tab = findTab(id);
        if (tab) raiseTab(tab);
    };


    var raiseTab = function(tab){

        if (tab.style.display === 'none') return; //tab is hidden

        if (tab.el.style.display === 'none'){

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


            tab.el.style.display = 'block';
        }
    };


  //**************************************************************************
  //** setActiveTab
  //**************************************************************************
    this.setActiveTab = this.raiseTab;


  //**************************************************************************
  //** removeTab
  //**************************************************************************
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
    this.showTab = function(id){
        var tab = findTab(id);
        if (tab) tab.style.display = '';
    };


  //**************************************************************************
  //** findTab
  //**************************************************************************
    var findTab = function(id){
        if (isNaN(id)){
            if (typeof parent === "string"){
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