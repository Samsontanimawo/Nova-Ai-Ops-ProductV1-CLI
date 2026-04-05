# Nova CLI — Complete Command Reference

Full reference for every command available in the Nova AI Ops CLI.

---

## Table of Contents

- [Installation](#installation)
- [Authentication](#authentication)
- [Platform Status](#platform-status)
- [Incidents](#incidents)
- [Services](#services)
- [Alerts](#alerts)
- [SLO & Error Budgets](#slo--error-budgets)
- [Agents](#agents)
- [Runbooks](#runbooks)
- [Metrics](#metrics)
- [Logs](#logs)
- [Traces](#traces)
- [On-Call](#on-call)
- [Teams](#teams)
- [Backups](#backups)
- [Page Audit](#page-audit)
- [SSL Certificates](#ssl-certificates)
- [Synthetic Monitoring](#synthetic-monitoring)
- [Postmortems](#postmortems)
- [Integrations](#integrations)
- [Tenants](#tenants)
- [Predictive Detection](#predictive-detection)
- [Configuration](#configuration)
- [Utility Commands](#utility-commands)
- [Global Options](#global-options)
- [Output Formats](#output-formats)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Installation

### npm (recommended)

```bash
npm install -g @novaaiops/cli
```

### From source

```bash
git clone https://github.com/Samsontanimawo/Nova-Ai-Ops-ProductV1-CLI.git
cd Nova-Ai-Ops-ProductV1-CLI
npm install
npm link
```

### Verify installation

```bash
nova --version
# 1.0.0

nova --help
```

---

## Authentication

### `nova login`

Authenticate with the Nova AI Ops platform. Supports interactive login and token-based auth.

```bash
# Interactive login (prompts for URL, username, password)
nova login

# Login with a specific API URL
nova login --url https://app.novaaiops.com/api

# Login with a pre-generated token (from browser DevTools or API)
nova login --token eyJhbGciOiJIUzI1NiIs...

# Login to a self-hosted instance
nova login --url https://nova.yourcompany.com/api
```

**Options:**

| Flag | Description |
|------|-------------|
| `-u, --url <url>` | API base URL (default: `https://app.novaaiops.com/api`) |
| `-t, --token <token>` | Auth token (skips interactive login) |

**How to get a token from the browser:**
1. Log into https://app.novaaiops.com
2. Open DevTools → Application → Cookies
3. Copy the value of `nova_token`
4. Run `nova login --token <value>`

---

### `nova logout`

Clear stored credentials and auth token.

```bash
nova logout
# ✓ Logged out
```

---

### `nova whoami`

Display the currently authenticated user, role, and organization.

```bash
nova whoami
#   User:     samson
#   Email:    samson@novaaiops.com
#   Role:     Founder
#   Org:      nova-ai-ops
#   API:      https://app.novaaiops.com/api
```

---

## Platform Status

### `nova status`

Show a quick platform health overview — services, incidents, and critical alerts.

```bash
nova status
#   ● System Status: HEALTHY
#
#   Services     12 healthy
#   Incidents    0 open  45 total
#   Total        12 services monitored

# JSON output for scripting
nova status --json
```

**Options:**

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |

---

## Incidents

### `nova incidents list`

List incidents with optional filters.

```bash
# List all incidents (default: 20 most recent)
nova incidents list

# Short alias
nova inc ls

# Filter by status
nova incidents list --status open
nova incidents list --status resolved
nova incidents list --status investigating

# Limit results
nova incidents list --limit 50

# JSON output
nova incidents list --json
```

**Output columns:** ID, Title, Severity, Status, Created

**Options:**

| Flag | Description |
|------|-------------|
| `-s, --status <status>` | Filter: `open`, `resolved`, `investigating` |
| `-l, --limit <n>` | Max results (default: 20) |
| `--json` | Output as JSON |

---

### `nova incidents create`

Create a new incident from the command line.

```bash
# Basic incident
nova incidents create --title "API latency spike on checkout service"

# With severity and description
nova incidents create \
  --title "Database connection pool exhausted" \
  --severity critical \
  --description "PostgreSQL max_connections reached, new connections failing" \
  --service payment-api

# Quick P1 incident
nova inc create -t "Production down" -s critical
```

**Options:**

| Flag | Description | Required |
|------|-------------|----------|
| `-t, --title <title>` | Incident title | Yes |
| `-s, --severity <level>` | `critical`, `high`, `medium`, `low` (default: `medium`) | No |
| `-d, --description <text>` | Detailed description | No |
| `--service <name>` | Affected service name | No |

---

### `nova incidents resolve`

Resolve an open incident.

```bash
# Resolve with a note
nova incidents resolve INC-42 --note "Root cause: memory leak in v2.3.1, hotfix deployed"

# Resolve without a note
nova incidents resolve INC-42
```

**Options:**

| Flag | Description |
|------|-------------|
| `-n, --note <text>` | Resolution note |

---

### `nova incidents ack`

Acknowledge an incident (signal that someone is investigating).

```bash
nova incidents ack INC-42

# Alias
nova incidents acknowledge INC-42
```

---

## Services

### `nova services list`

List all monitored services with key metrics.

```bash
# List all services
nova services list

# Short alias
nova svc ls

# Filter by status
nova services list --status critical
nova services list --status degraded

# JSON output
nova services list --json
```

**Output columns:** Name, Status, Type, Region, RPS, P99 (ms), Error %

**Options:**

| Flag | Description |
|------|-------------|
| `-s, --status <status>` | Filter: `healthy`, `degraded`, `critical` |
| `--json` | Output as JSON |

---

### `nova services health`

Quick health check — shows status indicator for each service.

```bash
# Check all services
nova services health
#   ● api-gateway — healthy  SLO: 99.95%  P99: 45ms
#   ● payment-api — healthy  SLO: 99.90%  P99: 120ms
#   ● auth-service — degraded  SLO: 98.50%  P99: 890ms

# Check a specific service (partial name match)
nova services health payment
#   ● payment-api — healthy  SLO: 99.90%  P99: 120ms
```

---

## Alerts

### `nova alerts list`

List alert rules and their current state.

```bash
# List all alerts
nova alerts list

# Only firing alerts
nova alerts list --firing

# JSON output
nova alerts list --json
```

**Output columns:** Name, Severity, State, Service, Created

**Options:**

| Flag | Description |
|------|-------------|
| `--firing` | Show only firing/active alerts |
| `--json` | Output as JSON |

---

## SLO & Error Budgets

### `nova slo check`

Check SLO compliance and error budget status for all services.

```bash
# Check all services
nova slo check
#   ┌─────────────┬───────────┬────────┬──────────┬──────────────────┐
#   │ Service     │ SLO Target│ Actual │ Status   │ Error Budget     │
#   ├─────────────┼───────────┼────────┼──────────┼──────────────────┤
#   │ api-gateway │ 99.9%     │ 99.95% │ Meeting  │ 50.0% remaining  │
#   │ payment-api │ 99.9%     │ 99.85% │ Breaching│ Exhausted        │
#   └─────────────┴───────────┴────────┴──────────┴──────────────────┘

# Check specific service
nova slo check --service api-gateway

# JSON output
nova slo check --json
```

**Options:**

| Flag | Description |
|------|-------------|
| `--service <name>` | Filter by service name (partial match) |
| `--json` | Output as JSON |

---

## Agents

### `nova agent status`

Show all registered Nova agents and their health.

```bash
nova agent status
#   ┌──────────────────┬──────────────────┬─────────┬────────────────┬────────────────┐
#   │ Agent ID         │ Hostname         │ Status  │ Platform       │ Last Heartbeat │
#   ├──────────────────┼──────────────────┼─────────┼────────────────┼────────────────┤
#   │ nova-linux-01    │ prod-web-01      │ online  │ linux arm64    │ 10s ago        │
#   │ nova-linux-02    │ prod-db-01       │ online  │ linux x64      │ 15s ago        │
#   └──────────────────┴──────────────────┴─────────┴────────────────┴────────────────┘

# JSON output
nova agent status --json
```

**Options:**

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |

---

### `nova agent install`

Print step-by-step instructions for installing the Nova agent on a server.

```bash
nova agent install
#   Install Nova Agent
#   ─────────────────
#
#   1. SSH into your server
#
#   curl -sSL https://get.novaaiops.com/agent | bash
#
#   2. Configure the agent:
#   ...
```

---

## Runbooks

### `nova runbooks list`

List all available AI runbooks.

```bash
nova runbooks list

# Short alias
nova rb ls

# JSON output
nova runbooks list --json
```

**Output columns:** ID, Name, Type, Steps, Last Run

---

### `nova runbooks run`

Execute a runbook against a target.

```bash
# Execute a runbook
nova runbooks run RB-restart-nginx --target prod-web-01

# Preview without executing (dry run)
nova runbooks run RB-restart-nginx --target prod-web-01 --dry-run

# Short alias
nova rb run RB-01
```

**Options:**

| Flag | Description |
|------|-------------|
| `--target <target>` | Target service or host |
| `--dry-run` | Preview steps without executing |

---

## Metrics

### `nova metrics query`

Query golden signal metrics.

```bash
# Query with time window
nova metrics query "cpu > 80" --last 1h
nova metrics query "error_rate" --last 24h
nova metrics query "latency_p99" --last 7d

# JSON output
nova metrics query "cpu" --json
```

**Options:**

| Flag | Description |
|------|-------------|
| `--last <duration>` | Time window: `1h`, `6h`, `24h`, `7d` (default: `1h`) |
| `--json` | Output as JSON |

---

### `nova metrics push`

Push a custom metric to Nova.

```bash
# Push a metric
nova metrics push deploy.count 1

# With tags
nova metrics push api.latency 250 --tags env:prod,service:checkout

# Track deployments in CI/CD
nova metrics push deploy.success 1 --tags branch:main,version:2.3.1
```

**Options:**

| Flag | Description |
|------|-------------|
| `--tags <tags>` | Comma-separated key:value tags |

---

## Logs

### `nova logs search`

Search logs by keyword with filters.

```bash
# Search logs
nova logs search "error"
nova logs search "timeout" --service api-gateway --level error
nova logs search "connection refused" --last 24h --limit 50

# JSON output
nova logs search "error" --json
```

**Options:**

| Flag | Description |
|------|-------------|
| `-l, --limit <n>` | Max results (default: 20) |
| `--service <name>` | Filter by service |
| `--level <level>` | Filter: `error`, `warn`, `info`, `debug` |
| `--last <duration>` | Time window: `1h`, `6h`, `24h`, `7d` (default: `1h`) |
| `--json` | Output as JSON |

### `nova logs tail`

Stream logs in real-time (polls every 5 seconds).

```bash
# Tail all logs
nova logs tail

# Filter by service
nova logs tail --service payment-api

# Filter by level
nova logs tail --level error
```

---

## Traces

### `nova traces list`

List distributed traces.

```bash
nova traces list
nova trace ls --service api-gateway
nova traces list --min-duration 500 --limit 10
nova traces list --json
```

**Options:**

| Flag | Description |
|------|-------------|
| `--service <name>` | Filter by service |
| `-l, --limit <n>` | Max results (default: 20) |
| `--min-duration <ms>` | Minimum duration filter |
| `--json` | Output as JSON |

---

## On-Call

### `nova oncall who`

Show who is currently on-call.

```bash
nova oncall who
#   ● John Smith — Platform Team  until 04/07 9:00 AM
#   ● Jane Doe — Backend Team  until 04/06 6:00 PM

nova oncall who --json
```

### `nova oncall list`

List all on-call schedules and rotations.

```bash
nova oncall list
nova oncall ls --json
```

---

## Teams

### `nova teams list`

List all team members with roles.

```bash
nova teams list
nova teams ls --json
```

### `nova teams invite`

Invite a new team member.

```bash
nova teams invite engineer@company.com
nova teams invite admin@company.com --role Admin
nova teams invite viewer@company.com --role Viewer
```

**Options:**

| Flag | Description |
|------|-------------|
| `-r, --role <role>` | Role: `Viewer`, `Engineer`, `Admin` (default: `Engineer`) |

---

## Backups

### `nova backups list`

List all database backups.

```bash
nova backups list
nova backup ls --json
```

### `nova backups create`

Create a new backup.

```bash
nova backups create
nova backups create --type incremental
```

**Options:**

| Flag | Description |
|------|-------------|
| `--type <type>` | `full` or `incremental` (default: `full`) |

### `nova backups restore`

Restore from a backup.

```bash
# Interactive confirmation
nova backups restore BACKUP-ID

# Skip confirmation (for scripts)
nova backups restore BACKUP-ID --confirm
```

---

## Page Audit

### `nova audit run`

Trigger a page health audit across all platform pages.

```bash
nova audit run
#   ● Health Score: 100%
#   Pages: 34/34 passed, 0 failed, 0 warnings
#   Avg Response: 4ms
#   Duration: 2s
```

### `nova audit results`

Show the latest audit results.

```bash
nova audit results
nova audit results --json
```

### `nova audit ssl`

Check SSL certificate status.

```bash
nova audit ssl
#   ● novaaiops.com — 40 days remaining (Let's Encrypt)
```

---

## SSL Certificates

### `nova certs`

Show SSL/TLS certificate status for all monitored domains.

```bash
nova certs
nova certificates --json
```

---

## Synthetic Monitoring

### `nova synthetic list`

List all synthetic monitoring checks.

```bash
nova synthetic list
nova synth ls --json
```

### `nova synthetic run`

Trigger a synthetic check immediately.

```bash
# Run all checks
nova synthetic run

# Run a specific check
nova synthetic run "Homepage Check"
```

---

## Postmortems

### `nova postmortem list`

List post-incident reviews.

```bash
nova postmortem list
nova pm ls --limit 10
nova postmortem list --json
```

### `nova postmortem create`

Create a postmortem for an incident.

```bash
nova postmortem create INC-42
nova postmortem create INC-42 --title "Database outage root cause analysis"
```

---

## Integrations

### `nova integrations`

Check the status of all configured integrations.

```bash
nova integrations
nova int --json
```

---

## Tenants

### `nova tenants list`

List all organizations (admin only).

```bash
nova tenants list
nova orgs ls --json
```

### `nova tenants create`

Create a new organization.

```bash
nova tenants create --name "Acme Corp"
nova tenants create --name "Startup Inc" --plan starter
```

**Options:**

| Flag | Description |
|------|-------------|
| `-n, --name <name>` | Organization name (required) |
| `--plan <plan>` | Plan: `free`, `starter`, `professional`, `enterprise` (default: `free`) |

---

## Predictive Detection

### `nova predict`

Show ML-based predictive incident detection results.

```bash
nova predict
nova predict --json
```

Shows predicted incidents with risk level, confidence score, signal type, and estimated time to impact.

---

## Configuration

### `nova config`

Show current CLI configuration.

```bash
nova config
#   API URL:   https://app.novaaiops.com/api
#   Username:  samson
#   Org ID:    nova-ai-ops
#   Format:    table
```

### Config file locations

| File | Purpose |
|------|---------|
| `~/.nova/config.json` | API URL, username, org, preferences |
| `~/.nova/token` | Auth token (permissions: 600) |

### Manual config

```bash
# Set a custom API URL
nova login --url https://nova.yourcompany.com/api
```

---

## Utility Commands

### `nova open`

Open the Nova AI Ops web dashboard in your default browser.

```bash
nova open
```

### `nova --version`

Print CLI version.

```bash
nova --version
# 1.0.0
```

### `nova --help`

Show help for any command.

```bash
nova --help
nova incidents --help
nova services list --help
```

---

## Global Options

These options work with any command:

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON (available on list commands) |
| `-h, --help` | Show help |
| `-V, --version` | Show version |

---

## Output Formats

### Table (default)

Human-readable ASCII tables with color-coded status indicators.

```
┌──────────┬───────────────────────────┬──────────┬──────────┬──────────┐
│ ID       │ Title                     │ Severity │ Status   │ Created  │
├──────────┼───────────────────────────┼──────────┼──────────┼──────────┤
│ a1b2c3d4 │ API latency spike         │ high     │ open     │ 2h ago   │
│ e5f6g7h8 │ Database connection limit │ critical │ open     │ 15m ago  │
└──────────┴───────────────────────────┴──────────┴──────────┴──────────┘
```

### JSON

Machine-readable output for scripting and CI/CD pipelines.

```bash
nova incidents list --json | jq '.[] | {title, severity, status}'
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy Check
on: [push]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Install Nova CLI
        run: npm install -g @novaaiops/cli

      - name: Login
        run: nova login --token ${{ secrets.NOVA_TOKEN }}

      - name: Check SLOs before deploy
        run: |
          nova slo check --json | jq -e '.[] | select(.status == "breaching")' && exit 1 || echo "All SLOs met"

      - name: Create deploy incident
        if: failure()
        run: nova incidents create -t "Deploy failed on ${{ github.ref }}" -s high

      - name: Push deploy metric
        run: nova metrics push deploy.success 1 --tags branch:${{ github.ref_name }}
```

### GitLab CI

```yaml
deploy:
  script:
    - npm install -g @novaaiops/cli
    - nova login --token $NOVA_TOKEN
    - nova status --json
    - nova metrics push deploy.count 1 --tags env:$CI_ENVIRONMENT_NAME
```

### Jenkins

```groovy
pipeline {
    stages {
        stage('Pre-deploy Check') {
            steps {
                sh 'nova login --token ${NOVA_TOKEN}'
                sh 'nova slo check --service api-gateway'
                sh 'nova services health api-gateway'
            }
        }
    }
}
```

---

## Troubleshooting

### "Authentication required"

```bash
# Re-authenticate
nova login
```

### "Request timed out"

Check your API URL and network connectivity:

```bash
nova config
curl -sf https://app.novaaiops.com/api/health
```

### "Permission denied"

Your account role may not have access to the requested resource. Check your role:

```bash
nova whoami
```

### Reset configuration

```bash
rm -rf ~/.nova
nova login
```

---

## Support

- Web: https://app.novaaiops.com
- Issues: https://github.com/Samsontanimawo/Nova-Ai-Ops-ProductV1-CLI/issues
- Docs: https://docs.novaaiops.com

---

*Nova CLI v1.0.0 — Built by Nova AI Ops*
