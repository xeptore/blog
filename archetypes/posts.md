---
title: {{ replace .Name "-" " " | title }}
slug: {{ .Name }}
description: description
summary: summary
date: {{ now.UTC.Format "2006-01-02T15:04:05Z07:00" }}
images:
  - /images/posts/{{ .Name }}/banner.png
draft: false
tags:
  - tag1
keywords:
  - kw1
---
