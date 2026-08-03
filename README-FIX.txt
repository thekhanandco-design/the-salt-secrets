DASHBOARD BUILD ERROR FIX

Replace this exact file in your project:
src/app/admin/page.tsx

Then run in PowerShell:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev

This version moves the country flag helper to a safe top-level position and avoids the parser issue around Record<string,string>.
