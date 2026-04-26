# ==============================================================================
# Global Settings
# ==============================================================================
# Disable POSIX path conversion in Git Bash (Windows)

export MSYS_NO_PATHCONV := "1"

# ==============================================================================
# Project Settings
# ==============================================================================

build_dir := "target"
site_name := "arttet.github.io"

# ==============================================================================
# Help
# ==============================================================================

[doc('Show help')]
default: help

[doc('List all commands')]
help:
    @just --list --unsorted --list-submodules

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
    @echo "🔍 Running Oxfmt..."
    bunx oxfmt --write .
    @echo "✅ Code formatted!"

[doc('Type check')]
[group('Development')]
check:
    @echo "🔍 Type checking..."
    bunx svelte-kit sync
    bunx svelte-check --tsconfig ./tsconfig.json --incremental
    @echo "🧹 Checking Oxfmt..."
    bunx oxfmt --check .
    @echo "✅ Passed!"

[doc('Run linters')]
[group('Development')]
lint:
    @echo "🔍 Running Oxlint..."
    bunx oxlint --deny-warnings .
    @echo "🔍 Running Stylelint..."
    bunx stylelint "src/**/*.css" "src/**/*.svelte"
    @echo "🧹 Running Knip..."
    bunx knip --no-config-hints
    @echo "🔍 Running Markdownlint..."
    bunx markdownlint-cli2 "src/content/**/*.md"
    @echo "✅ Linting complete!"

[doc('Build production build')]
[group('Development')]
build:
    @echo "🔨 Building {{ site_name }}..."
    bun run build
    @echo "✅ Built: {{ build_dir }}/"

[doc('Start production server')]
[group('Development')]
preview: build
    @echo "👁  Previewing {{ site_name }}..."
    bun run preview

[doc('Start development server')]
[group('Development')]
dev:
    @echo "🚀 Starting dev server..."
    bun run dev --open

[doc('Remove build artifacts')]
[group('Development')]
clean:
    @echo "🧹 Cleaning..."
    rm -rf {{ build_dir }} .lighthouseci .svelte-kit node_modules
    @echo "✅ Cleaned!"

[doc('Run CI pipeline')]
[group('Development')]
ci: audit fmt check lint build
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
# Baselines
# ==============================================================================

[group: 'Baselines']
mod baseline 'misc/justfiles/baseline.just'

alias bs := baseline::snapshots
alias bb := baseline::bundle

# ==============================================================================
# Deployment
# ==============================================================================

[group: 'Deployment']
mod deploy 'misc/justfiles/deployment.just'

alias dl := deploy::list
alias dc := deploy::create
alias dd := deploy::delete
