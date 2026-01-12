-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', 'משתמש חדש'));
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Family groups table
CREATE TABLE public.family_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;

-- Family group members table
CREATE TABLE public.family_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.family_group_members ENABLE ROW LEVEL SECURITY;

-- Location updates during alerts
CREATE TABLE public.location_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_safe BOOLEAN DEFAULT false,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;

-- Safety check-ins
CREATE TABLE public.safety_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_safe BOOLEAN NOT NULL DEFAULT true,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_checkins ENABLE ROW LEVEL SECURITY;

-- Alert settings for each user
CREATE TABLE public.alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  alert_sound TEXT NOT NULL DEFAULT 'calm-bell',
  vibration_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_share_location BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

-- Family groups policies
CREATE POLICY "Users can view groups they are members of"
  ON public.family_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_group_members
      WHERE group_id = family_groups.id AND user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create groups"
  ON public.family_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their groups"
  ON public.family_groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their groups"
  ON public.family_groups FOR DELETE
  USING (auth.uid() = created_by);

-- Family group members policies
CREATE POLICY "Users can view members of their groups"
  ON public.family_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_group_members AS m
      WHERE m.group_id = family_group_members.group_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON public.family_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.family_group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Location updates policies
CREATE POLICY "Users can view locations of family members"
  ON public.location_updates FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_group_members AS m1
      JOIN public.family_group_members AS m2 ON m1.group_id = m2.group_id
      WHERE m1.user_id = auth.uid() AND m2.user_id = location_updates.user_id
    )
  );

CREATE POLICY "Users can insert their own location"
  ON public.location_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Safety checkins policies
CREATE POLICY "Users can view checkins of family members"
  ON public.safety_checkins FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_group_members AS m1
      JOIN public.family_group_members AS m2 ON m1.group_id = m2.group_id
      WHERE m1.user_id = auth.uid() AND m2.user_id = safety_checkins.user_id
    )
  );

CREATE POLICY "Users can create their own checkins"
  ON public.safety_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Alert settings policies
CREATE POLICY "Users can view their own settings"
  ON public.alert_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.alert_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.alert_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for location updates and safety checkins
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_checkins;

-- Policy for viewing profiles of family members
CREATE POLICY "Users can view profiles of family members"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_group_members AS m1
      JOIN public.family_group_members AS m2 ON m1.group_id = m2.group_id
      WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
    )
  );