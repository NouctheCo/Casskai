#!/usr/bin/env python3
"""
Script to add emailRedirectTo parameter to signUp call
"""

import re

# Read the file
with open('src/components/guards/AuthGuard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the signUp call
old_pattern = r'''await signUp\(\{
        email: signUpForm\.email,
        password: signUpForm\.password,
        options: \{
          data: \{
            first_name: signUpForm\.firstName,
            last_name: signUpForm\.lastName,
          \},
        \},
      \}\);'''

new_code = '''await signUp({
        email: signUpForm.email,
        password: signUpForm.password,
        options: {
          data: {
            first_name: signUpForm.firstName,
            last_name: signUpForm.lastName,
          },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });'''

content = re.sub(old_pattern, new_code, content)

# Write back
with open('src/components/guards/AuthGuard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("OK Added emailRedirectTo parameter to signUp")
print("OK Users will now be redirected to /onboarding after email confirmation")
