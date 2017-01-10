
HEAD=wordfindatron
SRC=src
JS=$(HEAD).js
CSS=$(HEAD).css
SCSS=$(HEAD).scss
HTML=index.html
DATA=data/words7.txt data/blacklist.txt
DEBUG=--debug
#UGLIFY=-g uglifyify
BROWSERIFY=node_modules/browserify/bin/cmd.js
UNITTEST=node_modules/nodeunit/bin/nodeunit

build: $(JS) $(CSS)

$(JS): $(SRC)/*.js
	$(BROWSERIFY) $(DEBUG) $(UGLIFY) $(SRC)/main.js -o $(JS)

$(CSS): wordfindatron.scss
	sass $(SCSS) $(CSS)

dist: build
	mkdir -p dist
	cp $(HTML) $(JS) $(CSS) $(DATA) dist

test:
	$(UNITTEST) tests

clean:
	rm -f dist/*
	rm -f $(JS) $(CSS) $(CSS).map

