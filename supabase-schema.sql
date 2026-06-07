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
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
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
-- RLS
-- ============================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users view other profiles" ON public.profiles
  FOR SELECT USING (true);
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
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.board_members
            WHERE board_id = boards.id AND user_id = auth.uid())
  );
CREATE POLICY "Users view public boards" ON public.boards
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users create boards" ON public.boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own boards" ON public.boards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Editors update member boards" ON public.boards
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.board_members
            WHERE board_id = boards.id AND user_id = auth.uid()
            AND role IN ('owner', 'editor'))
  );
CREATE POLICY "Users delete own boards" ON public.boards
  FOR DELETE USING (auth.uid() = user_id);

-- board_members
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View members" ON public.board_members;
DROP POLICY IF EXISTS "Owners manage members" ON public.board_members;

CREATE POLICY "View members" ON public.board_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.boards
               WHERE id = board_members.board_id AND user_id = auth.uid())
  );
CREATE POLICY "Owners manage members" ON public.board_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.boards
            WHERE id = board_members.board_id AND user_id = auth.uid())
  );

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
-- Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_members;

-- ============================================
-- Done
-- ============================================
