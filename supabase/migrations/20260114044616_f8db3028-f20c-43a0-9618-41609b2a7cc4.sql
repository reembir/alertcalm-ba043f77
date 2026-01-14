-- Allow users to find groups by invite_code (needed for joining)
CREATE POLICY "Anyone can find groups by invite code" 
ON public.family_groups 
FOR SELECT 
USING (true);

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.family_groups;