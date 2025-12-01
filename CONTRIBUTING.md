# Deploying Your VoiceOver Studio Project

This document provides a step-by-step guide to deploying your VoiceOver Studio application to the web using Firebase App Hosting, which connects directly to a GitHub repository.

This is the recommended and configured method for hosting this application, as it supports the full-stack Next.js features used in this project (like server-side voiceover generation).

---

### Step 1: Push Your Project to a New GitHub Repository

First, your project's code needs to live in a GitHub repository.

1.  **Create a New Repository:** Go to [GitHub.com](https://github.com/new) and create a new, empty repository. **Do not** initialize it with a `README` or other files.

2.  **Push Your Local Code to GitHub:** Open your terminal in the project directory and run the following commands. Replace `<YOUR_GITHUB_REPO_URL>` with the URL of the empty repository you just created.

    ```bash
    # (If you haven't already) Initialize a local git repository
    git init -b main

    # Add all your files to be tracked
    git add .

    # Create your first commit
    git commit -m "Initial commit of VoiceOver Studio"

    # Connect your local repository to the one on GitHub
    git remote add origin <YOUR_GITHUB_REPO_URL>

    # Push your code to GitHub
    git push -u origin main
    ```

---

### Step 2: Connect Firebase App Hosting to GitHub

Now, you will connect Firebase to your new GitHub repository.

1.  **Go to the Firebase Console:** Visit the [Firebase Console](https://console.firebase.google.com/).

2.  **Create a Firebase Project:** Either create a new Firebase project or select an existing one.

3.  **Navigate to App Hosting:** In the "Build" menu on the left sidebar, click on **App Hosting**.

4.  **Create a New Backend:**
    *   Click "Get started".
    *   You will be prompted to connect Firebase to your GitHub account. Authorize it to access your repositories.
    *   Choose the GitHub repository you just created for this project.
    *   In the setup screen, keep the default settings. Firebase will automatically detect your `apphosting.yaml` file and set the "Root directory" to `/`.
    *   Click "Finish and deploy".

---

### Step 3: Add the Gemini API Key as a Secret in Firebase

For security, your `GEMINI_API_KEY` is not stored in your GitHub repository. You must provide it to Firebase securely.

1.  After your App Hosting backend is created, you will see a dashboard for it.
2.  Click on the **Settings** tab for your backend.
3.  Scroll down to the **Secret Manager** section.
4.  Click **"Create secret"**.
5.  For the **Name**, enter `GEMINI_API_KEY`.
6.  For the **Value**, paste the same API key you are using in your local `.env` file.
7.  Click **"Create secret"** and then **"Save"**.

---

### Step 4: Your App is Live!

Firebase App Hosting will automatically start the first deployment as soon as you complete the setup. Once it's done, you'll be given a live URL (e.g., `your-app-name--backend-id.us-central1.run.app`).

From now on, every time you `git push` new changes to your `main` branch, Firebase will automatically build and deploy the new version of your application.
