-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create interview_sessions table
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_description TEXT,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'in_progress', 'completed')),
  current_question INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 5,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  feedback TEXT,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on interview_sessions
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for interview_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.interview_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.interview_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.interview_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create interview_questions table
CREATE TABLE public.interview_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'behavioral',
  user_answer TEXT,
  ai_feedback TEXT,
  score INTEGER,
  time_spent INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on interview_questions
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for interview_questions
CREATE POLICY "Users can view questions from their sessions" 
ON public.interview_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.interview_sessions 
    WHERE interview_sessions.id = interview_questions.session_id 
    AND interview_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert questions for their sessions" 
ON public.interview_questions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.interview_sessions 
    WHERE interview_sessions.id = interview_questions.session_id 
    AND interview_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update questions from their sessions" 
ON public.interview_questions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.interview_sessions 
    WHERE interview_sessions.id = interview_questions.session_id 
    AND interview_sessions.user_id = auth.uid()
  )
);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Create storage policies for resumes
CREATE POLICY "Users can view their own resumes" 
ON storage.objects 
FOR SELECT 
USING (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'resumes');

CREATE POLICY "Users can upload their own resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'resumes');

CREATE POLICY "Users can update their own resumes" 
ON storage.objects 
FOR UPDATE 
USING (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'resumes');

CREATE POLICY "Users can delete their own resumes" 
ON storage.objects 
FOR DELETE 
USING (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'resumes');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interview_questions_updated_at
  BEFORE UPDATE ON public.interview_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();