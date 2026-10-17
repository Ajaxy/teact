# Changesets

A changeset is a Markdown file in this directory that names the packages a pull request changes, the kind of version bump (`patch`, `minor` or `major`) and a summary for the changelog. Add one with `npx changeset`. A pull request that changes nothing in the published package, such as tests, CI or documentation, needs none. See [CONTRIBUTING.md](../CONTRIBUTING.md#changesets).

While `pre.json` is in pre mode, versions are prereleases (`0.1.0-next.N`) published under the `next` npm dist-tag. Changesets that a prerelease has already used move to `pre/`; they come back into the changelog of the final version.

The release workflow, `.github/workflows/release.yml`, turns pending changesets into a "Release: Version packages" pull request, and publishes the new version to npm once that pull request is merged. Documentation: https://changesets.dev.
