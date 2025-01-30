# Introduction
The javaxt-webcontrols library is a collection of lightwieght UI components and functions used to build rich web applications. 
The library is implemented using 100% vanilla javascript and has no external dependencies.



## Demos
Below is a list of demos of some of the components. 
Open the source code in each page for more information on how the component is instantiated and stylized. Open the web console to see some of the events.

- [Themes](https://javaxt-project.github.io/javaxt-webcontrols/demos/themes/Themes.html)
- [Effects](https://javaxt-project.github.io/javaxt-webcontrols/demos/effects/Effects.html)
- [Carousel](https://javaxt-project.github.io/javaxt-webcontrols/demos/carousel/Carousel.html)
- [Slider](https://javaxt-project.github.io/javaxt-webcontrols/demos/slider/Slider.html)
- [Switch](https://javaxt-project.github.io/javaxt-webcontrols/demos/switch/Switch.html)
- [Window](https://javaxt-project.github.io/javaxt-webcontrols/demos/window/Window.html)
- [Callout](https://javaxt-project.github.io/javaxt-webcontrols/demos/callout/Callout.html)
- [DatePicker](https://javaxt-project.github.io/javaxt-webcontrols/demos/datepicker/DatePicker.html)
- [DateInput](https://javaxt-project.github.io/javaxt-webcontrols/demos/datepicker/DateInput.html)
- [ComboBox](https://javaxt-project.github.io/javaxt-webcontrols/demos/combobox/ComboBox.html)
- [Checkbox](https://javaxt-project.github.io/javaxt-webcontrols/demos/checkbox/Checkbox.html)
- [Button](https://javaxt-project.github.io/javaxt-webcontrols/demos/button/Button.html)
- [Tree](https://javaxt-project.github.io/javaxt-webcontrols/demos/tree/Tree.html)
- [Accordion](https://javaxt-project.github.io/javaxt-webcontrols/demos/accordion/Accordion.html)
- [MenuLayout](https://javaxt-project.github.io/javaxt-webcontrols/demos/layouts/MenuLayout.html)
- [BarGraph](https://javaxt-project.github.io/javaxt-webcontrols/demos/bargraph/BarGraph.html)


## General Usage
Most of the UI components are instantiated using a `parent` and a `config` object. 
The `parent` is a DOM element in which to render the component and the `config` object is 
a JSON object with configuration settings. There are default configuration settings defined 
within each component called `defaultConfig`. Developers can override any of the default 
settings by defining thier own config.

Here's an example of how to instantiate one of the UI components using a parent and a config object.
Once the component is instantiated, you can call any of the pubic methods defined in the class.

```javascript

//Select element used hold the component
var parent = document.body;

//Define config settings (optional)
var config = {
    //put config options here
};

//Instantiate component
var window = new javaxt.dhtml.Window(parent, config);

//Call public methods
window.open();
```

## Public Methods and Event Listeners
Any function in the javaxt classes that start with a `this` keyword is public and can be called after the class has been instantiated. 
Most of the functions have code however some do not. For example, in the `Window` class there is a method called `isOpen` that has code:
```javascript
this.isOpen = function(){
   return visible;
}
```
In contrast, there is a method called `onOpen` that has no body:
```javascript
this.onOpen = function(){};
```
As described in the docs, the `onOpen` method is called whenever the window is opened or made visible. Users can override these functions 
using an instance of the window class to add thier own event listeners. Example:
```javascript
window.onOpen = function(){
   //Do something!
   console.log(window.getWidth(), window.getHeight());
};
```

## Stylizing Components
One of the goals of this project is make it as easy as possible to customize and use the UI components. All of the UI classes have style definitions 
in the `defaultConfig` so you can render components out-of-the-box without any external stylesheets or CSS. 

The style definitions in the `defaultConfig` allow users to customize individual elements within a UI component (title bar, footer, etc).
The default styles use camel-case varients of CSS keywords and are applied as inline `style` attributes for various DOM elements. 
Users can tweak individual styles or provide CSS classes to use instead. Example:
```javascript

//Set style definition in a custom window config using CSS classes
var windowConfig = {
    style : {
        panel: "window",
        header: "panel-header window-header",
        title: "panel-title window-title",
        button: "window-header-button",
        buttonBar: "window-header-button-bar",
        mask: "window-mask"
    }
};

//Instantiate window with custom config
var window = new javaxt.dhtml.Window(parent, windowConfig);
```

Using CSS classes is recommended, but not required. 


## Themes
This project includes two optional CSS files that developers can use to apply either a default blue/gray theme or a dark/black theme. 
The example above uses CSS classes defined in the `default.css` with a blue/gray theme. Note that the themes directory also includes
a `default.js` file which has keyword mappings to various styles. You can use something similar in your application to simplify the 
code used to configure classes. So instead of defining a `windowConfig` like we did in the previous example, you can use a lookup value
like this:
```javascript
var window = new javaxt.dhtml.Window(parent, {
   style: javaxt.dhtml.style.default.window
});
```

## License
JavaXT is an open source project released under an MIT License. Feel free to use the code and information found here as you like. 
This software comes with no guarantees or warranties. You may use this software in any open source or commercial project.
