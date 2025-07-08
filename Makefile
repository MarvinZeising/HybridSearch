.PHONY: restart restart-backend test

restart:
	docker compose up -d --build --remove-orphans

restart-backend:
	docker compose up -d --build backend

test:
	make restart && cd playwright && npm run test && cd ..
