import {
  Game
} from '..';

const game = new Game();

const [ step, player ] = game.next('foo');

game.next('bar', 1, true);