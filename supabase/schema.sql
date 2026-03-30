-- Dev 1: Initial Database Schema (Phase 1)
-- Run this in your Supabase SQL Editor to establish tables and RLS permissions.

-- 1. Create Users Table (Tracks accounts extended from Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) for public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile." ON public.users FOR SELECT USING (auth.uid() = id);

-- 2. Create Simulations Table (Tracks historical simulation runs)
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  purpose TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  state_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for public.simulations
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own simulations." ON public.simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own simulations." ON public.simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own simulations." ON public.simulations FOR UPDATE USING (auth.uid() = user_id);
