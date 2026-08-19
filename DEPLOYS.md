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

## postgres DATABASE CONFIGURATION (Required for Contact Form)

Once your project is initialized on Vercel:

1.  **Link Database**:
    *   Inside your project dashboard on Vercel, navigate to the **Storage** tab.
    *   Click **Connect Database**, select **Postgres**, and click **Create**.
    *   This will link a Postgres cluster to your project, injecting the database environment variables automatically.
2.  **Create SQL Table**:
    *   Under the **Storage** tab, click **Query Console**.
    *   Paste and run this SQL query to initialize the database:
        ```sql
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            project_type VARCHAR(100),
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ```
3.  **Local Environment Fetching (Optional)**:
    If you ever want to check connection strings locally, install the CLI, link your project, and pull the configurations:
    ```powershell
    vercel link
    vercel env pull .env.local
    ```
