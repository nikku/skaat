import {
  AllCards,
  AllSuites,
  CardComponents,
  CardValues,
  ColorSuites,
  Pictures,
  Jack,
  Null,
  Ramsch,
  Grand
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

function scoreKeyed(arr) {
  return arr.reduce((score, card, index) => {
    score[card] = index + 1;

    return score;
  }, {});
}

const SUIT_ORDER = scoreKeyed(ColorSuites);

const NULL_ORDER = scoreKeyed([ 'A', 'K', 'Q', 'J', '10', '9', '8', '7' ]);
const DEFAULT_ORDER = scoreKeyed([ 'A', '10', 'K', 'Q', '9', '8', '7' ]);

const NON_JACK_PICTURES = Pictures.filter(p => p !== Jack);

const JACKS = ColorSuites.map(suit => `${suit}${Jack}`);

const TRUMP_CARDS = AllSuites.reduce((trumps, suit) => {
  trumps[suit] = ((suit) => {

    if (suit === Null) {
      return [];
    }

    if (suit === Ramsch || suit === Grand) {
      return scoreKeyed(JACKS);
    }

    return scoreKeyed([
      ...JACKS,
      ...NON_JACK_PICTURES.map(p => `${suit}${p}`)
    ]);
  })(suit);

  return trumps;
}, {});


/**
 * @param {Card} a
 * @param {Card} b
 * @param {Suit} trumpSuit
 *
 * @return {number}
 */
export function beatsCompare(a, b, trumpSuit) {

  const [ aSuit, aPicture ] = cardComponents(a);

  const [ bSuit, bPicture ] = cardComponents(b);

  const trumps = TRUMP_CARDS[trumpSuit];
  const order = trumpSuit === Null ? NULL_ORDER : DEFAULT_ORDER;

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
    return order[bPicture] - order[aPicture];
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

  const [ aSuit, aPicture ] = cardComponents(a);

  const [ bSuit, bPicture ] = cardComponents(b);

  const trumps = TRUMP_CARDS[trumpSuit];
  const order = trumpSuit === Null ? NULL_ORDER : DEFAULT_ORDER;

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
    return order[bPicture] - order[aPicture];
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