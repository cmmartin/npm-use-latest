# npm-use-latest

#### How it works
1. Searches your `package.json` for github dependencies, indicated by the `github:` prefix
2. Fetches their latest commit ID using `git ls-remote`
3. Appends the new commit ID to the dependency, forcing npm to install the latest version

###### Before

```javascript
{
  ...
  "dependencies": {
  	"react": "github:facebook/react",
  	"lodash": "github:lodash/lodash"
  }
}
```
###### During
```
$ npm-use-latest
Fetching latest commit ID for react
Fetching latest commit ID for lodash
Successfully updated package.json
```

###### After

```javascript
{
  ...
  "dependencies": {
    "react": "github:facebook/react#4045747af6bb83a73ef6057abd07017ee056a5f7",
    "lodash": "github:lodash/lodash#2c5f026d3c59a38c429246513437681569b523b8"
  }
}
```

#### Install
```bash
npm i -g cmmartin/npm-use-latest
```

I'll publish this to npm eventually and save you those extra 9 characters

#### Usage

Navigate to your project root and run it!

```bash
cd path/to/my/project/root
npm-use-latest
```

#### Requirements

- A recent enough version of npm that supports github dependencies
- A recent enough version of node.js that supports ecma 6 syntax (const, arrow functions, etc)
- git
