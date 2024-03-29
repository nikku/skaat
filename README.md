# skaat

[![CI](https://github.com/nikku/skaat/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/skaat/actions/workflows/CI.yml)

A [Skat](https://en.wikipedia.org/wiki/Skat_%28card_game%29) game loop.

Can be embedded to build a [fully featured Skat application](https://nikku.github.io/skaat-app/).


## Installation

```
npm install skaat
```


## Usage

```javascript
import { Game, Clubs } from 'skaat';

const game = new Game();

game.next('start'); // [ 'ask-bid', 2 ]
game.next('pass', 2); // [ 'ask-bid', 0 ]
game.next('bid', 0, 24); // [ 'ask-ack', 1 ]
game.next('pass', 1); // [ 'ask-declare', 0 ]
game.next('declare', 0, { suit: Clubs }); // [ 'ask-card', 1 ]

...
```

The game loop enforces the rules of [Skat](https://en.wikipedia.org/wiki/Skat_%28card_game%29) and asks you for input as needed. You can provide input via human players [or bots](./test/AutomaSpec.js).


## Related

* [skaat-app](https://github.com/nikku/skaat-app)
