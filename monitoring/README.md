# Production monitoring

`stillup.config.json` owns the private `paramtune-production` checks in StillUp. They run every minute and open an incident after two consecutive failures; one successful observation resolves it. IDs remain stable to preserve history.

Readiness checks the backend, Redis, and production OIDC discovery. The fixture check reads a public platform anonymously, covering the public API and configuration resolution; it doesn't exercise API token authentication. The frontend check verifies HTML serving. These checks do not execute browser JavaScript or prove interactive login, editing, or logout.

## Initial production setup

1. In Paramtune's dashboard, create a platform named `monitoring`, add version `1.0.0`, and save the contents of `fixture.json` as its configuration. Keep this fixed fixture independent of customer data and without `@extends` dependencies.
2. On the `monitoring` platform's page, under **Public API**, choose **Make public**. Only people who manage Paramtune see the button: when `OIDC_ADMIN_GROUP` is set, members of that group. `curl https://paramtune.rec.farm/api/monitoring/1.0.0` should then return the fixture without a token.
3. In StillUp, under **Manage notifications**, add a webhook channel with **Enabled** and **Use as a default channel** checked. These checks set no `notificationChannelIds`, so they notify every enabled default channel for both incidents and recoveries.
4. In StillUp, open **API access** → **Connect a repository** and enter repository `rec-farm/paramtune`, projects `paramtune-production`, workflow file `monitoring.yml`, branch `master`, and GitHub environment `monitoring-production`. This repository already has the workflow; don't commit the one StillUp writes. Always set the branch: StillUp refuses pull request runs only because their ref is not `refs/heads/master`. Rules can't be edited; to change one, remove it and connect the repository again. The first run binds the rule to this repository's GitHub ID.
5. In this repository, create the GitHub environment `monitoring-production` and restrict its deployment branches to `master`. The workflow sets `STILLUP_URL` to `https://stillup.rec.farm/api`.
6. Run the Production monitoring workflow on `master`, or use the commands below. It tests real GET requests, previews changes, and applies only after all checks pass.
7. Verify every check records fresh scheduled results in StillUp. Verify incident and recovery alerts with a separate disposable check, rather than breaking production.

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

Applying configuration saves monitors; it does not prove scheduled worker execution or notification delivery. Making `monitoring` private again turns the configuration-read check into a failure (HTTP 401), which opens an incident. Omitted checks remain running until explicitly archived. Pauses and archives survive apply. No checks are published on the public status page by this config.
