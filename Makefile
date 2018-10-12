#!/bin/bash

install:
	for file in ../*/ ; \
	do \
		echo "$$file"; \
		cd $$file; \
		npm install; \
		cd ../core; \
	done

pull: 
	for file in ../*/ ; \
	do \
		echo "$$file"; \
		cd $$file; \
		git pull origin dev; \
		cd ../core; \
	done

checkout_dev:
	for file in ../*/ ; \
	do \
		echo "$$file"; \
		cd $$file; \
		git checkout dev; \
		cd ../core; \
	done

status:
	for file in ../*/ ; \
	do \
		echo "$$file"; \
		cd $$file; \
		git status; \
		cd ../core; \
	done

fetch:
	for file in ../*/ ; \
	do \
		echo "$$file"; \
		cd $$file; \
		git fetch --prune; \
		cd ../core; \
	done

eslint:
	for file in ../*/ ; \
	do \
		echo "$$file"; \
		cd $$file; \
		( PKG=eslint-config-airbnb-base; npm info "$$PKG@latest" peerDependencies --json | command sed 's/[\{\},]//g ; s/: /@/g' | xargs npm install --save-dev "$$PKG@latest"); \
		cd ../core; \
	done

babel:
	for file in ../*/ ; \
	do \
		echo "$$file"; \
		cd $$file; \
		npm install --save-dev babel-preset-airbnb; \
		cd ../core; \
	done


