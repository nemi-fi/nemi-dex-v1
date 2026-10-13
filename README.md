# Nemi Monorepo

## Requirements

- Node.js: recommended to use [nvm for bash/zsh](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) or [nvm for fish](https://github.com/jorgebucaran/nvm.fish?tab=readme-ov-file#installation)
- pnpm & turbo: `npm install -g pnpm turbo`

## Bootstrap the monorepo

You only need to bootstrap the monorepo once after cloning it. Run this in the root:

```sh
pnpm install  # installs the correct version of turbo
turbo bootstrap
```

You can run `turbo bootstrap` after you pull new git commits but it's not necessary as all scripts (e.g., `turbo dev`) will run it automatically.

## Project structure

- `apps/` - Applications
- `packages/` - Packages

## Common scripts

Scripts that should be run from the root of the monorepo:

- `pnpm aztec:local-network` - Start Aztec local network
- `CHAIN=testnet pnpm aztec:deploy` - Deploy Aztec contracts

All other scripts should be run from a project folder (e.g., `cd apps/client && turbo dev`). These scripts follow the same pattern in all projects:

- `turbo dev` - Start in development mode
- `turbo build` - Build for production
- `turbo test` - Run `turbo test:static` && `turbo test:runtime`
- `turbo test:runtime` - Run unit, e2e and other runtime tests
- `turbo test:static` - Type-check and lint code
- `turbo compile` - If available, compile contracts & other artifacts

## Workflow

You should have a local network running with `pnpm aztec:local-network`.

Development inside `packages/*` folder is usually accompanied by running `turbo test:runtime` to run runtime tests.

Development inside `apps/*` folder is usually accompanied by running `turbo dev` and opening the appropriate app in the browser. You need to deploy contracts on the local network before running the app using `CHAIN=localNetwork pnpm aztec:deploy` (run from root).

To test the whole project, run `turbo test` in the root.

## Note on Aztec

We use [`gaztec`](https://github.com/nemi-fi/gaztec) to manage Aztec versions.

## PR guidelines

1. Title prefixed with `feat`, `fix`, `refactor` or `chore`. Optionally, add scope in parenthesis. See full list of prefixes and scopes in the [workflow](.github/workflows/pull-request-title.yml). E.g., `feat: add new feature`, `chore(ci): update node version`.
2. Branch name prefixed with 2 letter initials and then dashed name of the feature. E.g., `om/update-docs`
3. When merged, commits are squashed into one commit with the title of the PR.

If Vercel fails on PR, it is likely due to Noir artifacts not being uploaded to the remote cache yet. Waiting and re-deploying on Vercel usually fixes it.
