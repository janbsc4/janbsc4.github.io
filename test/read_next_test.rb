# frozen_string_literal: true

require "fileutils"
require "jekyll"
require "minitest/autorun"
require "nokogiri"
require "tmpdir"

class ReadNextTest < Minitest::Test
  REPOSITORY_ROOT = File.expand_path("..", __dir__)

  def self.build_site(source, destination, safe: false)
    config = Jekyll.configuration(
      "config" => File.join(source, "_config.yml"),
      "source" => source,
      "destination" => destination,
      "layouts_dir" => "_layouts",
      "includes_dir" => "_includes",
      "safe" => safe,
      "quiet" => true
    )
    Jekyll::Site.new(config).tap(&:process)
  end

  def self.actual_site
    @actual_build ||= Dir.mktmpdir("read-next-site")
    @actual_site ||= build_site(REPOSITORY_ROOT, @actual_build)
  end

  def self.shutdown
    FileUtils.remove_entry(@actual_build) if @actual_build
  end

  def test_english_notes_and_essays_render_eligible_discovery_essays
    site = self.class.actual_site
    eligible_essays = site.posts.docs.select { |post| eligible_essay?(post) }
    eligible_urls = eligible_essays.map(&:url)

    english_posts = site.posts.docs.select do |post|
      post.data.fetch("lang", "en") == "en" && post.data["layout"] == "post"
    end

    english_posts.each do |post|
      document = generated_document(post)
      navigation = document.at_css("article.post > nav.read-next[aria-labelledby='read-next-heading']")
      expected_count = [eligible_urls.reject { |url| url == post.url }.length, 3].min

      refute_nil navigation, "expected Read next navigation on #{post.url}"
      assert_equal "Read next", navigation.at_css("#read-next-heading")&.text&.strip
      assert_nil navigation.at_css("#read-next-heading")["lang"]

      links = navigation.css(".read-next__list > li > a")
      urls = links.map { |link| link["href"] }
      assert_equal expected_count, links.length, "unexpected item count on #{post.url}"
      assert_equal urls.uniq, urls, "duplicate Discovery essay on #{post.url}"
      refute_includes urls, post.url, "self-link on #{post.url}"
      assert_empty urls - eligible_urls, "ineligible Discovery essay on #{post.url}"
      assert links.all? { |link| !link.at_css(".title-text")&.text&.strip&.empty? }
      assert links.none? { |link| link.at_css(".post-kind") }
      assert_equal navigation, document.at_css("article.post").element_children.last
    end
  end

  def test_photo_essays_and_feed_remain_unchanged
    site = self.class.actual_site
    photo_essay = site.posts.docs.find { |post| post.data["layout"] == "landing" }

    refute_nil photo_essay
    assert_nil generated_document(photo_essay).at_css(".read-next")

    feed = File.read(File.join(self.class.instance_variable_get(:@actual_build), "feed.xml"))
    refute_includes feed, "read-next"
    refute_includes feed, "Read next"
  end

  def test_small_candidate_pools_render_only_real_choices
    { 0 => 0, 1 => 1, 2 => 2 }.each do |essay_count, expected_count|
      with_fixture_site(essay_count) do |destination|
        document = Nokogiri::HTML(File.read(File.join(destination, "note.html")))
        navigation = document.at_css("nav.read-next")

        if expected_count.zero?
          assert_nil navigation
        else
          refute_nil navigation, "expected navigation for a pool of #{essay_count} Essays"
          links = navigation.css(".read-next__list > li > a")
          assert_equal expected_count, links.length
          assert_equal links.map { |link| link["href"] }.uniq.length, links.length
        end
      end
    end
  end

  def test_related_essay_is_first_and_excluded_from_discovery
    posts = {
      "2026-01-01-note.md" => fixture_post("Note", related_essay: "essay-2"),
      "2026-01-02-essay-1.md" => fixture_post("Essay 1", essay: true),
      "2026-01-03-essay-2.md" => fixture_post("Essay 2", essay: true),
      "2026-01-04-essay-3.md" => fixture_post("Essay 3", essay: true),
      "2026-01-05-essay-4.md" => fixture_post("Essay 4", essay: true)
    }

    with_custom_fixture_site(posts) do |destination|
      document = Nokogiri::HTML(File.read(File.join(destination, "note.html")))
      links = document.css(".read-next__list > li > a")
      urls = links.map { |link| link["href"] }

      assert_equal "/essay-2", urls.first
      assert_equal 3, urls.length
      assert_equal urls.uniq, urls
      assert_equal 1, urls.count("/essay-2")
    end
  end

  def test_cross_language_related_essay_is_visibly_identified
    posts = {
      "2026-01-01-note.md" => fixture_post("Note", related_essay: "ensayo"),
      "2026-01-02-english-essay.md" => fixture_post("English Essay", essay: true),
      "2026-01-03-ensayo.md" => fixture_post("Ensayo", essay: true, lang: "es")
    }

    with_custom_fixture_site(posts) do |destination|
      document = Nokogiri::HTML(File.read(File.join(destination, "note.html")))
      links = document.css(".read-next__list > li > a")

      assert_equal "/ensayo", links.first["href"]
      assert_equal "es", links.first.at_css(".title-text")["lang"]
      assert_equal "ES", links.first.at_css(".post-language")&.text&.strip
      english_link = links.find { |link| link["href"] == "/english-essay" }
      assert_nil english_link.at_css(".title-text")["lang"]
      assert_nil english_link.at_css(".post-language")
    end
  end

  def test_translated_essay_falls_back_to_english_after_language_switcher
    posts = {
      "2026-01-01-english-version.md" => fixture_post("English Version", essay: true, ref: "translated-essay"),
      "2026-01-02-ensayo.md" => fixture_post("Ensayo", essay: true, lang: "es", ref: "translated-essay"),
      "2026-01-03-english-discovery.md" => fixture_post("English Discovery", essay: true),
      "2026-01-04-hidden-english.md" => fixture_post("Hidden English", essay: true, categories: ["hidden"])
    }

    with_custom_fixture_site(posts) do |destination|
      document = Nokogiri::HTML(File.read(File.join(destination, "ensayo.html")))
      article = document.at_css("article.post")
      navigation = article.at_css("nav.read-next")

      refute_nil navigation
      assert_equal navigation, article.element_children.last
      assert_operator article.element_children.index(navigation), :>, article.element_children.index(article.at_css(".language-switcher"))
      assert_equal "en", navigation.at_css("#read-next-heading")["lang"]

      links = navigation.css(".read-next__list > li > a")
      urls = links.map { |link| link["href"] }
      assert_equal ["/english-discovery", "/english-version"].sort, urls.sort
      assert_equal urls.uniq, urls
      refute_includes urls, "/hidden-english"
      assert_equal "/english-version", article.at_css(".language-switcher a")["href"]
      links.each do |link|
        assert_equal "en", link.at_css(".title-text")["lang"]
        assert_nil link.at_css(".post-kind:not(.post-language)")
        assert_equal "EN", link.at_css(".post-language")&.text&.strip
      end
    end
  end

  def test_cross_language_related_essay_does_not_change_translated_discovery_priority
    posts = {
      "2026-01-01-ensayo.md" => fixture_post("Ensayo", essay: true, lang: "es", related_essay: "english-related"),
      "2026-01-02-otro-ensayo.md" => fixture_post("Otro Ensayo", essay: true, lang: "es"),
      "2026-01-03-tercer-ensayo.md" => fixture_post("Tercer Ensayo", essay: true, lang: "es"),
      "2026-01-04-english-related.md" => fixture_post("English Related", essay: true),
      "2026-01-05-english-discovery.md" => fixture_post("English Discovery", essay: true),
      "2026-01-06-hidden-ensayo.md" => fixture_post("Hidden Ensayo", essay: true, lang: "es", categories: ["hidden"])
    }

    with_custom_fixture_site(posts) do |destination|
      document = Nokogiri::HTML(File.read(File.join(destination, "ensayo.html")))
      links = document.css(".read-next__list > li > a")
      urls = links.map { |link| link["href"] }

      assert_equal "/english-related", urls.first
      assert_equal ["/otro-ensayo", "/tercer-ensayo"].sort, urls.drop(1).sort
      refute_includes urls, "/english-discovery"
      refute_includes urls, "/hidden-ensayo"
      assert_equal "EN", links.first.at_css(".post-language")&.text&.strip
      assert links.none? { |link| link.at_css(".post-kind:not(.post-language)") }
      links.drop(1).each do |link|
        assert_nil link.at_css(".title-text")["lang"]
        assert_nil link.at_css(".post-language")
      end
    end
  end

  def test_translated_essay_small_candidate_pools_render_only_real_choices
    cases = {
      none: {},
      one: {
        "2026-01-02-english-essay.md" => fixture_post("English Essay", essay: true)
      },
      two: {
        "2026-01-02-otro-ensayo.md" => fixture_post("Otro Ensayo", essay: true, lang: "es"),
        "2026-01-03-english-essay.md" => fixture_post("English Essay", essay: true)
      }
    }

    cases.each do |name, candidates|
      posts = { "2026-01-01-ensayo.md" => fixture_post("Ensayo", essay: true, lang: "es") }.merge(candidates)

      with_custom_fixture_site(posts) do |destination|
        document = Nokogiri::HTML(File.read(File.join(destination, "ensayo.html")))
        navigation = document.at_css("nav.read-next")

        if candidates.empty?
          assert_nil navigation, name.to_s
        else
          links = navigation.css(".read-next__list > li > a")
          assert_equal candidates.length, links.length, name.to_s
          assert_equal links.map { |link| link["href"] }.uniq.length, links.length, name.to_s
        end
      end
    end
  end

  def test_translated_essays_select_discovery_essays_independently
    posts = {
      "2026-01-01-primer-ensayo.md" => fixture_post("Primer Ensayo", essay: true, lang: "es"),
      "2026-01-02-segundo-ensayo.md" => fixture_post("Segundo Ensayo", essay: true, lang: "es")
    }

    with_custom_fixture_site(posts) do |destination|
      first_urls = Nokogiri::HTML(File.read(File.join(destination, "primer-ensayo.html"))).css(".read-next a").map { |link| link["href"] }
      second_urls = Nokogiri::HTML(File.read(File.join(destination, "segundo-ensayo.html"))).css(".read-next a").map { |link| link["href"] }

      assert_equal ["/segundo-ensayo"], first_urls
      assert_equal ["/primer-ensayo"], second_urls
    end
  end

  def test_invalid_related_essays_fail_the_build_with_actionable_diagnostics
    invalid_cases = {
      unknown: {
        value: "missing-essay",
        posts: {
          "2026-01-01-source.md" => fixture_post("Source", related_essay: "missing-essay")
        }
      },
      non_slug_value: {
        value: "false",
        posts: {
          "2026-01-01-source.md" => fixture_post("Source", related_essay: false)
        }
      },
      ambiguous: {
        value: "duplicate",
        posts: {
          "2026-01-01-source.md" => fixture_post("Source", related_essay: "duplicate"),
          "2026-01-02-first.md" => fixture_post("First", essay: true, slug: "duplicate"),
          "2026-01-03-second.md" => fixture_post("Second", essay: true, slug: "duplicate")
        }
      },
      hidden: {
        value: "hidden-essay",
        posts: {
          "2026-01-01-source.md" => fixture_post("Source", related_essay: "hidden-essay"),
          "2026-01-02-hidden-essay.md" => fixture_post("Hidden Essay", essay: true, categories: %w[hidden other])
        }
      },
      note: {
        value: "note-target",
        posts: {
          "2026-01-01-source.md" => fixture_post("Source", related_essay: "note-target"),
          "2026-01-02-note-target.md" => fixture_post("Note Target")
        }
      },
      photo_essay: {
        value: "photo-target",
        posts: {
          "2026-01-01-source.md" => fixture_post("Source", related_essay: "photo-target"),
          "2026-01-02-photo-target.md" => fixture_post("Photo Target", layout: "landing")
        }
      },
      self_reference: {
        value: "source",
        posts: {
          "2026-01-01-source.md" => fixture_post("Source", essay: true, related_essay: "source")
        }
      }
    }

    invalid_cases.each do |name, invalid_case|
      error = assert_raises(StandardError, "expected #{name} to fail") do
        with_custom_fixture_site(invalid_case.fetch(:posts)) { nil }
      end

      assert_includes error.message, "2026-01-01-source.md", name.to_s
      assert_includes error.message, invalid_case.fetch(:value), name.to_s
    end
  end

  private

  def eligible_essay?(post)
    post.data.fetch("lang", "en") == "en" &&
      post.data["post_type"] == "essay" &&
      !post.data.fetch("categories", []).include?("hidden")
  end

  def generated_document(post)
    self.class.actual_site
    destination = self.class.instance_variable_get(:@actual_build)
    output_path = File.join(destination, post.url.sub(%r{\A/}, ""))
    output_path = File.join(output_path, "index.html") if File.directory?(output_path)
    output_path += ".html" unless File.exist?(output_path)
    Nokogiri::HTML(File.read(output_path))
  end

  def with_fixture_site(essay_count)
    posts = { "2026-01-01-note.md" => fixture_post("Note") }
    essay_count.times do |index|
      filename = "2026-01-0#{index + 2}-essay-#{index + 1}.md"
      posts[filename] = fixture_post("Essay #{index + 1}", essay: true)
    end

    with_custom_fixture_site(posts) { |destination| yield destination }
  end

  def with_custom_fixture_site(posts)
    Dir.mktmpdir("read-next-custom-fixture") do |source|
      source = File.realpath(source)
      destination = File.join(source, "_site")
      FileUtils.mkdir_p(File.join(source, "_layouts"))
      FileUtils.mkdir_p(File.join(source, "_includes"))
      FileUtils.mkdir_p(File.join(source, "_posts"))
      FileUtils.cp(File.join(REPOSITORY_ROOT, "_layouts", "post.html"), File.join(source, "_layouts"))
      FileUtils.cp(File.join(REPOSITORY_ROOT, "_includes", "read_next.html"), File.join(source, "_includes"))
      FileUtils.cp(File.join(REPOSITORY_ROOT, "_includes", "post_title.html"), File.join(source, "_includes"))
      FileUtils.cp(File.join(REPOSITORY_ROOT, "_includes", "post_metadata.html"), File.join(source, "_includes"))
      File.write(File.join(source, "_layouts", "default.html"), "---\n---\n{{ content }}")
      File.write(File.join(source, "_config.yml"), fixture_config)
      posts.each do |filename, contents|
        File.write(File.join(source, "_posts", filename), contents)
      end

      self.class.build_site(source, destination, safe: true)
      yield destination
    end
  end

  def fixture_config
    <<~YAML
      permalink: /:slug
      defaults:
        - scope:
            path: ""
            type: posts
          values:
            lang: en
    YAML
  end

  def fixture_post(title, essay: false, related_essay: nil, lang: nil, layout: "post", categories: nil, slug: nil, ref: nil)
    <<~MARKDOWN
      ---
      layout: #{layout}
      title: "#{title}"
      #{"post_type: essay" if essay}
      #{"lang: #{lang}" if lang}
      #{"categories: [#{categories.join(', ')}]" if categories}
      #{"slug: #{slug}" if slug}
      #{"ref: #{ref}" if ref}
      #{"related_essay: #{related_essay}" unless related_essay.nil?}
      ---
      Fixture content.
    MARKDOWN
  end
end

Minitest.after_run { ReadNextTest.shutdown }
