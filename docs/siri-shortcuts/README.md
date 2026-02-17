# Siri Shortcuts for Family Dashboard

Two Apple Shortcuts that let you manage groceries and timers hands-free via Siri. Items added through Siri appear on the wall display in real-time.

- **Grocery Shortcut** -- Say "Hey Siri, grocery" to add items to the shared grocery list
- **Timer Shortcut** -- Say "Hey Siri, timer" to start a kitchen timer on the wall display

## Prerequisites

You need two values from your Supabase project. Find them in the [Supabase Dashboard](https://supabase.com/dashboard):

1. Open your project
2. Go to **Settings** (gear icon) > **API**
3. Copy the **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
4. Copy the **anon public** key under "Project API keys"

You will paste these values into the Shortcuts where you see `[YOUR_SUPABASE_URL]` and `[YOUR_ANON_KEY]`.

## Setup Guides

Follow these step-by-step guides to create each Shortcut in the Apple Shortcuts app on your iPhone:

1. [Grocery Shortcut Guide](grocery-shortcut.md) -- Voice-add items to the shared grocery list
2. [Timer Shortcut Guide](timer-shortcut.md) -- Voice-start timers that show on the wall display

## How It Works

The Shortcuts use Supabase's REST API (PostgREST) to insert rows directly into the same `groceries` and `timers` database tables that the wall display reads from. Because the dashboard subscribes to real-time changes on these tables, new items appear on all connected devices within seconds.

```
iPhone (Siri) --> Apple Shortcut --> Supabase REST API --> Database
                                                              |
Wall Display <-- Realtime Subscription <-----------------------
```

No app code changes are needed. The Shortcuts are self-contained.

## Sharing with Family

After creating and testing both Shortcuts on your iPhone:

1. Open the **Shortcuts** app
2. Long-press the Shortcut you want to share
3. Tap **Share**
4. Tap **Copy iCloud Link**
5. Send the link to family members via Messages, AirDrop, or email
6. Family members tap the link to install the Shortcut on their own device

Each family member gets their own copy. The Supabase URL and anon key are embedded in the Shortcut, so recipients do not need to configure anything.

## Security Note

The Shortcuts use the Supabase **anon** key (the same key used by the browser-based dashboard). This key is safe to embed in the Shortcuts -- it is already public in the web app's client-side code. Row Level Security (RLS) policies with row count limits protect against abuse.
