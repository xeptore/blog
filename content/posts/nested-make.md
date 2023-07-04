---
title: Nested Make
date: 2023-07-04T14:58:08Z
draft: false
slug: nested-make
images:
  - /images/posts/nested-make/banner.png
summary: Another solution for invoking commands inside another working directory context.
tags:
  - make
---

## Problem

Assume that we have the following directory structure in a project:

```txt
/
├── db/
│   └── gen/
│       ├── customer_table.go
│       └── product_table.go
└── Makefile
```

Where you might have some targets defined in the `Makefile`, and you also need to run a specific command that generates some code (in this case the contents of `/db/gen/` directory). Also, one limitation you have with the generator command is that is must be executed in the `/db/` directory. How to solve this?

## Solution

There are some common solutions for this:

1. Write a script inside `/db/` directory, e.g., `/db/generate.sh`, that executes the command. And, when you'd want to run it, you have to manually `cd` into `/db/`, run this script, and `cd` back to where you were in the first place (usually project's root directory). Something similar to:

    ```sh
    cd ./db
    bash ./generate.sh
    cd ..
    ```

2. Add a target to the Makefile that before executing the generator command, it `cd`s into `/db/` directory.
3. Add a target that executes the generator command in `/db/Makefile`, and a similar target in the root `Makefile` that simply forwards the target command execution to the `Makefile` inside `/db/` directory.

The last solution, I think, makes intentions clearer, compared to the 1st solution, which at some point might cause confusions about who is going to execute that shell script, the application itself, or developers? What if a developer executes the script directly from project's root directory? How is the platform support for that shell script format? When compared to the 2nd option, it doesn't require any _explicit_ `cd` instructions, which might become a problem when it comes to cross-platform development support. Of course there are some drawbacks to this solution, but let's have a demonstration of it.

Content of `/Makefile`:

```md
.PHONY: gen
gen:
	$(MAKE) -C ./db gen
```

And, `/db/Makefile`:

```md
.PHONY: gen
gen:
	somescript that --generates files
```

This way, all you need to do, is to run `make gen` in the root directory, and it will run the `gen` target defined in the nested `Makefile`.
