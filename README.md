# Cookie Analyzer
A mod for [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/) that adds a menu where you have access to a variety of tools to help your cookie baking experience.

>Feel free to contribute to the project by creating a pull request or opening an issue if you find a bug or have a suggestion.

- [Features](#features)
- [Usage](#usage)
    - [Bookmarklet](#bookmarklet)
    - [Address Bar](#address-bar)
    - [Console or DevTools](#console-or-devtools)

## Features
- **Most Efficient Purchase** - Tells you what the most efficient building to purchase is. (Measured in CPSPCS - Cookies Per Second Per Cookie Spent)
- **Auto Buy** - Automatically buys the most efficient building for you. (if you have enough cookies)
- **Auto Clicker** - Automatically clicks the cookie for you.
- **Auto Click Golden Cookies** - Automatically clicks golden cookies for you.

## Usage
### Bookmarklet
To use the mod, copy the following code and paste it into a bookmark's URL field.
```js
javascript:(function(){document.body.appendChild(document.createElement('script')).src='https://jlannoo.github.io/CookieAnalyzer/CookieAnalyzer.js';})();
```
Then, when you are on the Cookie Clicker page, click the bookmark to load the mod.

### Address Bar
Alternatively, you can paste the same code into the address bar of your browser while on the Cookie Clicker page.
> Note: Make sure the `javascript:` part is still there. Some browsers will remove it when you paste it in.

### Console or DevTools
You can also paste the code or the contents of [CookieAnalyzer.js](./CookieAnalyzer.js) into the console or DevTools (or snippets if you want to save it for later) while on the Cookie Clicker page.

It exposes a global variable `CA` which you can use to access the mod's functions.
