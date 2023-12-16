import {
  Automa,
  Game,
  Win
} from '../src/index.js';


describe('Automa', function() {

  let wins = 0;
  let passes = 0;
  let losses = 0;

  after(() => {
    console.log('Results (W/L/P): %s %s %s', wins / 1000, losses / 1000, passes / 1000);
  });


  it('should play game', function() {

    for (let i = 0; i < 1000; i++) {

      // given
      const game = new Game({ verbose: false });
      const automas = [
        new Automa(),
        new Automa(),
        new Automa()
      ];

      let next = game.next('start');

      while (next) {

        if (next[0] === 'end') {
          if (game.state.result.outcome === Win) {
            wins++;
          } else {
            losses++;
          }

          break;
        }

        if (next[0] === 'ask-declare' && next[1] === null) {

          passes++;
          break;
        }

        const [ step, player ] = next;

        const automa = automas[player];

        const [ state, ...args ] = automa.next(game, step, player);

        next = game.next(state, player, ...args);
      }
    }
  });

});
