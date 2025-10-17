import React, { useEffect } from 'react';
import ExperienceStep from './onboarding/ExperienceStep';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function PostLoginExperience() {
  // This page shows the ExperienceStep exactly once and marks the user metadata
  useEffect(() => {
    const markSeen = async () => {
      try {
        // Update user metadata to mark seen_experience true
        await supabase.auth.updateUser({ data: { seen_experience: true } } as any);
        if (typeof window !== 'undefined') localStorage.setItem('seen_experience', 'true');
      } catch (e) {
        // Best effort: store locally
        if (typeof window !== 'undefined') localStorage.setItem('seen_experience', 'true');
      }
    };

    markSeen();
  }, []);

  return <ExperienceStep />;
}
