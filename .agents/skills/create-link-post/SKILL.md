---
name: create-link-post
description: Create a concise Jekyll link post that quotes and credits an external article. Use when the user asks to create a blog post about, in response to, or linking to a URL.
---

# Create Link Post

Create a narrow `_posts/YYYY-MM-DD-slug.md` post in this site's link-post style.

## Inputs

Before editing, establish:

1. The source URL to link to.
2. The exact text to quote.
3. Whether the user wants to add personal commentary, and its wording if so.

Use details already present in the request. Ask a concise clarification for each missing input; do not infer a quotation or invent commentary. If the user does not want commentary, omit it.

## Workflow

1. Check the working tree.
2. Retrieve the source and preserve the selected quotation exactly. Confirm the source title and use it as the post title unless the user provides another title.
3. Create the dated post with exactly this front matter:

   ```markdown
   ---
   layout: post
   title: "Source Title"
   ---
   ```

   Follow it with the blockquote, any approved commentary, and a final standalone attribution line in this form: `[Author’s article](URL).`
4. Keep the change to the post unless a supporting edit is necessary.
5. Run `bundle exec jekyll build --trace`, `git diff --check`, and inspect the generated HTML for the new post.

## Shape

```markdown
---
layout: post
title: "Source Title"
---

> Exact selected quotation.

Optional user commentary.

[Author's article](https://example.com/article).
```
