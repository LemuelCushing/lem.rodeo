#!/usr/bin/env ruby
# frozen_string_literal: true

# Pre-parses the two Bulgarian OSIS Bibles from gratis-bible@<pinned> into
# per-book JSON shipped as static assets (public/data/bg/<bibleId>/<OsisBook>.json).
# Run manually: bundle exec ruby scripts/build_bulgarian.rb

require "nokogiri"
require "open-uri"
require "json"
require "fileutils"

PINNED_REF = "252c53a7e51916f6f2bf329b477f1ca6f2016b15"
RAW_BASE = "https://raw.githubusercontent.com/gratis-bible/bible/#{PINNED_REF}/bg"
DATA_ROOT = File.expand_path("../public/data/bg", __dir__)
OSIS_NS = { "osis" => "http://www.bibletechnologies.net/2003/OSIS/namespace" }

SOURCES = {
  "gb-bulcarigradnt" => "bulcarigradnt.xml",
  "gb-bulveren"      => "bulveren.xml"
}

def parse(xml)
  doc = Nokogiri::XML(xml)
  # Notes and titles can sit inside or near a verse; strip them once so verse
  # text is just the verse text. Defensive — these two files don't use them.
  doc.css("note, title").each(&:remove)

  doc.xpath("//osis:verse[@osisID]", OSIS_NS).each_with_object({}) do |node, books|
    book, chapter, verse = node["osisID"].split(".")
    text = node.text.gsub(/\s+/, " ").strip
    next if text.empty?

    (books[book] ||= {})["#{chapter}.#{verse}"] = text
  end
end

def write_book(bible_id, book, verses)
  dir = File.join(DATA_ROOT, bible_id)
  FileUtils.mkdir_p(dir)
  File.write(File.join(dir, "#{book}.json"), JSON.generate(verses))
end

SOURCES.each do |bible_id, filename|
  warn "→ #{bible_id} (#{filename})"
  xml = URI.open("#{RAW_BASE}/#{filename}", &:read)
  books = parse(xml)
  books.each { |book, verses| write_book(bible_id, book, verses) }
  warn "  #{books.size} books, #{books.values.sum(&:size)} verses"
end
