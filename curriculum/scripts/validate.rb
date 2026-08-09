#!/usr/bin/env ruby
# frozen_string_literal: true

require "pathname"
require "yaml"

ROOT = Pathname.new(__dir__).join("../..").expand_path
LOCALES = %w[en es].freeze

def fail_validation(message)
  warn "CV validation failed: #{message}"
  exit 1
end

def load_yaml(path)
  YAML.safe_load_file(path, aliases: false)
rescue Psych::Exception => error
  fail_validation("#{path.relative_path_from(ROOT)} contains invalid YAML: #{error.message}")
end

def fetch_path(data, path, filename)
  path.reduce(data) do |value, key|
    unless value.is_a?(Hash) && value.key?(key)
      fail_validation("#{filename} is missing #{path.join('.')}")
    end
    value[key]
  end
end

def require_text(data, path, filename)
  value = fetch_path(data, path, filename)
  fail_validation("#{filename} has an empty #{path.join('.')}") unless value.is_a?(String) && !value.strip.empty?
end

private_path = ROOT.join("curriculum/data/private.yml")
unless private_path.file?
  fail_validation("curriculum/data/private.yml is missing; copy curriculum/data/private.example.yml and add your details")
end

private_data = load_yaml(private_path)
%w[display href].each do |key|
  require_text(private_data, ["phone", key], "curriculum/data/private.yml")
  require_text(private_data, ["email", key], "curriculum/data/private.yml")
end
require_text(private_data, ["portrait_path"], "curriculum/data/private.yml")

fail_validation("phone.href must start with tel:") unless private_data.dig("phone", "href").start_with?("tel:")
fail_validation("email.href must start with mailto:") unless private_data.dig("email", "href").start_with?("mailto:")

portrait_path = ROOT.join(private_data["portrait_path"]).expand_path
unless portrait_path.to_s.start_with?("#{ROOT}/") && portrait_path.file?
  fail_validation("portrait_path must point to an existing file inside this repository")
end

required_text_paths = [
  %w[meta html_lang],
  %w[meta title],
  %w[meta description],
  %w[meta kicker],
  %w[meta annotation],
  %w[meta last_updated],
  %w[identity name],
  %w[identity professional_title],
  %w[identity portrait_alt],
  %w[contact aria_label],
  %w[contact location],
  %w[sections profile],
  %w[sections experience],
  %w[sections skills],
  %w[sections languages],
  %w[sections education],
  ["profile"]
].freeze

locale_data = LOCALES.to_h do |locale|
  relative_path = "curriculum/data/#{locale}.yml"
  path = ROOT.join(relative_path)
  fail_validation("#{relative_path} is missing") unless path.file?

  data = load_yaml(path)
  required_text_paths.each { |key_path| require_text(data, key_path, relative_path) }

  %w[skip navigation_label english spanish print checking fits_normal fits_compact overflow].each do |key|
    require_text(data, ["controls", key], relative_path)
  end

  %w[experience skills languages education].each do |section|
    value = fetch_path(data, [section], relative_path)
    fail_validation("#{relative_path} must contain a non-empty #{section} list") unless value.is_a?(Array) && !value.empty?
  end

  data["experience"].each_with_index do |role, index|
    %w[id title dates start].each do |key|
      fail_validation("#{relative_path} experience item #{index + 1} is missing #{key}") unless role[key].is_a?(String) && !role[key].strip.empty?
    end
  end

  data["languages"].each_with_index do |language, index|
    %w[language level].each do |key|
      fail_validation("#{relative_path} language item #{index + 1} is missing #{key}") unless language[key].is_a?(String) && !language[key].strip.empty?
    end
  end

  data["education"].each_with_index do |item, index|
    %w[id qualification institution dates start end].each do |key|
      fail_validation("#{relative_path} education item #{index + 1} is missing #{key}") unless item[key].is_a?(String) && !item[key].strip.empty?
    end
  end

  [locale, data]
end

experience_ids = locale_data.values.map { |data| data["experience"].map { |item| item["id"] } }
education_ids = locale_data.values.map { |data| data["education"].map { |item| item["id"] } }
fail_validation("English and Spanish experience entries must use the same IDs and order") unless experience_ids.uniq.one?
fail_validation("English and Spanish education entries must use the same IDs and order") unless education_ids.uniq.one?

puts "CV data valid for #{LOCALES.join(' and ')}"
