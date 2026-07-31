# Local CV workflow

The CV uses the website's Jekyll build, fonts, palette, and editorial design
language, but it is never included in the normal GitHub Pages build.

## Updating the CV

- Edit `_data/cv/en.yml` and `_data/cv/es.yml` for career content. Keep the
  `id` and order of equivalent experience and education entries aligned.
- Edit `_data/cv_private.yml` for phone and email details. This file is ignored
  by Git. On a new checkout, copy `_data/cv_private.example.yml` first.
- Replace `curriculum/assets/portrait.jpg` to update the portrait. The image is
  also ignored by Git; use a square or portrait-oriented JPEG with enough
  resolution for a 33 mm printed image.

## Building and printing

Build the website together with both local CV pages:

```zsh
bin/cv build
```

Build and open a language in the default browser:

```zsh
bin/cv preview en
bin/cv preview es
```

Wait for the fit status above the page. The layout first uses normal spacing
and switches that language to the bounded compact preset if necessary. Any
remaining overflow message is advisory because browser measurements can be
conservative; use the native A4 print preview as the final check. The Print /
Save as PDF button always remains available.

Use the page's Print / Save as PDF button. In the print dialog select:

- Paper size: A4
- Scale: 100%
- Margins: None
- Background graphics: On

Save the files as `CV-en.pdf` and `CV-es.pdf`. Confirm in Preview that each PDF
has exactly one page and that no text, rules, or portrait edges are clipped.

The generated pages are `_site/curriculum/en.html` and
`_site/curriculum/es.html`. `_site` and saved PDFs are ignored by Git.
