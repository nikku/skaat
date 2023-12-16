# skaat

[![CI](https://github.com/nikku/skaat/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/skaat/actions/workflows/CI.yml)

A [Skat](https://en.wikipedia.org/wiki/Skat_%28card_game%29) game loop.

Can be embedded to build a full featured Skat application: [:arrow_right: Demo](https://nikku.github.io/skaat-app/).


## Installation

```
npm install skaat
```


## Usage

```javascript
import { Game, Clubs } from 'skaat';

const game = new Game();

game.next('start'); // 'ask-bid', 2
game.next('pass', 2); // 'ask-bid', 0
game.next('bid', 0, 24); // 'ask-ack', 1
game.next('pass', 1); // 'ask-declare', 0
game.next('declare', 0, { suit: Clubs }); // 'ask-card', 1

...
```