#!/usr/bin/env node

'use strict'

const path = require('path')
const fs = require('fs')
const exec = require('child_process').exec
const pathToPackageDotJson = path.resolve(process.cwd(), 'package.json')
const packageDotJson = require(pathToPackageDotJson)
const branch = 'master'

// This is how we know if its a github dependency.
// This prefix is optional, which makes this check not so great, 
// but allows a cheap form of blacklisting by removing it for repos to ignore
const indicator = 'github:'

// Find all github dependencies in package.json
const githubDeps = Object.keys(packageDotJson.dependencies).reduce((githubDeps, module) => {
  const version = packageDotJson.dependencies[module]
  if (version.indexOf(indicator) === 0) {
    const idxOfHash = version.indexOf('#')
    const endIdx = idxOfHash > indicator.length ? idxOfHash : version.length
    githubDeps[module] = version.substring(indicator.length, endIdx)
  }
  return githubDeps
}, {})

const runCommand = command => new Promise((resolve, reject) => exec(command, (error, stdout, stderr) => {
  if (error || stderr) reject(error || stderr)
  else resolve(stdout)
})).catch(err => console.error(err))

const requestsForCommitSha = {}

// Fetch the latest commit sha using git ls-remote
for (let repo in githubDeps) {
  let origin = `git@github.com:${ githubDeps[repo] }.git`
  console.log(`Fetching latest commit ID for ${ repo }`)
  const shellCommand = `git ls-remote ${ origin } ${ branch } | cut -f1 | tr -d '\n'`
  requestsForCommitSha[repo] = runCommand(shellCommand)
}

const repoNames = Object.keys(requestsForCommitSha)

const createUpdatedDependencies = commitIds => commitIds.reduce((updatedDependenciesMap, commitId, idx) => {
  const repoName = repoNames[idx]
  if (commitId) {
    const repoWithCommitId = `github:${ githubDeps[repoName] }#${ commitId }`
    updatedDependenciesMap[repoName] = repoWithCommitId
  } else {
    console.log(`Failed to fetch latest commit ID for ${ repoName }`)
  }
  return updatedDependenciesMap
}, {})

const writeUpdatedPackageDotJson = updatedDependenciesMap => {
  Object.assign(packageDotJson.dependencies, updatedDependenciesMap)
  fs.writeFile(pathToPackageDotJson, JSON.stringify(packageDotJson, null, 2), err => {
      if (err) return console.error(err)
      console.log('Successfully updated package.json')
  })
}

Promise.all(repoNames.map(name => requestsForCommitSha[name])).
  then(createUpdatedDependencies).
  then(writeUpdatedPackageDotJson)

