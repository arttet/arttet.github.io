vitest_max_workers := env('VITEST_MAX_WORKERS', '100%')
vitest_test_timeout := env('VITEST_TEST_TIMEOUT', '10000')
vitest_hook_timeout := env('VITEST_HOOK_TIMEOUT', '10000')
bundle_budget_threshold := env('BUNDLE_BUDGET_THRESHOLD', '0.3')

[doc("Run all test suites")]
[no-cd]
all: unit integration
    @echo "✅ Fast local tests passed"

[doc("Run fast unit tests with ENV-driven workers/timeouts")]
[no-cd]
unit:
    @echo "🧪 Running fast Vitest tests..."
    bunx vitest run --maxWorkers "{{ vitest_max_workers }}" --testTimeout "{{ vitest_test_timeout }}" --hookTimeout "{{ vitest_hook_timeout }}"
    @echo "✅ Unit tests passed!"

[doc("Integration tests")]
[no-cd]
integration:
    @echo "🧪 Running Playwright tests..."
    bun run test:playwright
    @echo "✅ Playwright tests passed!"

[doc('Generate coverage')]
[no-cd]
coverage:
    @echo "📊 Running unit tests with coverage..."
    bun run test:unit:coverage
    @echo "✅ Coverage report generated"

[doc("Run Lighthouse CI")]
[no-cd]
lhci:
    @echo "🔦 Running Lighthouse CI..."
    bunx lhci autorun
    @echo "✅ Lighthouse CI passed!"

[doc("Run bundle budget")]
[no-cd]
bundle:
    @echo "📦 Checking bundle budget..."
    bun scripts/bundle-report.mjs check --stats target/bundle/stats.json --baseline misc/bundle-baseline.json --threshold "{{ bundle_budget_threshold }}" --summary target/bundle/summary.md --json target/bundle/summary.json
    @echo "✅ Bundle budget passed!"
