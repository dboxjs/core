#!/bin/bash

pull: 

	for file in ../*/ ; \
	do \
		echo "$$file"; \
		cd $$file; \
		git pull origin dev; \
		cd ../core; \
	done
