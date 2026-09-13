# GitHub operating map — 2026-09-13

Status: Record. Not a new architecture layer.

## Accounts

- Person: `ahmeddaaja1-create`
- Institution container: `X12twelve`
- Connector authenticated as: `ahmeddaaja1-create`

## Capability of this connector (measured, not assumed)

AVAILABLE NOW on person account:
- read/write files
- create public/private repos on the person account
- create issues and labels on repos the token can administer
- read public org repos
- list stars

REQUIRES HIGHER ORG ADMIN / RECONNECT:
- create repos under `X12twelve`
- write files to `X12twelve/work-agent-lab`
- org profile README via `X12twelve/.github`
- GitHub Projects v2
- org labels
- teams

NOT AVAILABLE FROM HERE:
- pin repositories
- edit profile bio, location, social links
- upload org/person avatar
- transfer a repo person → org
- rename a repo
- change visibility of an existing repo
- GitHub Sponsors, Packages, Enterprise policies

## Promotion states used on GitHub objects

Observe → Experiment → Adopt / Refine / Reject / Dormant

No object moves to Adopt without a live application event.

## Hygiene decided 2026-09-13

1. Keep STRATA on the person account while it remains a peer packet.
2. Do not merge work-agent-lab PR #1.
3. Do not treat OmniRoute, browser-use, OpenMAIC, archify, or skill catalogs as X12 subsystems.
4. Do not create new repos for optional services tonight.
5. Person profile README is the public map.
6. Org profile README waits for org-admin permission.
