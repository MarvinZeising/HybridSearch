.PHONY: restart

restart:
  docker compose up -d --build --remove-orphans

recreate:
  docker compose down -v && docker compose up -d --build --remove-orphans
