import {
  AllCards,
  AllSuites,
  CardComponents,
  CardValues,
  ColorSuites,
  Jack,
  Null
} from './Constants';

/**
 * @typedef { import('./types').Card } Card
 * @typedef { import('./types').Trick } Trick
 * @typedef { import('./types').Suit } Suit
 * @typedef { import('./types').Picture } Picture
 * @typedef { import('./types').Player } Player
 */


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

      if (compareCards(winner[1], part[1], trumpSuit) < 0) {
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

  const [ firstSuit, firstPicture ] = cardComponents(trick[0][1]);

  const [ cardSuit, cardPicture ] = cardComponents(card);

  if (trumpSuit === Null) {
    return firstSuit === cardSuit || !hand.some(card => cardComponents(card)[0] === firstSuit);
  }

  // trump is played
  if (firstSuit === trumpSuit || firstPicture === Jack) {

    return (cardSuit === trumpSuit || cardPicture === Jack) || !hand.some(card => {
      const [ cardSuit, cardPicture ] = cardComponents(card);

      return cardSuit === trumpSuit || cardPicture === Jack;
    });
  }

  // something else is played
  return (cardSuit === firstSuit && cardSuit !== Jack) || !hand.some(card => {
    const [ cardSuit ] = cardComponents(card);

    return cardSuit === firstSuit && cardSuit !== Jack;
  });

}

const SUIT_ORDER = AllSuites;

const NULL_ORDER = [ '7', '8', '9', '10', 'J', 'Q', 'K', 'A' ];
const DEFAULT_ORDER = [ '7', '8', '9', 'Q', 'K', '10', 'A', 'J' ];


/**
 * @param {Card} a
 * @param {Card} b
 * @param {Suit} trumpSuit
 *
 * @return {number}
 */
export function compareCards(a, b, trumpSuit) {

  const [ aSuit, aPicture ] = cardComponents(a);

  const [ bSuit, bPicture ] = cardComponents(b);

  if (trumpSuit === Null) {

    if (aSuit === bSuit) {
      return NULL_ORDER.indexOf(aPicture) - NULL_ORDER.indexOf(bPicture);
    }

    return 1;
  } else {
    if (aSuit === bSuit) {
      return DEFAULT_ORDER.indexOf(aPicture) - DEFAULT_ORDER.indexOf(bPicture);
    }

    if (aPicture === Jack && bPicture === Jack) {
      return SUIT_ORDER.indexOf(bSuit) - SUIT_ORDER.indexOf(aSuit);
    }

    if (bSuit === trumpSuit || bPicture === Jack) {
      return -1;
    }

    return 1;
  }

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