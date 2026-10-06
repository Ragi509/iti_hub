# StoreSync — Centralized ITI Store & Inventory System

**StoreSync** is a web-based centralized digital inventory and store management system built for Government Industrial Training Institutes (ITI).

## Project Overview

StoreSync replaces paper registers (**Bin Card**, **Miscellaneous Register**, **Dead Stock Register - DSR**) and manual requisition workflows with a modern digital system:

- **Offline-First Architecture**: Designed to run locally with an embedded SQLite database engine.
- **Role-Based Access Control**: Storekeeper, Trade Instructor, Approver (Vice-Principal), System Administrator.
- **Stock Auto-Reconciliation**: Recalculates stock balances on every intake/issue transaction (`SUM(purchases) - SUM(issues) +/- SUM(adjustments)`).
- **FIFO Batch Allocation**: Suggests stock fulfillment using First-In, First-Out purchase batch drawing.
- **Syllabus Gap Analysis**: Real-time comparison of NCVT trade practical requirements against store balance on hand.
- **DSR Machinery Management**: Tracks heavy equipment, serial numbers, holding departments, and return logs.

## System Architecture

```
iti_hub/
├── backend/            # Express REST API (Node.js & SQLite)
│   ├── src/
│   │   ├── config/     # Database driver
│   │   ├── db/         # Schema definitions & seed script
│   │   ├── routes/     # REST API route handlers
│   │   └── server.js   # Server entry point
│   └── package.json
└── frontend/           # React PWA Web Application
    ├── src/
    │   ├── components/ # Shared UI components
    │   ├── context/    # Authentication & state context
    │   ├── pages/      # 10 core application screens
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

## Quick Start (Local Setup)

### 1. Backend API Setup
```bash
cd backend
npm install
npm run seed      # Populate initial database
npm start         # Runs Express server on http://localhost:5000
```

### 2. Frontend Web App Setup
```bash
cd frontend
npm install
npm run dev       # Runs Vite dev server on http://localhost:3000
```
