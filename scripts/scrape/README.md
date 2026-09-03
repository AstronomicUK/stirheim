# Rescraping mordheimer.net

`convert.mjs` turns downloaded Docusaurus pages into the Markdown under `reference/rules`.
It expects a `scrape/` folder of `.html` files next to it, named after the URL path with `/`
replaced by `__` (e.g. `campaigns__hired-swords__grade-1a.html`), and needs `cheerio`,
`turndown` and `turndown-plugin-gfm` installed in the same folder (not part of the app's
dependencies on purpose).

```bash
cd scripts/scrape
npm init -y && npm i cheerio turndown turndown-plugin-gfm
mkdir -p scrape
# download politely, ~1 request/second, with a descriptive User-Agent
curl -s -A "Stirheim-rules-reference (personal project)" \
  https://mordheimer.net/docs/campaigns/hired-swords/grade-1a \
  -o scrape/campaigns__hired-swords__grade-1a.html
node convert.mjs ../../reference/rules
```

The site's robots.txt signals `search=yes, ai-train=no, use=reference`; this project uses the
text as a rules reference for a private group tool and does not train models on it.
