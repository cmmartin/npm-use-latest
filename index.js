#!/usr/bin/env node

'use strict'

const path = require('path')
const fs = require('fs')
const exec = require('child_process').exec
const pathToPackageDotJson = path.resolve(process.cwd(), 'package.json')
const packageDotJson = require(pathToPackageDotJson)
const branch = 'master'

// this is how we know if its a github dependency
// this prefix is optional, which makes this check not so great, 
// but allows a cheap form of blacklisting by removing it for repos to ignore
const indicator = 'github:'

// Find all github dependencies in package.json
const githubDeps = Object.keys(packageDotJson.dependencies).reduce((githubDeps, module) => {
	const version = packageDotJson.dependencies[module]
	if (version.indexOf(indicator) === 0) {
		githubDeps[module] = version.substring(indicator.length, version.indexOf('#') || version.length)
	}
	return githubDeps
}, {})

const runCommand = command => new Promise((resolve, reject) => exec(command, (error, stdout, stderr) => {
	if (error || stderr) reject(error || stderr)
	else resolve(stdout)
})).catch(err => console.error(err))

const requestsForCommitSha = {}

// Fetch the latest commit id using git ls-remote
for (let repo in githubDeps) {
	console.log(`fetching latest commit sha for ${ repo }`)
	let origin = `git@github.com:${ githubDeps[repo] }.git`
	requestsForCommitSha[repo] = runCommand(`git ls-remote ${ origin } ${ branch } | cut -f1 | tr -d '\n'`)
}

const repos = Object.keys(requestsForCommitSha)

const createUpdatedDependencies = commitIds => commitIds.reduce((updatedDependenciesMap, commitId, idx) => {
	const repoWithCommitId = `github:${ githubDeps[repos[idx]] }#${ commitId }`
	updatedDependenciesMap[repos[idx]] = repoWithCommitId
	return updatedDependenciesMap
}, {})

const writeUpdatedPackageDotJson = updatedDependenciesMap => {
	Object.assign(packageDotJson.dependencies, updatedDependenciesMap)
	fs.writeFile(pathToPackageDotJson, JSON.stringify(packageDotJson, null, 2), err => {
	    if (err) return console.error(err)
	    console.log('Successfully updated package.json')
	})
}

Promise.all(repos.map(name => requestsForCommitSha[name])).
	then(createUpdatedDependencies).
	then(writeUpdatedPackageDotJson)

