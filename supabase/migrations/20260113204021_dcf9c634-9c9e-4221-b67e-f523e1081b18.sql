-- Add home_city column to alert_settings table
ALTER TABLE public.alert_settings 
ADD COLUMN home_city text;

-- Add push_enabled column for push notification preferences
ALTER TABLE public.alert_settings 
ADD COLUMN push_enabled boolean NOT NULL DEFAULT false;

-- Add push_subscription column to store the push subscription object
ALTER TABLE public.alert_settings 
ADD COLUMN push_subscription jsonb;