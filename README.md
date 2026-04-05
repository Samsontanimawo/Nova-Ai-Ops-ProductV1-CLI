# Nova CLI

Command-line interface for the [Nova AI Ops](https://app.novaaiops.com) SRE platform.

## Install

```bash
# From npm (global)
npm install -g @novaaiops/cli

# Or clone and link
git clone https://github.com/Samsontanimawo/Nova-Ai-Ops-ProductV1-Final-2026.git
cd Nova-Ai-Ops-ProductV1-Final-2026/nova-cli
npm install
npm link
```

## Quick Start

```bash
# Authenticate
nova login

# Check platform health
nova status

# List incidents
nova incidents list

# List services
nova services list
```

## Commands

| Command | Description |
|---------|-------------|
| `nova login` | Authenticate with Nova AI Ops |
| `nova logout` | Clear credentials |
| `nova whoami` | Show current user |
| `nova status` | Platform health overview |
| `nova config` | Show CLI configuration |
| `nova open` | Open web UI in browser |

### Incidents

```bash
nova incidents list                              # List all incidents
nova incidents list --status open                # Filter by status
nova incidents list --json                       # JSON output
nova incidents create -t "DB latency spike" -s critical
nova incidents resolve INC-42 --note "Fixed pool"
nova incidents ack INC-42                        # Acknowledge
```

### Services

```bash
nova services list                               # List all services
nova services list --status critical             # Filter by status
nova services health                             # Health check all
nova services health api-gateway                 # Check specific service
```

### Alerts

```bash
nova alerts list                                 # List all alerts
nova alerts list --firing                        # Only firing alerts
```

### SLO

```bash
nova slo check                                   # Check all SLOs
nova slo check --service api-gateway             # Specific service
```

### Agents

```bash
nova agent status                                # Show all agents
nova agent install                               # Install instructions
```

### Runbooks

```bash
nova runbooks list                               # List runbooks
nova runbooks run RB-01 --target prod-web-01     # Execute
nova runbooks run RB-01 --dry-run                # Preview only
```

### Metrics

```bash
nova metrics query "cpu > 80" --last 1h          # Query metrics
nova metrics push deploy.count 1 --tags env:prod # Push custom metric
```

## Configuration

Config is stored in `~/.nova/config.json`:

```json
{
  "apiUrl": "https://app.novaaiops.com/api",
  "username": "admin",
  "orgId": "acme-corp"
}
```

Auth token stored in `~/.nova/token` (permissions: 600).

## Output Formats

All list commands support `--json` for machine-readable output:

```bash
nova incidents list --json | jq '.[] | .title'
nova services list --json | jq '.[] | select(.status == "critical")'
```

## License

MIT
