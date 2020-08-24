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

pull_master: 
	for file in ../*/ ; \
	do \
		echo "$$file"; \
		cd $$file; \
		git pull origin master; \
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
		git fetch --all --prune; \
		cd ../core; \
	done
