BASENAME=wordfindatron
SRC=src
WORDS=wordlists.txt
JS=$(BASENAME).js
CSS=$(BASENAME).css
SCSS=$(BASENAME).scss
HTML=index.html
DATA=data

JSFILES=src/*.js src/**/*.js

DEBUG=--debug
UGLIFY=

BROWSERIFY=node_modules/browserify/bin/cmd.js
UNITTEST=tests/runTests.js
ESLINT=node_modules/eslint/bin/eslint.js
ISTANBUL=node_modules/istanbul/lib/cli.js
RSYNC=rsync -azv

build: $(WORDS) $(JS) $(CSS)

$(JS): $(JSFILES)
	$(BROWSERIFY) $(DEBUG) $(UGLIFY) $(SRC)/main.js -o $(JS)

$(CSS): wordfindatron.scss
	sass $(SCSS) $(CSS)

$(WORDS): data/*.txt
	@echo '### WORDLIST ###' > $(WORDS)
	cat data/words7.txt >> $(WORDS)
	@echo '### BLACKLIST ###' >> $(WORDS)
	cat data/blacklist.txt >> $(WORDS)
	@echo '### BLACKLIST ###' >> $(WORDS)
	cat data/graylist.txt >> $(WORDS)

dist: DEBUG=
dist: UGLIFY=-g uglifyify
dist: clean build
	mkdir -p dist
	cp $(HTML) $(JS) $(CSS) $(WORDS) dist

# Must define DEPLOYPATH at command line, don't leave real paths floating around in the makefile
deploy: dist
	(test -z '$(DEPLOYPATH)' && echo 'Set DEPLOYPATH when calling deploy!') || (test '$(DEPLOYPATH)' && $(RSYNC) dist/ $(DEPLOYPATH)/$(BASENAME)/)
	
lint:
	$(ESLINT) src

test: $(JSFILES) $(WORDS)
	node $(UNITTEST)

coverage: $(JSFILES) $(WORDS)
	$(ISTANBUL) cover $(UNITTEST)

clean:
	rm -rf dist/*
	rm -f $(WORDS) $(JS) $(CSS) $(CSS).map

