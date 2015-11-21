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

// Provider for search results from Yahoo. Uses cheerio to parse the HTML returned from the normal web page.

var needle = require('needle')
var cheerio = require('cheerio')
var SearchProvider = require('./search-provider')

var url = 'https://search.yahoo.com/search'

var payload = {}

var requestOptions = {
  open_timeout: 20000,
  read_timeout: 30000
}

var parsePage = function (pageBody) {
  var finalResults = []
  var $ = cheerio.load(pageBody)
  var rawSearchResults = $('ol.searchCenterMiddle > li')

  rawSearchResults.each(function () {
    var result = {
      title: $(this).find('div.Sr .compTitle a').text().trim(),
      preview: $(this).find('div.Sr .compText p').text().trim(),
      url: $(this).find('div.Sr .compTitle a').attr('href')
    }
    if (result.title && result.url) {
      finalResults.push(result)
    }
  })

  return finalResults
}

var YahooProvider = function () {
  SearchProvider.call(this)
  this.providerName = 'Yahoo-Search'
  this.defaultKeyword = 'search'

  this.performSearch = function (query, id, callback) {
    payload.p = query
    var _self = this
    needle.request('get', url, payload, requestOptions, function (err, res) {
      if (!err && res.statusCode === 200) {
        callback(parsePage(res.body), id, _self)
      } else {
        callback({error: err}, id, _self)
      }
    })
  }
}

YahooProvider.prototype = SearchProvider

YahooProvider.create = function () {
  return new YahooProvider()
}

module.exports = new YahooProvider()
