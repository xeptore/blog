.PHONY: run
run:
	hugo server --buildDrafts --disableFastRender --printPathWarnings --printI18nWarnings --printUnusedTemplates --noHTTPCache --logLevel info

.PHONY: build
build:
	hugo --minify --printPathWarnings --printI18nWarnings --printUnusedTemplates

.PHONY: post
post:
ifndef name
	@echo you must provide the 'name' paramtere in kebab-case format
else
	TZ=UTC hugo new posts/$(shell date +%Y_%m_%d)_$(name).md
endif
