.PHONY: run
run:
	hugo server --buildDrafts --disableFastRender --printPathWarnings --printI18nWarnings --printUnusedTemplates --noHTTPCache --logLevel info 
