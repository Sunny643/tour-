-- Placeholder music library. NOT licensed for production use.
-- TODO: before production launch, replace file_url values with tracks licensed
-- from Epidemic Sound / Artlist (or equivalent) and flip is_placeholder to false.
-- Per CLAUDE.md: never ship unlicensed tracks to real customers.

INSERT INTO music_tracks (name, mood_tags, suggested_persona, file_url, duration_seconds, is_placeholder) VALUES
  ('Placeholder - Warm Piano',    ARRAY['calm', 'warm'],          'agent', 'https://example-placeholder-audio.local/warm-piano.mp3',    120, true),
  ('Placeholder - Modern Ambient',ARRAY['calm', 'modern'],        'agent', 'https://example-placeholder-audio.local/modern-ambient.mp3',120, true),
  ('Placeholder - Uplifting Corp',ARRAY['upbeat', 'confident'],   'agent', 'https://example-placeholder-audio.local/uplifting-corp.mp3',120, true),
  ('Placeholder - Chill Pop',     ARRAY['upbeat', 'social'],      'host',  'https://example-placeholder-audio.local/chill-pop.mp3',      90,  true),
  ('Placeholder - Tropical House',ARRAY['upbeat', 'luxury'],      'host',  'https://example-placeholder-audio.local/tropical-house.mp3', 90,  true),
  ('Placeholder - Acoustic Cozy', ARRAY['calm', 'cozy'],          'both',  'https://example-placeholder-audio.local/acoustic-cozy.mp3',  90,  true);
