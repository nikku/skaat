export type Player = number;
export type Card = string;

export type State = {

  // initialize
  hands: Card[][];
  skat: Card[];

  playerTurn?: Player;
  playerAction?: string;

  // bidding
  bidding?: {
    leader?: Player;
    bidder?: Player;
    acknowledger: Player;
    participants: Player[]
    bid: number
  };

  // declaring
  hand: boolean;

  // playing
  game: {
    declarer: Player;
    suit: string;
    hand: boolean;
    open: boolean;
    limit: number;
  };

  currentTrick: Card[];

  playerTricks: Card[][];
}