/**
 * @typedef { import('./types').Player } Player
 * @typedef { import('./types').Card } Card
 * @typedef { import('./types').Suit } Suit
 *
 * @typedef { import('./types').GameState } GameState
 * @typedef { import('./types').GameStep } GameStep
 *
 * @typedef { import('./Game').default } Game
 */

/* eslint "no-constant-condition": Off */

import {
  cardComponents,
  TRUMP_ORDER,
  isValidTrickCard
} from './Util.js';

import {
  ColorSuits,
  Hand,
  Null,
  NoModifiers,
  CardValues,
  Spades,
  Clubs,
  Hearts,
  Diamonds,
  Grand
} from './Constants.js';

const BIDS = [ 18, 20, 22, 23, 24, 27, 30, 33, 35, 36, 40, 44, 46, 48, 50 ];

/**
 * @type { Record<import('./types').Picture, number> }
 */
const NULL_GAME_CARD_VALUES = {
  'A': -2,
  'K': -2,
  'Q': -2,
  'J': 0,
  '10': 0,
  '9': 1,
  '8': 1,
  '7': 2
};

/**
 * @type { Record<import('./types').Picture, number> }
 */
const COLOR_GAME_CARD_VALUES = {
  'A': 5,
  '10': 3,
  'K': 2,
  'Q': 2,
  'J': 7,
  '9': 1,
  '8': 1,
  '7': 1
};


/**
 * @constructor
 */
export default function Automa() {

  let pickedSkat = false;

  /**
   * @param { Game } game
   * @param { GameStep } step
   * @param { Player } player
   * @param { ...unknown } args
   *
   * @return { [ GameStep, ...unknown[] ] } next step
   */
  this.next = (game, step, player, ...args) => {

    switch (step) {
    case 'ask-declare': {

      const result = evaluateHand(game.state.hands[player]);

      if (result.modifiers & Hand || pickedSkat) {
        return [ 'declare', {
          suit: result.suit,
          modifiers: result.modifiers & ~Hand
        } ];
      }

      pickedSkat = true;

      return [ 'pick-skat' ];
    }

    case 'ask-skat': {

      const hand = game.state.hands[player];

      const result = evaluateHand(hand);

      const skat = dropSkat(hand, result.suit);

      return [ 'put-skat', skat ];
    }

    case 'ask-card': {

      const suit = game.state.game.suit;

      const currentTrick = game.state.currentTrick;
      const hand = game.state.hands[player];

      while (true) {
        const card = randomElement(hand);

        if (isValidTrickCard(card, currentTrick, hand, suit)) {
          return [ 'play-card', card ];
        }
      }
    }

    case 'ask-ack': {
      const bid = game.state.bidding.bid;

      const {
        value
      } = evaluateHand(game.state.hands[player]);

      if (value >= bid) {
        return [ 'ack' ];
      }

      return [ 'pass' ];
    }

    case 'ask-bid': {
      const bid = game.state.bidding.bid || 17;

      const {
        value
      } = evaluateHand(game.state.hands[player]);

      const nextBid = increaseBid(bid, BIDS);

      if (value >= nextBid) {
        return [ 'bid', nextBid ];
      }

      return [ 'pass' ];
    }
    }
  };

}



// helpers ////////////

/**
 * @param {Card[]} hand
 *
 * @return { {
 *   modifiers: import('./types').GameModifiers,
 *   suit: import('./types').Suit,
 *   value: number
 * } }
 */
function evaluateHand(hand) {

  const nullValue = hand.reduce((sum, card) => {
    const [ _, picture ] = cardComponents(card);

    return sum + /** @type { number } */ (NULL_GAME_CARD_VALUES[picture]);
  }, 0);

  // let's play Null
  if (nullValue > 3) {
    return {
      modifiers: nullValue > 6 ? Hand : NoModifiers,
      suit: Null,
      value: nullValue > 6 ? 35 : 23
    };
  }

  const trumps = ColorSuits.map(suit => {

    const cards = hand.filter(card => TRUMP_ORDER[suit][card]);
    const cardsValue = cards.reduce((sum, card) => {

      const [ _, picture ] = cardComponents(card);

      return sum + /** @type { number } */ (COLOR_GAME_CARD_VALUES[picture]);
    }, 0);

    return {
      suit,
      cards,
      cardsValue
    };
  });

  const sortedTrumps = trumps.sort((a, b) => b.cards.length - a.cards.length);

  const {
    suit,
    cards,
    cardsValue
  } = sortedTrumps[0];

  // won't play shaky games
  if (cards.length < 5 || cardsValue < 12) {
    return {
      modifiers: NoModifiers,
      value: -1,
      suit: suit
    };
  }

  return {
    modifiers: NoModifiers,
    suit,
    value: {
      [ Grand ]: 48,
      [ Spades ]: 22,
      [ Clubs ]: 24,
      [ Hearts ]: 20,
      [ Diamonds ]: 18
    }[suit]
  };

}

/**
 * @param { Card[] } hand
 * @param { Suit } suit
 *
 * @return { [ Card, Card ] }
 */
function dropSkat(hand, suit) {
  const skat = [];

  const trumps = TRUMP_ORDER[suit];

  while (skat.length < 2) {

    const card = randomElement(hand);

    // do not drop low value cards
    if (suit === Null && !CardValues[card]) {
      continue;
    }

    // do not drop trump
    if (!trumps[card]) {
      skat.push(card);
    }
  }

  return /** @type { [ Card, Card ] } */ (skat);
}

/**
 * @param {number} bid
 * @param {number[]} bids
 *
 * @return {number}
 */
function increaseBid(bid, bids) {
  return bids.find(b => b > bid) || (bid + 5);
}

/**
 * @template T
 *
 * @param {T[]} arr
 *
 * @return {T}
 */
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}