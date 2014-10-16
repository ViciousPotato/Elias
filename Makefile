test:
	./node_modules/.bin/mocha --reporter spec --compilers coffee:coffee-script/register --colors
.PHONY: test
