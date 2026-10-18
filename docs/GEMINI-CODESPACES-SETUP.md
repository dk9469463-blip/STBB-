# Restore Gemini AI in GitHub Codespaces

SindhLearn's AI Study Assistant needs a valid Google Gemini API key. Code changes cannot re-enable a disabled Google AI Studio key, remove a provider quota, or turn on billing for an account.

## 1. Check the Google API key

1. Open Google AI Studio: https://aistudio.google.com/apikey
2. Select the Google account and project you want to use.
3. Create a new API key if the old key/project is disabled or revoked.
4. Check usage and rate limits: https://ai.dev/rate-limit
5. If Google reports quota/billing restrictions, follow the account's Google AI Studio instructions. Switching models does not bypass an account-level quota.

Never paste the key into chat, frontend code, GitHub commits, or a public repository.

## 2. Add the key to Codespaces

1. Open the repository: https://github.com/dk9469463-blip/STBB-
2. Open **Settings → Secrets and variables → Codespaces**.
3. Select **New repository secret**.
4. Set the name to `GEMINI_API_KEY` and the value to the new key from Google AI Studio.
5. Save it. Make sure the secret is available to this repository/Codespace.
6. Stop and restart the Codespace so the server receives the new environment variable.

If you use a local `.env` file instead, add `GEMINI_API_KEY=your_key_here` there. Do not commit `.env`; keep it private. The repository's `.env.example` is only a template and is not read as a secret.

## 3. Start and test in Codespaces

In the Codespaces terminal run:

```bash
npm install
npm run dev
```

Open port **3000** in the Ports tab and test the AI assistant with a short question. If the key is valid but a provider quota has been reached, wait for the quota reset or resolve the account/project restriction in Google AI Studio.

## What changed in this repository

The server now prefers text-generation models that Google actually lists for the configured key, rather than letting a stale model name take up a fallback attempt. If model discovery is temporarily unavailable, it uses a short list of fallback model names. This can fix unavailable/retired model errors; it cannot bypass a disabled key or exhausted quota.
