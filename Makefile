.PHONY: run
run:
	hugo server --buildDrafts --disableFastRender --printPathWarnings --printI18nWarnings --printUnusedTemplates --noHTTPCache --logLevel info

.PHONY: build
build:
	hugo --minify --printPathWarnings --printI18nWarnings --printUnusedTemplates
