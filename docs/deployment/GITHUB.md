# Upload Helios to GitHub (one push, not file-by-file)

GitHub’s browser upload rejects large file *counts*. This repo is ~330 files / ~280 KB as a zip — small, but too many files to drag.

## 1. Create an empty repo on GitHub

https://github.com/new  
Name: `helios`  
Do **not** add a README, .gitignore, or license on GitHub (this zip already has them).

## 2. On your computer

```bash
unzip Helios.zip -d helios
cd helios

git init
git add .
git commit -m "Initial Helios PAPER handoff (live gate closed)"

git branch -M main
git remote add origin https://github.com/YOUR_USER/helios.git
git push -u origin main
```

Or with GitHub CLI:

```bash
unzip Helios.zip -d helios
cd helios
git init
git add .
git commit -m "Initial Helios PAPER handoff (live gate closed)"
gh repo create helios --private --source=. --remote=origin --push
```

## Do not commit

`.env.control-plane`, `.env.trading-runtime`, `.env.vps`, wallet keys.

## After push

Hostinger: clone the repo on the VPS, copy env examples, `docker compose -f infrastructure/docker/docker-compose.prod.yml up` with `TRADING_MODE=PAPER`.
