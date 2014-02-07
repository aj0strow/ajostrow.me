var two = parseInt('ff', 16);

function randomTwo() {
  return parseInt(Math.random() * two, 10);
}

var counter = randomTwo();
var machineId = randomTwo();

function hexify(num) {
  return num.toString(16);
}

function objectid() {
  var unixtime = parseInt(Date.now() / 1000, 10);
  counter = (counter + 1) % two;
  var parts = [ unixtime, machineId, process.pid, counter ];
  return parts.map(hexify).join('');
}

module.exports = objectid;