-- Migration 001: Profiles & Workspaces
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- WORKSPACES (Multi-Workspace Capability)
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- WORKSPACE SETTINGS
CREATE TABLE public.workspace_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE NOT NULL,
    company_name TEXT,
    gstin TEXT,
    bank_name TEXT,
    bank_account_no TEXT,
    bank_ifsc TEXT,
    upi_id TEXT,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Select profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Update profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for workspaces
CREATE POLICY "All workspaces" ON public.workspaces FOR ALL USING (auth.uid() = profile_id);

-- Policies for workspace settings
CREATE POLICY "All workspace settings" ON public.workspace_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = workspace_settings.workspace_id AND profile_id = auth.uid()
    )
);

-- Trigger for Auto-Creating Profile and Workspace on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
        new.raw_user_meta_data->>'avatar_url'
    );
    
    -- Insert default workspace
    INSERT INTO public.workspaces (profile_id, name)
    VALUES (new.id, 'My Default Workspace')
    RETURNING id INTO new_workspace_id;
    
    -- Insert default workspace settings
    INSERT INTO public.workspace_settings (workspace_id, company_name)
    VALUES (new_workspace_id, 'Freelancer Payouts Workspace');
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_profile ON public.workspaces(profile_id);
CREATE INDEX IF NOT EXISTS idx_workspace_settings_workspace ON public.workspace_settings(workspace_id);
