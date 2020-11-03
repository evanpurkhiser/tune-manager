##
##usage :
##-------

build: ## build
	docker build --tag=evanpurkhiser/tune-manager:latest .

docker-run: build ## docker-run
	docker run -it -p 8080:80 -v library:/library -v staging:/staging -v storage:/storage evanpurkhiser/tune-manager

install: ## install
	yarn install
	poetry install

dev: ## dev
	yarn build
	poetry run tunemanager --library-path=./library --staging-path=./staging --storage-path=./storage 

# DEFAULT
.DEFAULT_GOAL := help
help:
	@grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

##
