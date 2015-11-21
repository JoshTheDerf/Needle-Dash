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

// A module for handling multi-provider searches with keyword support.

var SearchHandler = function () {
  this.providers = {}
  this.defaultProvider = null

  this.keywords = {}
  this.keywordDelimiter = ':'

  this.performSearch = function (providerNames, query, id, callback) {
    var finalResult = {}
    if (!providerNames) {
      this.providers[this.defaultProvider].performSearch(query, id, function (result, id, provider) {
        finalResult[provider.providerName] = result
        callback(finalResult, id, provider)
      })
    } else {
      var _self = this
      providerNames.forEach(function (providerName) {
        _self.providers[providerName].performSearch(query, id, function (result, id, provider) {
          // The callback will run multiple times for multiple (or multi-part) providers.
          finalResult[provider.providerName] = result
          callback(finalResult, id, provider)
        })
      })
    }
  }

  this.registerProvider = function (provider, isDefault) {
    this.providers[provider.providerName] = provider
    if (isDefault) {
      this.defaultProvider = provider.providerName
    }
    this.registerKeyword(provider.defaultKeyword, provider.providerName)

    provider.setHandler(this)
  }

  this.registerKeyword = function (keyword, providerName) {
    keyword = keyword.toLowerCase()
    this.keywords[keyword] = providerName
    this.providers[providerName].setKeyword(keyword)
  }

  this.parseQuery = function (query) {
    var usingProviders = []

    // Build query keyword array
    var queryKeywords = (function () {
      var currentKeywords = query.split(':')[0].split(',')
      return currentKeywords.map(function (item) {
        return item.trim().toLowerCase()
      })
    }())

    var _self = this
    var knownKeywords = Object.keys(this.keywords)
    queryKeywords.forEach(function (queryKeyword) {
      knownKeywords.some(function (knownKeyword) {
        if (knownKeyword.indexOf(queryKeyword) === 0) {
          usingProviders.push(_self.keywords[knownKeyword])
          return true
        }
      })
    })

    if (usingProviders.length > 0) {
      return {
        providers: usingProviders,
        query: query.split(this.keywordDelimiter).slice(1).join(this.keywordDelimiter).trim()
      }
    }

    return {
      providers: null,
      query: query
    }
  }

  this.getProviders = function () {
    return this.providers
  }

  this.getKeywords = function () {
    return this.keywords
  }

  this.setDefaultProvider = function (defaultProviderName) {
    this.defaultProvider = defaultProviderName
  }

  this.getDefaultProvider = function () {
    return this.defaultProvider
  }

  this.setKeywordDelimiter = function (keywordDelimiter) {
    this.keywordDelimiter = keywordDelimiter
  }

  this.getKeywordDelimiter = function () {
    return this.keywordDelimiter
  }
}

SearchHandler.create = function () {
  return new SearchHandler()
}

module.exports = new SearchHandler()
