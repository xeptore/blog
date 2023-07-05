---
title: Pin Go Installed Package Version
slug: pin-go-installed-package-version
description: One of the problems that may arise when working with executables installed by Go is difference in versions. In this post, I'm going to share a solution that I use to resolve this issue.
summary: One of the problems that may arise when working with executables installed by Go is difference in versions. In this post, I'm going to share a solution that I use to resolve this issue.
date: 2023-07-05T08:30:14Z
publishDate: 2023-07-07T08:30:14Z
images:
  - /images/posts/pin-go-installed-package-version/banner.png
draft: true
tags:
  - go
  - versioning
keywords:
  - go
  - go-install
  - pin-version
  - shared-version
  - versioning
  - go-package-versioning
---

You may already have encountered the version issues when working with executable binaries installed by Go (using `go install` command), specially if you're working in a team, where other team members are using a different version of the same package that you've installed on your machine, and as a result, they get different outputs/results than what you get. In this post, I'm going to share a solution that I'm using. You can skip to the [Solution](#solution) section if you're already familiar with this issue.

## Problem

As you may know, Go command line provides the `install` command, which as its documentation states:

> Install compiles and installs the packages named by the import paths.

There are also many packages available by the Go community that needs to be installed to be used. Here are some of these packages that I usually use:

- [`swag`](https://github.com/swaggo/swag/): Generates Swagger/OAS documentation from code comments
- [`mock`](https://github.com/golang/mock): Generates mock code that can be used for testing
- [`jet`](https://github.com/go-jet/jet): Generates type-safe models from existing SQL database schemas alongside provided utilities for writing SQL queries in Go
- [`easyjson`](https://github.com/mailru/easyjson): Generates code for `struct`s that does JSON serialization, and deserialization

For this post, let's take `mock` package as an example, and let's assume that you also have a `Make` target similar to the following to make command execution easier:

```makefile
.PHONY: gen
gen:
	mockgen -source=foo.go
```

This has a couple of issues in general:

- It **assumes** the user has `mock` already installed on their machine, and it's available in executables `$PATH`, which is, in general, a bold assumption for a developer who joined recently for example. On someone who does not _want_ to have `$GOBIN` directory in their `$PATH`. What if there might be other executables in their `$GOBIN` that might mess up with the ones installed system-wide?
- How would a developer know what is that `mock` executable, and where to install it from? Specially for some packages where their executable name differs from the package name, like `mock`. It seems we need some sort of documentation here, right?
- What if there is another executable named `mock` installed on your machine that gets executed instead of the one you installed using `go install`? How would you resolve this?
- What if the version resolved to the `latest` tag at the time of installation on my machine is `v1.1.0` for example, but version `v1.2.0` gets installed on CI environment tomorrow that causes some sort of misbehavior internally without any explicit errors on production?

## Solution

The solution that I'm using recently is simply updating the command to the following:

```makefile
.PHONY: gen
gen:
	go run github.com/golang/mock/mockgen@v1.6.0 -source=foo.go
```

At it does the same thing without installing the executable in the `$GOBIN` directory. Look at how explicit this version is, and we'd always wanted explicitness, don't we?

How this works is retrieving the specified version once, build it. Any subsequent execution of the same command will result in a cache-hit, and doesn't require any downloads unless you change the version tag.
