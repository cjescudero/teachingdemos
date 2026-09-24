# Repository Guidelines

## Structure & Navigation

This static teaching portal uses **home → topic index → demo**:

- `index.html`: topic cards only.
- `teoria-de-la-informacion/`: preserved TI_GCED index, six imported resources, and poles/zeros.
- `inteligencia-artificial/`: index, RAG simulator, and context-window video page with its MP4 asset.
- `redes-inalambricas/`: index and `EspectroyRedes.html`.
- `assets/site.css`: shared home and new topic-index styles.

Demos contain their own HTML, CSS, and JavaScript. Keep demos inside their topic folders, with return navigation. Preserve the original TI_GCED site's independence and its imported index's design, descriptions, and ordering.

## Mandatory Index Consistency

**Always review the main index and every topic index when changing repository content; update every affected index in the same change.** Adding, deleting, moving, or renaming a demo requires checking its topic card, home topic description, links, and README. Remove stale placeholders such as “Próximamente” when content becomes available. Ensure every demo is reachable, titles and descriptions match its content, and no links target removed files. Keep home limited to topics and individual demos in topic indexes. Use relative URLs compatible with `/teachingdemos/`.

## Development & Validation

No installation or compilation is needed. Open `index.html` or run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

To test the Pages prefix, serve the parent directory and visit `/teachingdemos/`. External fonts and the poles/zeros CDN libraries require connectivity. No automated test framework, coverage threshold, formatter, or linter is configured.

Run `git diff --check`. Check all local links, home/topic/demo round trips, desktop/mobile indexes, keyboard navigation, and browser console errors. Exercise controls in affected demos and record the browser and results.

## Style & Contributions

Match existing indentation and naming. Keep demos self-contained; preserve supplied filenames and existing demo languages. New navigation is Spanish: retain accents and Unicode. Use descriptive Spanish commit summaries. PRs explain behavior changes, validation, relevant issues, and screenshots for visual changes.

## Git, GitHub & Pages

Remote: `https://github.com/cjescudero/teachingdemos.git`; local `main` tracks `origin/main`. Check `git status --short --branch`, `git remote -v`, and fresh remote state before synchronization. Review the diff and include required new files; never discard unrelated work or force-push.

For authorized publication, fetch, reconcile remote changes, commit the reviewed files, and push to the configured publishing branch. Confirm **Settings → Pages** uses the intended branch and `/(root)`; do not assume settings from local files. Check deployment completion and the live home, topic indexes, and changed demos at `https://cjescudero.github.io/teachingdemos/`.

Local edits and commits alone do not publish anything. A successful push is not proof of successful Pages deployment. Report separately what is local, committed, pushed, and verified live; explain any authentication or deployment blocker.
