import { expect } from './chai';

import {
  Game,
  Grand,
  Clubs,
  Ramsch,
  Hand,
  Null,
  Overt,
  Schwarz,
  Schneider,
  NoModifiers,
  isValidTrickCard,
  getTrickWinner
} from '../src';


describe('Game', function() {

  describe('states', function() {

    it('should initialize', function() {

      // given
      const game = new Game();

      // when
      game.next('start');

      // then
      for (const hand of game.state.hands) {
        expect(hand).to.have.length(10);
      }

      expect(game.state.skat).to.have.length(2);

      expect(game.state.skat).to.eql(game.state.initialSkat);
      expect(game.state.hands).to.eql(game.state.initialHands);
    });


    it('should run bidding', function() {

      // given
      const game = new Game();

      // when
      expect(game.next('start')).to.eql([ 'ask-bid', 2 ]);

      expect(game.state.bidding).to.deep.include({
        acknowledger: 1,
        bidder: 2,
        participants: [ 0, 1, 2 ]
      });

      expect(game.next('bid', 2, 18)).to.eql([ 'ask-ack', 1 ]);

      expect(game.state.bidding.bid).to.eql(18);

      expect(game.next('pass', 1)).to.eql([ 'ask-bid', 0 ]);

      expect(game.next('bid', 0, 20)).to.eql([ 'ask-ack', 2 ]);

      expect(game.state.bidding.bid).to.eql(20);

      expect(game.next('pass', 2)).to.eql([ 'ask-declare', 0 ]);

      expect(game.state.bidding).to.eql({
        leader: 0,
        bid: 20
      });

      expect(game.state.player).to.eql(0);
    });


    it('should pick skat', function() {

      // given
      const game = new Game();

      expect(game.next('start')).to.eql([ 'ask-bid', 2 ]);
      expect(game.next('pass', 2)).to.eql([ 'ask-bid', 0 ]);
      expect(game.next('pass', 0)).to.eql([ 'ask-bid', 1 ]);
      expect(game.next('bid', 1, 18)).to.eql([ 'ask-declare', 1 ]);

      // when
      const hand = game.state.hands[1];
      const skat = game.state.skat;

      expect(game.next('pick-skat', 1)).to.eql([ 'ask-skat', 1 ]);

      const newSkat = [ hand[1], hand[5] ];
      const newHand = hand.concat(skat).filter(c => !newSkat.includes(c));

      expect(game.next('put-skat', 1, newSkat)).to.eql([ 'ask-declare', 1 ]);

      expect(game.state.hands[1]).to.eql(newHand);
      expect(game.state.skat).to.eql(newSkat);
      expect(game.state.game.modifiers & Hand).to.eql(0);
    });


    it('should declare', function() {

      // given
      const game = new Game();

      expect(game.next('start')).to.eql([ 'ask-bid', 2 ]);
      expect(game.next('pass', 2)).to.eql([ 'ask-bid', 0 ]);
      expect(game.next('pass', 0)).to.eql([ 'ask-bid', 1 ]);
      expect(game.next('bid', 1, 18)).to.eql([ 'ask-declare', 1 ]);

      // when
      const hand = game.state.hands[1];

      expect(game.next('pick-skat', 1)).to.eql([ 'ask-skat', 1 ]);

      const newSkat = [ hand[1], hand[5] ];

      expect(game.next('put-skat', 1, newSkat)).to.eql([ 'ask-declare', 1 ]);

      expect(() => {
        game.next('declare', 1, {
          suit: Null,
          modifiers: Hand
        });
      }).to.throw(/cannot declare Hand/);

      expect(() => {
        game.next('declare', 1, {
          suit: 'F',
          modifiers: Hand
        });
      }).to.throw(/unknown suit <F>/);

      expect(() => {
        game.next('declare', 1, {
          suit: Null,
          modifiers: Schneider
        });
      }).to.throw(/illegal modifier <Schneider> for suit <Null>/);

      expect(() => {
        game.next('declare', 1, {
          suit: Null,
          modifiers: Schwarz
        });
      }).to.throw(/illegal modifier <Schwarz> for suit <Null>/);

      expect(game.next('declare', 1, {
        suit: Grand,
        modifiers: Overt | Schwarz
      })).to.eql([ 'ask-card', 1 ]);

      expect(game.state.game).to.include({
        modifiers: Overt | Schwarz | Schneider,
        suit: Grand
      });

      expect(game.state.player).to.eql(1);
    });


    it('should run game', function() {

      // given
      const game = new Game();

      expect(game.next('start')).to.eql([ 'ask-bid', 2 ]);
      expect(game.next('bid', 2, 35)).to.eql([ 'ask-ack', 1 ]);
      expect(game.next('pass', 1)).to.eql([ 'ask-bid', 0 ]);
      expect(game.next('pass', 0)).to.eql([ 'ask-declare', 2 ]);

      // when
      expect(game.next('declare', 2, {
        suit: Grand
      })).to.eql([ 'ask-card', 1 ]);

      expect(game.state.game).to.include({
        suit: Grand,
        modifiers: NoModifiers | Hand
      });

      expect(game.state.player).to.eql(2);

      expect(game.state.lastTrick).to.eql(null);
      expect(game.state.playerTricks).to.eql([
        [], [], []
      ]);

      expect(game.state.tricks).to.eql([]);
      expect(game.state.currentTrick).to.eql([]);

      const validCard_1 = validCard(game, 1);

      expect(game.next('play-card', 1, validCard_1)).to.eql([ 'ask-card', 2 ]);

      const validCard_2 = validCard(game, 2);

      expect(game.next('play-card', 2, validCard_2)).to.eql([ 'ask-card', 0 ]);

      const validCard_0 = validCard(game, 0);

      const next = game.next('play-card', 0, validCard_0);

      // then
      // round completed, last trick logged
      expect(game.state.lastTrick).to.eql([
        [ 1, validCard_1 ],
        [ 2, validCard_2 ],
        [ 0, validCard_0 ]
      ]);

      expect(game.state.tricks).to.eql([
        game.state.lastTrick
      ]);

      expect(game.state.currentTrick).to.eql([]);

      // last winner starts next round
      const lastWinner = getTrickWinner(game.state.lastTrick, game.state.game.suit);

      expect(game.state.playerTricks).to.eql(
        [0, 1, 2].map(p => p === lastWinner ? [
          game.state.lastTrick
        ] : [])
      );

      expect(next).to.eql([ 'ask-card', lastWinner ]);
    });


    describe('should play', function() {

      it('Null', function() {

        // given
        const game = new Game();

        expect(game.next('start')).to.eql([ 'ask-bid', 2 ]);
        expect(game.next('pass', 2)).to.eql([ 'ask-bid', 0 ]);
        expect(game.next('bid', 0, 23)).to.eql([ 'ask-ack', 1 ]);
        expect(game.next('pass', 1)).to.eql([ 'ask-declare', 0 ]);

        // when
        let next = game.next('declare', 0, {
          suit: Null
        });

        expect(game.state.game).to.include({
          modifiers: NoModifiers | Hand,
          suit: Null
        });

        expect(game.state.game.jacks).not.to.exist;

        while (next) {

          const [ action, player ] = next;

          if (action === 'ask-card') {
            expect(player).to.exist;

            const card = validCard(game, player);

            next = game.next('play-card', player, card);

            continue;
          }

          if (action === 'end') {
            break;
          }

          expect(action).not.to.exist;
        }

        // then
        expect(game.state.result).to.have.keys([
          'outcome',
          'player',
          'points'
        ]);

        expect(game.state.result.player).to.eql(0);

        const expectedPoints = game.state.result.outcome === 'loss' ? -70 : 35;

        expect(game.state.result.points).to.eql([
          [
            [ 'points', expectedPoints ]
          ],
          [],
          []
        ]);
      });


      it('Clubs', function() {

        // given
        const game = new Game();

        expect(game.next('start')).to.eql([ 'ask-bid', 2 ]);
        expect(game.next('pass', 2)).to.eql([ 'ask-bid', 0 ]);
        expect(game.next('bid', 0, 24)).to.eql([ 'ask-ack', 1 ]);
        expect(game.next('pass', 1)).to.eql([ 'ask-declare', 0 ]);

        // when
        let next = game.next('declare', 0, {
          suit: Clubs
        });

        expect(game.state.game).to.include({
          modifiers: NoModifiers | Hand,
          suit: Clubs
        });

        expect(game.state.game.jacks).to.exist;

        while (next) {

          const [ action, player ] = next;

          if (action === 'ask-card') {
            expect(player).to.exist;

            const card = validCard(game, player);

            next = game.next('play-card', player, card);

            continue;
          }

          if (action === 'end') {
            break;
          }

          expect(action).not.to.exist;
        }

        // then
        expect(game.state.tricks).to.have.length(10);

        expect(game.state.result).to.have.keys([
          'outcome',
          'player',
          'points'
        ]);

        expect(game.state.result.player).to.eql(0);

        expect(game.state.result.points[0]).to.have.length(1);
      });


      it('Grand', function() {

        // given
        const game = new Game();

        expect(game.next('start')).to.eql([ 'ask-bid', 2 ]);
        expect(game.next('pass', 2)).to.eql([ 'ask-bid', 0 ]);
        expect(game.next('pass', 0)).to.eql([ 'ask-bid', 1 ]);
        expect(game.next('bid', 1, 24)).to.eql([ 'ask-declare', 1 ]);

        // when
        let next = game.next('declare', 1, {
          suit: Grand,
          modifiers: Schneider | Overt
        });

        expect(game.state.game).to.include({
          modifiers: NoModifiers | Hand | Schneider | Overt,
          suit: Grand
        });

        while (next) {

          const [ action, player ] = next;

          if (action === 'ask-card') {
            expect(player).to.exist;

            const card = validCard(game, player);

            next = game.next('play-card', player, card);

            continue;
          }

          if (action === 'end') {
            break;
          }

          expect(action).not.to.exist;
        }

        // then
        expect(game.state.tricks).to.have.length(10);

        expect(game.state.result).to.have.keys([
          'outcome',
          'player',
          'points'
        ]);

        expect(game.state.result.player).to.eql(1);

        expect(game.state.result.points[1]).to.have.length(1);
      });


      it.skip('Ramsch', function() {

        // given
        const game = new Game();

        expect(game.next('start')).to.eql([ 'ask-bid', 2 ]);
        expect(game.next('pass', 2)).to.eql([ 'ask-bid', 0 ]);
        expect(game.next('pass', 0)).to.eql([ 'ask-bid', 1 ]);

        // when
        let next = game.next('pass', 1);

        expect(game.state.game).to.include({
          suit: Ramsch,
          modifiers: 0
        });

        while (next) {

          const [ action, player ] = next;

          if (action === 'ask-card') {
            expect(player).to.exist;

            const card = validCard(game, player);

            next = game.next('play-card', player, card);

            continue;
          }

          if (action === 'end') {
            break;
          }

          expect(action).not.to.exist;
        }

        expect(game.state.tricks).to.have.length(10);
        expect(game.state.result).to.exist;
      });
    });

  });


  describe('error handling', function() {

    it('should handle invalid action', function() {

      // given
      const game = new Game();

      // then
      expect(function() {
        game.next('foo');
      }).to.throw(/no transition initial -> foo/);

    });


    it('should handle invalid actor', function() {

      // given
      const game = new Game();

      // when
      game.next('start');

      // then
      expect(function() {
        game.next('bid', 0);
      }).to.throw(/unexpected actor <0>/);

    });

  });

});



// helpers ////////////////

function validCard(game, player) {

  const {
    hands,
    currentTrick: trick
  } = game.state;

  const {
    suit
  } = game.state.game;

  const hand = hands[player];

  return hand.find(card => isValidTrickCard(card, trick, hand, suit));
}