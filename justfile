# tanstack-app-starter — a full-stack TanStack Start starter.

set shell := ["pwsh", "-NoLogo", "-Command"]

setup:
    npm install

dev:
    npm run dev

build:
    npm run build

test:
    npm test

lint:
    npm run lint

format:
    npm run format

check: build test lint
    npm run format:check

db:migrate:
    npm run db:migrate
