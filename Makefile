IMAGE ?= ghcr.io/tikhomirovv/tg-moderator-ai
TAG   ?= local

.PHONY: docker-build

docker-build:
	docker build -t $(IMAGE):$(TAG) .
