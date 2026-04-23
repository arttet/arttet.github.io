[doc("Run all test suites")]
[no-cd]
all: unit integration
    @echo "✅ All tests passed"

[doc("Run unit tests")]
[no-cd]
unit:
    @echo "🧪 Running Vitest tests..."
    bun run test:unit
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

[doc("Run Lighthouse CI assertions against the static build")]
[no-cd]
lhci:
    @echo "🔦 Running Lighthouse CI..."
    bunx lhci autorun
    @echo "✅ Lighthouse CI passed!"
