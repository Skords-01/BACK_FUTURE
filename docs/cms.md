# CMS setup

The admin UI is available at `/admin/` and uses Sveltia CMS with the GitHub backend.

## Authentication

For production, configure a GitHub OAuth app or a Sveltia/Decap-compatible auth gateway for this repository:

- repository: `Skords-01/BACK_FUTURE`
- branch: `main`
- callback path: `/admin/`

Use a dedicated service account where possible and grant only repository access needed for pull requests/content edits.

## Editorial workflow

`public/admin/config.yml` enables `publish_mode: editorial_workflow`.

Recommended flow:

1. Create or edit a fact in CMS.
2. Save it as draft.
3. Move it to review after sources are filled.
4. Publish only after CI passes: `npm run validate:content`, `npm run lint`, `npm run build`.
5. Source URLs are checked in the `Link check` workflow: CI runs `npm run dump:source-urls` and validates `dist/.fact-source-urls.md` with Lychee.

## Local checks

Before publishing CMS-created content locally:

```bash
npm run validate:content
npm run coverage:content
npm run lint:md
npm run build
npm run dump:source-urls
```
