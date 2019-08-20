if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Effects
//*****************************************************************************/
/**
 *   Used to dynamically apply transition effects to elements.
 *
 ******************************************************************************/

javaxt.dhtml.Effects = function() {

    var me = this;

  //**************************************************************************
  //** fadeIn
  //**************************************************************************
  /** Used to gradually update the opacity of a given element. Assumes the
   *  element style is initially set to display:none;
   */
    this.fadeIn = function(el, transitionEffect, duration, callback){
        el.style.opacity = 0;
        el.style.display = "";
        me.setTransition(el, transitionEffect, duration);
        setTimeout(function(){
            el.style.opacity = "";
            if (callback){
                setTimeout(function(){
                    callback.apply(el, []);
                }, duration+50);
            }
        }, 50);
    };


  //**************************************************************************
  //** fadeOut
  //**************************************************************************
  /** Used to gradually update the opacity of a given element until it is no
   *  longer visible.
   */
    this.fadeOut = function(el, transitionEffect, duration, callback){
        me.setTransition(el, transitionEffect, duration);
        setTimeout(function(){
            el.style.opacity = 0;
            if (callback){
                setTimeout(function(){
                    el.style.display = "none";
                    callback.apply(el, []);
                }, duration+50);
            }
        }, 50);
    };


  //**************************************************************************
  //** setTransition
  //**************************************************************************
  /** Used to set the transition style for a given element.
   */
    this.setTransition = function(el, transitionEffect, duration){
        if (isNaN(duration) || duration<=0) return;
        var points = getPoints(transitionEffect);
        if (duration) duration = 500;
        setTransition(el, duration, points);
    };


  //**************************************************************************
  //** getPoints
  //**************************************************************************
    var getPoints = function(transitionEffect){
        if (isArray(transitionEffect)){
            return transitionEffect;
        }
        else{
            var points = javaxt.dhtml.Transitions[transitionEffect];
            if (!points) points = javaxt.dhtml.Transitions["ease"];
            return points;
        }
    };


  //**************************************************************************
  //** isArray
  //**************************************************************************
    var isArray = function(obj){
        return (Object.prototype.toString.call(obj)==='[object Array]');
    };


  //**************************************************************************
  //** setTransition
  //**************************************************************************
  /** Used to set or update the transition style for a the given element.
   *  all 500ms cubic-bezier(0.52, 0.075, 0.47, 0.895)
   */
    var setTransition = function(el, t, arr) {


        var x1 = arr[0];
        var y1 = arr[1];
        var x2 = arr[2];
        var y2 = arr[3];



        // set all transition types. ugly ugly vendor prefixes
        el.style.WebkitTransition =
        el.style.MozTransition =
        el.style.MsTransition =
        el.style.OTransition =
        el.style.transition =
            'all ' + t + 'ms cubic-bezier' +
            '(' + x1 + ', ' + y1 + ', ' + x2 + ', ' + y2 + ')';


        if ( !supportsBezierRange ) {

          var wy1, wy2;

          if (y1 > 1) wy1 = 1;
          if (y1 < 0) wy1 = 0;
          if (y2 > 1) wy2 = 1;
          if (y2 < 0) wy2 = 0;

          el.style.WebkitTransition = 'all ' + t + 'ms cubic-bezier' + '(' + x1 + ', ' + wy1 + ', ' + x2 + ', ' + wy2 + ')';
        }

    };


  //**************************************************************************
  //** supportsBezierRange
  //**************************************************************************
    var supportsBezierRange = (function() {
        var el = document.createElement('div');
        el.style.WebkitTransitionTimingFunction = 'cubic-bezier(1,0,0,1.1)';
        return !!el.style.WebkitTransitionTimingFunction.length;
    })();
};

javaxt.dhtml.Transitions = {
    linear	: [0.250, 0.250, 0.750, 0.750],
    ease	: [0.250, 0.100, 0.250, 1.000],
    easeIn	: [0.420, 0.000, 1.000, 1.000],
    easeOut	: [0.000, 0.000, 0.580, 1.000],
    easeInOut	: [0.420, 0.000, 0.580, 1.000],


    easeInQuad	: [0.550, 0.085, 0.680, 0.530],
    easeInCubic	: [0.550, 0.055, 0.675, 0.190],
    easeInQuart	: [0.895, 0.030, 0.685, 0.220],
    easeInQuint	: [0.755, 0.050, 0.855, 0.060],
    easeInSine	: [0.470, 0.000, 0.745, 0.715],
    easeInExpo	: [0.950, 0.050, 0.795, 0.035],
    easeInCirc	: [0.600, 0.040, 0.980, 0.335],
    easeInBack	: [0.600, -0.280, 0.735, 0.045],

    easeOutQuad     : [0.250, 0.460, 0.450, 0.940],
    easeOutCubic    : [0.215, 0.610, 0.355, 1.000],
    easeOutQuart    : [0.165, 0.840, 0.440, 1.000],
    easeOutQuint    : [0.230, 1.000, 0.320, 1.000],
    easeOutSine     : [0.390, 0.575, 0.565, 1.000],
    easeOutExpo     : [0.190, 1.000, 0.220, 1.000],
    easeOutCirc     : [0.075, 0.820, 0.165, 1.000],
    easeOutBack     : [0.175, 0.885, 0.320, 1.275],

    easeInOutQuad	: [0.455, 0.030, 0.515, 0.955],
    easeInOutCubic	: [0.645, 0.045, 0.355, 1.000],
    easeInOutQuart	: [0.770, 0.000, 0.175, 1.000],
    easeInOutQuint	: [0.860, 0.000, 0.070, 1.000],
    easeInOutSine	: [0.445, 0.050, 0.550, 0.950],
    easeInOutExpo	: [1.000, 0.000, 0.000, 1.000],
    easeInOutCirc	: [0.785, 0.135, 0.150, 0.860],
    easeInOutBack	: [0.680, -0.550, 0.265, 1.550]
};