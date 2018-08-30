#! /usr/bin/env node
const childProcess = require('child_process');

let hasCleanedUp = false;

function exec(cmd, stdio = 'inherit') {
  try {
    childProcess.execSync(cmd, {
      stdio,
    });
  } catch (err) {
    console.log(err.message);
    console.log('');
    throw err;
  }
}

function cleanup() {
  if (hasCleanedUp) {
    return;
  }
  hasCleanedUp = true;
  console.log('Stopping containers');
  exec('docker-compose down --remove-orphans');
}

async function start() {
  console.log('Starting containers');
  exec('docker-compose up', [process.stdin, 'ignore', process.stderr]);
}

process.on('exit', cleanup);
process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);
process.on('uncaughtException', (err) => {
  if (!hasCleanedUp) {
    console.log(err.stack);
    process.exit(1);
  }
});

start();
