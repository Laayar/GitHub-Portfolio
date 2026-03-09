# ☀️🧊 Weather Notifier – n8n Workflow

An automated n8n workflow that fetches the current weather for a configurable city, evaluates whether it is warm or cold, and sends a formatted email via Gmail. Includes built-in error handling for failed API calls.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Nodes – Step by Step](#nodes--step-by-step)
4. [Node Connections](#node-connections)
5. [Expressions Used](#expressions-used)
6. [Setup Instructions](#setup-instructions)
7. [Import the Workflow](#import-the-workflow)
8. [Customisation](#customisation)

---

## Overview

```
Schedule Trigger → Set City → Fetch Weather → API Success Check
                                                    │
                               ┌────────────────────┤
                               │ (success)          │ (error)
                               ▼                    ▼
                        Check Temperature     Send Error Email
                               │
                  ┌────────────┴────────────┐
                  │ (≥ 22 °C – Warm)        │ (< 22 °C – Cold)
                  ▼                         ▼
          Send Warm Email           Send Cold Email
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| n8n instance | Self-hosted or [n8n.cloud](https://n8n.cloud) |
| OpenWeatherMap account | Free tier – [openweathermap.org](https://openweathermap.org/api) |
| Gmail account | OAuth2 configured inside n8n |

---

## Nodes – Step by Step

### Node 1 – Schedule Trigger

| Property | Value |
|---|---|
| **Type** | `n8n-nodes-base.scheduleTrigger` |
| **Purpose** | Starts the workflow automatically every day at 07:00 AM |
| **Cron expression** | `0 7 * * *` |

The Schedule Trigger fires the workflow on a fixed schedule so you receive a daily weather briefing without any manual action. You can swap this for a **Manual Trigger** (`n8n-nodes-base.manualTrigger`) while testing.

---

### Node 2 – Set City

| Property | Value |
|---|---|
| **Type** | `n8n-nodes-base.set` |
| **Purpose** | Stores the target city and recipient email as named variables |

**Fields set:**

| Field | Default value | Description |
|---|---|---|
| `city` | `Casablanca` | City whose weather will be fetched |
| `recipientEmail` | `your-email@gmail.com` | Address that receives the weather email |

Keeping configurable values in a dedicated Set node makes it easy for beginners to find and update settings without touching any expressions inside other nodes.

---

### Node 3 – Fetch Weather

| Property | Value |
|---|---|
| **Type** | `n8n-nodes-base.httpRequest` |
| **Method** | `GET` |
| **URL** | `https://api.openweathermap.org/data/2.5/weather` |
| **Auth** | Query Auth credential (`appid` parameter) |
| **Continue On Fail** | `true` |

**Query parameters sent:**

| Parameter | Value | Description |
|---|---|---|
| `q` | `={{ $json.city }}` | City name from the previous Set City node |
| `units` | `metric` | Returns temperature in °C |
| `appid` | *(from credential)* | Your OpenWeatherMap API key – never hardcoded |

The **Continue On Fail** flag ensures the workflow keeps running even if the HTTP call fails (e.g. network timeout, invalid API key), routing the error to the **API Success Check** node which then sends an error email.

**Example API response (abbreviated):**

```json
{
  "name": "Casablanca",
  "main": {
    "temp": 19.3,
    "feels_like": 18.7,
    "humidity": 72
  },
  "weather": [
    { "description": "light rain" }
  ]
}
```

---

### Node 4 – API Success Check

| Property | Value |
|---|---|
| **Type** | `n8n-nodes-base.if` |
| **Purpose** | Validates that the API returned usable data |

**Condition:**

```
$json.main?.temp  →  exists
```

- **True branch (output 0):** Proceeds to the temperature evaluation.
- **False branch (output 1):** Sends an error email with the raw API response.

---

### Node 5 – Check Temperature

| Property | Value |
|---|---|
| **Type** | `n8n-nodes-base.if` |
| **Purpose** | Decides warm vs. cold based on the threshold of 22 °C |

**Condition:**

```
$json.main.temp  ≥  22
```

- **True branch (output 0):** Warm → routes to **Send Warm Email**.
- **False branch (output 1):** Cold → routes to **Send Cold Email**.

---

### Node 6 – Send Warm Email

| Property | Value |
|---|---|
| **Type** | `n8n-nodes-base.gmail` |
| **Operation** | `send` |
| **Triggered when** | Temperature ≥ 22 °C |

**Subject expression:**
```
☀️ Weather Alert: Warm in {{ $('Set City').item.json.city }}
```

**Body includes:**
- City name
- Status: *Warm 🌞*
- Temperature (°C)
- Feels-like temperature
- Humidity
- Weather description
- Suggestion: *"Great day to enjoy the outdoors! Don't forget your sunscreen and sunglasses."*

---

### Node 7 – Send Cold Email

| Property | Value |
|---|---|
| **Type** | `n8n-nodes-base.gmail` |
| **Operation** | `send` |
| **Triggered when** | Temperature < 22 °C |

**Subject expression:**
```
🧊 Weather Alert: Cold in {{ $('Set City').item.json.city }}
```

**Body includes:**
- City name
- Status: *Cold 🥶*
- Temperature (°C)
- Feels-like temperature
- Humidity
- Weather description
- Suggestion: *"Stay warm! Wear a coat and consider a hot drink before heading out."*

---

### Node 8 – Send Error Email

| Property | Value |
|---|---|
| **Type** | `n8n-nodes-base.gmail` |
| **Operation** | `send` |
| **Triggered when** | The API call failed or returned unexpected data |

**Subject expression:**
```
⚠️ Weather Notifier Error – Could not fetch weather for {{ $('Set City').item.json.city }}
```

**Body includes:**
- City name
- Raw JSON response from the API for debugging
- Reminder to check the API key and city name

---

## Node Connections

```
┌─────────────────────────────────────────────────────────────────────┐
│  Node                │  Output        │  Connected to               │
├─────────────────────────────────────────────────────────────────────┤
│  Schedule Trigger    │  main[0]       │  Set City                   │
│  Set City            │  main[0]       │  Fetch Weather              │
│  Fetch Weather       │  main[0]       │  API Success Check          │
│  API Success Check   │  main[0] (✅)  │  Check Temperature          │
│  API Success Check   │  main[1] (❌)  │  Send Error Email           │
│  Check Temperature   │  main[0] (🌞)  │  Send Warm Email            │
│  Check Temperature   │  main[1] (🥶)  │  Send Cold Email            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Expressions Used

All expressions below use n8n's **JavaScript expression** syntax wrapped in `{{ }}`.

| Node | Expression | Explanation |
|---|---|---|
| Fetch Weather – `q` param | `={{ $json.city }}` | Reads the `city` field set by the Set City node |
| API Success Check | `={{ $json.main?.temp }}` | Optional chaining prevents errors when `main` is absent; the `exists` operator validates the result |
| Check Temperature | `={{ $json.main.temp }}` | Reads the temperature value from the OpenWeatherMap response |
| Email – `sendTo` | `={{ $('Set City').item.json.recipientEmail }}` | Reads `recipientEmail` from the Set City node regardless of the current branch |
| Email – subject | `={{ $('Set City').item.json.city }}` | Inserts city name into the email subject |
| Email – body temp | `={{ $json.main.temp }}` | Inserts the current temperature into the email body |
| Email – body feels-like | `={{ $json.main.feels_like }}` | Inserts the feels-like temperature |
| Email – body humidity | `={{ $json.main.humidity }}` | Inserts the humidity percentage |
| Email – body description | `={{ $json.weather[0].description }}` | Inserts the human-readable weather description |
| Error email – raw data | `={{ JSON.stringify($json, null, 2) }}` | Pretty-prints the raw API response for debugging |

---

## Setup Instructions

### Step 1 – Get an OpenWeatherMap API Key

1. Register at [openweathermap.org](https://home.openweathermap.org/users/sign_up) (free).
2. Go to **API Keys** in your account dashboard.
3. Copy the generated key.

### Step 2 – Create a Query Auth Credential in n8n

1. In n8n, go to **Credentials → Add Credential**.
2. Search for **"Query Auth"** and select it.
3. Fill in:
   - **Name (credential):** `OpenWeatherMap API Key`
   - **Name (parameter):** `appid`
   - **Value:** `<your_openweathermap_api_key>`
4. Save.

### Step 3 – Create a Gmail OAuth2 Credential

> 📖 Full guide: [n8n Gmail credential docs](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/)

1. **Create a Google Cloud project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project.
2. **Enable the Gmail API**
   - In your project, navigate to **APIs & Services → Library**, search for *Gmail API*, and click **Enable**.
3. **Configure the OAuth consent screen**
   - Go to **APIs & Services → OAuth consent screen**.
   - Choose **External**, fill in the app name and your email, then save.
4. **Create OAuth 2.0 credentials**
   - Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Add the n8n redirect URI shown inside the n8n Gmail credential form as an **Authorised redirect URI**.
   - Copy the **Client ID** and **Client Secret**.
5. **Add the credential in n8n**
   - Go to **Credentials → Add Credential**, search for *"Gmail OAuth2"*.
   - Paste the Client ID and Client Secret, name the credential `Gmail Account`, and click **Sign in with Google** to authorise.

### Step 4 – Import the Workflow

See the [Import the Workflow](#import-the-workflow) section below.

### Step 5 – Configure the Workflow

1. Open the **Set City** node.
2. Change `city` to your desired city (e.g. `London`, `Paris`, `New York`).
3. Change `recipientEmail` to the email address that should receive notifications.

### Step 6 – Activate

Click the **Active** toggle in the top-right corner of the workflow editor. The workflow will now run automatically every morning at 07:00.

---

## Import the Workflow

1. In n8n, click **Workflows → Import from File**.
2. Select the `workflow.json` file from this folder.
3. After importing, open each credential placeholder and link it to your actual credentials:
   - In **Fetch Weather** node → select your `OpenWeatherMap API Key` credential.
   - In all three Gmail nodes → select your `Gmail Account` credential.

> **Note:** The `REPLACE_WITH_CREDENTIAL_ID` placeholder in the JSON is intentional. n8n will prompt you to link real credentials after import.

---

## Customisation

| What to change | Where |
|---|---|
| City | **Set City** node → `city` field |
| Recipient email | **Set City** node → `recipientEmail` field |
| Warm/cold threshold | **Check Temperature** node → right-hand value (default `22`) |
| Schedule | **Schedule Trigger** node → cron expression |
| Email content | **Send Warm Email** / **Send Cold Email** nodes → `message` field |

---

## Sample Emails

### Warm weather (≥ 22 °C)

> **Subject:** ☀️ Weather Alert: Warm in Casablanca
>
> **Body:**
> ☀️ Weather Update for Casablanca
>
> | | |
> |---|---|
> | Status | Warm 🌞 |
> | Temperature | 25°C |
> | Feels Like | 24.2°C |
> | Humidity | 61% |
> | Conditions | clear sky |
>
> 💡 *Suggestion: Great day to enjoy the outdoors! Don't forget your sunscreen and sunglasses.*

### Cold weather (< 22 °C)

> **Subject:** 🧊 Weather Alert: Cold in Casablanca
>
> **Body:**
> 🧊 Weather Update for Casablanca
>
> | | |
> |---|---|
> | Status | Cold 🥶 |
> | Temperature | 14°C |
> | Feels Like | 13.1°C |
> | Humidity | 80% |
> | Conditions | light rain |
>
> 💡 *Suggestion: Stay warm! Wear a coat and consider a hot drink before heading out.*
