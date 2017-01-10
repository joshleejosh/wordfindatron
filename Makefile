BASENAME=wordfindatron
SRC=src
JS=$(BASENAME).js
CSS=$(BASENAME).css
SCSS=$(BASENAME).scss
HTML=index.html
DATA=data

DEBUG=--debug
UGLIFY=

BROWSERIFY=node_modules/browserify/bin/cmd.js
UNITTEST=node_modules/nodeunit/bin/nodeunit
JSHINT=node_modules/jshint/bin/jshint
RSYNC=rsync -azv

build: $(JS) $(CSS)

$(JS): $(SRC)/*.js
	$(BROWSERIFY) $(DEBUG) $(UGLIFY) $(SRC)/main.js -o $(JS)

$(CSS): wordfindatron.scss
	sass $(SCSS) $(CSS)

dist: DEBUG=
dist: UGLIFY=-g uglifyify
dist: clean build
	mkdir -p dist
	cp -r $(DATA) dist
	cp $(HTML) $(JS) $(CSS) dist

# Must define DEPLOYPATH at command line, don't leave real paths floating around in the makefile
deploy: dist
	(test -z '$(DEPLOYPATH)' && echo 'Set DEPLOYPATH when calling deploy!') || (test '$(DEPLOYPATH)' && $(RSYNC) dist/ $(DEPLOYPATH)/$(BASENAME)/)
	

hint:
	$(JSHINT) src

test:
	$(UNITTEST) tests

clean:
	rm -rf dist/*
	rm -f $(JS) $(CSS) $(CSS).map

