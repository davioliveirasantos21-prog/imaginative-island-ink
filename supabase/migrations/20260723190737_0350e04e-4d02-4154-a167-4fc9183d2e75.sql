GRANT SELECT ON public.game_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.game_content TO authenticated;
GRANT ALL ON public.game_content TO service_role;