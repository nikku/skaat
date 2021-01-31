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

export const Schneider = 1;
export const Schwarz = 3;

export const Contra = 1;
export const Re = 3;
export const Bock = 7;

export const ColorSuites = [
  Clubs,
  Spades,
  Hearts,
  Diamonds
];

export const Pictures = [
  Seven,
  Eight,
  Nine,
  Ten,
  Jack,
  Queen,
  King,
  Ace
];

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

export const Cards = ColorSuites.map(s => Pictures.map(p => `${s}${p}`)).flat();

export const CardComponents = Cards.reduce((components, card) => {
  components[card] = /^(♣|♠|♥|♦)(.*)$/.exec(card).slice(1);
  return components;
}, {});

export const CardValues = Cards.reduce((values, card) => {
  values[card] = PictureValues[CardComponents[card][1]];
  return values;
}, {});

export const AllSuites = [ ...ColorSuites, Grand, Null ];
