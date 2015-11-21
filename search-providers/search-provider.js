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

// A basic search provider class. All other search providers should call and inherit from this one.

var SearchProvider = function () {
  // The name of this provider. Used internally for mapping.
  this.name = 'Base-Search-Provider'
  // The default keyword used to call this provider. Will be partially matched.
  this.defaultKeyword = 'search'
  // The keyword set for this provider. (Not always the default.)
  this.keyword = null
  // A reference to the handler that owns this provider.
  this.handler = null

  // Setter for this.handler.
  this.setHandler = function (handler) {
    this.handler = handler
  }
  // Getter for this.handler.
  this.getHandler = function () {
    return this.handler
  }

  // Setter for this.keyword.
  this.setKeyword = function (keyword) {
    this.keyword = keyword
  }

  // Getter for this.keyword.
  this.getKeyword = function () {
    return this.keyword
  }

  // All subclasses should implement this method.
  /**
   * Asynchronously performs a search based on the given query.
   * @param String query The search query as input by the user.
   * @param Object id    An object unique to the search term. Type does not matter.
   * Evaluation is left to the implementation.
   * @param Function(Array, id, SearchProvider) callback. This may be called multiple
   * times per search by the same provider. Parameters are an array of result objects,
   * the id input into the original search, and a reference to this provider.
   */
  this.performSearch = function (query, id, callback) {
    // callback(Object result, Query Id, SearchProvider provider)
    callback ? callback([], id, this) : null
  }
}

module.exports = SearchProvider
