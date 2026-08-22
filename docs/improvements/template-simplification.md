# Template and Layout Simplification Proposals

This document outlines the proposed improvements and code cleanups for Jekyll layouts and Liquid includes (Point 1).

---

## 1. Eliminate Duplicate HTML Envelope in `_layouts/landing.html`

### Context & Problem
Currently, `_layouts/landing.html` duplicates the entire 14-line root HTML envelope (`<!DOCTYPE html>`, `<html...>`, `{% include head.html %}`, `<body...>`, `<a class="skip-link"...>`, `<header...>`, `<footer...>`). The only functional differences from `_layouts/default.html` are:
1. The shell class uses `site-shell--wide` instead of `site-shell--standard`.
2. The main content container uses `.page-content.photo-essay` instead of standard `.page-content`.

This duplication creates a maintenance burden: any future update to `<head>`, skip links, accessibility tags, or masthead/footer structure must be manually applied in both places.

### Proposed Solution
Update `_layouts/default.html` to accept optional layout and shell modifiers:
```liquid
<!DOCTYPE html>
<html lang="{{ page.lang | default: "en" }}" class="html" data-theme="{{ site.theme_config.appearance | default: "auto" }}">
  {%- include head.html -%}
  <body class="layout-{{ page.layout | default: 'default' }}{% if page.body_class %} {{ page.body_class }}{% endif %}">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="site-shell {{ page.shell_class | default: 'site-shell--standard' }}">
      {% include site_header.html %}
      <main id="main-content" class="page-content{% if page.content_class %} {{ page.content_class }}{% elsif page.collection == 'posts' %} page-content--post{% endif %}" aria-label="Content" tabindex="-1">
        {{ content }}
      </main>
      {% include site_footer.html %}
    </div>
  </body>
</html>
```

Then refactor `_layouts/landing.html` to inherit directly from `default`:
```liquid
---
layout: default
shell_class: site-shell--wide
content_class: photo-essay
---
{{ content }}
```

---

## 2. Standardize Hidden Post Filtering in `_includes/home_post_list.html`

### Context & Problem
Different includes currently use different methods to filter out hidden posts:
- `_includes/post_list.html`: `{% unless post.categories contains "hidden" %}`
- `_includes/read_next.html`: `{% unless essay_candidate.categories contains "hidden" %}`
- `_includes/home_post_list.html`: `{%- assign visible_posts = site.posts | where_exp: "item", "item.category != 'hidden'" -%}`

In Jekyll, `item.category` returns only the first category of a post. If a post has multiple categories (such as `categories: [essay, hidden]`), `item.category != 'hidden'` evaluates to `true`, causing the hidden post to appear on the homepage.

### Proposed Solution
Standardize `_includes/home_post_list.html` to check the full `categories` array:
```liquid
{%- assign visible_posts = site.posts | where_exp: "item", "item.categories contains 'hidden' == false" -%}

{% if visible_posts.size > 0 %}
  <ul>
    {% for post in visible_posts limit: 5 %}
      <li class="post-list-item">
        {% include post_list_meta.html post=post %}
        <a href="{{ post.url | relative_url }}">{% include post_title.html post=post show_kind=true %}</a>
      </li>
    {% endfor %}
  </ul>

  {% if visible_posts.size > 5 %}
    <p class="see-more">
      <a href="/blog">See all posts →</a>
    </p>
  {% endif %}
{% endif %}
```

---

## 3. Streamline Translation Filtering in `_layouts/post.html`

### Context & Problem
In `_layouts/post.html` (lines 21–61), the translation block runs three separate `for` loops across `translations`:
1. First loop: checks `has_translation` by looking for any post where `post.lang != page.lang`.
2. Second loop: computes `translation_count` of other language versions.
3. Third loop: renders the actual language switch links and separator hyphens.

### Proposed Solution
Filter other language versions once using `where_exp`:
```liquid
{% if page.ref %}
  {% assign other_translations = site.posts | where: "ref", page.ref | where_exp: "item", "item.lang != page.lang" | sort: "lang" %}
  {% if other_translations.size > 0 %}
    <hr>
    <div class="language-switcher">
      <p>Also available in</p>
      {% for post in other_translations %}
        {% case post.lang %}
          {% when 'en' %}
            {% assign read_in_message = "Read in English" %}
          {% when 'de' %}
            {% assign read_in_message = "Auf Deutsch lesen" %}
          {% when 'es' %}
            {% assign read_in_message = "Leer en castellano" %}
          {% when 'cat' %}
            {% assign read_in_message = "Llegir en català" %}
          {% else %}
            {% assign read_in_message = post.lang | upcase %}
        {% endcase %}
        <a href="{{ post.url | relative_url }}" class="{{ post.lang }}">{{ read_in_message }}</a>{% unless forloop.last %} - {% endunless %}
      {% endfor %}
    </div>
  {% endif %}
{% endif %}
```

### Benefits
- Removes 2 unnecessary loops per rendered post.
- Replaces manual index tracking (`current_index < translation_count`) with standard Liquid `{% unless forloop.last %}`.
- Makes the translation section concise, readable, and easier to maintain.
