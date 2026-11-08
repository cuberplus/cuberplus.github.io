# Screenshots

## Explanatory text

Put explanatory blocks of text in an info tooltip using the circled "i" control.
Keep its trigger beside the label it explains, outside expandable content.

Always capture Timer, Scrambler, and Smartcube Analyzer screenshots in the **Dark**
theme, including homepage tool previews and documentation images. Aurora is the
site default; do not change that default to take screenshots.

Use an isolated browser context and select Dark in `/options/` before capturing.
For automated screenshot-only contexts, initialize the theme before navigation:

```js
await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
```

Wait for `html[data-theme="dark"]` and for the tool to finish rendering before
capturing. Do not overwrite a real user's saved theme preference. Tests may
exercise other themes, but screenshots of these three tools must use Dark.

## Homepage preview composition

Keep homepage previews at 1440 x 900 and visually inspect the images before
finishing. Refresh only the tools requested; preserve other approved previews.

- **Timer:** Show a representative completed CFOP solve above 10 seconds.
  Populate Cross, all four F2L pairs, OLL, and PLL with substantive, balanced
  timings; do not use a fast simulated solve or an unfinished Cross-only view.
  No "Simulated cube" text, daily-streak notifications, or PB overlays.
- **Smartcube Analyzer:** Frame the first few charts at the top of the chart
  area, not the upload controls or fastest-solves table. Load a full dataset
  such as Dev Solves and verify at least 2,500 contributing solves after
  filtering. Set the sliding window to at least 2,500 too, so windowed charts
  meet the same requirement. Dismiss warnings, close menus, and wait for chart
  computation and animations to finish.

Do not generate these two previews from the small fixtures in
`scripts/check-solve-workflows.mjs`. Its screenshot mode is only suitable for
Scrambler and Database.
