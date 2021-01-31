import {
  Null,
  CardComponents,
  CardValues,
  Jack
} from './Constants';

export function getCardValue(card) {
  return CardValues[card];
}

export function cardComponents(card) {
  return CardComponents[card];
}

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

const SUIT_ORDER = [ '♣', '♠', '♥', '♦' ];

const NULL_ORDER = [ '7', '8', '9', '10', 'J', 'Q', 'K', 'A' ];
const DEFAULT_ORDER = [ '7', '8', '9', 'Q', 'K', '10', 'A', 'J' ];

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