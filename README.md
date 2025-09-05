# EduMeet (minimal scaffold)

This repository contains a minimal scaffold for an EduMeet-like app with server and client directories.

Server:
This workspace contains the EduMeet application. It includes a Node/Express backend (`server/`) and a static client (`client/`) that implements video chat, a collaborative whiteboard, and basic room/participant management using Socket.IO and WebRTC.

Quick start
-----------

1. Install server dependencies:

   ```bash
   cd server
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Open the client in a browser: http://localhost:3000

Generate a full project README
------------------------------

This repo includes `generate_full_readme.sh` which will create `FULL_README.md` containing a tree of the repository and the full contents of files under `client/` and `server/`.

Usage:

```bash
./generate_full_readme.sh
```

What this snapshot contains
--------------------------

- Server: Express + Socket.IO controllers and a `socketController.js` that handles room join/leave and relays WebRTC signaling events.
- Client: static HTML/CSS/JS implementing UI, canvas, WebRTC manager, socket handler, and fallback handling for mediasoup.

Notes and troubleshooting
-------------------------
- If your browser reports camera already in use, close other tabs or apps using the camera.
- If WebRTC offers are created but not answered, check server logs to ensure the `offer`/`answer`/`ice-candidate` events are received and relayed.
- Use the browser console to inspect signaling logs — this project logs offers/answers and ICE events for debugging.
