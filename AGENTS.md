# Screenshots

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
