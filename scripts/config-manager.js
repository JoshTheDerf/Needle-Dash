var fs = require('fs')
var path = require('path')
var extend = require('extend')

var app = (function () {
  try {
    return require('app')
  } catch (e) {
    return require('remote').require('app')
  }
})()

var dataPath = app.getPath('userData')

var defaults = {
  x: -1,
  y: -1,
  width: 600,
  height: 600,
  theme: 'dark',
  disableGPU: false,
  providers: {
    'Linux-App-Descriptors': {
      keyword: 'app'
    },
    'URL': {
      keyword: 'url'
    },
    'Yahoo-Search': {
      keyword: 'yahoo'
    },
  }
}

// TODO: Extend module.
var config = {}

var configManager = {}

configManager.readFromDisk = function () {
  try {
    var configString = fs.readFileSync(path.join(dataPath, 'config.json'), {encoding: 'UTF-8'})
    extend(true, config, JSON.parse(configString))
    console.log('Loaded configuration from disk.')
    return true
  } catch (e) {
    extend(true, config, defaults)
    return false
  }
}

configManager.writeToDisk = function () {
  try {
    fs.writeFileSync(path.join(dataPath, 'config.json'), JSON.stringify(config, null, '  '))
    console.log('Wrote configuration to disk.')
    return true
  } catch (e) {
    console.log('ERR: Failed to save configuration to disk.')
    return false
  }
}

configManager.getConfig = function () {
  return config
}

configManager.setConfig = function (newConfig) {
  extend(true, config, newConfig)
}

configManager.resetConfig = function () {
  extend(true, config, defaults)
}

configManager.readFromDisk()

module.exports = configManager
