# Real-Time Poll Rooms

A full-stack real-time polling application built with Node.js, Express, Socket.io, and React.

## Features
- **Create Polls**: Instant poll creation with multiple options.
- **Join by Link**: Shareable URLs for voting.
- **Real-Time Results**: Live updates via WebSockets (Socket.io).
- **Persistence**: Data saved in PostgreSQL database.

## Fairness & Anti-Abuse Mechanisms
To prevent abuse while ensuring fairness, two layers of checks are implemented:
1.  **Device-Based Voter ID (Fairness)**: A unique UUID (`voterId`) is generated and stored in the user's LocalStorage. The server enforces that a specific `voterId` can only vote once per poll.
    - *Protection*: Prevents a single browser/device from voting multiple times.
2.  **Rate Limiting (Anti-Abuse)**: The server tracks the number of votes from each IP address. If an IP exceeds 10 votes per minute, temporary blocking occurs.
    - *Protection*: Prevents script/bot based spam attacks while *allowing* multiple legitimate users on the same shared WiFi (e.g., offices, schools) to vote.

## Edge Cases Handled
- **Shared Networks (NAT)**: Unlike simple IP blocking, our Rate Limiting approach allows users on the same WiFi to vote (up to the rate limit).
- **Invalid Poll Creation**: Server validates that a poll has a question and at least 2 options.
- **Database Consistency**: Transactions ensure atomic poll creation.
- **Real-time Synchronization**: New voters see the current state immediately.

## Known Limitations & Future Improvements
- **LocalStorage Clearing**: knowledgeable users can clear LocalStorage (and generate a new `voterId`) to bypass the fairness check.
    - *Mitigation*: Rate limiting prevents this from being easily automated at scale.
- **IP Spoofing**: Sophisticated attackers could rotate IPs to bypass rate limits.
- **PostgreSQL Dependency**: Requires a running Postgres instance (configured via `DATABASE_URL`).

## Deployment
This project is deployed to Vercel and Render as a split deployment (Vercel + Render).
