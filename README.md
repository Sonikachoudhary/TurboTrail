# Neon Lane — Car Dodge

A small lane-switching car game. Dodge traffic and survive to build your score.

## Play

Open `web/index.html` in a browser and press **Start Engine**. Use **← / →** or **A / D** to switch lanes. On a phone, use the left and right buttons under the road. Your best score is saved in your browser.

The playable preview uses JavaScript so it runs without setup. `src/game.cpp` contains the corresponding C++ lane, score, and collision logic; compiling it to WebAssembly requires the Emscripten SDK.
