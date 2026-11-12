# MCP servers for website work

Source: the mcpservers.org catalog via its source list, github.com/wong2/awesome-mcp-servers (snapshot 2026-07-13). The site itself blocked automated reads, so entries the site has but the list lacks are not covered. Recommendations are ours. Installing a server is a new dependency with access to code, data or accounts: get the user's approval, prefer official vendor servers, and read a community server's code before running it.

## Shortlist by job
| Job | Server | Type | Link |
|---|---|---|---|
| Drive a real browser: E2E, visual checks, a11y tree, screenshots | Playwright | official (Microsoft) | github.com/microsoft/playwright-mcp |
| Cloud browser automation | Browserbase | official | github.com/browserbase/mcp-server-browserbase |
| Repos, PRs, issues, CI logs | GitHub | official | github.com/github/github-mcp-server |
| Postgres + auth + storage | Supabase | official | github.com/supabase-community/supabase-mcp |
| Serverless Postgres, branches for migrations | Neon | official | github.com/neondatabase/mcp-server-neon |
| Prisma Postgres | Prisma | official | github.com/prisma/mcp |
| Payments | Stripe (agent toolkit) | official | github.com/stripe/agent-toolkit |
| Errors, traces, releases | Sentry | official | github.com/getsentry/sentry-mcp |
| Edge deploy: Workers/KV/R2/D1 | Cloudflare | official | github.com/cloudflare/mcp-server-cloudflare |
| Static security analysis | Semgrep | official | github.com/semgrep/mcp |
| Feature flags, A/B experiments | GrowthBook | official | github.com/growthbook/growthbook-mcp |
| CMS | Webflow (official), Contentful (community) | mixed | github.com/webflow/mcp-server · github.com/ivo-toby/contentful-mcp |
| SEO data | Google Search Console | community | github.com/ahonn/mcp-server-gsc |
| UI component generation | 21st.dev Magic | official | github.com/21st-dev/magic-mcp |
| shadcn/ui registry | shadcn-ui-mcp-server · Shadcn Registry Manager | community | github.com/heilgar/shadcn-ui-mcp-server · github.com/reuvenaor/shadcn-registry-manager |
| Research and scraping of references | Firecrawl, Exa, Tavily, Apify | official | github.com/mendableai/firecrawl-mcp-server · github.com/exa-labs/exa-mcp-server · github.com/tavily-ai/tavily-mcp · github.com/apify/actors-mcp-server |
| Containers | Docker | community | github.com/QuantGeekDev/docker-mcp |
| Basics | Fetch, Git, Filesystem, Memory, Sequential Thinking, Time | reference (test-grade) | github.com/modelcontextprotocol/servers |

Notes
- Generated components (21st.dev Magic, shadcn registries) pull toward the generic look: restyle them through the project's tokens (see `aesthetics.md`).
- Scraping servers: respect robots.txt and site terms; never use them to bypass bot protection.
- Paid APIs (Firecrawl, Exa, Tavily, Browserbase, Apify) need keys: keep them in the client's secret store, never in repo files.
- Figma, Vercel, Supabase and Sentry are also available as claude.ai connectors. If one is connected, use it instead of installing a local server.

## How to register a server
Claude Code (all projects):
```bash
claude mcp add --scope user playwright -- npx @playwright/mcp@latest
```
Project-shared instead: `--scope project`, which writes `.mcp.json` at the repo root.

Antigravity: global file `~/.gemini/config/mcp_config.json`. Older builds use `~/.gemini/antigravity/mcp_config.json`; the IDE shows the active path under Agent panel → ⋯ → MCP Servers → Manage → View raw config. Workspace file: `.agents/mcp_config.json`.
```json
{
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["@playwright/mcp@latest"] }
  }
}
```
Remote (HTTP) servers in Antigravity use `"serverUrl"` instead of `command`.
