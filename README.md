# THE BACKSTREETS COMMONWEALTH DATABASE

A secure-terminal website for the TBCW office (Roblox "Archived"). Members log in with personal access codes; all content lives in a Supabase database.

## For members
- Log in with your personal access code (`CALLSIGN-CODE`).
- **HR TERMINAL** → fill the wizard → **PUBLISH TO DATABASE**.
- Your dossier lands in the approval queue; the Administrator approves it and it goes live.
- Guests (shared guest code) see only the public promo page and brief archives.

## For the admin
- **Create a member**: Supabase dashboard → Authentication → Users → Add user
  (email: `callsign@tbcw.db`, password: the access code you hand out).
- **Roles**: Table Editor → `profiles` (`guest` / `base` / `extended` / `admin`).
- **Approve member dossiers**: site → [ ADMIN ] → APPROVAL QUEUE → [ APPROVE ].

## How to run locally
The site is fully static — any static server works. From the repo root:
```
python -m http.server 8080
```
Then open http://127.0.0.1:8080 (opening `index.html` via `file://` breaks data loading).
