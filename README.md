# Discord Account Manager

A Chrome extension (Manifest V3) that lets you store and instantly switch between multiple Discord accounts.

## Features

- **Add accounts by token** — paste one token or many, one per line
- **One-click login** — injects the selected token into your active Discord tab (opens one if needed)
- **Logout button** — clears the token from the current tab
- **Delete accounts** — remove any saved account from the list
- **Export** — copy all saved tokens to clipboard (one per line) as a backup
- **Import** — paste the exported tokens back in to restore
- **Account badges** — Nitro and Hypesquad flags per account
- **Auto-capture** — reads the token from the current Discord tab's `localStorage` with no pasting

## Install (unpacked)

1. Clone or download this repo
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select this folder

## Usage

| Button | What it does |
|---|---|
| **Add Token & Login** | Validates and stores the token(s), then logs into the first one |
| **Add Current Account** | Stores the token(s) without switching |
| **Login** | Switches to that account |
| **Logout** | Logs out of the active Discord tab |
| **Export** | Copies all tokens to clipboard |
| **Trash** | Deletes the account from storage |

## Privacy

- Tokens are stored in `chrome.storage.sync` (synced through your Google account).
- The extension never sends tokens anywhere except `discord.com` itself, to validate and log in.
- No analytics, no tracking, no external servers.

## Disclaimer

Not affiliated with or endorsed by Discord. Use at your own risk; automating or managing multiple accounts may be subject to Discord's Terms of Service.
