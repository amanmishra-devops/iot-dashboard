# NexHome — Complete Build Guide
### From Hardware to Cloud Deployment

---

## Overview: 3-Layer Architecture

```
Layer 1 — Hardware      : ESP32 + Relay Module (physical device)
Layer 2 — Backend       : Flask REST API on AWS EC2 (cloud server)
Layer 3 — Frontend      : React Dashboard on Vercel (web interface)
```

All three layers communicate over HTTP. The ESP32 polls the server every 2 seconds. The React app sends commands to the same server. No WebSockets — pure HTTP, simple and reliable.

---

## Layer 1 — Hardware Setup

### Components Required

| Component | Specification | Purpose |
|---|---|---|
| ESP32 Dev Module | 38-pin, dual-core 240MHz | Main microcontroller + WiFi |
| Relay Module | 5V Single Channel | Switches AC light circuit |
| Light Bulb + Holder | Any AC bulb (60W max for demo) | Output device |
| Jumper Wires | Male-to-Male + Male-to-Female | Connections |
| USB Cable | Micro-USB | Programming + power for ESP32 |
| Breadboard (optional) | 400 tie-point | Clean prototype layout |

---

### Understanding the Relay Module

A relay is an electrically operated switch. It uses a small DC signal (from ESP32) to control a high-power AC circuit (the light).

```
Relay Module has 3 sides:

[DC Control Side]         [AC Switch Side]
  VCC  → 5V power          COM  → Common (AC Live IN)
  GND  → Ground            NO   → Normally Open (to bulb)
  IN   → Signal from ESP32 NC   → Normally Closed (unused)
```

- **NO (Normally Open):** Circuit is OPEN when relay is idle → light OFF
- When ESP32 sends HIGH to IN pin → relay energizes → NO closes → light ON
- When ESP32 sends LOW → relay de-energizes → NO opens → light OFF

---

### Wiring — Step by Step

#### Part A: ESP32 to Relay Module (DC side)

```
ESP32 Pin        Wire Color    Relay Pin
─────────        ──────────    ─────────
GPIO 23    ───►  Orange  ───►  IN
5V / VIN   ───►  Red     ───►  VCC
GND        ───►  Black   ───►  GND
```

> Use **5V (VIN)** pin on ESP32 for relay VCC, not 3.3V — relay coil needs 5V to trigger reliably.

#### Part B: Relay Module to AC Light (AC side)

```
                 ┌─────────────────────────────┐
AC Power Plug    │                             │
  Live ──────────┤ COM              NO ────────┤──── Bulb (+)
  Neutral ───────┼──────────────────────────── ┼──── Bulb (-)
                 └─────────────────────────────┘
                        Relay Module
```

> ⚠️ **SAFETY:** Work on AC wiring only when power is OFF. Use insulated wires. Keep AC and DC sides physically separated.

#### Full Connection Summary

```
[USB Power]
    │
    ▼
[ESP32 Dev Module]
    │  GPIO 23 ──────────────► [Relay IN]
    │  5V (VIN) ─────────────► [Relay VCC]
    │  GND ──────────────────► [Relay GND]
                                    │
                               [Relay COM] ◄── AC Live from plug
                               [Relay NO]  ──► AC to Bulb
                               [Relay NC]  (not used)
                                    │
                                [Bulb] ──► AC Neutral back to plug
```

---

### ESP32 Pin Reference (38-pin board)

```
                    ┌───────────────┐
                    │   ESP32 Dev   │
               EN ──┤               ├── GPIO 23  ◄── RELAY IN
           GPIO36 ──┤               ├── GPIO 22
           GPIO39 ──┤               ├── GPIO 21
           GPIO34 ──┤               ├── GPIO19
           GPIO35 ──┤               ├── GPIO18
           GPIO32 ──┤               ├── GPIO 5
           GPIO33 ──┤               ├── GPIO17
           GPIO25 ──┤               ├── GPIO16
           GPIO26 ──┤               ├── GPIO 4
           GPIO27 ──┤               ├── GPIO 0
           GPIO14 ──┤               ├── GPIO 2
           GPIO12 ──┤               ├── GPIO15
            GPIO13──┤               ├── GND      ◄── RELAY GND
              GND ──┤               ├── VIN (5V) ◄── RELAY VCC
              3V3 ──┤               ├── 3V3
               EN ──┤               ├── EN
              SVP ──┤    [USB]      ├── SVN
                    └───────────────┘
```

---

### ESP32 Firmware Setup

#### Step 1 — Install Arduino IDE 2.x
- Download from: **arduino.cc/en/software**
- Install and open

#### Step 2 — Add ESP32 Board Package
1. Open **File → Preferences**
2. In "Additional Board Manager URLs" paste:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Click OK
4. Go to **Tools → Board → Board Manager**
5. Search **"esp32"** → Install package by **Espressif Systems** (v2.x)

#### Step 3 — Select Board and Port
1. Plug ESP32 into PC via Micro-USB
2. **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
3. **Tools → Port → COM5** (Windows) or `/dev/ttyUSB0` (Linux)

> If COM port not visible: install **CP2102 driver** or **CH340 driver** depending on your ESP32 USB chip.

#### Step 4 — Open and Configure the Sketch

Open `esp32/nexhome_esp32.ino` — update these 3 lines:

```cpp
const char* WIFI_SSID     = "Moto.Fusion";         // your WiFi name
const char* WIFI_PASSWORD = "Aman19988991";          // your WiFi password
const char* SERVER_URL    = "https://your-cloudflare-url.trycloudflare.com";
```

#### Step 5 — Upload
1. Click the **Upload** button (→ arrow) in Arduino IDE
2. Wait for "Connecting..." then "Done uploading"
3. If upload fails: hold the **BOOT** button on ESP32 while uploading

#### Step 6 — Verify It Works
- Open **Tools → Serial Monitor** (set baud to 115200)
- You should see ESP32 connecting to WiFi then polling relay state
- Check EC2 server logs — you'll see GET /esp/relay requests every 2 seconds

---

### How the Firmware Works (Logic Flow)

```
Power ON
    │
    ▼
setup():
  Set GPIO 23 as OUTPUT
  Set GPIO 23 LOW (relay OFF on boot)
  WiFi.begin(SSID, PASSWORD)
  Wait until connected...
    │
    ▼
loop() — runs every 2 seconds:
    │
    ├─ WiFi disconnected? → reconnect → wait 2s → retry
    │
    ├─ HTTP GET https://server/esp/relay
    │       │
    │       ├─ Response 200: body = {"state":"on"} or {"state":"off"}
    │       │       │
    │       │       ├─ "on"  AND lastState ≠ "on"  → GPIO 23 HIGH → relay ON
    │       │       └─ "off" AND lastState ≠ "off" → GPIO 23 LOW  → relay OFF
    │       │
    │       └─ Error / no response → skip, try again next cycle
    │
    └─ delay(2000ms) → loop again
```

> `lastState` prevents writing to GPIO every 2s unnecessarily — only acts when state **changes**.

---

### Common Hardware Issues

| Problem | Cause | Fix |
|---|---|---|
| COM port not showing | Driver not installed | Install CP2102 or CH340 USB driver |
| Upload fails | Boot mode issue | Hold BOOT button on ESP32 during upload |
| Relay not clicking | Wrong VCC (3.3V) | Use 5V/VIN pin instead of 3.3V |
| Light not turning on | NC instead of NO used | Move wire from NC to NO terminal |
| ESP32 keeps resetting | Power fluctuation | Use dedicated 5V adapter, not laptop USB |
| Relay clicks but light off | Loose AC wiring | Check COM and NO terminals are tight |

---

## Layer 2 — Backend (Flask on AWS EC2)

### Tech Stack
- Python 3.x + Flask
- Flask-JWT-Extended (authentication)
- Flask-CORS (allow React/ESP32 requests)
- SQLite (database — no separate DB server needed)
- Groq API (LLaMA 3.1 8B for AI commands)
- OpenWeatherMap API (weather automation)

### Project Structure
```
server/
├── app.py              # App factory, blueprint registration
├── config.py           # Environment config reader
├── database.py         # SQLite init, schema, helpers
├── requirements.txt    # Python dependencies
├── .env                # Secrets (not committed to git)
└── routes/
    ├── auth.py         # POST /login → JWT token
    ├── relay.py        # GET/POST relay state + ESP32 endpoints
    ├── ai.py           # POST /ai-command → Groq LLM
    ├── weather.py      # GET /weather → OpenWeatherMap
    ├── automation.py   # Weather rules + background thread
    ├── analytics.py    # GET /analytics → usage stats
    └── logs.py         # GET /logs → activity history
```

### Database Schema (SQLite)
```sql
relay_state       -- single row: current ON/OFF state + method
activity_log      -- timestamp, action, method for every change
automation_rules  -- rain/hot/night rules with enabled flag
automation_settings -- city name + master enable toggle
```

### API Design
| Endpoint | Auth | Purpose |
|---|---|---|
| POST /login | No | Returns JWT token (8hr expiry) |
| GET /relay | JWT | Get current light state |
| POST /on | JWT | Turn light ON |
| POST /off | JWT | Turn light OFF |
| GET /esp/relay | No | ESP32 polls this (no auth needed) |
| POST /ai-command | JWT | NLP command → Groq → relay action |
| GET /weather | JWT | Live weather for a city |
| GET /automation | JWT | Get rules + master switch state |
| POST /automation/toggle | JWT | Enable/disable automation |
| GET /logs | JWT | Activity log (IST timestamps) |
| GET /analytics | JWT | Daily ON/OFF statistics |

### AWS EC2 Setup

**Step 1 — Launch EC2 Instance**
- AMI: Ubuntu 22.04 LTS
- Instance type: t2.micro (free tier)
- Security Group — Inbound rules:
  - Port 22 (SSH)
  - Port 5000 (Flask API)

**Step 2 — SSH into EC2**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

**Step 3 — Install Python & dependencies**
```bash
sudo apt update
sudo apt install python3 python3-pip git -y
```

**Step 4 — Clone project**
```bash
git clone https://github.com/your-username/nexhome.git
cd nexhome/server
```

**Step 5 — Create `.env` file**
```bash
nano .env
```
Paste:
```
JWT_SECRET=your-strong-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
WEATHER_API_KEY=your-owm-key
GROQ_API_KEY=your-groq-key
WEATHER_CITY=New Delhi
```

**Step 6 — Install Python packages**
```bash
pip3 install -r requirements.txt
```

**Step 7 — Run server**
```bash
# For demo/testing:
python3 app.py

# For persistent background run:
nohup python3 app.py > server.log 2>&1 &
```

Server runs on `http://your-ec2-ip:5000`

### Getting API Keys
- **Groq API** (free): console.groq.com → API Keys → Create
- **OpenWeatherMap** (free): openweathermap.org → API Keys

---

## Layer 3 — Frontend (React on Vercel)

### Tech Stack
- React.js (Create React App)
- Axios (HTTP requests)
- React Icons (UI icons)
- Recharts (analytics charts)
- Web Speech API (voice recognition — browser built-in)
- Poppins font (Google Fonts)

### Project Structure
```
client/src/
├── components/
│   ├── Login.jsx         # Auth page — centered card design
│   ├── Dashboard.jsx     # Main layout + page routing
│   ├── Sidebar.jsx       # Fixed sidebar nav + mobile hamburger
│   ├── ChatAI.jsx        # AI chat + voice input
│   ├── Weather.jsx       # Live weather + automation rules
│   ├── AnalyticsChart.jsx # Usage graphs
│   └── ActivityLog.jsx   # Event history table (IST time)
├── styles/               # Per-component CSS files
├── config.js             # API_URL from .env
└── App.js                # Auth state + token expiry logic
```

### Key Frontend Features Built

**Authentication Flow**
- JWT token stored in localStorage
- Auto-logout on 401 response (global axios interceptor)
- Session expiry via `setTimeout` (token decoded for expiry time)

**AI Assistant**
- Text input OR voice (Web Speech API)
- Supports Hindi, English, Hinglish
- Fresh SpeechRecognition instance per mic press (fixes stale closure bug)
- Devanagari keywords: चालू, बंद, जलाओ, बुझाओ etc.
- AI response syncs relay state in dashboard instantly

**Weather Automation**
- City search using OWM Geocoding API directly from React
- 3 automation rules: Rain → ON, Hot (>35°C) → ON, Night → ON
- Master toggle — when OFF, no weather API calls made
- Manual OFF always respected (automation won't override)

**Mobile Responsive**
- Sidebar hidden on mobile
- Hamburger button (top-left) opens sidebar
- Dark overlay closes sidebar on tap

### Local Development Setup
```bash
cd client
npm install
```

Create `client/.env`:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEATHER_API_KEY=your-owm-key
```

```bash
npm start   # runs on http://localhost:3000
```

### Deploy to Vercel

**Step 1 — Build**
```bash
npm run build
```

**Step 2 — Deploy**
```bash
npx vercel
# Follow prompts — select project, set root to client/
```

Or deploy via Vercel Dashboard:
- Import GitHub repo
- Set root directory: `client`
- Add environment variables:
  - `REACT_APP_API_URL` = your HTTPS server URL
  - `REACT_APP_WEATHER_API_KEY` = your OWM key

---

## Connecting All 3 Layers

### The Mixed Content Problem (HTTPS vs HTTP)
Vercel always serves over **HTTPS**. But EC2 Flask is plain **HTTP**.
Browsers block HTTP requests from HTTPS pages.

### Solution — Cloudflare Tunnel (Free, No Domain Needed)
```bash
# On EC2, while Flask is running on port 5000:
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
./cloudflared-linux-amd64 tunnel --url http://localhost:5000
```

Cloudflare gives a free HTTPS URL like:
```
https://xxxx-xxxx.trycloudflare.com
```

Use this URL as `REACT_APP_API_URL` in Vercel and as `SERVER_URL` in ESP32 code.

> **Note:** Cloudflare Tunnel URL changes every restart. For permanent URL, use a custom domain with Nginx + Let's Encrypt.

### Final Data Flow

```
User opens nexhome-nita-pe.vercel.app (HTTPS)
    │
    │ POST /login → JWT token
    ▼
Flask on EC2 via Cloudflare HTTPS tunnel
    │
    │ stores relay state in SQLite
    │ logs every action with timestamp
    ▼
ESP32 polls GET /esp/relay every 2s (same HTTPS URL)
    │
    │ reads {"state": "on"} or {"state": "off"}
    ▼
GPIO 23 → Relay Module → Light Bulb
```

---

## Full Command Reference

### EC2 Server
```bash
# Start server
python3 app.py

# Start in background
nohup python3 app.py > server.log 2>&1 &

# View logs
tail -f server.log

# Kill server
pkill -f app.py

# Start Cloudflare tunnel
./cloudflared-linux-amd64 tunnel --url http://localhost:5000
```

### React Client
```bash
npm install        # install dependencies
npm start          # local dev server
npm run build      # production build
npx vercel --prod  # deploy to Vercel
```

### Git Workflow (EC2 update)
```bash
# Local machine
git add .
git commit -m "update"
git push origin main

# On EC2
git pull origin main
pkill -f app.py
nohup python3 app.py > server.log 2>&1 &
```

---

## Team

| Name | Enrollment | Role |
|---|---|---|
| **Aman Mishra** | 23UPE026 | Team Lead |
| Nipabithi | 23UPE006 | Member |
| Babumoni | 23UPE044 | Member |
| Aswanth | 23UPE049 | Member |
| Jothibasu | 23UPE048 | Member |

**Department:** Production Engineering
**Institution:** NIT Agartala
**Year:** 2025–26
