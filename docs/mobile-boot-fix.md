# Mobile startup readiness

The hosted check caught a real startup race: the splash was already interactive while the ordered audio script had not finished downloading. An early Start or Enter could call audioUnlock before it existed. The menu is now inert, with Start disabled and a visible Loading game status, until main.js completes initialization. Keyboard and direct start calls also guard readiness; audio unlock waits for its effects initializer to exist. The ready tap remains a trusted gesture so Safari can unlock audio normally.

The browser regression holds audio.js at the network boundary, checks disabled/inert/loading UI and harmless early Enter/direct-start attempts, then releases the script and verifies that a real touch starts the voiced comic without JavaScript errors. This is a Chromium touch simulation, not a physical Safari run.
