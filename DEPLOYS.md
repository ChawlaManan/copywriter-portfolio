# Hosting Your Portfolio: GitHub & Vercel Guide

This guide details two methods for deploying your website live on Vercel.

---

## METHOD 1: Direct Command-Line Deploy (Fastest, No Git Required)

Since your system does not currently have `git` installed in the PATH, you can deploy your local directory directly to Vercel using the Vercel CLI:

1.  **Install Vercel CLI**:
    Open PowerShell and run:
    ```powershell
    npm install -g vercel
    ```
2.  **Deploy Directly**:
    Navigate to your project directory and type:
    ```powershell
    cd "C:\Users\Dell\.gemini\antigravity\scratch\copywriter-portfolio"
    vercel
    ```
    *   Vercel will prompt you to log in (or create a free account).
    *   Follow the command-line setup prompts (default options are recommended).
    *   Once complete, your site will be live on a production-ready preview URL!
3.  **Postgres Setup**:
    Follow the database setup steps in the Postgres section below.

---

## METHOD 2: Continuous Git Deployment (Recommended for Continuous Updates)

To connect your project to a GitHub repository so that Vercel automatically deploys every time you push code:

### Step 1: Install Git & Set Up Repo
1.  **Download Git**: Go to [git-scm.com/downloads](https://git-scm.com/downloads) and install it on Windows.
2.  **Create GitHub Repository**:
    *   Go to [github.com](https://github.com), sign in, and click **New Repository**.
    *   Name it (e.g. `copywriter-portfolio`), keep it Public/Private, and click **Create** (do *not* initialize with a README).
3.  **Push Your Files**:
    Open Git Bash (or PowerShell after restarting to apply git environment paths) and run:
    ```bash
    cd "C:\Users\Dell\.gemini\antigravity\scratch\copywriter-portfolio"
    git init
    git add .
    git commit -m "initial release"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git push -u origin main
    ```

### Step 2: Connect GitHub to Vercel
1.  Go to [vercel.com](https://vercel.com) and log in.
2.  Click **Add New...** -> **Project**.
3.  Authorize/connect your GitHub account and import your `copywriter-portfolio` repository.
4.  Keep default deployment settings and click **Deploy**.

---

## CONTACT FORM & INQUIRIES DELIVERY

The contact form is configured with a resilient, multi-tiered transmission architecture:

### 1. Direct Email Delivery to Your Inbox (Zero-Config, Works Out of the Box)
- Every submission is automatically formatted and forwarded directly to **`chawlamanan@outlook.com`**.
- **First-Time Activation**: The very first time a submission is sent through the form, FormSubmit sends a quick one-time verification email to `chawlamanan@outlook.com` with an "Activate Form" button. Click it once, and all future client inquiries will land directly in your inbox instantly.
- The sender's email is set as `Reply-To`, allowing you to reply to prospective clients with a single click.

### 2. Database Archiving (Optional with Vercel Postgres)
- If you have linked a Vercel Postgres database to your project, submissions are also stored in a database table (`contact_submissions`) for archiving and backup.
- The table is **created automatically** by the API on first submission—no manual SQL queries are required.

### 3. Client-Side & Offline Fallbacks
- If the serverless API is offline (e.g. running locally via a simple static web server), the browser automatically routes the submission through the direct client-side delivery bridge.
- If network connection fails completely, the form surfaces a one-click pre-filled email draft button directly to your email address.
