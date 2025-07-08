.PHONY: restart restart-backend recreate

restart:
	docker compose up -d --build --remove-orphans

restart-backend:
	docker compose up -d --build backend
