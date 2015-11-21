// COPYRIGHT (c) 2015 Joshua Bemenderfer
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Bootstrap starter for Needle.

var menubar = require('menubar')
var globalShortcut = require('global-shortcut')
var configManager = require('./scripts/config-manager')
var iconFinder = require('./freedesktop-icon-finder')

var config = configManager.getConfig()

var mb = menubar({
  dir: __dirname,
  icon: 'assets/images/Icon.png',
  preloadWindow: true,
  width: config.width,
  height: config.height,
  x: config.x >= 0 ? config.x : undefined,
  y: config.y >= 0 ? config.y : undefined,
  transparent: true,
  'skip-taskbar': true,
  type: 'notification'
})

mb.app.commandLine.appendSwitch('enable-transparent-visuals')
mb.app.commandLine.appendSwitch('disable-http-cache')

if (config.disableGPU) mb.app.commandLine.appendSwitch('disable-gpu')

var windowIsShown = false
mb.on('ready', function ready () {
  // Register the icon://NAME@SIZE protocol for freedesktop icons
  var protocol = require('protocol')

  protocol.registerFileProtocol('icon', function (request, callback) {
    var size = request.url.slice(request.url.lastIndexOf('@') + 1)
    var url = request.url.slice(7, request.url.lastIndexOf('@'))

    var foundPath = iconFinder.findIcon(url, size)
    callback({path: foundPath})
  })

  protocol.registerFileProtocol('theme', function(request, callback) {
    configManager.readFromDisk()
    config = configManager.getConfig()
    var path = 'styles/' + config.theme + '.less'
    callback({path: path})
  })
})

mb.on('after-create-window', function () {
  globalShortcut.register('ctrl+shift+x', function () {
    windowIsShown ? mb.hideWindow() : mb.showWindow()
  })
})

mb.on('show', function () {
  windowIsShown = true
  mb.window.focus()
})

mb.on('hide', function () {
  windowIsShown = false
})
