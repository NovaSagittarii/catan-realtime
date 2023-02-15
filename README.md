# catan-realtime

This is a multiplayer game server implementation of the board game catan, but in realtime.  
Made with sockets.io, HTML, CSS, and Javascript.
[link to live deployment](https://cypress-rtc.glitch.me/)

## Differences from the Board Game

- Everyone rolls at the same time, with a cooldown on each player's rolls.
- Ports and player trading not implemented, but you can trade 4 for 1.
- Robber is a temporary status that disables a resource node for a set period of time, there can be multiple active robbers at a time.

## Installation

- `npm i` installs dependencies
- `npm start` starts server
