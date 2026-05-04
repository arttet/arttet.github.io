set dotenv-load
set dotenv-path := ".envrc"

# ==============================================================================
# Project Settings
# ==============================================================================

build_dir := "target"
site_name := "arttet.github.io"

export BUILD_DIR := justfile_directory() / build_dir

# ==============================================================================
# Help
# ==============================================================================

[doc('Show help')]
default: help

[doc('List all commands')]
help:
    @just --list --unsorted --list-submodules
# ==============================================================================
# Authoring
# ==============================================================================

[doc('Scaffold post')]
[group('Authoring')]
new title:
    #!/usr/bin/env bash
    set -euo pipefail
    title='{{ title }}'
    [[ -n "$title" ]] || { echo "Usage: just new <title>" >&2; exit 1; }
    slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sd '[^a-z0-9 ]' '' | sd ' +' '-')
    date=$(date +%Y-%m-%d)
    target="content/blog/${date%%-*}/${date}-${slug}.md"
    mkdir -p "$(dirname "$target")"
    set -C
    sd '__TITLE__' "$title" < misc/templates/post.md.template | sd '__DATE__' "$date" > "$target"
    echo "✅ Created: $target"

[doc('Spell check')]
[group('Authoring')]
spell:
    @echo "🔤 Running CSpell..."
    bunx --bun cspell '**/*.{md,svelte,ts}'
    @echo "🔍 Running Markdownlint..."
    bunx --bun markdownlint-cli2 --fix "content/**/*.md"
    @echo "✅ Spell check complete!"

# ==============================================================================
# Development
# ==============================================================================

[doc('Install dependencies')]
[group('Development')]
install:
    @echo "📦 Installing dependencies..."
    bun install --frozen-lockfile
    @echo "✅ Dependencies installed!"

[doc('Update dependencies')]
[group('Development')]
update:
    @echo "⬆️  Updating dependencies..."
    bun update -i
    @echo "✅ Dependencies updated!"

[doc('Audit dependencies')]
[group('Development')]
audit:
    @echo "🔍 Auditing dependencies..."
    bun audit
    @echo "✅ Audit complete!"

[doc('Format code')]
[group('Development')]
fmt:
    @echo "✨ Formatting code..."
    just --fmt
    @echo "🔍 Running Oxfmt..."
    bunx oxfmt --write .
    @echo "✅ Code formatted!"

[doc('Type check')]
[group('Development')]
check:
    @echo "✨ Checking just..."
    just --fmt --check
    @echo "🧹 Checking Oxfmt..."
    bunx oxfmt --check .
    @echo "🔍 Type checking..."
    bunx --bun svelte-kit sync
    bunx --bun svelte-check --tsconfig ./tsconfig.json --incremental
    @echo "🔍 Checking lefthook..."
    bunx --bun lefthook validate
    @echo "✅ Passed!"

[doc('Run linters')]
[group('Development')]
lint:
    @echo "🔍 Running Oxlint..."
    bunx --bun oxlint --fix --deny-warnings .
    @echo "🔍 Running Stylelint..."
    bunx --bun stylelint --fix "src/**/*.css" "src/**/*.svelte"
    @echo "🧹 Running Knip..."
    bunx knip --no-config-hints
    @echo "🔍 Running ESLint..."
    bunx --bun eslint "**/*.{js,ts,svelte}" --fix --max-warnings=0
    @echo "✅ Linting complete!"

[doc('Build production build')]
[group('Development')]
build:
    @echo "🔨 Building {{ site_name }}..."
    bun run --bun build
    @echo "✅ Built: {{ build_dir }}/"

[doc('Start production server')]
[group('Development')]
preview: build
    @echo "👁  Previewing {{ site_name }}..."
    bun run --bun preview

[doc('Start development server')]
[group('Development')]
dev:
    @echo "🚀 Starting dev server..."
    bun run --bun dev --open

[doc('Remove build artifacts')]
[group('Development')]
clean:
    @echo "🧹 Cleaning..."
    rm -rf {{ build_dir }} .lighthouseci .svelte-kit node_modules
    @echo "✅ Cleaned!"

[doc('Run CI pipeline')]
[group('Development')]
ci: audit fmt check spell lint build
    @echo "🚀 All systems go! Ready to push."

# ==============================================================================
# Testing
# ==============================================================================

[group: 'Testing']
mod test 'misc/justfiles/testing.just'

alias tt := test::unit
alias ta := test::all
alias tu := test::unit
alias ti := test::integration
alias tc := test::coverage

# ==============================================================================
# Documentation
# ==============================================================================

[group: 'Documentation']
mod docs 'misc/justfiles/docs.just'

# ==============================================================================
# Baselines
# ==============================================================================

[group: 'Baselines']
mod baseline 'misc/justfiles/baseline.just'

alias bb := baseline::bundle
alias bs := baseline::snapshots

# ==============================================================================
# Pull Requests
# ==============================================================================

[group: 'Pull Requests']
mod pr 'misc/justfiles/pr.just'

alias prc := pr::create
alias prr := pr::review
alias prv := pr::view

# ==============================================================================
# Deployment
# ==============================================================================

[group: 'Deployment']
mod deploy 'misc/justfiles/deployment.just'

alias dl := deploy::list
alias dc := deploy::create
alias dd := deploy::delete
