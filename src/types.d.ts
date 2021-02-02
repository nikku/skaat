export type Win = 'win';
export type Loss = 'loss';

export type Suit = string;
export type Picture = string;
export type Player = number;
export type Card = string;

export type Game = {
  suit: Suit;
  modifiers: number;
  jacks: number;
};

export type PointsPart = [ string, number ];

export type Result = {
  outcome: Win | Loss,
  player: Player,
  points: PointsPart[][],
  reason?: [ Player, string ]
};

export type Bidding = {
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
  bidding?: Partial<Bidding>;

  // playing
  game?: Partial<Game>;

  currentTrick: Trick;
  lastTrick: Trick;

  playerTricks: Trick[][];

  tricks: Trick[];

  player?: Player;

  result?: Partial<Result>;
};