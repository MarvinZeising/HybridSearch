.PHONY: restart

restart:
	docker compose up -d --build --remove-orphans

recreate:
	docker compose down --volumes && docker compose up -d --build --remove-orphans
