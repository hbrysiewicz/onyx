onyx
====

A dashboard app to visualize graphite data using Cubism.js and NVD3

# Build Dependencies

Install dependencies from npm

```
$> npm install
```

# Configuration

Onyx comes with an example config.json file in the app directory called `config_example.json`. 
This can be used as a starting point for configuring Onyx to display data as desired.

```
$> cp app/config_example.json app/config.json
```

Be sure to update the `graphite` property in config.json with correct hostname that graphite is running on.

## Cubism and NVD3 Graphs

There are two different sections in the configuration to define metrics and how they are graphed. 


The `cubism` property is an array of objects that define the metrics and information for a single Cubism page.
They all must have the `type` of `cubism`.


http://cl.ly/image/3W0m2g3o2H3B


The `graphs` property is an array of objects that define the metrics and information for a single NVD3 page.
Currently only the following types of NVD3 graphs are available:

 * Simple Line _type: lineGraph_
 * Line with View Finder _type: lineWithFocusGraph_
 * Stacked Area _type: stackedAreaChart_


For each cubism and graph object the `name`, `title`, `type` and `metrics` properties must be defined.


__name:__ this is used for the route/url


__title:__ this is used for the navigation and header on the page


__type:__ this is used to render the graph as line/lineWithFocus/stackedArea


__metrics:__ is an array of metric objects and their aliases


http://cl.ly/image/0p1W2X340z0Y
