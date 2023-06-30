---
title: CNAME Flattening
description: What is CNAME flattening and how is it used?
summary: CNAME flattening is a feature provided by some DNS services to either speed up the DNS resolution process, or mitigate some limitations of the DNS standards.
slug: cname-flattening
date: 2023-06-30T08:49:40Z
draft: false
tags:
  - dns
---

## Context

While I was configuring my blog's custom domains (`www.xeptore.blog`, and `xeptore.blog`) to point to its respective Cloudflare Pages project, I realized an info badge next to the `xeptore.blog` zone apex record:

![custom domain records](/images/posts/cname-flattening/custom-domain-records.png)

And its message was:

> CNAME records normally can not be on the zone apex. We use CNAME flattening to make it possible

But, what is CNAME flattening? Why does the badge only appear for `xeptore.blog`, not for `www.xeptore.blog`?

## Some DNS Background

There are terminologies associated with the DNS protocol. To keep it short, CNAME is a _record type_ in DNS, that its job is to tell clients that a domain name is a **pointer** another domain name, and it stands for Canonical Name. For example according to the image above, `www.xeptore.blog` is pointing to `blog-ecs.pages.dev`, which itself is a domain generated, and (I guess) owned by Cloudflare. There are some use cases for CNAME records, for example, assume that you have multiple domains pointing an IP address, and at some point, you decide to change that IP address. One solution is to update all these domains' IP addresses one by one. Another option, is to have one domain with that IP address in the first place, and have others pointing to this domain using CNAME records. With this setup, all you need to do is to only update one IP address. CNAME records can be chained too although it's not recommended, as it degrades DNS resolution performance, and might cause timeout limits, or create an infinite loop (by mistake).

## What Is CNAME Flattening?

Let's answer it with an example. Assume `foo.example.com` is a CNAME to `bar.example.com`, which itself points to `93.184.216.34`. Here is the high-level default process of obtaining the IP address of `foo.example.com`:

1. Client asks for the address of `foo.example.com`
2. DNS server responds with `bar.example.com` and tells the client it's a CNAME record
3. Client asks (not necessarily from the same DNS server) address of the `bar.example.com`
4. DNS server responds with `93.184.216.34`

Now let's restructure the previous flow:

1. Client asks for the address of `foo.example.com`
2. As DNS server knows the record is a CNAME record pointing to `bar.example.com`, instead of responding to the client, it tries to resolve the IP address of `bar.example.com` by itself whether by asking another DNS server, or by looking somewhere else in its database.
3. DNS server responds to the client with the actual IP address (`A` record) of `93.184.216.34`

As you can see, the DNS server, which holds the CNAME record of `foo.example.com`, instead of delegating the resolution process of `boo.example.com` to the client, it does all the next steps, no matter how long it takes, or hard it is, by itself, and returns the final **actual answer** to the client. This is called CNAME flattening. This reduces the time, and effort needed by a client to obtain the IP of a domain with CNAME chains.

## Why Only For The Second Domain?

There are two restrictions to CNAME records in DNS standards, which theoretically prohibits having a CNAME record on domain _zone apex_. What is the zone apex? It's simply the domain name itself without any subdomains, for example `example.com` is domain zone apex. However, in some situations, we need to have CNAME records for zone apex, e.g., in case of this blog as I need to be able to serve it from zone apex (`xeptore.blog`) too. To circumvent this limitation, some DNS services provide a feature similar to Cloudflare's CNAME flattening.

## References

- <https://en.wikipedia.org/wiki/CNAME_record>
- <https://developers.cloudflare.com/dns/cname-flattening/>
- <https://developers.cloudflare.com/dns/cname-flattening/cname-flattening-diagram/>
