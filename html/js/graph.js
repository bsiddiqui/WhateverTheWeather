/*
 *  Whatever the Weather
 *  lineChart adapted http://bl.ocks.org/mbostock/3883245
 *  compareLineChart and compareStackedAreaChart adapted from examples http://nvd3.org/ghpages/examples.html
 */

 var parseDate = d3.time.format("%m %Y").parse;

 function trivialBounds(bounds) { 
  return (bounds[0][0].toString() == bounds[1][0].toString() && bounds[0][1].toString() == bounds[1][1].toString());

}

function withinExtent(x, y, bounds) {
  return trivialBounds(bounds) || (x >= bounds[0][0] && x <= bounds[1][0] && y >= bounds[0][1] && y <= bounds[1][1]);
}

function withinXExtent(x, y, bounds) {
  return x >= +bounds[0][0].getFullYear() && x <= +bounds[1][0].getFullYear();
}


function tempTable(cityName, state, datapoint, yearRange) {

  var city = filterByCity(cityName, state);

  var points = ["Average "];
  var sum = 0;
  var total = 0;
  for(var year in city) {
    var months = city[year];

    for(var mo in months) {

      var d = months[mo];

      if (!d.data[datapoint]) {
        continue;
      }

      year = parseDate(mo + " " + year);
      d["year"] = year;
      d.data[datapoint] = +d.data[datapoint];

      if (yearRange && !withinExtent(d["year"], d.data[datapoint], yearRange)) {
        continue;
      }

      sum += d.data[datapoint];
      total++;
    }

  }

  var average = sum / total;
  $("#selection_avg").html(Math.round(average * 100) / 100);

  var color = d3.scale.linear()
  .domain(d3.extent(city, function(d) { return d["data"][datapoint]; }))
  .range(["blue",  "orange"])

  appendButton(yearRange, datapoint, cityName, state);

}

function appendButton(yearRange, datapoint, cityName, state) {

  if (yearRange && !trivialBounds(yearRange)) {
    $("." + datapoint + "-table-viz").html("");
    var table = d3.select("." + datapoint + "-table-viz")
    .append("button")
    .text("Focus on Selection")
    .style({
      padding: "10px"
    })
    .attr("class", "btn btn-inverse btn-small")
    .on("click", function() {
      var month = $("#lineChartMonth").val();
      lineChart(cityName, state, datapoint, yearRange, month);
    });
  }
}

function lineChart(cityName, state, datapoint, yearRange, month){

  window.city = cityName;
  window.state = state;
  window.datapoint = datapoint;
  window.yearRange = yearRange;

  var margin = {top: 20, right: 20, bottom: 30, left: 50},
  width = 600 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom;

  var x = d3.time.scale()
  .range([0, width]);

  var y = d3.scale.linear()
  .range([height, 0]);

  var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom");

  var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left");

  var line = d3.svg.line()
  .x(function(d) { return x(d["year"]); })
  .y(function(d) { return y(d.data[datapoint]); });

  var brush = d3.svg.brush()
  .x(x)
  .y(y)
  .on("brush", function(p) {
    tempTable(cityName, state, datapoint, brush.extent());
  })
  .on("brushend", function() {
  });

  $("." + datapoint + "-table-viz").html("");
  $("." + datapoint + "-line-graph").html("");

  var datamap = {
    "avg_temp": "Average Temperature", 
    "avg_max_tempo": "Average Maximum Temperature", 
    "avg_min_temp": "Average Minimum Temperature"
  }
  tempTable(cityName, state, datapoint);

  var header = d3.select("."  + datapoint + "-line-graph").append("h4").text(datamap[datapoint]);
  var svg = d3.select("." + datapoint + "-line-graph").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .attr("class", "brush") 
  .call(brush);

  var cityData = filterByCity(cityName, state);
  var city = [];

  for(var year in cityData)
  {

    for(var mo in cityData[year]) {

      if (mo != month)
      {
	  continue;
      }

      var d = cityData[year][mo];
      d["year"] = parseDate(mo + " " + year);
      d.data[datapoint] = +d.data[datapoint]

      if (!d.data[datapoint])
      {
        continue;
      }

      if (!yearRange) {
        city.push(d);
      }

      if (yearRange && withinXExtent(year, d.data[datapoint], yearRange)) {
        city.push(d);
      } 
    }

  }

  x.domain(d3.extent(city, function(d) { return d["year"]; }));
  y.domain(d3.extent(city, function(d) { return +d.data[datapoint]; }));

  svg.append("g")
  .attr("class", "lineGraph-x lineGraph-axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

  svg.append("g")
  .attr("class", "lineGraph-y lineGraph-axis")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 6)
  .attr("dy", ".71em")
  .style("text-anchor", "end")
  .text("Temp (F)");

  svg.append("path")
  .datum(city)
  .attr("class", "lineGraph-line")
  .attr("d", line);
  
  if (yearRange) {
    d3.select("."  + datapoint + "-line-graph")
    .insert("button", ":first-child").text("Reset View")
    .attr("class", "btn btn-inverse btn-small")
    .on("click", function() {
      var month = $("#lineChartMonth").val();
      lineChart(cityName, state, datapoint, undefined, month);
    });
  }

};


function compareCitiesData(city1Name, state1, city2Name, state2, datapoint, monthNum){
  var city1 = filterByCity(city1Name, state1);
  var city2 = filterByCity(city2Name, state2);

  var values1 = [];
  var values2 = [];
  var data = [];

  var minCity1, minCity2;

  for(var year in city1)
  {
    var months = city1[year];
    for(var month in months)
    {
     	if(month != monthNum)
     	{
		continue;
	}
        values1.push([year, +city1[year][month].data.avg_temp]);
    }
  }


  for(var year in city2)
  {
    var months = city2[year];
    for(var month in months)
    {

     	if(month != monthNum)
     	{
		continue;
	}
        values2.push([year, +city2[year][month].data.avg_temp]);
    }
  }

  var data=  [{key: city1Name, values: values1}, {key: city2Name, values: values2}]

  return data; 
};

function compareLineChart(city1, state1, city2, state2, datapoint, month){
  var data = compareCitiesData(city1, state1, city2, state2, datapoint, month);
  var colors = d3.scale.category10();
  keyColor = function(d, i) {return colors(d.key)};

  var chart;
  nv.addGraph(function() {
    chart = nv.models.lineChart()
    .x(function(d) { return d[0] })
    .y(function(d) { return d[1] })
    .color(keyColor)

    chart.xAxis
    .showMaxMin(false);

    chart.yAxis
    .tickFormat(d3.format(',.2f'));

    d3.select('#' + datapoint + "-compare-line-graph")
    .datum(data)
    .transition().duration(500).call(chart); 

    nv.utils.windowResize(chart.update);

    return chart;

  });
};

function compareStackedAreaChart(city1, state1, city2, state2, datapoint){
  $("#" + datapoint + "-compare-btn").show();
  $('#' + datapoint + "-compare-stacked").show();
  $("#" + datapoint + "-compare-btn").html("Show Line Graph Chart")
  $("#" + datapoint + "-compare-btn").unbind('click');
  $("#" + datapoint + "-compare-btn").on('click', function() {
    $('#' + datapoint + "-compare-stacked").hide();
    $('#' + datapoint + "-compare-line-graph").show();
    compareLineChart(city1, state1, city2, state2, datapoint);  
  });

  var data = compareCitiesData(city1, state1, city2, state2, datapoint);

  var colors = d3.scale.category10();
  keyColor = function(d, i) {return colors(d.key)};

  var chart;
  nv.addGraph(function() {
    chart = nv.models.stackedAreaChart()
    .x(function(d) { return d[0] })
    .y(function(d) { return +d[1] })
    .color(keyColor)

    chart.xAxis
    .showMaxMin(false)

    chart.yAxis
    .tickFormat(d3.format(',.2f'));

    d3.select('#' + datapoint + "-compare-stacked")
    .datum(data)
    .call(chart);

//    .transition().duration(500).call(chart); 

nv.utils.windowResize(chart.update);

//    chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

return chart;

});
};
