import { Cards, AllSuites, Null, Ramsch } from './Constants';

import {
  isValidTrickCard,
  getCardValue,
  getTrickWinner
} from './Util';

import StateMachine from './StateMachine';

/**
 * @typedef { import("./types").State } State
 */

export default function Game() {

  const players = [0, 1, 2];

  let state = {

    // initialize
    initialHands: [],
    initialSkat: [],

    hands: [],
    skat: [],

    // bidding
    bidding: null,

    // declaration
    game: null,

    // play
    lastTrick: null,
    currentTrick: null,
    playerTricks: [],
    tricks: []
  };

  const steps = [
    [ 'initial', 'start', () => {

      const [
        hands,
        skat
      ] = deal();

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

    [ 'ask-bid', 'bid', (player, playerBid) => {

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

    [ 'ask-bid', 'pass', (player) => {

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
    }],

    [ 'ask-ack', 'ack', (player) => {

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

    [ 'ask-ack', 'pass', (player) => {

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
        leader,
        bid
      } = bidding;

      state = {
        ...state,
        game: {
          bid,
          declarer: leader,
          hand: true
        }
      };

      return [ 'ask-declare', leader ];
    } ],

    [ 'ask-declare', 'pick-skat', (player) => {

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
          hand: false
        },
        hands: updatedHands,
        skat
      };

      return [ 'ask-skat', player ];
    } ],

    [ 'ask-skat', 'put-skat', (player, skat) => {

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

    [ 'ask-declare', 'declare', (player, declaration) => {

      const {
        limit = 0,
        open = false,
        suit
      } = declaration;

      if (!AllSuites.includes(suit)) {
        throw new Error(`unexpected suit <${suit}>`);
      }

      const {
        game
      } = state;

      state = {
        ...state,
        game: {
          ...game,
          open,
          suit,
          limit
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
        tricks: []
      };

      return [ 'ask-card', players[1] ];
    } ],

    [ 'ask-card', 'play-card', (player, card) => {

      const {
        suit
      } = state.game;

      const hand = state.hands[player];

      if (!hand.includes(card)) {
        throw new Error(`card <${card}> not in player hand`);
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

      const currentTrick = [ ...state.currentTrick, [ player, card ] ];

      state = {
        ...state,
        hands,
        currentTrick
      };

      if (currentTrick.length === 3) {
        return 'trick-complete';
      } else {
        return [ 'ask-card', (player + 1) % players.length ];
      }
    } ],

    [ 'trick-complete', () => {

      const {
        currentTrick
      } = state;

      const {
        suit,
        declarer
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
        lastTrick: currentTrick,
        currentTrick: []
      };

      if (suit === Null && declarer === winner) {
        state = {
          ...state,
          result: 'loss',
          player: winner
        };

        return 'game-finished';
      }

      if (tricks.length === 10) {
        return 'game-finished';
      } else {
        return [ 'ask-card', winner ];
      }
    } ],

    [ 'game-finished', () => {

      const {
        result
      } = state;

      const declarer = state.game.declarer;
      const suit = state.game.suit;

      if (!result) {

        if (suit === Null) {
          state = {
            ...state,
            result: 'win',
            player: declarer
          };
        } else

        if (suit === Ramsch) {

          const trickPoints = state.playerTricks.map(
            tricks => tricks.flat().map(t => t[1]).reduce(sumCards, 0)
          );

          const skatPoints = state.skat.reduce(sumCards, 0);

          const max = Math.max(...trickPoints);

          const looser = trickPoints.indexOf(max);

          const points = max + skatPoints;

          state = {
            ...state,
            result: 'loss',
            player: looser,
            points
          };
        }

        else {
          const declarer = state.game.declarer;

          const declarerCards = [
            ...state.skat,
            ...state.playerTricks[declarer].flat().map(t => t[1])
          ];

          const points = declarerCards.reduce(sumCards, 0);

          state = {
            ...state,
            result: points > 60 ? 'win' : 'loss',
            player: declarer,
            points
          };
        }
      }

      console.log('GAME finished', state.player, state.result, state.points);

      // TODO(nikku): wrap-up game
      return 'end';
    } ]
  ];

  const stateMachine = new StateMachine(steps);


  // API ///////////////////////

  this.next = function(...args) {
    const result = stateMachine.next(...args);

    const [ next, actor ] = result;

    console.log(`req ${next} <${ typeof actor !== 'undefined' ? actor : 'null'}>`);

    return result;
  };

  // expose state //////////////

  Object.defineProperty(this, 'state', {
    get: () => state
  });

}

const dealSequence = Array.from('11122233344111122223333111222333').map(s => parseInt(s, 10));

function deal() {

  const cards = shuffle(Cards);

  const buckets = [
    [], [], [], []
  ];

  for (const bucket of dealSequence) {
    const card = cards.pop();

    buckets[bucket - 1].push(card);
  }

  return [
    buckets.slice(0, 3),
    buckets[3]
  ];
}

/**
 * Shuffles an array.
 *
 * @template T
 * @param {T[]} cards
 * @return T[]
 */
function shuffle(cards) {
  const copy = cards.slice();

  let j, x, i;
  for (i = copy.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = copy[i];
    copy[i] = copy[j];
    copy[j] = x;
  }

  return copy;
}

function sumCards(sum, card) {
  return sum + getCardValue(card);
}