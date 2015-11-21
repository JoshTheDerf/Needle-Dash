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

// A module for finding absolute paths to freedesktop icons give an icon name, perhaps sourced from a .desktop file.
// Based on the spec here: http://standards.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html

var path = require('path')
var childProcess = require('child_process')
var fileExists = require('is-there')
var iniParser = require('ini-parser')
var expandHomeDir = require('expand-home-dir')

var env = {
  'XDG_DATA_DIRS': process.env['XDG_DATA_DIRS'].split(':')
}

var themeLocations = [
  expandHomeDir('~/.icons/'),
  expandHomeDir('~/.local/share/icons/'),
]
addFromEnv('XDG_DATA_DIRS', 'icons/', themeLocations)

var fallbackIconDirs = [
  '/usr/share/pixmaps/',
  '/usr/share/app-install/icons/'
]

function findIcon (iconName, size, themeName) {
  if (iconName[0] === '/' || iconName.indexOf('./') === 0) return iconName

  if (!themeName) themeName = determineTheme()
  var parsedTheme = readThemeFile(themeName)
  var fileName

  if (parsedTheme) {
    fileName = findIconInTheme(iconName, size, parsedTheme)
    if (fileName) return fileName
  }

  fileName = findIconInTheme(iconName, size, readThemeFile('hicolor'))
  if (fileName) return fileName

  return lookupFallbackIcon(iconName)
}

function findIconInTheme (iconName, size, parsedTheme) {
  var fileName = lookupIcon(iconName, size, parsedTheme)
  if (fileName) return fileName

  if (parsedTheme['Icon Theme']['Inherits']) {
    var parents = parsedTheme['Icon Theme']['Inherits'].split(',')

    for (var i = 0; i < parents.length; i++) {
      fileName = findIconInTheme(iconName, size, readThemeFile(parents[i].trim()))
      if (fileName) return fileName
    }
  }
  return null
}

function lookupIcon (iconName, size, parsedTheme) {
  var validExtensions = ['png', 'svg', 'xpm']
  var subDirectories = parsedTheme['Icon Theme']['Directories'].split(',').reverse()

  var subdirIndex, subdirDescriptor, extensionIndex, filename
  for (subdirIndex in subDirectories) {
    subdirDescriptor = parsedTheme[subDirectories[subdirIndex]]
    if (directoryMatchesSize(subdirDescriptor, size)) {
      for (extensionIndex in validExtensions) {
        filename = path.join(
          path.dirname(parsedTheme.__path),
          subDirectories[subdirIndex],
          iconName + '.' + validExtensions[extensionIndex]
        )
        if (fileExists(filename)) return filename
      }
    }
  }

  // Look for closest sized image
  var minimal_size = 8912
  var closest_filename = null

  // Getting around the linter
  subdirIndex = null
  subdirDescriptor = null
  extensionIndex = null
  filename = null
  for (subdirIndex in subDirectories) {
    subdirDescriptor = parsedTheme[subDirectories[subdirIndex]]
    for (extensionIndex in validExtensions) {
      filename = path.join(
        path.dirname(parsedTheme.__path),
        subDirectories[subdirIndex],
        iconName + '.' + validExtensions[extensionIndex]
      )

      if (fileExists(filename) && directorySizeDistance(subdirDescriptor, size) < minimal_size) {
        closest_filename = filename
        minimal_size = directorySizeDistance(subdirDescriptor, size)
      }
    }
  }

  if (closest_filename !== null) {
    return closest_filename
  }
  return null
}

function lookupFallbackIcon (iconName) {
  var validExtensions = ['png', 'svg', 'xpm']

  for (var dirIndex in fallbackIconDirs) {
    for (var extensionIndex in validExtensions) {
      var filename = path.join(
        fallbackIconDirs[dirIndex],
        iconName + '.' + validExtensions[extensionIndex]
      )
      if (fileExists(filename)) return filename
    }
  }
}

function directoryMatchesSize (desc, iconSize) {
  iconSize = +iconSize
  // Read Type and size data from subdir descriptor.
  var Type = desc.Type
  if (Type === 'Fixed') {
    return +desc.Size === iconSize
  // These bits aren't working correctly yet... >_>
  } else if (Type === 'Scalable') {
    var cachedBool = true
    if (cachedBool && desc.MinSize) cachedBool = +desc.MinSize <= iconSize
    if (cachedBool && desc.MaxSize) cachedBool = iconSize <= +desc.MaxSize
    return cachedBool
  } else if (Type === 'Threshold') {
    var Threshold = +desc.Threshold || 2
    return +desc.Size - Threshold <= iconSize <= +desc.Size + Threshold
  }
}

function directorySizeDistance (desc, testSize) {
  testSize = +testSize
  // Read Type and size data from subdir descriptor.
  var Type = desc.Type
  if (Type === 'Fixed') {
    return Math.abs(+desc.Size - testSize)
  } else if (Type === 'Scaled') {
    if (desc.MinSize && testSize < desc.MinSize) {
      return +desc.MinSize - testSize
    } else if (desc.MaxSize && testSize > desc.MaxSize) {
      return testSize - (+desc.MaxSize)
    }
    return 0
  // I really don't think this works yet. Really hard to test.
  } else if (Type === 'Threshold') {
    var Threshold = +desc.Threshold || 2
    if (testSize < +desc.Size - Threshold) {
      return Threshold - testSize
    }
    if (testSize > +desc.Size + Threshold) {
      return testSize - Threshold
    }
    return 0
  }
}

function readThemeFile (themeName) {
  for (var i = 0; i < themeLocations.length; i++) {
    var fullPath = path.join(themeLocations[i], themeName, 'index.theme')
    if (fileExists(fullPath)) {
      var parsedFile = iniParser.parseFileSync(fullPath)
      parsedFile.__path = fullPath
      return parsedFile
    }
  }
}

function determineTheme () {
  // Only works on Gnome-based environments.
  var theme = childProcess.spawnSync('gsettings', ['get', 'org.gnome.desktop.interface', 'icon-theme']).stdout
  theme = theme ? theme.toString() : null
  theme = theme ? theme.slice(1, theme.length - 2) : null
  return theme
}

function addFromEnv (envVar, suffix, array) {
  env[envVar].forEach(function (item) {
    array.push(path.join(item, suffix))
  })
}

var freedesktopIconFinder = {
  findIcon: function (iconName, size, themeName) {
    var icon = findIcon(iconName, size, themeName) || findIcon('application-default-icon', size, themeName) || null
    return icon
  },
  findIconInTheme: findIconInTheme
}

module.exports = freedesktopIconFinder
