BASENAME=wordfindatron

WORDS=wordlists.txt
JS=$(BASENAME).js
CSS=$(BASENAME).css
HTML=index.html

SRC=src
DATA=data
IMG=img
GENERATEDJS=$(SRC)/_generated.js
JSFILES=$(SRC)/*.js $(SRC)/**/*.js $(GENERATEDJS)
FONTS=node_modules/font-awesome/fonts

DEBUG=--debug
UGLIFY=

BROWSERIFY=node_modules/browserify/bin/cmd.js
UNITTEST=tests/runTests.js
ESLINT=node_modules/eslint/bin/eslint.js
ISTANBUL=node_modules/istanbul/lib/cli.js
RSYNC=rsync -azv

# ################################################################# #

build: $(WORDS) $(JS) $(CSS) $(HTML)

dist: DEBUG=
dist: UGLIFY=-g uglifyify
dist: clean build
	@mkdir -p dist
	cp $(HTML) $(JS) $(CSS) $(WORDS) dist
	cp -r $(IMG) dist
	@mkdir -p dist/$(FONTS)
	cp $(FONTS)/* dist/$(FONTS)/

$(JS): $(JSFILES)
	$(BROWSERIFY) $(DEBUG) $(UGLIFY) $(SRC)/main.js -o $(JS)

$(GENERATEDJS):
	@echo "[$(DEBUG)]"
	@if [ -z "$(DEBUG)" ]; then \
		echo "exports.DEBUG=false;\nexports.VERBOSITY=0;" > $(GENERATEDJS); \
	else \
		echo "exports.DEBUG=true;\nexports.VERBOSITY=1;" > $(GENERATEDJS); \
	fi

$(CSS): css/*.scss
	sass css/$(BASENAME).scss $(CSS)

$(WORDS): data/*.txt
	@echo '### WORDLIST ###' > $(WORDS)
	cat data/wordlist.txt >> $(WORDS)
	@echo '### BLACKLIST ###' >> $(WORDS)
	cat data/blacklist.txt >> $(WORDS)

# Must define DEPLOYPATH at command line, don't leave real paths floating around in the makefile
deploy: dist
	(test -z '$(DEPLOYPATH)' && echo 'Set DEPLOYPATH when calling deploy!') \
		|| (test '$(DEPLOYPATH)' && $(RSYNC) dist/ $(DEPLOYPATH)/$(BASENAME)/)

test: $(JSFILES) $(WORDS)
	node $(UNITTEST)

coverage: $(JSFILES) $(WORDS)
	$(ISTANBUL) cover $(UNITTEST)

lint:
	$(ESLINT) src

clean:
	rm -rf dist/*
	rm -rf coverage_report
	rm -f $(WORDS) $(JS) $(CSS) $(CSS).map $(GENERATEDJS)

