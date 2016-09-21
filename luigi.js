/*
LUIGI - Lightweight User Interface for Genomic Intervals
Ajish D. George (ajishg@gmail.com)
2010
*/

var colors = ["red","green", "blue", "yellow", "pink", "grey", "black", "brown"];
var gutter_width = 0.15;
var anno_width = 0.1;
var pad_width = 0.05;

//the data to be populated
var seq = "";
var fwd = [];
var rev = [];
var n_rev = [];

var annotations = {};
var num_tracks = 0;
var max_pos= -Infinity;
var min_neg= Infinity;
var max_sum= -Infinity;

var data = null;
var stack = null;

var plot;
var overview;

var f_xmin = null;
var f_xmax = null;

function assignFetchedData( fetched ){
    annotations = fetched.annotations;
    seq = fetched.sequence;
    
    var cval;
    fwd = [];
    for (var i = 0; i < fetched.forward.length; i += 1){
        cval = fetched.forward[i];
        fwd.push([i, cval]);
        if (max_pos < cval){
            max_pos = cval;
        }
    }

    rev = [];
    for (var i = 0; i < fetched.reverse.length; i += 1){
        cval = fetched.reverse[i];
        rev.push([i, cval]);
        n_rev.push( [i, -1*cval] );
        if (min_neg > -1*cval){
            min_neg = -1*cval;
        }
    }

    num_tracks=0; 
    for (name in annotations){
        num_tracks++;
    }



    for (var i = 0; i < fwd.length; i += 1){
        if (max_sum < fwd[i][1]+rev[i][1]){
            max_sum = fwd[i][1]+rev[i][1]
        }
    }
}


function assignDefaultData(){
    annotations = {
        "mature": [1,1010],
        "loop": [1500,2500],
        "fark": [1750,2000],
        "star": [7000,8000],
        "snp": [9000,9001]
    }

    
    seq = "";
    for (var i = 0; i < 10000; i += 1){
        seq = seq.concat("A") 
    }

    var cval;
    fwd = [];
    for (var i = 0; i < 10000; i += 1){
        cval = parseInt(Math.random()*10);
        fwd.push([i, cval]);
        if (max_pos < cval){
            max_pos = cval;
        }
    }

    rev = [];
    for (var i = 0; i < 10000; i += 1){
        cval = parseInt(Math.random()*10);
        rev.push([i, cval]);
        if (min_neg > -1*cval){
            min_neg = -1*cval;
        }
    }

    for (var i = 0; i < 10000; i += 1){
        if (max_sum < fwd[i][1]+rev[i][1]){
            max_sum = fwd[i][1]+rev[i][1]
        }
    }

}

function formatOverviewLabel(lbl){
    rnded = Math.round(lbl*10)/10;
    return "<font size=1>"+rnded+"</font>";
}

function plotWithOptions() {
    var ymin, ymax;
    if (stack){
        //make sure rev is positive
        data = [fwd, rev];
        document.getElementById("stack_btn").disabled=true;
        document.getElementById("stggr_btn").disabled=false;
        ymin = 0;
        ymax = max_sum;
    }else{
        document.getElementById("stack_btn").disabled=false;
        document.getElementById("stggr_btn").disabled=true;
        data = [fwd, n_rev];
        ymin = min_neg;
        ymax = max_pos;
    }
    
    var data_height = (ymax-ymin);

    //add space at bottom for annotations and padding for top and bottom
    var plot_min = ymin - 2*gutter_width*data_height - num_tracks * anno_width*data_height - pad_width*data_height*(num_tracks-1);
    var plot_max = ymax + gutter_width*data_height;

    //thickness of annotations
    var cur_ann_width = anno_width*data_height;
    var cur_ann_y = ymin - gutter_width*data_height;

    //add annotations to be plotted
    markings = [];
    var ann_ct = 0;
    for (ann in annotations){
        markings.push( {    color: colors[ann_ct],
                            lineWidth:1, 
                            yaxis:{ 
                                from: (cur_ann_y - cur_ann_width),
                                to: cur_ann_y
                            },
                            xaxis:{
                                from: annotations[ann][0],
                                to: annotations[ann][1]
                            }
                        } );
        cur_ann_y = cur_ann_y - cur_ann_width - pad_width*data_height;
        ann_ct++;
    }

    //check if x_axis limits are pre-defined
    // -- used for zoom-to-annotation
    var f_xaxis;
    if (f_xmin != null){
        f_xaxis = { tickDecimals:0, min: f_xmin, max: f_xmax };
        $('#seq_dialog').val(seq.slice(f_xmin, f_xmax));
    }else{
        f_xaxis = {tickDecimals: 0};
        $('#seq_dialog').val(seq);
    } 

    //setup plot config
    var options = {
        series: {
            stack: stack,
            bars: { show: 1, barWidth: 0.8 }
        },
        legend: { noColumns: 2 },
        xaxis: f_xaxis,
        yaxis: { min: plot_min, max: plot_max },
        selection: { mode: "x" },
        grid:{hoverable: true, markings: markings}
    };
    //the plot
    plot = $.plot($("#placeholder"), data, options);

    //make the overview graph
    overview = $.plot($("#overview"), data, {
        series: {
            bars: { show: 1, barWidth: 0.1 },
            shadowSize: 0,
            stack: stack
        },
        legend: { noColumns: 2 },
        xaxis: { ticks:[seq.length*.25, seq.length*.5, seq.length*.75], tickFormatter: formatOverviewLabel },
        yaxis: { ticks:[ymin/.9, ymax/.9], autoscaleMargin: 0.2, tickFormatter: formatOverviewLabel },
        selection: { mode: "x" }
    });
    //connect plot to overview
    
    $("#placeholder").bind("plotselected", function (event, ranges) {
        // do the zooming
        plot = $.plot($("#placeholder"), data,
                      $.extend(true, {}, options, {
                          xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to }
                      }));
        f_xmin = ranges.xaxis.from;
        f_xmax = ranges.xaxis.to;

        // don't fire event on the overview to prevent eternal loop
        overview.setSelection(ranges, true);
        $('#seq_dialog').val(seq.slice(ranges.xaxis.from, ranges.xaxis.to));
    });
    var previousPoint = null;

    $("#placeholder").bind("plothover", function (event, pos, item) {
        clrTxt = "";
        idx = 0;
        for (ann in annotations){
            if (pos.x > annotations[ann][0] && pos.x < annotations[ann][1] && pos.y < ymin){
                clrTxt = clrTxt + "<font color=\""+colors[idx]+"\">&diams;</font>-"+ann+"<br>";
            }
            idx++;
        }
        $("#tooltip").remove();
        $("#x").text(pos.x.toFixed(0));
        if (clrTxt != ""){
            showTooltip( pos.pageX, pos.pageY, clrTxt);
        }else{

            if (item) {
                if (previousPoint != item.datapoint) {
                    previousPoint = item.datapoint;
                    
                    $("#tooltip").remove();
                    var x = parseInt(item.datapoint[0].toFixed(0)),
                        y = item.datapoint[1].toFixed(0);
                    
                    showTooltip(item.pageX, item.pageY,
                                x + " -> " + seq[x] +" : " + y);
                }
            }
        }
    });
    $("#overview").bind("plotselected", function (event, ranges) {
        plot.setSelection(ranges);
    });
}

function initializeGraph() {
        
    $('#seq_dialog').val(seq);
    legend = "<font size=-1>";
    var ann_ct =0;
    for (ann in annotations){
            curLeg = annotations[ann][0]+"-"+annotations[ann][1]
            legend= legend + "<font color=\""+colors[ann_ct]+"\" size=+1>&diams;</font>&nbsp;<input type=\"button\" value=\""+ann+"\" id=\""+ann+"\" title=\""+curLeg+"\" class=\"legendbutton\"><br>";
        ann_ct++;
    }
    legend = legend+"</font>";
    $("#features").html(legend);
 
   plotWithOptions();
    
    $(".stackControls input").click(function (e) {
        e.preventDefault();
        clckd = $(this).val();
        if (clckd == "Stacked"){
            stack = true;
        }
        if (clckd == "Staggered"){
            stack = null;
        }
        if (clckd == "Reset"){
            f_xmin = null;
            f_xmax = null;
        } 
        plotWithOptions();
    });

    $(".featSel input").click(function (e) {
        e.preventDefault();
        ann = $(this).val();//attr("name");
        //alert(ann);
        f_xmin = annotations[ann][0];
        f_xmax = annotations[ann][1];
        var rng = f_xmax - f_xmin;
        f_xmin = f_xmin - rng;
        f_xmax = f_xmax + rng;
        if (f_xmin <0){
            f_xmin = 0;
        }
        if (f_xmax >= fwd.length){
            f_xmax = fwd.length -1;
        }
        plotWithOptions();
    });
}

function showTooltip(x, y, contents) {
    $('<div id="tooltip">' + contents + '</div>').css( {
        position: 'absolute',
        display: 'none',
        top: y-20,
        left: x+10,
        border: '1px solid #fdd',
        padding: '2px',
        'background-color': '#e6e8fa',
        opacity: 0.80,
        'font-size': '70%'
    }).appendTo("body").fadeIn(200);
}
