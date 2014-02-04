App = Ember.Application.create();

App.deferReadiness();

App.Config = Ember.Object.extend();

Ember.$.getJSON('/app/config.json').done(function(data) {
  App.Config.reopen(data);
  App.advanceReadiness();
});

App.register('config:current', App.Config, {singleton: true});
App.inject('controller', 'config', 'config:current');
App.inject('view', 'config', 'config:current');
App.inject('route', 'config', 'config:current');

App.Router.reopen({
  location: 'history'
});

App.Router.map(function() {
  this.route('cubism', {path: '/cubisms/:name'});
  this.route('graph', {path: '/graphs/:name'});
});

App.ApplicationRoute = Ember.Route.extend({
  model: function() {
    return this.get('config');
  }
});

App.IndexRoute = Ember.Route.extend({
  beforeModel: function() {
    this.transitionTo('/cubisms/systemLoads');
  }
});

App.CubismRoute = Ember.Route.extend({
  model: function(param) {
    return this.get('config.cubisms').findBy('name', param.name);
  }
});

App.GraphRoute = Ember.Route.extend({
  model: function(param) {
    return this.get('config.graphs').findBy('name', param.name);
  }
})

App.CubismView = Ember.View.extend({
  templateName: 'cubism',

  renderGraph: function() {
    if (this.get('isLoading')) return;
    this.set('isLoading',true);
    this.rerender();
  }.observes('controller.model'),

  didInsertElement: function() {
    var context = cubism.context().step(1000*60).size(1200);
    var graphite = context.graphite(this.get('config.graphite'));
    var spectral = ["#66c2a5", "#abdda4", "#fee08b", "#f46d43", "#d53e4f",
                    "#66c2a5", "#abdda4", "#fee08b", "#f46d43", "#d53e4f"];
    var horizon = context.horizon().height(this.get('controller.model.height')).colors(spectral);

    var metrics = this.get('controller.model.metrics').map(function(item) {
      return graphite.metric(item.metric).alias(item.alias);
    });

    d3.select("#loads").selectAll(".axis")
        .data(["top", "bottom"])
      .enter().append("div")
        .attr("class", function(d) { return d + " axis"; })
        .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

    d3.select("#loads").append("div")
        .attr("class", "rule")
        .call(context.rule());

    d3.select("#loads").selectAll(".horizon")
        .data(metrics)
      .enter().insert("div", ".bottom")
        .attr("class", "horizon")
        .call(horizon);

    context.on("focus", function(i) {
      d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
    });

    this.set('isLoading',false);
  }
});

App.GraphController = Ember.Controller.extend({
  isLoaded: false,
  graphite: Ember.computed.alias('config.graphite'),

  metricQuery: function() {
    return this.get('model.metrics').map(function(item) {
      return '&target=' + item.metric;
    }).join('');
  }.property('model.metrics'),

  timeQuery: function() {
    var from = this.get('model.from'), to = this.get('model.to'), query = '';
    if (from) query += '&from=' + from;
    if (from && to) query += '&to=' + to;
    return query;
  }.property('model.from', 'model.to'),

  url: function() {
    return '%@/render?%@%@&format=json'.fmt(this.get('graphite'), this.get('metricQuery'), this.get('timeQuery'));
  }.property('graphite','metricQuery','timeQuery')
});

App.GraphView = Ember.View.extend({
  templateName: 'graph',

  lineGraph: function(datum) {
    var colors = d3.scale.category20(),
        keyColor = function(d,i) {return colors(d.key)},
        chart;
    nv.addGraph(function() {
      chart = nv.models.lineChart()
                .options({showControls: false})
                .x(function(d) { return d[1] })
                .y(function(d) { return d[0] })
                .color(keyColor)
                .transitionDuration(300);

      chart.xAxis.tickFormat(function(d) { return d3.time.format('%I:%M %p')( new Date(d*1000)) });

      chart.yAxis.tickFormat(d3.format(',.2f'));

      d3.select('svg').datum(datum).transition().call(chart);

      nv.utils.windowResize(chart.update);
      return chart;
    });
  },

  lineWithFocusGraph: function(datum) {
    var colors = d3.scale.category20(),
        keyColor = function(d,i) {return colors(d.key)},
        chart;
    nv.addGraph(function() {
      chart = nv.models.lineWithFocusChart()
                .options({showControls: false})
                .x(function(d) { return d[1] })
                .y(function(d) { return d[0] })
                .color(keyColor)
                .transitionDuration(300);

      chart.xAxis.tickFormat(function(d) { return d3.time.format('%I:%M %p')( new Date(d*1000)) });
      chart.x2Axis.tickFormat(function(d) { return d3.time.format('%I:%M %p')( new Date(d*1000)) });

      chart.yAxis.tickFormat(d3.format(',.2f'));
      chart.y2Axis.tickFormat(d3.format(',.2f'));

      d3.select('svg').datum(datum).transition().call(chart);

      nv.utils.windowResize(chart.update);
      return chart;
    });
  },

  stackedAreaChart: function(datum) {
    var colors = d3.scale.category20(),
        keyColor = function(d,i) {return colors(d.key)},
        chart;
    nv.addGraph(function() {
      chart = nv.models.stackedAreaChart()
                .options({showControls: false})
                .x(function(d) { return d[1] })
                .y(function(d) { return d[0] })
                .color(keyColor)
                .transitionDuration(300);

      chart.xAxis.tickFormat(function(d) { return d3.time.format('%I:%M %p')( new Date(d*1000)) });

      chart.yAxis.tickFormat(d3.format(',.2f'));

      d3.select('svg').datum(datum).transition().call(chart);

      nv.utils.windowResize(chart.update);
      return chart;
    });
  },

  renderGraph: function() {
    if (this.get('isLoading')) return;
    this.set('isLoading',true);
    this.rerender();
  }.observes('controller.model'),

  willClearRender: function() {
    d3.select('svg').remove();
  },

  didInsertElement: function() {
    var _this = this, metrics = [];
    Ember.$.get(this.get('controller.url'))
      .done(function(data) {
        _this.get('controller.model.metrics').forEach(function(item, idx) {
          metrics.push({key: item.alias, values: data[idx].datapoints});
        });
        _this[_this.get('controller.model.type')](metrics);
        _this.set('isLoading',false);
      });
  }
});

