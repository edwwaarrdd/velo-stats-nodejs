// Production entrypoint.
//
// Node runs JavaScript on a single thread, so one process can only ever use one
// core. A production deployment forks a worker per allotted core and lets the
// cluster module round-robin incoming connections between them; every worker
// runs the same unmodified dist/main.js and shares the listening socket.
//
// This file is copied next to main.js in the image, so the relative require
// below resolves inside dist/.

'use strict';

const cluster = require('node:cluster');
const os = require('node:os');

const workers = Number(process.env.WEB_CONCURRENCY) || os.availableParallelism();

if (!cluster.isPrimary) {
  require('./main.js');
} else {
  console.log(`cluster: starting ${workers} workers`);

  for (let i = 0; i < workers; i += 1) {
    cluster.fork();
  }

  // A worker that dies is replaced, so a crash degrades capacity instead of
  // taking the service down.
  cluster.on('exit', (worker, code, signal) => {
    console.error(`cluster: worker ${worker.process.pid} exited (${signal || code}), restarting`);
    cluster.fork();
  });
}
