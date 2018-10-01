global.specify = global.it

global.req = function (module) {
  return require('../server/' + module)
}
