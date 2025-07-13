.PHONY: restart restart-backend test

restart:
	docker compose up -d --build --remove-orphans

restart-backend:
	docker compose up -d --build backend monstache-1 monstache-2

recreate:
	docker compose down --volumes && docker compose up -d --build --remove-orphans

test:
	make restart && cd playwright && npm run test && cd ..
