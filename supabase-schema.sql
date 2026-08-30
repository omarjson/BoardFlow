-- ============================================
-- BoardFlow — Supabase Schema
-- ============================================
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- Idempotent: safe to re-run (drops + recreates)
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. boards
-- ============================================
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Board',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  template TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTE: items JSONB column removed — items are stored in the dedicated items table only.
-- ⚠️ If migrating an existing database, run this exactly once:
-- ALTER TABLE public.boards DROP COLUMN IF EXISTS items;

CREATE INDEX IF NOT EXISTS idx_boards_user_id ON public.boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_share_token ON public.boards(share_token);
CREATE INDEX IF NOT EXISTS idx_boards_is_public ON public.boards(is_public);

-- ============================================
-- 3. board_members
-- ============================================
CREATE TABLE IF NOT EXISTS public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON public.board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON public.board_members(user_id);

-- ============================================
-- 4. items
-- ============================================
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'sticky_note', 'rich_note', 'sketch', 'screenshot',
    'link_card', 'roadmap', 'file', 'audio', 'video',
    'image', 'connection'
  )),
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 200,
  height FLOAT DEFAULT 200,
  rotation FLOAT DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  color TEXT,
  title TEXT,
  content TEXT,
  url TEXT,
  file_url TEXT,
  file_provider TEXT,
  file_id TEXT,
  sketch_data JSONB,
  metadata JSONB,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_board_id ON public.items(board_id);
CREATE INDEX IF NOT EXISTS idx_items_created_by ON public.items(created_by);
CREATE INDEX IF NOT EXISTS idx_items_type ON public.items(type);

-- ============================================
-- 5. chat_messages
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_board_id ON public.chat_messages(board_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- ============================================
-- updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_boards_updated_at ON public.boards;
CREATE TRIGGER trg_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_items_updated_at ON public.items;
CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS Helpers — SECURITY DEFINER to avoid infinite recursion
-- These functions bypass RLS (run as postgres) so policies can
-- reference boards ↔ board_members without looping.
-- ============================================
CREATE OR REPLACE FUNCTION public.is_board_owner(bid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.boards WHERE id = bid AND user_id = auth.uid());
$$;
CREATE OR REPLACE FUNCTION public.is_board_member(bid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.board_members WHERE board_id = bid AND user_id = auth.uid());
$$;
CREATE OR REPLACE FUNCTION public.is_board_editor(bid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.board_members WHERE board_id = bid AND user_id = auth.uid() AND role IN ('owner','editor'));
$$;
CREATE OR REPLACE FUNCTION public.can_view_profile(target_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() = target_id
  OR EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.board_members bm WHERE bm.board_id = b.id AND bm.user_id = target_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.user_id = target_id AND EXISTS (SELECT 1 FROM public.board_members bm WHERE bm.board_id = b.id AND bm.user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.board_members bm1
    JOIN public.board_members bm2 ON bm1.board_id = bm2.board_id
    WHERE bm1.user_id = auth.uid() AND bm2.user_id = target_id
  );
$$;
CREATE OR REPLACE FUNCTION public.find_user_id_by_email(email text)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE profiles.email = find_user_id_by_email.email LIMIT 1;
$$;

-- ============================================
-- RLS
-- ============================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view collaborator profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users view collaborator profiles" ON public.profiles
  FOR SELECT USING (public.can_view_profile(id));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- boards
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own boards" ON public.boards;
DROP POLICY IF EXISTS "Users view member boards" ON public.boards;
DROP POLICY IF EXISTS "Users view public boards" ON public.boards;
DROP POLICY IF EXISTS "Users create boards" ON public.boards;
DROP POLICY IF EXISTS "Users update own boards" ON public.boards;
DROP POLICY IF EXISTS "Users delete own boards" ON public.boards;
DROP POLICY IF EXISTS "Editors update member boards" ON public.boards;

CREATE POLICY "Users view own boards" ON public.boards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view member boards" ON public.boards
  FOR SELECT USING (public.is_board_member(id));
CREATE POLICY "Users view public boards" ON public.boards
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users create boards" ON public.boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own boards" ON public.boards
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Editors update member boards" ON public.boards
  FOR UPDATE USING (public.is_board_editor(id)) WITH CHECK (public.is_board_editor(id));
CREATE POLICY "Users delete own boards" ON public.boards
  FOR DELETE USING (auth.uid() = user_id);
-- Share links: enumeration blocked. Use RPC get_board_by_token(token) for anon access.
-- No anonymous share_token IS NOT NULL policy.

-- board_members
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View members" ON public.board_members;
DROP POLICY IF EXISTS "Owners manage members" ON public.board_members;
DROP POLICY IF EXISTS "Owners add members" ON public.board_members;
DROP POLICY IF EXISTS "Owners update members" ON public.board_members;
DROP POLICY IF EXISTS "Owners remove members" ON public.board_members;

CREATE POLICY "View members" ON public.board_members
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_board_owner(board_id) OR public.is_board_member(board_id)
  );
CREATE POLICY "Owners add members" ON public.board_members
  FOR INSERT WITH CHECK (public.is_board_owner(board_id));
CREATE POLICY "Owners update members" ON public.board_members
  FOR UPDATE USING (public.is_board_owner(board_id)) WITH CHECK (public.is_board_owner(board_id));
CREATE POLICY "Owners remove members" ON public.board_members
  FOR DELETE USING (public.is_board_owner(board_id));

-- items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View items on own boards" ON public.items;
DROP POLICY IF EXISTS "View items on member boards" ON public.items;
DROP POLICY IF EXISTS "View items on public boards" ON public.items;
DROP POLICY IF EXISTS "Editors insert items" ON public.items;
DROP POLICY IF EXISTS "Editors update items" ON public.items;
DROP POLICY IF EXISTS "Editors delete items" ON public.items;

CREATE POLICY "View items on own boards" ON public.items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.boards
            WHERE id = items.board_id AND user_id = auth.uid())
  );
CREATE POLICY "View items on member boards" ON public.items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.board_members
            WHERE board_id = items.board_id AND user_id = auth.uid())
  );
CREATE POLICY "View items on public boards" ON public.items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.boards
            WHERE id = items.board_id AND is_public = true)
  );
-- Anonymous items via share link removed — use RPC for token-gated access
CREATE POLICY "Editors insert items" ON public.items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE id = items.board_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.board_members
      WHERE board_id = items.board_id AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );
CREATE POLICY "Editors update items" ON public.items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.boards
            WHERE id = items.board_id AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.board_members
      WHERE board_id = items.board_id AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );
CREATE POLICY "Editors delete items" ON public.items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.boards
            WHERE id = items.board_id AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.board_members
      WHERE board_id = items.board_id AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

-- chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View chat on own boards" ON public.chat_messages;
DROP POLICY IF EXISTS "View chat on member boards" ON public.chat_messages;
DROP POLICY IF EXISTS "View chat on public boards" ON public.chat_messages;
DROP POLICY IF EXISTS "Members send messages" ON public.chat_messages;

CREATE POLICY "View chat on own boards" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.boards
            WHERE id = chat_messages.board_id AND user_id = auth.uid())
  );
CREATE POLICY "View chat on member boards" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.board_members
            WHERE board_id = chat_messages.board_id AND user_id = auth.uid())
  );
CREATE POLICY "View chat on public boards" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.boards
            WHERE id = chat_messages.board_id AND is_public = true)
  );
CREATE POLICY "Members send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM public.boards
              WHERE id = chat_messages.board_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.board_members
                 WHERE board_id = chat_messages.board_id AND user_id = auth.uid())
    )
  );

-- ============================================
-- Chat message cleanup — call periodically to save storage
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_messages(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.chat_messages
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call via: SELECT public.cleanup_old_chat_messages(30);
-- Or set up as a cron job (Supabase pg_cron) on paid plans:
-- SELECT cron.schedule('cleanup-chat', '0 0 * * 0', $$SELECT public.cleanup_old_chat_messages(30);$$);

-- ============================================
-- Share link gated access (SECURE: no enumeration)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_board_by_token(p_token TEXT)
RETURNS SETOF public.boards
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.boards WHERE share_token = p_token LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.get_items_by_token(p_token TEXT)
RETURNS SETOF public.items
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.* FROM public.items i JOIN public.boards b ON b.id = i.board_id WHERE b.share_token = p_token;
$$;

-- ============================================
-- Delete account (called from settings)
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- delete owned boards (cascade deletes items/members/chat)
  DELETE FROM public.boards WHERE user_id = auth.uid();
  -- delete memberships
  DELETE FROM public.board_members WHERE user_id = auth.uid();
  -- delete profile
  DELETE FROM public.profiles WHERE id = auth.uid();
  -- delete auth user (requires service role via trigger; if fails, profile delete is enough)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- ============================================
-- Realtime
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'board_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.board_members;
  END IF;
END $$;

-- ============================================
-- Storage bucket for board files (run once)
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('boardflow', 'boardflow', true)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public read boardflow" ON storage.objects;
CREATE POLICY "Public read boardflow" ON storage.objects FOR SELECT USING (bucket_id = 'boardflow');
DROP POLICY IF EXISTS "Users upload boardflow" ON storage.objects;
CREATE POLICY "Users upload boardflow" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'boardflow' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users update own boardflow" ON storage.objects;
CREATE POLICY "Users update own boardflow" ON storage.objects FOR UPDATE USING (bucket_id = 'boardflow' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users delete own boardflow" ON storage.objects;
CREATE POLICY "Users delete own boardflow" ON storage.objects FOR DELETE USING (bucket_id = 'boardflow' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- Done
-- ============================================
