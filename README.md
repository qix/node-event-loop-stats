[![Build Status](https://travis-ci.org/smyte/node-event-loop-stats.svg?branch=master)](https://travis-ci.org/smyte/node-event-loop-stats.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/smyte/node-event-loop-stats/badge.svg?branch=master)](https://coveralls.io/github/smyte/node-event-loop-stats?branch=master)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

# Event loop timer

This was primarily written to provide accurate event loop statistics for our blog post on the node event loop.

```js
const EventLoopMonitor = require("node-event-loop-stats").EventLoopMonitor;

const monitor = new EventLoopMonitor();
monitor.start();
setInterval(() => {
  console.log("Event loop: " + monitor.getStatsString());
}, 1000);
```

## Setting travis and coveralls badges

1.  Sign in to [travis](https://travis-ci.org/) and activate the build for your project.
2.  Sign in to [coveralls](https://coveralls.io/) and activate the build for your project.
