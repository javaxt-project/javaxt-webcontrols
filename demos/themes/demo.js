var renderComponents = function(parent, style){

  //Create main div (can't use parent directly if iframe)
    var div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "100%";
    parent.appendChild(div);


//    javaxt.dhtml.utils.updateDOM();
//    var createElement = javaxt.dhtml.utils.createElement;
//    var createTable = javaxt.dhtml.utils.createTable;



    var window = new javaxt.dhtml.Window(div, {
        title: "Window",
        width: 400,
        height: 200,
        style: style ? style.window : {}
    });

    window.show();


};