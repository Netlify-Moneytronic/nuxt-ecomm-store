# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install all dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Quality Testing

Run quality testing before pushing:

First setup the pre-push hook as follows:

```
cd .git/hooks
touch pre-push
chmod +x pre-push
```

Then add this script to your .git folder:

```
#!/usr/bin/env bash

set -e

echo "Running pre-push hook..."

# Get the name of the repository
REPO_NAME=$(basename -s .git "$(git config --get remote.origin.url)")
echo "Repository: $REPO_NAME"

# Store the current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Run lint checks
echo "\n📝 Running lint checks..."
cd "$(git rev-parse --show-toplevel)" && pnpm run lint

# Catch lint errors
if [ $? -ne 0 ]; then
  echo "❌ Lint check failed. Please fix the errors before pushing."
  exit 1
fi

echo "✅ Lint checks passed!"

# Run component tests
echo "\n🧪 Running component tests..."
cd "$(git rev-parse --show-toplevel)" && pnpm run test:component

# Catch test errors
if [ $? -ne 0 ]; then
  echo "❌ Component tests failed. Please fix the failing tests before pushing."
  exit 1
fi

echo "✅ Component tests passed!"

echo "\n🚀 All checks have passed.. Pushing to remote..."

exit 0

```
