# Production monitoring

`stillup.config.json` owns the private `paramtune-production` checks in StillUp. They run every minute and open an incident after two consecutive failures; one successful observation resolves it. IDs remain stable to preserve history.

Readiness checks the backend, Redis, and production OIDC discovery. The fixture check validates scoped token authentication and resolved configuration reads. The frontend check verifies HTML serving. These checks do not execute browser JavaScript or prove interactive login, editing, or logout.

## Initial production setup

1. In Paramtune's dashboard, create a platform named `monitoring`, add version `1.0.0`, and save the contents of `fixture.json` as its configuration. Keep this fixed fixture independent of customer data and without `@extends` dependencies.
2. Under **API tokens**, create a token scoped only to `monitoring`. Tokens can read but never change configuration. The page is visible only to people who manage Paramtune: when `OIDC_ADMIN_GROUP` is set, members of that group.
3. In StillUp, create the managed secret `PARAMTUNE_MONITOR_TOKEN` with that token. Managed secrets require `SECRETS_ENCRYPTION_KEY` on the API and workers. Alternatively, set `CHECK_SECRET_PARAMTUNE_MONITOR_TOKEN` on both the API (used by `stillup test`) and the workers, and restart them. A managed secret with the same name takes precedence, even when disabled. Keep the plaintext out of git, logs, and CI.
4. In StillUp, under **Manage notifications**, add a webhook channel with **Enabled** and **Use as a default channel** checked. These checks set no `notificationChannelIds`, so they notify every enabled default channel for both incidents and recoveries.
5. In StillUp, open **API access** → **Connect a repository** and enter repository `rec-farm/paramtune`, projects `paramtune-production`, workflow file `monitoring.yml`, branch `master`, and GitHub environment `monitoring-production`. This repository already has the workflow; don't commit the one StillUp writes. Always set the branch: StillUp refuses pull request runs only because their ref is not `refs/heads/master`. Rules can't be edited; to change one, remove it and connect the repository again. The first run binds the rule to this repository's GitHub ID.
6. In this repository, create the GitHub environment `monitoring-production` and restrict its deployment branches to `master`. The workflow sets `STILLUP_URL` to `https://stillup.rec.farm/api`.
7. Run the Production monitoring workflow on `master`, or use the commands below. It tests real GET requests, previews changes, and applies only after all checks pass.
8. Verify every check records fresh scheduled results in StillUp. Verify incident and recovery alerts with a separate disposable check, rather than breaking production.

The checks run from StillUp's own worker (location `local`). To observe Paramtune from outside both hosts, connect a probe under **Manage locations** and list its ID in each check's `locationIds`; `stillup test` always runs from the API server, never from probes.

## Local commands

Use Node.js 24 or later. Supply `STILLUP_URL` and `STILLUP_TOKEN` through your local environment; don't paste credentials into shell commands or config files. For the token, create a StillUp API key under **API access** with access **Deploy** and projects `paramtune-production`.

```sh
npm exec --yes --package=@rec/stillup@0.2.0 -- stillup validate --config monitoring/stillup.config.json
npm exec --yes --package=@rec/stillup@0.2.0 -- stillup test --config monitoring/stillup.config.json --yes
npm exec --yes --package=@rec/stillup@0.2.0 -- stillup diff --config monitoring/stillup.config.json
npm exec --yes --package=@rec/stillup@0.2.0 -- stillup apply --config monitoring/stillup.config.json --yes
```

The workflow installs the exact CLI release independently of Paramtune's app dependencies. PR validation needs no credentials. Deploys sign in with the job's GitHub OIDC token (`id-token: write`) and receive 15 minutes of deploy access to `paramtune-production`; StillUp refuses runs from other repositories, workflows, branches, and environments. Changed monitoring files trigger deployment. `workflow_dispatch` reruns production smoke tests and synchronization; a future application deployment workflow can invoke the same test command after rollout.

Applying configuration saves monitors; it does not prove scheduled worker execution or notification delivery, and it doesn't check that referenced secrets exist. A missing or disabled secret makes each run an execution error rather than a failure: no incident opens and no alert is sent, and the check shows as unknown after a few intervals. Omitted checks remain running until explicitly archived. Pauses and archives survive apply. No checks are published on the public status page by this config.
