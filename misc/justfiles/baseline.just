[doc('Update bundle baseline')]
[no-cd]
bundle:
    @just build
    @echo "📦 Writing bundle baseline..."
    bun scripts/bundle-report.mjs baseline --stats target/bundle/stats.json --baseline misc/bundle-baseline.json
    @echo "✅ Bundle baseline updated"

[doc('Update snapshots')]
[no-cd]
snapshots:
    @just build
    @echo "📸 Updating Playwright snapshots for current OS..."
    bunx playwright test --update-snapshots
    @echo "✅ Snapshots updated"

[doc('Update snapshots for CI')]
[no-cd]
ci:
    @just build
    @echo "📸 Updating Playwright snapshots via Docker (chrome-desktop only)..."
    docker run --rm --network host \
        -v .:/work_dir \
        -v playwright_node_modules:/work_dir/node_modules \
        -w /work_dir \
        -e PLAYWRIGHT_SERVER_COMMAND="npx serve target/build -l 4173" \
        -e PLAYWRIGHT_SERVER_URL="http://localhost:4173" \
        -e PLAYWRIGHT_BASE_URL="http://localhost:4173" \
        mcr.microsoft.com/playwright:v1.59.1 \
        bash -c "npm install && npx playwright test --config=playwright.ci.config.ts --update-snapshots --project=chrome-desktop"
    @echo "✅ Snapshots updated"
