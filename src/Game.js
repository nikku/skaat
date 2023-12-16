/* global console */

import {
  AllSuites,
  Null,
  Ramsch,
  Hand,
  Schwarz,
  Schneider,
  Win,
  Loss
} from './Constants.js';

import {
  isValidTrickCard,
  getTrickWinner,
  getJacksModifier,
  dealCards
} from './Util.js';

import {
  calculateResults
} from './Results.js';


import StateMachine from './StateMachine.js';

/**
 * @typedef { import('./types').Card } Card
 * @typedef { import('./types').State } State
 * @typedef { import('./types').Result } Result
 * @typedef { import('./types').Player } Player
 * @typedef { import('./types').Suit } Suit
 *
 * @typedef { { state: Partial<State>, initialStep: string, expectedActor: number } } GameInit
 */

/**
 * @constructor
 * @param { { verbose?: boolean } } [options]
 * @param {GameInit} [init]
 */
export default function Game(options, init) {

  const verbose = options && options.verbose || false;

  const players = [ 0, 1, 2 ];

  let state = init && init.state || {};

  const stateMachine = new StateMachine({
    steps: [
      [ 'initial', 'start', () => {
        return 'deal';
      } ],

      [ 'deal', () => {
        const [
          hands,
          skat
        ] = dealCards();

        state = {
          ...state,
          initialHands: hands.map(h => h.slice()),
          initialSkat: skat.slice(),
          hands,
          skat
        };

        return 'dealt';
      } ],

      [ 'dealt', () => {
        return 'bidding-start';
      } ],

      [ 'bidding-start', () => {

        const participants = players.slice();

        const bidder = participants[2];

        state = {
          ...state,
          bidding: {
            bidder,
            acknowledger: participants[1],
            participants,
            leader: null,
            bid: null
          }
        };

        return [ 'ask-bid', bidder ];
      } ],

      [ 'ask-bid', 'bid', (
          /** @type {Player} */ player,
          /** @type {number} */ playerBid
      ) => {

        const {
          bidding
        } = state;

        const {
          bid,
          acknowledger
        } = bidding;

        if (Math.floor(playerBid) !== playerBid) {
          throw new Error(`expected integral bid, found ${playerBid}`);
        }

        const minBid = (bid ? bid : 18);

        if (playerBid < minBid) {
          throw new Error(`expected bid >= ${minBid}, found ${playerBid}`);
        }

        if (acknowledger) {
          state = {
            ...state,
            bidding: {
              ...bidding,
              leader: player,
              bid: playerBid
            }
          };

          return [ 'ask-ack', acknowledger ];
        } else {
          state = {
            ...state,
            bidding: {
              leader: player,
              bid: playerBid
            }
          };

          return 'bidding-completed';
        }
      } ],

      [ 'ask-bid', 'pass', (/** @type {Player} */ player) => {

        const {
          bidding
        } = state;

        const {
          bid,
          leader
        } = bidding;

        const participants = bidding.participants.filter(p => p !== player);

        // everyone passed _or_
        // last player remaining is leader
        if (
          (participants.length === 0) ||
          (participants.length === 1 && leader)
        ) {
          state = {
            ...state,
            bidding: {
              leader,
              bid
            }
          };

          return 'bidding-completed';
        }

        // player(s) remaining, swap bidder / acknowledger

        const bidder = participants[0];
        const acknowledger = participants.find(p => p !== bidder);

        state = {
          ...state,
          bidding: {
            ...bidding,
            participants,
            bidder,
            acknowledger
          }
        };

        return [ 'ask-bid', bidder ];
      } ],

      [ 'ask-ack', 'ack', (/** @type {Player} */ player) => {

        const {
          bidding
        } = state;

        const {
          bidder
        } = bidding;

        state = {
          ...state,
          bidding: {
            ...bidding,
            leader: player
          }
        };

        return [ 'ask-bid', bidder ];
      } ],

      [ 'ask-ack', 'pass', (/** @type {Player} */ player) => {

        const {
          bidding
        } = state;

        const {
          bid,
          leader
        } = bidding;

        const participants = bidding.participants.filter(p => p !== player);

        // bidder wins
        if (participants.length === 1) {
          state = {
            ...state,
            bidding: {
              leader,
              bid
            }
          };

          return 'bidding-completed';
        }

        const bidder = participants[0];
        const acknowledger = bidding.bidder;

        state = {
          ...state,
          bidding: {
            ...bidding,
            participants,
            bidder,
            acknowledger
          }
        };

        return [ 'ask-bid', bidder ];
      } ],

      [ 'bidding-completed', () => {

        const {
          bidding
        } = state;

        const {
          leader
        } = bidding;

        state = {
          ...state,
          game: {
            modifiers: Hand
          },
          player: leader
        };

        return [ 'ask-declare', leader ];
      } ],

      [ 'ask-declare', 'pick-skat', (/** @type {Player} */ player) => {

        const {
          skat,
          hands,
          game
        } = state;

        const updatedHands = hands.slice();

        updatedHands[player] = updatedHands[player].concat(skat);

        state = {
          ...state,
          game: {
            ...game,
            modifiers: game.modifiers & ~Hand
          },
          hands: updatedHands,
          skat
        };

        return [ 'ask-skat', player ];
      } ],

      [ 'ask-skat', 'put-skat', (
          /** @type {Player} */ player,
          /** @type {Card[]} */ skat,
      ) => {

        const {
          hands
        } = state;

        if (skat.length !== 2) {
          throw new Error('must put two cards to skat');
        }

        const updatedHands = hands.slice();

        const playerHand = updatedHands[player];

        if (skat.some(card => !playerHand.includes(card))) {
          throw new Error('cannot drop what is not on your hand');
        }

        updatedHands[player] = playerHand.filter(card => !skat.includes(card));

        state = {
          ...state,
          hands: updatedHands,
          skat
        };

        return [ 'ask-declare', player ];
      } ],

      [ 'ask-declare', 'declare', (
          /** @type {Player} */ player,
          /** @type { { suit: Suit, modifiers?: number } } */ declaration
      ) => {

        const {
          game,
          hands,
          skat
        } = state;

        const {
          suit
        } = declaration;

        if (!AllSuites.includes(suit)) {
          throw new Error(`unknown suit <${suit}>`);
        }

        let declarationModifiers = declaration.modifiers || 0;

        if (declarationModifiers & Hand) {
          throw new Error('cannot declare Hand');
        }

        if (suit === Null) {
          if (declarationModifiers & Schneider) {
            throw new Error('illegal modifier <Schneider> for suit <Null>');
          }

          if (declarationModifiers & Schwarz) {
            throw new Error('illegal modifier <Schwarz> for suit <Null>');
          }
        }

        const gameModifiers = game.modifiers || 0;

        // Schwarz implies Schneider
        if (declarationModifiers & Schwarz) {
          declarationModifiers = declarationModifiers | Schneider;
        }

        const jacksModifier = suit !== Null ? {
          jacks: getJacksModifier([ ...hands[player], ...skat ])
        } : {};

        const modifiers = declarationModifiers | gameModifiers;

        state = {
          ...state,
          game: {
            ...game,
            ...jacksModifier,
            modifiers,
            suit
          }
        };

        return 'declared';
      } ],

      [ 'declared', () => {
        return 'game-start';
      } ],

      [ 'game-start', () => {

        state = {
          ...state,
          playerTricks: players.map(p => []),
          currentTrick: [],
          lastTrick: null,
          tricks: []
        };

        return [ 'ask-card', players[1] ];
      } ],

      [ 'ask-card', 'play-card', (
          /** @type { Player } */ player,
          /** @type { Card } */ card
      ) => {

        const suit = state.game.suit;

        const hand = state.hands[player];

        if (!hand.includes(card)) {
          throw new Error(`card <${card}> not in <${player}> hand`);
        }

        if (!isValidTrickCard(card, state.currentTrick, hand, suit)) {
          throw new Error(`invalid card <${card}> in current trick`);
        }

        // remove card from hand
        const hands = state.hands.map((hand, p) => {
          if (player !== player) {
            return hand;
          } else {
            return hand.filter(c => c !== card);
          }
        });

        state = {
          ...state,
          hands,
          currentTrick: [ ...state.currentTrick, [ player, card ] ]
        };

        if (state.currentTrick.length === 3) {
          return 'trick-complete';
        }

        return [ 'ask-card', (player + 1) % players.length ];
      } ],

      [ 'trick-complete', () => {

        const {
          currentTrick,
          player
        } = state;

        const {
          suit
        } = state.game;

        const winner = getTrickWinner(currentTrick, state.game.suit);

        const tricks = [ ...state.tricks, currentTrick ];
        const playerTricks = state.playerTricks.map((tricks, player) => {

          if (player !== winner) {
            return tricks;
          } else {
            return [ ...tricks, currentTrick ];
          }
        });

        state = {
          ...state,
          tricks,
          playerTricks,
          currentTrick: [],
          lastTrick: currentTrick
        };

        // Null player took trick
        if (suit === Null && player === winner) {
          return 'game-finish';
        }

        if (tricks.length === 10) {
          return 'game-finish';
        }

        return [ 'ask-card', winner ];
      } ],

      [ 'ask-card', 'give-up', (/** @type {Player} */ player) => {

        const {
          player: _player,
          game
        } = state;

        if (game.suit === Ramsch) {
          throw new Error('cannot give up a game of Ramsch');
        }

        state = {
          ...state,
          result: {
            player: _player,
            outcome: player === _player ? Loss : Win,
            reason: [ player, 'give-up' ]
          }
        };

        return 'game-finish';
      } ],

      [ 'game-finish', () => {

        state = {
          ...state,
          result: calculateResults(players, state)
        };

        verbose && console.log('GAME game-finish', state.player, state.result, state.result.points);

        return 'end';
      } ],

      [ 'end' ]
    ],
    verbose
  });


  // API ///////////////////////

  this.next = function(...args) {
    const result = stateMachine.next(...args);

    const [ next, actor ] = result;

    verbose && console.log(`req ${next} <${ typeof actor !== 'undefined' ? actor : 'null'}>`);

    return result;
  };

  // expose state //////////////

  /**
   * @type { Partial<State> }
   */
  this.state = state;

  Object.defineProperty(this, 'state', {
    get: () => state
  });

  // API ////////////////////////

  /**
   * Return the game result after it completed.
   *
   * @return {Partial<Result>}
   */
  this.getResult = function() {
    return state.result;
  };
}