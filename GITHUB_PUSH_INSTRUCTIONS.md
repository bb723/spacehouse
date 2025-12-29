# GitHub Push Instructions

Your repository is ready to push! I've already:
✅ Initialized git repository
✅ Added all files
✅ Created initial commit with 41 files

## Next Steps (You Need To Do These):

### Step 1: Create a New Repository on GitHub

1. Go to https://github.com/new
2. **Repository name**: `spacehouse` (or any name you prefer)
3. **Description**: "TerraBuild - Parametric Building Configurator with Wall Elevation Viewer"
4. **Visibility**: Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### Step 2: Link and Push

GitHub will show you instructions. Use the **"push an existing repository"** section.

Run these commands in your terminal:

```bash
cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse"

# Add GitHub as remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/spacehouse.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Example** (if your username is "brett-dev"):
```bash
git remote add origin https://github.com/brett-dev/spacehouse.git
git branch -M main
git push -u origin main
```

### Step 3: Authenticate

When you run `git push`, you'll be prompted to authenticate:

**Option A: GitHub Desktop (Easiest)**
- Install GitHub Desktop from https://desktop.github.com/
- Sign in with your GitHub account
- It will handle authentication automatically

**Option B: Personal Access Token**
- Go to https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Select scopes: `repo` (all checkboxes)
- Generate and copy the token
- Use the token as your password when prompted

**Option C: SSH Key**
- Follow GitHub's SSH guide: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### Step 4: Verify

After pushing, visit your repository URL:
```
https://github.com/YOUR_USERNAME/spacehouse
```

You should see all your files!

---

## Quick Commands Summary

```bash
# 1. Create repo on github.com
# 2. Then run:

cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse"
git remote add origin https://github.com/YOUR_USERNAME/spacehouse.git
git branch -M main
git push -u origin main

# 3. Enter your GitHub credentials when prompted
```

---

## What's Already Done ✅

- Git repository initialized
- All files added and committed
- Commit message includes:
  - Feature list
  - Component descriptions
  - Co-authored by Claude Sonnet 4.5

**Commit hash**: `d088e40`
**Branch**: `master` (will be renamed to `main` in Step 2)
**Files committed**: 41 files, 11,741 lines

---

## Pulling on Another PC

Once pushed, on any other PC:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/spacehouse.git

# Enter the directory
cd spacehouse

# Install frontend dependencies
cd frontend
npm install

# Go back to root
cd ..

# Run backend (Terminal 1)
python api.py

# Run frontend (Terminal 2)
cd frontend
npm run dev
```

---

## Troubleshooting

**"remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/spacehouse.git
```

**"Authentication failed"**
- Use a Personal Access Token instead of password
- Or use GitHub Desktop for easier authentication

**"Permission denied (publickey)"**
- You're trying to use SSH without setting up SSH keys
- Either set up SSH keys or use HTTPS URL instead

**"Repository not found"**
- Make sure you created the repository on GitHub first
- Check the URL is correct
- Verify you have permission to push to that repository

---

## Alternative: Use GitHub Desktop (Recommended for Beginners)

1. Download GitHub Desktop: https://desktop.github.com/
2. Install and sign in
3. Click "Add" → "Add Existing Repository"
4. Browse to: `C:\Users\brett\OneDrive\Desktop\Applications\spacehouse`
5. Click "Publish repository"
6. Choose visibility (Public/Private)
7. Click "Publish repository"

Done! It's that easy with GitHub Desktop.

---

## Current Status

Your local repository is ready. You just need to:
1. Create the GitHub repository
2. Link it with `git remote add`
3. Push with `git push`

Let me know if you need help with any of these steps!
