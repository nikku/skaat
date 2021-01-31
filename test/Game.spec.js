import { expect } from './chai';

import {
  Game,
  Grand,
  Clubs,
  Ramsch,
  Null,
  isValidTrickCard,
  getTrickWinner
} from '../lib';


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

    });


    it('should run declaration', function() {

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
      expect(game.state.game.hand).to.be.false;

      expect(game.next('declare', 1, {
        suit: Grand
      })).to.eql([ 'ask-card', 1 ]);

      expect(game.state.game).to.eql({
        bid: 18,
        declarer: 1,
        hand: false,
        limit: 0,
        open: false,
        suit: 'G'
      });

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

      expect(game.state.game).to.eql({
        bid: 35,
        declarer: 2,
        hand: true,
        limit: 0,
        open: false,
        suit: 'G'
      });

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

        expect(game.state.game).to.eql({
          bid: 23,
          declarer: 0,
          hand: true,
          limit: 0,
          open: false,
          suit: Null
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

        expect(game.state.result).to.exist;
        expect(game.state.player).to.exist;
        expect(game.state.points).not.to.exist;
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

        expect(game.state.game).to.eql({
          bid: 24,
          declarer: 0,
          hand: true,
          limit: 0,
          open: false,
          suit: Clubs
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
        expect(game.state.player).to.exist;
        expect(game.state.points).to.exist;
      });


      it.skip('Ramsch', function() {

        // given
        const game = new Game();

        expect(game.next('start')).to.eql([ 'ask-bid', 2 ]);
        expect(game.next('pass', 2)).to.eql([ 'ask-bid', 0 ]);
        expect(game.next('pass', 0)).to.eql([ 'ask-bid', 1 ]);

        // when
        let next = game.next('pass', 1);

        expect(game.state.game).to.eql({
          bid: null,
          declarer: null,
          hand: true,
          suit: Ramsch
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