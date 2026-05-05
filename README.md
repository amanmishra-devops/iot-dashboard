# NexHome — IoT Smart Home Automation Dashboard

## Overview

NexHome is a cloud-connected smart home automation system built around an ESP32 microcontroller and a relay module. It allows users to control a light remotely through a web dashboard, voice commands, AI natural language processing, and automatic weather-based rules — from anywhere in the world.

---

## Features

| Feature | Description |
|---|---|
| **Remote Light Control** | Turn the light ON/OFF from any browser via the dashboard |
| **AI Assistant** | Natural language commands in English, Hindi, or Hinglish (e.g., "jalao", "band karo") |
| **Voice Control** | Browser-based speech recognition — speak to control the light |
| **Weather Automation** | Auto-controls light based on live weather rules (rain, high temperature, nighttime) |
| **Activity Log** | Timestamped log of every ON/OFF action with source (web / AI / ESP32 / auto) |
| **Usage Analytics** | Visual charts showing device usage patterns over time |
| **JWT Authentication** | Secure login with 8-hour session tokens; auto-logout on expiry |

---

## Tech Stack

### Hardware
- **ESP32** microcontroller — polls the server every 2 seconds and drives the relay
- **Relay Module** — switches the light circuit based on commands

### Backend (Server)
- **Python / Flask** — REST API server with modular Blueprint architecture
- **Flask-JWT-Extended** — token-based authentication
- **SQLite** — stores relay state, activity log, and automation settings
- **Groq API (LLaMA 3.1 8B)** — AI language model for natural language command parsing
- **OpenWeatherMap API** — live weather data for automation rules
- **Deployed on AWS EC2** (Ubuntu)

### Frontend (Client)
- **React.js** — single-page application with sidebar navigation
- **Axios** — HTTP communication with the backend
- **Web Speech API** — browser-native voice recognition (Hindi / English)
- **Recharts** — usage analytics charts
- **React Icons** — UI iconography
- **Poppins (Google Fonts)** — typography

---

## System Architecture

```
[Browser / React App]
        |
        | HTTP (JWT)
        v
[Flask Server — AWS EC2 :5000]
        |
        |--- SQLite DB (relay state, logs, automation)
        |--- Groq API (AI commands)
        |--- OpenWeatherMap API (weather automation)
        |
        | HTTP polling every 2s (no auth)
        v
[ESP32 Microcontroller]
        |
        v
[Relay Module → Light]
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/login` | No | Authenticate and receive JWT token |
| GET | `/relay` | JWT | Get current light state |
| POST | `/on` | JWT | Turn light ON |
| POST | `/off` | JWT | Turn light OFF |
| GET | `/esp/relay` | No | ESP32 polling endpoint |
| POST | `/ai-command` | JWT | Send natural language command to AI |
| GET | `/weather` | JWT | Get live weather data for a city |
| GET | `/automation` | JWT | Get automation rules and settings |
| POST | `/automation/toggle` | JWT | Enable/disable weather automation |
| POST | `/automation/<id>/toggle` | JWT | Enable/disable individual rule |
| GET | `/logs` | JWT | Fetch activity log |
| GET | `/analytics` | JWT | Fetch usage analytics data |

---

## Weather Automation Rules

When the automation master switch is ON, the server checks live weather every 5 minutes and applies enabled rules:

- **Rain / Storm** — turns light ON when it rains, drizzles, or thunderstorms
- **Hot Day** — turns light ON when temperature exceeds 35°C
- **Night Time** — turns light ON after sunset (nighttime icon from OWM)

> Manual OFF by the user (or AI) is always respected — automation will not override it until the user manually turns the light back ON.

---

## Project Structure

```
iot/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Login, Dashboard, Sidebar, Weather, ChatAI, ActivityLog, AnalyticsChart
│   │   ├── styles/          # Per-component CSS files
│   │   └── config.js        # API base URL
│   └── .env                 # REACT_APP_API_URL, REACT_APP_WEATHER_API_KEY
│
└── server/                  # Flask backend
    ├── app.py               # App factory, blueprint registration
    ├── config.py            # Environment config
    ├── database.py          # SQLite init and helpers
    └── routes/
        ├── auth.py          # Login / JWT
        ├── relay.py         # Light control + ESP32 endpoints
        ├── ai.py            # AI command processing (Groq)
        ├── weather.py       # Live weather fetch
        ├── automation.py    # Weather-based automation + background thread
        ├── analytics.py     # Usage analytics
        └── logs.py          # Activity log
```

---

## Running Locally

### Server
```bash
cd server
pip install -r requirements.txt
python app.py
```

### Client
```bash
cd client
npm install
npm start
```

### Environment Variables

**server/.env**
```
JWT_SECRET=your-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
WEATHER_API_KEY=your-owm-key
GROQ_API_KEY=your-groq-key
```

**client/.env**
```
REACT_APP_API_URL=http://<ec2-ip>:5000
REACT_APP_WEATHER_API_KEY=your-owm-key
```

---

## Team Members

| Name | Enrollment No. | Role |
|---|---|---|
| **Aman Mishra** | 23UPE026 | Team Lead |
| Nipabithi | 23UPE006 | Member |
| Babumoni | 23UPE044 | Member |
| Aswanth | 23UPE049 | Member |
| Jothibasu | 23UPE048 | Member |

---
