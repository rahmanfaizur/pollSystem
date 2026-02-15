# Real-Time Poll Rooms

A full-stack real-time polling application built with Node.js, Express, Socket.io, and React.

## Features
- **Create Polls**: Instant poll creation with multiple options.
- **Join by Link**: Shareable URLs for voting.
- **Real-Time Results**: Live updates via WebSockets (Socket.io).
- **Persistence**: Data saved in SQLite database.

## Fairness & Anti-Abuse Mechanisms
To prevent repeat voting and abuse, two layers of checks are implemented:
1.  **IP Address Tracking**: The server records the IP address of every vote. If a vote for a specific poll ID is received from an IP that has already voted, it is rejected.
    - *Protection*: Prevents mass voting from a single device/network (assuming no VPN/proxy rotation).
2.  **LocalStorage Token**: The client stores a list of `votedPolls` in the browser's LocalStorage. This provides immediate UI feedback and prevents accidental double submissions from the same browser.
    - *Protection*: Improves user experience and provides a basic client-side guard.

## Edge Cases Handled
- **Invalid Poll Creation**: Server validates that a poll has a question and at least 2 options.
- **Database Consistency**: Use of SQLite transactions ensures that a poll and its options are created atomically. If one fails, the whole operation rolls back.
- **Real-time Synchronization**: New voters see the current state immediately upon joining, and subsequent updates are broadcast efficiently.
- **Connection Resilience**: Socket.io handles reconnection automatically.

## Known Limitations & Future Improvements
- **IP Spoofing/NAT**: Users behind the same NAT (e.g., in an office or school) might be blocked if one person votes.
    - *Improvement*: Implement cookie-based session tokens or account-based authentication.
- **LocalStorage Clearing**: A savvy user can clear LocalStorage to try and vote again (though IP check will still block them).
- **SQLite Concurrency**: While `better-sqlite3` is fast (WAL mode enabled), for ultra-high scale, a separate DB service like PostgreSQL would be better.

## Deployment
This project is configured to be deployed as a monorepo. The Node.js server serves the built React frontend.
See `DEPLOY.md` for instructions.
