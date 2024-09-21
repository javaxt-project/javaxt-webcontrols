var renderComponents = function(parent, style){


    javaxt.dhtml.utils.updateDOM();
    var createElement = javaxt.dhtml.utils.createElement;
    var createTile = function(){
        return createElement("div", parent, {
            position: "relative",
            width: "600px",
            height: "400px",
            float: "left"
        });
    };


  //Create window
    var window = new javaxt.dhtml.Window(createTile(), {
        title: "Window",
        width: 400,
        height: 200,
        style: style ? style.window : {},
        movable: false,
        resizable: false
    });
    window.show();



  //Create tab panel
    var tabContainer = createElement("div", createTile(), {
        width: "300px",
        height: "300px"
    });
    tabContainer.className = "middle center";
    var tabs = new javaxt.dhtml.TabPanel(tabContainer, {
        style: style ? style.tabPanel : {}
    });
    tabs.addTab("Selected", "");
    tabs.addTab("Search", "");
    tabs.raiseTab(0);




  //Create window with tabs
    var window = new javaxt.dhtml.Window(createTile(), {
        title: "Tab Window",
        width: 400,
        height: 200,
        style: style ? style.window : {},
        movable: false,
        resizable: false
    });
    window.getBody().style.padding = 0;

    var tabs = new javaxt.dhtml.TabPanel(window.getBody(), {
        style: style ? style.tabPanel : {}
    });
    tabs.addTab("Selected", "");
    tabs.addTab("Search", "");
    tabs.raiseTab(0);
    window.show();
};