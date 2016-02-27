#!/usr/bin/env node

'use strict'

const path = require('path')
const fs = require('fs')
const exec = require('child_process').exec
const pkg = require('./package.json')
const indicator = 'github:'
const branch = 'master'

// Find all github dependencies in package.json
const githubDeps = Object.keys(pkg.dependencies).reduce((githubDeps, module) => {
	const version = pkg.dependencies[module]
	if (version.indexOf(indicator) === 0) {
		githubDeps[module] = version.substring(indicator.length, version.indexOf('#') || version.length)
	}
	return githubDeps
}, {})

const requests = {}

// Fetch the latest commit id on master for each repo using git ls-remote
for (let repo in githubDeps) {
	let origin = `git@github.com:${ githubDeps[repo] }.git`
	console.log(`fetching commit id for ${ repo } at ${ origin }`)
	requests[repo] = runCommand(`git ls-remote ${ origin } ${ branch } | cut -f1 | tr -d '\n'`)
}

// Update the package.json with latest commit ids
const repos = Object.keys(requests)
const updatedDependencies = {}
Promise.all(repos.map(name => requests[name])).
	then(commitIds => commitIds.reduce((updatedDependencies, commitId, idx) => {
		const repoWithCommitId = `github:${ githubDeps[repos[idx]] }#${ commitId }`
		updatedDependencies[repos[idx]] = repoWithCommitId
		return updatedDependencies
	}, {})).
	then(updatedDependencies => {
		const pathToPackage = path.resolve(process.cwd(), 'package.json')
		const updatedPackage = Object.assign(pkg, { 
			dependencies: Object.assign(pkg.dependencies, updatedDependencies) 
		})
		fs.writeFile(pathToPackage, JSON.stringify(updatedPackage, null, 2), err => {
		    if (err) return console.error(err)
		    console.log('package.json updated successfully')
		})
	})

function runCommand(command) {
	return new Promise((resolve, reject) => exec(command, (error, stdout, stderr) => {
		if (error || stderr) reject(error || stderr)
		else resolve(stdout)
	})).catch(err => console.error(err))
}