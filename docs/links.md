# Links

- footnote (in-page link)  `[^fn] + [^fn]: text`
- link to full text `[text](link)`
- link to mention (annotation, review) `[text](link##ann)`
- link to bibliography `[text](slug##bib)`
    + these may point to online full texts or online mentions, it has to be pointed out via params: fulltext or online
    + use citation in the text [\\cite.](bib.slug) as in [natbib](http://merkel.texture.rocks/Latex/natbib.php)
    + double hash should prevent any serious problems if the text is used with another markdown compiler

## Rendering

- footnote: `href="#(…)"`
- link to online full text: standard link
- link to online mention: class="mention"
- link to offline source: class="offline"

