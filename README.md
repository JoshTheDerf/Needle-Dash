Needle
---

A proof-of-concept [electron](https://github.com/atom/electron)-based dash prototype. Currently Linux-only.
Very rudimentary at the moment, a lot of features and documentation are missing.

Features:
 * Open URLs with the keyword "url:"
 * Perform a yahoo web search with results displayed in Needle with the keyword "search:"
 * Search installed programs with the keyword "app:"
 * Partial keywords are supported. Just type the first letter or two and press the colon (:) key.
 * Basic configuration.


 Usage:
  1. Run `electron .` in the Needle directory. Requires [electron](https://github.com/atom/electron) to be installed system-wide before hand.
  2. Type a query in the search field. It will filter the installed applications on your system.
  3. To search with a different provider, select it from the list on the left or type the keyword followed by a colon (:) character. Then enter your query.
  4. Settings can be accessed from the hamburger menu on the right.

Feel free to fork and improve this project. It is very low-priority for me at the moment and is unlikely to see much attention.
