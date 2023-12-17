export const Seven = '7';
export const Eight = '8';
export const Nine = '9';
export const Ten = '10';
export const Jack = 'J';
export const Queen = 'Q';
export const King = 'K';
export const Ace = 'A';

export const Grand = 'G';
export const Null = 'N';
export const Ramsch = 'R';

export const Clubs = '♣';
export const Spades = '♠';
export const Hearts = '♥';
export const Diamonds = '♦';

/* eslint no-multi-spaces: "off" */
export const Schneider     = 0b00000000001;
export const Schwarz       = 0b00000000010;

export const Contra        = 0b00000000100;
export const Re            = 0b00000001100;
export const Bock          = 0b00000011100;

export const Overt         = 0b00000100000;
export const Hand          = 0b00001000000;

export const NoModifiers   = 0b00000000000;
export const AllModifiers  = 0b00001111111;

export const Win = 'win';
export const Loss = 'loss';

/**
 * @typedef { import("./types").ColorSuit } ColorSuit
 * @typedef { import("./types").Suit } Suit
 * @typedef { import("./types").Card } Card
 * @typedef { import("./types").Picture } Picture
 */

/**
 * @type { ColorSuit[] }
 */
export const ColorSuits = [
  Clubs,
  Spades,
  Hearts,
  Diamonds
];

/**
 * @type { Picture[] }
 */
export const Pictures = [
  Ace,
  Ten,
  King,
  Queen,
  Jack,
  Nine,
  Eight,
  Seven
];

/**
 * @type { Record<Picture, number> }
 */
export const PictureValues = {
  [Seven]: 0,
  [Eight]: 0,
  [Nine]: 0,
  [Ten]: 10,
  [Jack]: 2,
  [Queen]: 3,
  [King]: 4,
  [Ace]: 11
};

/**
 * @type { Card[] }
 */
export const AllCards = /** @type { Card[] } */ (
  ColorSuits.map(s => Pictures.map(p => `${s}${p}`)).flat()
);

/**
 * @typedef { Record<Card, [ ColorSuit, Picture ]>} CardComponents
 */

/**
 * @type { CardComponents }
 */
export const CardComponents = AllCards.reduce((components, card) => {
  components[card] = /** @type { [ ColorSuit, Picture ] } */ (
    /^(♣|♠|♥|♦)(.*)$/.exec(card).slice(1)
  );

  return components;
}, /** @type { CardComponents } */ ({}));

/**
 * @typedef { Record<Card, number>} CardValues
 */

/**
 * @type { CardValues }
 */
export const CardValues = AllCards.reduce((values, card) => {
  values[card] = PictureValues[CardComponents[card][1]];
  return values;
}, /** @type { CardValues } */ ({}));

/**
 * @type { Suit[] }
 */
export const AllSuits = [ ...ColorSuits, Grand, Ramsch, Null ];
