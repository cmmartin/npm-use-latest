# npm-use-latest

1. Searches your `package.json` for github dependencies, indicated by the `github:` prefix
2. Fetches their latest commit ID using `git ls-remote`
3. Appends the new commit ID to the dependency, forcing npm to install the latest version

#### Before

```javascript
{
  ...
  "dependencies": {
  	"react": "github:facebook/react",
  	"lodash": "github:lodash/lodash"
  }
}
```

#### After

```javascript
{
  ...
  "dependencies": {
    "react": "github:facebook/react#4045747af6bb83a73ef6057abd07017ee056a5f7",
    "lodash": "github:lodash/lodash#2c5f026d3c59a38c429246513437681569b523b8"
  }
}
```
