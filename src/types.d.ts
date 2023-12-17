export type Seven = "7";
export type Eight = "8";
export type Nine = "9";
export type Ten = "10";
export type Jack = "J";
export type Queen = "Q";
export type King = "K";
export type Ace = "A";
export type Grand = "G";
export type Null = "N";
export type Ramsch = "R";
export type Clubs = "♣";
export type Spades = "♠";
export type Hearts = "♥";
export type Diamonds = "♦";
export type Schneider = 1;
export type Schwarz = 2;
export type Contra = 4;
export type Re = 12;
export type Bock = 28;
export type Overt = 32;
export type Hand = 64;
export type NoModifiers = 0;
export type AllModifiers = 127;
export type Win = "win";
export type Loss = "loss";

export type ColorSuit =
    Clubs |
    Spades |
    Hearts |
    Diamonds;

export type OtherSuit =
    Null |
    Grand |
    Ramsch;

export type Suit = ColorSuit | OtherSuit;

export type Picture =
    Seven |
    Eight |
    Nine |
    Ten |
    Jack |
    Queen |
    King |
    Ace;

export type Card = `${ColorSuit}${Picture}`;

export type Player = number;

export type GameModifiers = number;
export type GameStep = string;

export type GameState = {
  suit: Suit;
  modifiers: GameModifiers;
  jacks: number;
};

export type PointsPart = [ string, number ];

export type Result = {
  outcome: Win | Loss,
  player: Player,
  points: PointsPart[][],
  reason?: [ Player, string ]
};

export type BiddingState = {
  leader: Player;
  bidder: Player;
  acknowledger: Player;
  participants: Player[];
  bid: number
};

export type PlayedCard = [ Player, Card ];

export type Trick = PlayedCard[];

export type State = {

  // initialize
  hands: Card[][];
  skat: Card[];

  initialHands: Card[][];
  initialSkat: Card[];

  // bidding
  bidding?: Partial<BiddingState>;

  // playing
  game?: Partial<GameState>;

  currentTrick: Trick;
  lastTrick: Trick;

  playerTricks: Trick[][];

  tricks: Trick[];

  player?: Player;

  result?: Partial<Result>;
};