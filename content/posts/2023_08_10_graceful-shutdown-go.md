---
title: Graceful Shutdown Go Apps
slug: graceful-shutdown-go
description: Let's see how we can gracefully shut down a Go application.
summary: In the context of long-living applications, such as web servers, it's a good practice to close, and release resources acquired upon application shut down. In this post I'm going to demonstrate how it can be done in the context of a simple typical web server application using Go 1.21, which was just released a few days ago.
date: 2023-08-10T08:42:12Z
images:
  - /images/posts/graceful-shutdown-go/banner.png
draft: false
tags:
  - go
keywords:
  - golang
  - go
---

Most of the time, the applications we write acquire some kind of resources, from a file descriptor, database connection, connection to a message broker, event subscription handler, etc., either at startup, or during their operation. It's better to release them once we no longer need them. However, some types of resources are long-lived, meaning they must be kept around as long as the application itself is working, and must be released just before the application process is terminated. In this post, I'm going to implement a resource cleanup pattern i usually use in Go applications updated to use a new function introduced few days ago in Go 1.21.

Let's start with the following code snippet of an HTTP web server:

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"os"
	"syscall"
	"time"

	"github.com/julienschmidt/httprouter"
	_ "github.com/lib/pq"
)

func main() {
	ctx := context.Background()
	db, err := connectDB(ctx)
	if nil != err {
		panic(fmt.Errorf("failed to initialize database connection: %v", err))
	}
	fmt.Println(db)// do something with db
	router := httprouter.New()
	httpServer := http.Server{Addr: "127.0.0.1:9090", Handler: router}
	httpServer.ListenAndServe() // TODO: handle the error you lazy ignorant!
}

func connectDB(ctx context.Context) (*sql.DB, error) {
	conn, err := sql.Open("postgres", os.Getenv("DB_DSN"))
	if nil != err {
		return nil, fmt.Errorf("db: failed to open database connection: %v", err)
	}
	if err := conn.PingContext(ctx); nil != err {
		return nil, fmt.Errorf("db: failed to ping database connection: %v", err)
	}
	return conn, nil
}
```

To shutdown the process, we have 2 options:

- Kill it! Which as programmers we don't believe in violence [^no-violence]
- Send `INT` (interrupt) signal to it, which is the same as pressing `^C` (CTRL+C) in the terminal

[^no-violence]: If you don't think so, remember this:

	```c
	int n = *((int *) (void *)x)
	```

The problem with the existing code is that the `INT` signal just immediately terminates the process. However, we need to get prepared for death! Let's update the code:

```go
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	db, err := connectDB(ctx) // TODO: handle the error you lazy ignorant!
	// rest is the same...
}
```

As noted in [`signal.NotifyContext`](https://pkg.go.dev/os/signal#NotifyContext) documentation, it basically marks the returned context as done, when any of the signals received by the application. With this change, the process can _listen_ to the `INT`, and `TERM` signals, which are the most commonly used signals on operating systems to indicate a shutdown request [^context-listener]. Also, deferring the `stop` function is recommended as it cleans up some internal stuff before the `main` function is returned.

[^context-listener]: It's not actually _listening_, it's more like altering the default behavior of the process when such signals are received as Go's default behavior is to terminate the main goroutine when `INT` signal is received.

OK, but how can we kind of _listen_ to the closure event of this context and do the cleanup once it's fired? Go 1.21 added the [`context.AfterFunc`](https://pkg.go.dev/context#AfterFunc) helper function, which alongside other fancy features it offers, it basically executes a function in a separate goroutine once a context is done. Let's update the code and use it:

```go
func main() {
	// ... database connection and http server initialization as before
	_ = context.AfterFunc(ctx, func() {
		httpServer.Shutdown(ctx) // TODO: handle the error you lazy ignorant!
		db.Close() // TODO: handle the error you lazy ignorant!
	})
	// starting http server as before...
}
```

OK, now we will shutdown the HTTP server, and close the database connection once `ctx` (the root context) is done. We are also not interested in the returned value of the `context.AfterFunc` call, which can be used to basically detach the callback from the _listeners_ of `ctx` done event.

However, there's still a catch! `context.AfterFunc` does not wait for the callback function to be completely finished, and as it will be executed in its own goroutine, there might be cases that when `ctx` is done, even the first instruction of the our callback function is not executed because the main goroutine already exists. That's our responsibility to handle this as we'd want to do our best to cleanup and release resources as we can, and we **can** do better:


```go
func main() {
	// ... database connection and http server initialization as before
	done := make(chan bool)
	_ = context.AfterFunc(ctx, func() {
		defer func() { done <- true }()
		httpServer.Shutdown(ctx) // TODO: handle the error you lazy ignorant!
		db.Close() // TODO: handle the error you lazy ignorant!
	})
	// ... start http server listener as before
	<-done
}
```

Now, we are forcing the main goroutine to wait for the cleanup callback function to end. You might need to change **when** you'd mark the callback function as finished per your needs, e.g., when a resource closure might panic due to multiple closure of the same resource handler, and `done` channel never gets called, but this is enough for this simple scenario I wrote. Also, this version handles the case when the cleanup callback function is executed before the HTTP server is started properly due to the current `http` package server design, which `(*http.Server).ListenAndServe()` returns immediately if the server is already shutdown.

I suppose this is currently the closest we can get to the internals of the resources I used to make sure they're (marked as) closed, and released before leaving the world with the current APIs of the HTTP, and SQL database packages. This is also an API design good practice as package designers to expose the cleanup procedures of the underlying resource we hold internally to clients with just enough abstraction.

Also, as a small improvement, I can suggest the following wrapper function:

```go
func AfterFunc(ctx context.Context, fn func()) <-chan bool {
	done := make(chan bool)
	_ = context.AfterFunc(ctx, func() {
		defer func() { done <- true }()
		fn()
	})
	return done
}
```

Which can be used to update the previous version of the code as below:

```go
func main() {
	// ... database connection and http server initialization as before
	done := AfterFunc(ctx, func() {
		httpServer.Shutdown(ctx) // TODO: handle the error you lazy ignorant!
		db.Close() // TODO: handle the error you lazy ignorant!
	})
	// ... start http server listener as before
	<-done
}
```

Seems simpler and more reasonable to read.

## Conclusion

I tried to demonstrate the concept of graceful shutdown/closure of a web application in Go. Of course, the details depends on the requirements, but I always try keep these rules in mind, specially when writing Go code:

- Always make sure goroutines you create/launch are done

    Goroutines are just functions, but with the current Go runtime design, the main goroutine does not wait for its _children_ to finish up their execution as it's done in other languages, so always wait for them to end. How you do this is on you, but make sure every goroutine you launched, will be closed at some point in the application lifetime. You created it, you own it, you're responsible for it. Either you're launching goroutines in your application, or you're writing an API which spins off goroutine(s) under the hood, which is not a good practice anyways, specially in Go, which hides this fact from the clients due to its type system design. But, even when you do this, inform clients of this explicitly using comments, and guide the clients on how to handle the closure properly.

- Always release resources you acquire

    That's why we have the `defer` keyword in Go, and some other languages, right? At least one of the main reasons.

As a note, this of course is possible in Go before 1.21, but as I was just reading the release notes of Go 1.21, I wanted to implement this using the new function.
