global.specify = global.it

global.req = function (module) {
  return require('../src/' + module)
}
