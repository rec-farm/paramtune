# Production monitoring

`stillup.config.json` owns the private `paramtune-production` checks in StillUp. They run every minute and open an incident after two consecutive failures; one successful observation resolves it. IDs remain stable to preserve history.

Readiness checks the backend, Redis, and production OIDC discovery. The fixture check validates scoped token authentication and resolved configuration reads. The frontend check verifies HTML serving. These checks do not execute browser JavaScript or prove interactive login, editing, or logout.

## Initial production setup

1. In Paramtune's dashboard, create a platform named `monitoring`, version `1.0.0`, and save the contents of `fixture.json` as its configuration. Keep this fixed fixture independent of customer data and without `@extends` dependencies.
2. Under Dashboard → API tokens, create a read-only token scoped only to `monitoring`.
3. In StillUp, create the managed secret `PARAMTUNE_MONITOR_TOKEN` using that token. Keep the plaintext out of git, logs, and CI. Managed secrets require StillUp's encryption key configuration; alternatively set `CHECK_SECRET_PARAMTUNE_MONITOR_TOKEN` on the API and workers and restart them.
4. Set up an enabled default incident/recovery notification channel in StillUp and test delivery. Notification channels and secret values are provisioned separately from this config.
5. In StillUp, open **API access** → **Connect a repository** and trust `rec-farm/paramtune`, workflow file `monitoring.yml`, branch `master`, environment `monitoring-production`, for project `paramtune-production`. The workflow already exists here, so don't commit the one StillUp writes. GitHub vouches for each run; no StillUp credential is stored in GitHub.
6. In this repository, create the GitHub environment `monitoring-production` and restrict its deployment branches to `master`. The workflow sets `STILLUP_URL` to `https://stillup.rec.farm/api`.
7. Run the Production monitoring workflow on `master`, or use the commands below. It tests real GET requests, previews changes, and applies only after all checks pass.
8. Verify every check records fresh scheduled results in StillUp. Verify incident and recovery alerts with a separate disposable check, rather than breaking production. A one-off test uses the API server, not regional probes; configure an independent probe location outside the Paramtune host and inspect its scheduled observations.

## Local commands

Use Node.js 24 or later. Supply `STILLUP_URL` and `STILLUP_TOKEN`, a **Deploy** API key from StillUp's API access limited to `paramtune-production`, through your local environment; don't paste credentials into shell commands or config files.

```sh
npm exec --yes --package=@rec/stillup@0.2.0 -- stillup validate --config monitoring/stillup.config.json
npm exec --yes --package=@rec/stillup@0.2.0 -- stillup test --config monitoring/stillup.config.json --yes
npm exec --yes --package=@rec/stillup@0.2.0 -- stillup diff --config monitoring/stillup.config.json
npm exec --yes --package=@rec/stillup@0.2.0 -- stillup apply --config monitoring/stillup.config.json --yes
```

The workflow installs the exact CLI release independently of Paramtune's app dependencies. PR validation needs no credentials. Deploys sign in with the job's GitHub OIDC token (`id-token: write`) and receive 15 minutes of deploy access to `paramtune-production` only; StillUp refuses runs from other branches, workflows, environments and pull requests. Changed monitoring files trigger deployment. `workflow_dispatch` reruns production smoke tests and synchronization; a future application deployment workflow can invoke the same test command after rollout.

Applying configuration saves monitors; it does not prove scheduled worker execution or notification delivery. Missing credentials produce configuration errors rather than target outages. Omitted checks remain running until explicitly archived. Pauses and archives survive apply. No checks are published on the public status page by this config.
