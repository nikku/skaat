import {
  AllCards,
  AllSuites,
  CardComponents,
  CardValues,
  ColorSuites,
  Jack,
  Null,
  Ramsch,
  Grand
} from './Constants.js';

/**
 * @typedef { import('./types').Card } Card
 * @typedef { import('./types').Trick } Trick
 * @typedef { import('./types').Suit } Suit
 * @typedef { import('./types').Picture } Picture
 * @typedef { import('./types').Player } Player
 */

function scoreKeyed(arr) {
  return arr.reduce((score, card, index) => {
    score[card] = index + 1;

    return score;
  }, {});
}

const NULL_PICTURES = [ 'A', 'K', 'Q', 'J', '10', '9', '8', '7' ];
const COLOR_PICTURES = [ 'A', '10', 'K', 'Q', '9', '8', '7' ];

const JACKS = ColorSuites.map(suit => `${suit}${Jack}`);

const COLOR_CARDS = AllSuites.reduce((colorCards, trumpSuit) => {

  const generateCards = trumpSuit === Null
    ? (suit) => NULL_PICTURES.map(p => `${suit}${p}`)
    : (suit) => COLOR_PICTURES.map(p => `${suit}${p}`);

  colorCards[trumpSuit] = ColorSuites.reduce((map, suit) => {
    map[suit] = generateCards(suit);

    return map;
  }, {});

  return colorCards;
}, {});

export const SUIT_ORDER = scoreKeyed(ColorSuites);

export const TRUMP_ORDER = AllSuites.reduce((trumps, suit) => {
  trumps[suit] = ((suit) => {

    if (suit === Null) {
      return scoreKeyed([]);
    }

    if (suit === Ramsch || suit === Grand) {
      return scoreKeyed(JACKS);
    }

    return scoreKeyed([
      ...JACKS,
      ...COLOR_CARDS[suit][suit]
    ]);
  })(suit);

  return trumps;
}, {});

export const COLOR_ORDER = Object.entries(COLOR_CARDS).reduce((byTrump, [suit, cardsBySuit]) => {

  byTrump[suit] = Object.entries(cardsBySuit).reduce((bySuit, [ suit, cards]) => {
    bySuit[suit] = scoreKeyed(cards);

    return bySuit;
  }, {});

  return byTrump;
}, {});

/**
 * @param {Card} card
 *
 * @return {number}
 */
export function getCardValue(card) {
  return CardValues[card];
}

/**
 * @param {Card} card
 *
 * @return {[ Suit, Picture ]}
 */
export function cardComponents(card) {
  return CardComponents[card];
}

/**
 * @param {Trick} trick
 * @param {Suit} trumpSuit
 *
 * @return {Player}
 */
export function getTrickWinner(trick, trumpSuit) {

  let winner;

  for (const part of trick) {

    if (!winner) {
      winner = part;
    } else {

      if (beatsCompare(part[1], winner[1], trumpSuit) > 0) {
        winner = part;
      }
    }
  }

  return winner[0];
}

/**
 * @param {Card} card
 * @param {Trick} trick
 * @param {Card[]} hand
 * @param {Suit} trumpSuit
 *
 * @return {boolean}
 */
export function isValidTrickCard(card, trick, hand, trumpSuit) {

  if (trick.length === 0) {
    return true;
  }

  const firstCard = trick[0][1];

  const trumps = TRUMP_ORDER[trumpSuit];

  if (trumps[firstCard]) {
    if (trumps[card]) {
      return true;
    }

    return !hand.some(card => trumps[card]);
  }

  const [ suit ] = cardComponents(firstCard);

  const color = COLOR_ORDER[trumpSuit][suit];

  if (color[card]) {
    return true;
  }

  return !hand.some(card => color[card]);
}

/**
 * @param {Card} a
 * @param {Card} b
 * @param {Suit} trumpSuit
 *
 * @return {number}
 */
export function beatsCompare(a, b, trumpSuit) {

  const [ aSuit ] = cardComponents(a);

  const [ bSuit ] = cardComponents(b);

  const trumps = TRUMP_ORDER[trumpSuit];

  if (trumps[a] && trumps[b]) {
    return trumps[b] - trumps[a];
  }

  if (trumps[a]) {
    return 1;
  }

  if (trumps[b]) {
    return -1;
  }

  if (aSuit === bSuit) {
    const colorOrder = COLOR_ORDER[trumpSuit][bSuit];

    return colorOrder[b] - colorOrder[a];
  }

  return -1;
}


/**
 * @param {Card} a
 * @param {Card} b
 * @param {Suit} trumpSuit
 * @return {number}
 */
export function semanticCompare(a, b, trumpSuit) {

  const [ aSuit ] = cardComponents(a);

  const [ bSuit ] = cardComponents(b);

  const trumps = TRUMP_ORDER[trumpSuit];

  if (trumps[a] && trumps[b]) {
    return trumps[b] - trumps[a];
  }

  if (trumps[a]) {
    return 1;
  }

  if (trumps[b]) {
    return -1;
  }

  if (aSuit === bSuit) {
    const colorOrder = COLOR_ORDER[trumpSuit][bSuit];

    return colorOrder[b] - colorOrder[a];
  }

  return SUIT_ORDER[bSuit] - SUIT_ORDER[aSuit];
}

export function semanticSort(cards, suit) {
  return cards.slice().sort((a, b) => semanticCompare(a, b, suit)).reverse();
}

/**
 * @param {Suit} suit
 * @param {Picture} picture
 *
 * @return {(Card) => boolean}
 */
export function findCard(suit, picture) {
  return (card) => {
    const [ _suit, _picture ] = cardComponents(card);

    return _suit === suit && _picture === picture;
  };
}

/**
 * @param {Card[]} cards
 * @return {number}
 */
export function getJacksModifier(cards) {
  const result = ColorSuites.reduce((val, suit) => {

    // skip
    if (val && val[2]) {
      return val;
    }

    const foundJack = cards.some(findCard(suit, Jack));

    if (val.length === 0) {
      return [ 1, foundJack, false ];
    } else {

      const [ count, withJack ] = val;

      if (withJack === foundJack) {
        return [ count + 1, withJack, false ];
      } else {
        return [ count, withJack, true ];
      }
    }
  }, []);

  return result[0];
}

const dealSequence = Array.from('11122233344111122223333111222333').map(s => parseInt(s, 10));

/**
 * Dealing cards, TÜF Rheinland geprüft. 🥳
 *
 * @return { [ hands: [ Card[], Card[], Card[] ], skat: Card[] ]}
 */
export function dealCards() {

  const cards = shuffle(AllCards);

  const buckets = [
    [], [], [], []
  ];

  for (const bucket of dealSequence) {
    const card = cards.pop();

    buckets[bucket - 1].push(card);
  }

  return [
    [
      buckets[0],
      buckets[1],
      buckets[2]
    ],
    buckets[3]
  ];
}

/**
 * Shuffles an array.
 *
 * @template T
 * @param {T[]} arr
 * @return {T[]}
 */
export function shuffle(arr) {
  const copy = arr.slice();

  let j, x, i;
  for (i = copy.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = copy[i];
    copy[i] = copy[j];
    copy[j] = x;
  }

  return copy;
}