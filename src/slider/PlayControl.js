if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  PlayControl
//******************************************************************************
/**
 *   Used to render a slider that can be used a part of a audio or video
 *   controller. Provides basic functions like play, pause, and stop. Users
 *   can interact with the slider while its running and get back elapsed time.
 *   This class requires the javaxt.dhtml.Slider class which, in turn requires
 *   a css file but has no other dependencies.
 *
 ******************************************************************************/

javaxt.dhtml.PlayControl = function(parent, config) {
    this.className = "javaxt.dhtml.PlayControl";

    var me = this;
    var slider;
    var playing = false;
    var timerId;
    var loop = false;

    var defaultConfig = {
        startTime: 0, //seconds
        speed: 0.2, //seconds
        totalTime: 60, //seconds
        style: {
            groove: "sliderGrove",
            handle: "sliderHandle"
        }
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************

    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;

        var fireEvents = false;

        slider = new javaxt.dhtml.Slider(parent, config);

        slider.onChange = function(){
            if (fireEvents){
                me.onChange(me.getElapsedTime());
            }
        };

        slider.onDrag = function(){
            var resume = playing;
            if (playing) me.pause();
            if (resume) me.play(loop);
        };


        slider.onRender = function(){
            me.setElapsedTime(config.startTime);
            fireEvents = true;
        };
    };


  //**************************************************************************
  //** setRunTime
  //**************************************************************************
  /** @param runTime in seconds
   */
    this.setRunTime = function(runTime){
        if (runTime===config.totalTime) return;
        var resume = false;
        if (playing){
            me.pause();
            resume = true;
        }
        config.totalTime = runTime;
        if (resume) me.play();
    };


  //**************************************************************************
  //** play
  //**************************************************************************
    this.play = function(_loop){
        if (playing===true) return;


        if (_loop===true) loop = true;
        else loop = false;


        playing = true;
        var startDate = new Date().getTime();
        var currVal = slider.getValue();
        if (currVal>0){
            startDate = startDate - ((currVal/slider.getWidth()) * config.totalTime)*1000;
        }

        timerId = setInterval(function(){
            var w = slider.getWidth();
            var elapsedTime = (new Date().getTime()-startDate)/1000;
            var percentComplete = elapsedTime/config.totalTime;
            var nextVal = w*percentComplete; //Math.ceil


            if (nextVal>=w){
                if (loop===true){
                    me.onEnd();
                    slider.setValue(0);
                    startDate = new Date().getTime();
                }
                else{
                    slider.setValue(w);
                    me.pause();
                    me.onEnd();
                }
            }
            else{
                slider.setValue(nextVal);
            }

        }, config.speed*1000);

    };


  //**************************************************************************
  //** pause
  //**************************************************************************
    this.pause = function(){
        clearInterval(timerId);
        playing = false;
    };


  //**************************************************************************
  //** stop
  //**************************************************************************
    this.stop = function(){
        me.pause();
        slider.setValue(0);
    };


  //**************************************************************************
  //** isPlaying
  //**************************************************************************
    this.isPlaying = function(){
        return playing;
    };


  //**************************************************************************
  //** getElapsedTime
  //**************************************************************************
    this.getElapsedTime = function(){
        return (slider.getValue()/slider.getWidth()) * config.totalTime;
    };


  //**************************************************************************
  //** setElapsedTime
  //**************************************************************************
    this.setElapsedTime = function(elapsedTime){
        if (elapsedTime==null || elapsedTime<0) return;


        var w = slider.getWidth();
        var x = Math.ceil((elapsedTime/config.totalTime)*w);


        if (x>w) x = 0;



        slider.setValue(x);

    };


  //**************************************************************************
  //** onChange
  //**************************************************************************
    this.onChange = function(elapsedTime){};


  //**************************************************************************
  //** onEnd
  //**************************************************************************
    this.onEnd = function(){};




  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;


    init();

};