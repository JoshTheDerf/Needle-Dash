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

// A search provider for applications on a Linux system. At the moment the matching methods are a bit broken.

var os = require('os')
var path = require('path')
var fs = require('fs')
var iniParser = require('ini-parser')
var fuzzAldrin = require('fuzzaldrin-plus')
var expandHomeDir = require('expand-home-dir')

var SearchProvider = require('./search-provider')

var searchPaths = [
  '/usr/share/applications',
  expandHomeDir('~/.local/share/applications')
]

var testQuery = function (query, value) {
  var position = fuzzAldrin.score(value, query)
  return position;
}

var parseDesktopFile = function (contents, query, id, callback, _self) {
  var entry = contents['Desktop Entry']

  var simpEntry = {
    name: entry['Name'],
    genericName: entry['Generic Name'],
    keywords: entry['Keywords'],
    categories: entry['Categories'],
    icon: entry['Icon'],
    exec: entry['Exec']
  }

  var testValues = [
    entry['Name'],
    entry['Generic Name'],
    entry['Keywords'],
    entry['Categories']
  ]

  var maxScore = testQuery(query, query);

  for (var i = 0; i < testValues.length; i++) {
    var val = testValues[i]
    if (val) {
      var queryPosition = testQuery(query, val)
      // Possibly a reasonable calculation. Needs testing.
      if (queryPosition > maxScore / 5) {
        // Primitive position calculations.
        simpEntry.position = queryPosition * i
        callback([simpEntry], id, _self)
        break
      }
    }
  }
}

var parseDesktopFiles = function (desktopFiles, query, id, callback, _self) {
  desktopFiles.forEach(function (file) {
    if (path.extname(file) === '.desktop') {
      iniParser.parseFile(file, function (err, data) {
        if (err) return

        parseDesktopFile(data, query, id, callback, _self)
      })
    }
  })
}

var DesktopFileProvider = function () {
  SearchProvider.call(this)
  this.providerName = 'Linux-App-Descriptors'
  this.defaultKeyword = 'app'

  this.performSearch = function (query, id, callback) {
    if (os.type() === 'Linux') {
      var _self = this

      var desktopFiles = []
      var finishedReadCount = 0

      searchPaths.forEach(function (searchPath) {
        fs.readdir(searchPath, function (err, files) {
          if (err) return

          files.forEach(function (file) {
            desktopFiles.push(path.join(searchPath, file))
          })

          finishedReadCount += 1
          if (finishedReadCount === searchPaths.length) {
            parseDesktopFiles(desktopFiles, query, id, callback, _self)
          }
        })
      })
    } else {
      callback({error: 'Running on a non-Linux platform.'}, this)
    }
  }
}

DesktopFileProvider.prototype = SearchProvider

DesktopFileProvider.create = function () {
  return new DesktopFileProvider()
}

module.exports = new DesktopFileProvider()
