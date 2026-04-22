# ==============================================================================
# Variables
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
deps:
    @echo "📦 Installing dependencies..."
    bun install
    @echo "✅ Dependencies installed!"

[doc('Update dependencies')]
[group('Development')]
bump:
    @echo "⬆️  Updating dependencies..."
    bun update -i
    @echo "✅ Dependencies updated!"

[doc('Format code')]
[group('Development')]
fmt:
    @echo "✨ Formatting code..."
    just --fmt --unstable
    bun run format
    @echo "✅ Code formatted!"

[doc('Type check')]
[group('Development')]
check:
    @echo "🔍 Type checking..."
    bun run check
    @echo "✅ Passed!"

[doc('Run all blazing-fast linters')]
[group('Development')]
lint:
    @echo "🔍 Running Biome (JS/TS)..."
    bunx biome check .
    @echo "🔍 Running OXlint (JS/TS)..."
    bunx oxlint .
    @echo "🔍 Running Stylelint (CSS)..."
    bunx stylelint "src/**/*.css" "src/**/*.svelte"
    @echo "🧹 Running Knip..."
    bunx knip
    @echo "🔍 Running Markdownlint..."
    bunx markdownlint-cli2 "src/content/**/*.md"
    @echo "✅ Linting complete!"

[doc('Build for production')]
[group('Development')]
build:
    @echo "🔨 Building {{ site_name }}..."
    bun run build
    @echo "✅ Built: {{ build_dir }}/"

[doc('Preview production build')]
[group('Development')]
preview: build
    @echo "👁  Previewing {{ site_name }}..."
    bun run preview

[doc('Start dev server')]
[group('Development')]
dev:
    @echo "🚀 Starting dev server..."
    bun run dev --open

[doc('Remove build artifacts')]
[group('Development')]
clean:
    @echo "🧹 Cleaning..."
    rm -rf {{ build_dir }} .svelte-kit
    @echo "✅ Cleaned!"

[doc('Run CI pipeline')]
[group('Development')]
ci: fmt check lint build
    @echo "🚀 All systems go! Ready to push."

# ==============================================================================
# Testing
# ==============================================================================

[group: 'Testing']
mod test 'misc/justfiles/testing.just'

# Quick test aliases

alias ta := test::all
alias tu := test::unit
alias ti := test::integration
alias tc := test::coverage
