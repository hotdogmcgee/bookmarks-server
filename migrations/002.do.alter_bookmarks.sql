CREATE TYPE test_category AS ENUM (
    'Listicle',
    'How-to',
    'News',
    'Interview',
    'Story'
);

ALTER TABLE bookmarks_list
  ADD COLUMN
    style test_category;