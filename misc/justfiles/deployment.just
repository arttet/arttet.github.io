set dotenv-load := true

production_branch := env('CF_PRODUCTION_BRANCH', 'main')

[doc('List Cloudflare Pages projects')]
[group('Deployment')]
[no-cd]
list:
    bunx wrangler pages project list --json

[doc('Create a Cloudflare Pages project')]
[group('Deployment')]
[no-cd]
create name:
    bunx wrangler pages project create "{{ name }}" --production-branch "{{ production_branch }}"

[doc('Delete a Cloudflare Pages project')]
[group('Deployment')]
[no-cd]
delete name:
    bunx wrangler pages project delete "{{ name }}"
