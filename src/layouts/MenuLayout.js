if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  MenuLayout
//******************************************************************************
/**
 *   Layout initially intended for mobile applications. Contains a header,
 *   body, and menu panel. The header includes a menu icon which is used to
 *   slide open/close a menu panel.
 *
 ******************************************************************************/

javaxt.dhtml.MenuLayout = function(parent, config) {
    this.className = "javaxt.dhtml.MenuLayout";

    var me = this;
    var defaultConfig = {


      /** Time to slide open the menu panel, in milliseconds.
       */
        animationSteps: 250.0,


      /** Transition effect. A "linear" transition is applied by default.
       *  Additional options are available if an instance of a
       *  javaxt.dhtml.Effects class is provided in the "fx" config. See
       *  the javaxt.dhtml.Effects class for complete a list of options.
       */
        transitionEffect: "linear",


      /** An instance of a javaxt.dhtml.Effects class used to animate
       *  transitions.
       */
        fx: null,


      /** Width of the menu panel, in pixels.
       */
        menuWidth: 250,


      /** Used to set which side to use for the menu panel and corresponding
       *  icon. Options are "left" or "right".
       */
        menuPosition: "left",


      /** Text or DOM object to appear in the header area.
       */
        title: "",


      /** Style for individual elements within this component. Note that you
       *  can provide CSS class names instead of individual style definitions.
       */
        style: {

            header: {
                height: "35px",
                backgroundColor: "#777777",
                color: "#FFFFFF"
            },

            title: {
                lineHeight: "35px",
                position: "absolute",
                width: "100%",
                whiteSpace: "nowrap",
                fontFamily: "helvetica,arial,verdana,sans-serif",
                fontSize: "20px",
                color: "white",
                textAlign: "center",
                cursor: "pointer"
                //textTransform: "uppercase"
            },


            menu: {
                backgroundColor: "#4BB5EF"
            },

            menuIcon: {
                //Defaults to createMenuIcon() function
            },

            body: {

            }
        }
    };

    var outerDiv;
    var innerDiv;
    var headerDiv;
    var menuDiv;
    var bodyDiv;
    var titleDiv;
    var title;
    var menuWidth, menuPosition;
    var menuIcon;
    var isMenuVisible = false;


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
        defaultConfig.style.menuIcon = createMenuIcon;
        merge(clone, defaultConfig);
        config = clone;


      //Process config
        menuWidth = config.menuWidth;
        menuPosition = config.menuPosition;
        if (menuPosition==="right"){}
        else menuPosition = "left";
        title = config.title;


        var mainDiv = createElement("div", parent, {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        mainDiv.setAttribute("desc", me.className);
        me.el = mainDiv;


      //Create outer table (for resize purposes)
        var table = createTable(mainDiv);
        table.setAttribute("desc", me.className);
        var row = table.addRow();
        var td = row.addColumn({
            width: "100%",
            height: "100%",
            border: "0px", //"1px solid #969696"
            verticalAlign: "top"
        });




      //Create divs (for overflow purposes)
        outerDiv = createElement('div', td, {
            width: "100%",
            height: "100%",
            position: "relative"
        });


        var overflowDiv = createElement('div', outerDiv, {
            width: "100%",
            height: "100%",
            position: "absolute",
            overflow: "hidden"
        });


      //Create content div with a width = parent width + menu width
        innerDiv = createElement('div', overflowDiv, {
            width: (outerDiv.offsetWidth+menuWidth)+"px",
            height: "100%",
            position: "relative",
            marginLeft: (menuPosition==="left" ? -menuWidth : 0) +"px"
        });
        if (config.fx){
            config.fx.setTransition(innerDiv, config.transitionEffect, config.animationSteps);
        }



      //Create table with 2 columns - one for the menu and one for the body
        table = createTable(innerDiv);
        row = table.addRow();
        var leftCol = row.addColumn({
            height: "100%",
            verticalAlign: "top"
        });
        if (menuPosition==="right") leftCol.style.width="100%";



        var rightCol = row.addColumn({
            height: "100%",
            verticalAlign: "top"
        });
        if (menuPosition==="left") rightCol.style.width="100%";


        menuDiv = createElement('div', config.style.menu);
        menuDiv.style.height = "100%";
        menuDiv.style.width = menuWidth + "px";
        if (menuPosition==="left") leftCol.appendChild(menuDiv);
        else rightCol.appendChild(menuDiv);



      //Create table with 2 rows - one for the header and one for the body
        table = createTable();

        row = table.addRow();
        headerDiv = row.addColumn(config.style.header);
        headerDiv.style.width="100%";

        row = table.addRow();
        bodyDiv = row.addColumn(config.style.body);
        bodyDiv.style.width="100%";
        bodyDiv.style.height="100%";
        bodyDiv.style.verticalAlign = "top";

        if (menuPosition==="left") rightCol.appendChild(table);
        else leftCol.appendChild(table);




        onRender(bodyDiv, function(){

          //Create header after the table has been added to the document!
            headerDiv.appendChild(createHeader());


          //Watch for resize events
            addResizeListener(outerDiv, function(){
                me.resize();
                me.onResize();
            });


          //Hide navbar hack. Might not work for other browsers. More info here:
          //https://developers.google.com/web/fundamentals/native-hardware/fullscreen/
            window.scrollTo(0,1);

        });
    };


  //**************************************************************************
  //** createHeader
  //**************************************************************************
    var createHeader = function(){

        var table = createTable();
        var row = table.addRow();


      //Create left column
        var leftCol = row.addColumn();


      //Create title
        var centerCol = row.addColumn({
            width: "100%",
            height: "100%"
        });
        centerCol.appendChild(createTitle());


      //Create right column
        var rightCol = row.addColumn();



      //Add menu icon
        var tgt = (menuPosition==="left") ? leftCol : rightCol;
        tgt.onclick = function(){
            var margin = parseFloat(innerDiv.style.marginLeft);
            if (margin<0){
                me.showMenu();
            }
            else{
                me.hideMenu();
            }
        };
        if (typeof config.style.menuIcon === "function") {
            menuIcon = config.style.menuIcon();
        }
        else{
            menuIcon = createElement('div', config.style.menuIcon);
        }
        tgt.appendChild(menuIcon);


        return table;
    };


  //**************************************************************************
  //** createMenuIcon
  //**************************************************************************
    var createMenuIcon = function(){

        var h = headerDiv.offsetHeight;

        var outerDiv = createElement('div', {
            width: h+"px",
            height: h+"px",
            position: "relative",
            cursor: "pointer"
        });



        var overflowDiv = createElement('div', outerDiv, {
            width: "100%",
            height: "100%",
            position: "absolute",
            overflow: "hidden"
        });


        var barWidth = 22;
        var barHeight = 3;
        var barSpacing = 3;

        for (var i=0; i<3; i++){
            createElement('div', overflowDiv, {
                width: barWidth+"px",
                height: barHeight+"px",
                background: "#FFFFFF",
                marginBottom: barSpacing+"px"
            });
        }


        overflowDiv.style.marginLeft = ((h-barWidth)/2)+"px";
        overflowDiv.style.marginTop = ((h-((barHeight+barSpacing)*3))/2)+"px";
        //overflowDiv.style.marginBottom = "-" + div.style.marginTop;



        return outerDiv;
    };


  //**************************************************************************
  //** getMenuIcon
  //**************************************************************************
  /** Returns the DOM element used to render the menu icon.
   */
    this.getMenuIcon = function(){
        return menuIcon;
    };


  //**************************************************************************
  //** createTitle
  //**************************************************************************
    var createTitle = function(){

        var outerDiv = createElement('div', {
            width: "100%",
            height: "100%",
            position: "relative"
        });


        var overflowDiv = createElement('div', outerDiv, {
            width: "100%",
            height: "100%",
            position: "absolute",
            overflow: "hidden"
        });


        titleDiv = createElement('div', overflowDiv, config.style.title);
        me.setTitle(title);

        return outerDiv;
    };


  //**************************************************************************
  //** setTitle
  //**************************************************************************
  /** Used to update the contents of the header area
   *  @param obj Text or DOM object to appear in the header area
   */
    this.setTitle = function(obj){
        title = obj;
        if (isElement(title)){
            titleDiv.innerHTML = "";
            titleDiv.appendChild(title);
        }
        else{
            titleDiv.innerHTML = title;
        }
    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
  /** Returns the title (e.g. string or DOM object). See setTitle()
   */
    this.getTitle = function(){
        return title;
    };


  //**************************************************************************
  //** isMenuVisible
  //**************************************************************************
  /** Returns true if the menu is visible
   */
    this.isMenuVisible = function(){
        return isMenuVisible;
    };


  //**************************************************************************
  //** showMenu
  //**************************************************************************
  /** Used to slide open the menu, if it is hidden from view
   */
    this.showMenu = function(){
        if (isMenuVisible) return;
        //console.log("showMenu!");
        me.beforeShow();
        isMenuVisible = true;
        if (config.fx){
            setTimeout(function(){
                innerDiv.style.marginLeft = "0px";
                setTimeout(function(){
                    me.onShow.apply(me, []);
                }, config.animationSteps+50);
            }, 50);
        }
        else{
            slideMenu(true, new Date().getTime(), config.animationSteps, me.onShow);
        }
    };


  //**************************************************************************
  //** hideMenu
  //**************************************************************************
  /** Used to hide the menu, if it is visible
   */
    this.hideMenu = function(){
        if (!isMenuVisible) return;
        me.beforeHide();

        var callback = function(){
            isMenuVisible = false;
            me.onHide.apply(me, []);
        };

        if (config.fx){
            setTimeout(function(){
                innerDiv.style.marginLeft = -menuWidth+"px";
                setTimeout(callback, config.animationSteps+50);
            }, 50);
        }
        else{

            slideMenu(false, new Date().getTime(), config.animationSteps, callback);
        }
    };


  //**************************************************************************
  //** onShow
  //**************************************************************************
  /** Called whenever the menu is made visible
   */
    this.onShow = function(){};


  //**************************************************************************
  //** onHide
  //**************************************************************************
  /** Called whenever the menu is hidden
   */
    this.onHide = function(){};


  //**************************************************************************
  //** beforeShow
  //**************************************************************************
  /** Called immediately before the menu is made visible
   */
    this.beforeShow = function(){};


  //**************************************************************************
  //** beforeHide
  //**************************************************************************
  /** Called immediately before the menu is hidden
   */
    this.beforeHide = function(){};


  //**************************************************************************
  //** slideMenu
  //**************************************************************************
  /** Used to slide the menu panel open or close.
   */
    var slideMenu = function(slideOpen, lastTick, timeLeft, callback){

        var curTick = new Date().getTime();
        var elapsedTicks = curTick - lastTick;


      //If the animation is complete, ensure that the panel is completely open
        if (timeLeft <= elapsedTicks){


            innerDiv.style.marginLeft = slideOpen? "0px" : -menuWidth+"px";

            if (callback!=null){
                callback.apply(me, []);
            }

            return;
        }


        timeLeft -= elapsedTicks;

        var marginLeft;
        if (slideOpen){
            marginLeft = Math.round((timeLeft/config.animationSteps) * menuWidth);
        }
        else{
            marginLeft = menuWidth - Math.round((timeLeft/config.animationSteps) * menuWidth);
        }

        innerDiv.style.marginLeft = -marginLeft + "px";


        setTimeout(function(){
            slideMenu(slideOpen, curTick, timeLeft, callback);
        }, 33);
    };


  //**************************************************************************
  //** resize
  //**************************************************************************
  /** Used to update the layout of this component
   */
    this.resize = function(){
        innerDiv.style.width=(outerDiv.offsetWidth+menuWidth)+"px";
    };


  //**************************************************************************
  //** onResize
  //**************************************************************************
  /** Function called whenever this component is resized
   */
    this.onResize = function(){};


  //**************************************************************************
  //** getMenu
  //**************************************************************************
  /** Returns the menu panel
   */
    this.getMenu = function(){
        return menuDiv;
    };


  //**************************************************************************
  //** getBody
  //**************************************************************************
  /** Returns the body panel
   */
    this.getBody = function(){
        return bodyDiv;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var onRender = javaxt.dhtml.utils.onRender;
    var createTable = javaxt.dhtml.utils.createTable;
    var createElement = javaxt.dhtml.utils.createElement;
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;
    var isElement = javaxt.dhtml.utils.isElement;


    init();
};