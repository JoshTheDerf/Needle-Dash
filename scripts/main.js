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

// Main program logic for Needle. Needs serious refactoring.

/* global $, Ractive */
var remote = require('remote')
var childProcess = require('child_process')
var handler = require('./search-handler/search-handler')
handler.registerProvider(require('./search-providers/search-provider-yahoo'))
handler.registerProvider(require('./search-providers/search-provider-url'))
handler.registerProvider(require('./search-providers/search-provider-desktop-files'), true)

function focusQueryField (selectText) {
  document.getElementById('queryInput').focus()
}

$(document).ready(function () {
  focusQueryField()
  $('#queryInput').focus(function () {
    this.select()
  })

  $('#queryInput').mouseover(focusQueryField)

  $('#contentWrapper').click(focusQueryField)

  $('#settingsButton').click(function () {
    if (!$('#settingsView').hasClass('hidden')) {
      focusQueryField()
    }
    $('#settingsView').toggleClass('hidden')
  })
})

window.onfocus = function () {
  setTimeout(function () {
    focusQueryField()
  }, 70)
}

window.onblur = function () {
  $('#settingsView').addClass('hidden')
}

$(document).on('keyup', function (e) {
  if (e.keyCode === 27) {
    if ($('#settingsView').hasClass('hidden')) {
      remote.getCurrentWindow().hide()
    } else {
      $('#settingsView').addClass('hidden')
    }
  }
})

var ractiveData = {
  results: {},
  hasResults: false,
}

var resultController
var currentRawQuery

function triggerUpdate (results, query) {
  if (query === currentRawQuery) {
    // Merge the contents of the results into the ractiveData object. This allow multiple async results.
    Object.keys(results).forEach(function (providerName) {
      if (results[providerName].length > 0) {
        ractiveData.hasResults = true
        if (ractiveData.results[providerName]) {
          ractiveData.results[providerName] = ractiveData.results[providerName].concat(results[providerName])
        } else {
          ractiveData.results[providerName] = results[providerName]
        }
      }
    })
    resultController.reset(ractiveData)

    setTimeout(function () {
      if($('.result')[0]) {
        $('.result')[0].focus()
      }
    }, 10)
  }
}

function resetData () {
  ractiveData.results = {}
  ractiveData.hasResults = false
  resultController.reset(ractiveData)
}

var queryFieldIsResetting = false
$(document).ready(function () {
  var parsedQuery

  // Bind keyboard commands to the query Input
  $('#queryInput').on('keyup', function (e) {
    if (e.keyCode === 13) {
      if ($('#providerList')[0].value !== 'Auto' && this.value) {
        resetData()
        currentRawQuery = this.value
        handler.performSearch(
          // Get provider value
          [$('#providerList')[0].value],
          // Get query, remove the prefixing >
          currentRawQuery,
          currentRawQuery,
          // Callback handler
          triggerUpdate
        )
      } else if (this.value) {
        currentRawQuery = this.value
        parsedQuery = handler.parseQuery(currentRawQuery)
        resetData()
        handler.performSearch(parsedQuery.providers, parsedQuery.query, currentRawQuery, triggerUpdate)
      }
    // Handle autodetection of provider
    } else if (this.value.indexOf(':') !== -1 && this.value.length > 1) {

      parsedQuery = handler.parseQuery(this.value)

      if (parsedQuery.providers && parsedQuery.providers.length === 1) {
        this.value = this.value.split(':').slice(1).join(':')
        $('#providerList')[0].value = parsedQuery.providers[0]
      }
    // If the user has pressed backspace twice on a non-auto field, set the field to auto.
    } else if (this.value.length === 0 && e.keyCode === 8 && $('#providerList')[0].value !== 'Auto') {
      if (queryFieldIsResetting) {
        $('#providerList')[0].value = 'Auto'
        queryFieldIsResetting = false
      } else {
        queryFieldIsResetting = true
      }
    } else {
      queryFieldIsResetting = false
    }
  })

  // Create ractive template
  resultController = new Ractive({
    el: '#resultWrapper',
    template: '#resultTemplate',
    data: ractiveData,
    execCommand: function (command, args, hide) {
      console.log('Starting application: ' + command + ' ' + args)
      if (!args) {
        command = command.replace(/%[a-zA-z0-9]?/, '')
        childProcess.exec(command)
      } else {
        if (!Array.isArray(args)) {
          args = [args]
        }
        childProcess.spawn(command, args)
      }

      if (hide) {
        remote.getCurrentWindow().hide()
      }
    },
    openBrowser: function(query) {
      if(query.indexOf('://') === -1) {
        query = 'http://' + query
      }
      this.execCommand('sensible-browser', query, true)
    }
  })
})
