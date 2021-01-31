import {
  Null,
  Ramsch,
  Grand,
  Hand,
  Schwarz,
  Schneider,
  Overt,
  Win,
  Loss,
  Contra,
  Re,
  Bock,
  Clubs,
  Spades,
  Hearts,
  Diamonds
} from './Constants';

import {
  getCardValue
} from './Util';

/**
 * @typedef { import('./types').Player } Player
 * @typedef { import('./types').Card } Card
 * @typedef { import('./types').State } State
 * @typedef { import('./types').Result } Result
 * @typedef { import('./types').Trick } Trick
 */

/**
 * Sum value of cards.
 *
 * @param {number} sum
 * @param {Card} card
 *
 * @return {number}
 */
function sumCards(sum, card) {
  return sum + getCardValue(card);
}

/**
 * Sum value of tricks.
 *
 * @param {Trick[]} tricks
 *
 * @return {number}
 */
function sumTricks(tricks) {
  return tricks.flat().map(t => t[1]).reduce(sumCards, 0);
}

/**
 * Calculate a Ramsch result.
 *
 * @param {Player[]} players
 * @param {State} state
 *
 * @return {Result}
 */
function calculateRamschResults(players, state) {

  const {
    playerTricks,
    result
  } = state;

  const trickPoints = playerTricks.map(sumTricks);

  const skatPoints = state.skat.reduce(sumCards, 0);

  const max = Math.max(...trickPoints);

  const looser = trickPoints.indexOf(max);

  const points = max + skatPoints;

  return {
    ...result,
    outcome: Loss,
    player: looser,
    points: players.map(p => p === looser ? [ [ 'points', -points ] ] : [])
  };
}

/**
 * Calculate a Null result.
 *
 * @param {Player[]} players
 * @param {State} state
 *
 * @return {Result}
 */
function calculateNullResults(players, state) {

  const {
    game,
    player,
    playerTricks
  } = state;

  const {
    modifiers
  } = game;

  let {
    result = {}
  } = state;

  const outcome = result.outcome || playerTricks[player].length === 0 ? Win : Loss;

  const modifierMap = {
    [ 0 ]: 23,
    [ Hand ]: 35,
    [ Overt ]: 46,
    [ Hand | Overt ]: 59
  };

  const basePoints = modifierMap[modifiers & (Hand | Overt)];

  const points = (
    (basePoints) *
    (outcome === Win && 1 || -2) *
    (modifiers & Contra && 2 || 1) *
    (modifiers & Re && 2 || 1) *
    (modifiers & Bock && 2 || 1)
  );

  return {
    ...result,
    outcome,
    player,
    points: players.map(p => p === player ? [ [ 'points', points ] ] : [])
  };
}

/**
 * Calculate a suit (or Grand) result
 *
 * @param {Player[]} players
 * @param {State} state
 *
 * @return {Result}
 */
function calculateSuitResults(players, state) {

  const {
    game,
    player,
    playerTricks
  } = state;

  const {
    suit,
    modifiers,
    jacks
  } = game;

  let {
    result = {}
  } = state;

  const valueMap = {
    [ Clubs ]: 12,
    [ Spades ]: 11,
    [ Hearts ]: 10,
    [ Diamonds ]: 9,
    [ Grand ]: 24
  };

  // TODO: add remaining cards to player, if enemy gave up
  const tricksValue = sumTricks(playerTricks[player]);

  const outcome = result.outcome || (
    modifiers & Schwarz && tricksValue < 120 ? Loss : (
      modifiers & Schneider && tricksValue <= 90 ? Loss : (
        tricksValue <= 60 ? Loss : Win
      )
    )
  );

  const basePoints = valueMap[suit];
  const gameModifier = (
    jacks +
    1 +
    (modifiers & Hand ? 1 : 0) +
    (modifiers & Overt ? 1 : 0) +
    (modifiers & Schneider ? 1 : 0) +
    (modifiers & Schwarz ? 1 : 0) +
    (tricksValue === 120 ? 1 : 0) +
    (tricksValue > 90 ? 1 : 0)
  );

  const points = (
    basePoints *
    gameModifier *
    (outcome === Win ? 1 : -2) *
    (modifiers & Contra ? 2 : 1) *
    (modifiers & Re ? 2 : 1) *
    (modifiers & Bock ? 2 : 1)
  );

  return {
    ...result,
    outcome,
    player,
    points: players.map(p => p === player ? [ [ 'points', points ] ] : [])
  };
}

/**
 * Calculate results based on game state.
 *
 * @param {Player[]} players
 * @param {State} state
 *
 * @return {Result}
 */
export function calculateResults(players, state) {

  const suit = state.game.suit;

  if (suit === Ramsch) {
    return calculateRamschResults(players, state);
  }

  if (suit === Null) {
    return calculateNullResults(players, state);
  }

  return calculateSuitResults(players, state);
}