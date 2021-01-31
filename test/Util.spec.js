import { expect } from './chai';

import {
  Null,
  Clubs,
  Ramsch,
  Grand
} from '../lib/Constants';

import {
  isValidTrickCard,
  getTrickWinner,
  getJacksModifier,
  compareCards,
  dealCards
} from '../lib/Util';


describe('Util', function() {

  describe('#isValidTrickCard', function() {

    it('should determine card validity', function() {

      // erste Karte
      expect(isValidTrickCard('♣9', trick(), [ '♣9', '♥9' ], Clubs)).to.be.true;
      expect(isValidTrickCard('♥9', trick(), [ '♣9', '♥9' ], Clubs)).to.be.true;

      // bedienen
      expect(isValidTrickCard('♣9', trick('♣7'), [ '♣9', '♥9' ], Clubs)).to.be.true;
      expect(isValidTrickCard('♥9', trick('♣7'), [ '♣9', '♥9' ], Clubs)).to.be.false;
      expect(isValidTrickCard('♣J', trick('♥J'), [ '♣J', '♥9' ], Grand)).to.be.true;
      expect(isValidTrickCard('♣9', trick('♥J'), [ '♣J', '♥9' ], Grand)).to.be.false;

      // stechen
      expect(isValidTrickCard('♣9', trick('♥7'), [ '♣9', '♥10' ], Clubs)).to.be.false;
      expect(isValidTrickCard('♣9', trick('♦7'), [ '♣9', '♥10' ], Clubs)).to.be.true;

      // abwerfen
      expect(isValidTrickCard('♦9', trick('♥7'), [ '♣9', '♦9' ], Clubs)).to.be.true;
      expect(isValidTrickCard('♦9', trick('♥7'), [ '♣9', '♦9' ], Null)).to.be.true;
      expect(isValidTrickCard('♣J', trick('♥J'), [ '♣J', '♥9' ], Null)).to.be.false;
      expect(isValidTrickCard('♣J', trick('♥J'), [ '♣J', '♦9' ], Null)).to.be.true;
    });

  });


  describe('#compareCards', function() {

    it('should compare', function() {
      expect(compareCards('♥J', '♣J', Null)).to.eql(1);
      expect(compareCards('♥7', '♥10', Null)).to.eql(-3);
      expect(compareCards('♥Q', '♥10', Null)).to.eql(2);

      expect(compareCards('♥J', '♣J', Grand)).to.eql(-2);
      expect(compareCards('♥10', '♣7', Clubs)).to.eql(-1);
      expect(compareCards('♥10', '♦7', Clubs)).to.eql(1);
      expect(compareCards('♣10', '♥J', Clubs)).to.eql(-1);
      expect(compareCards('♣J', '♥J', Clubs)).to.eql(2);
      expect(compareCards('♥7', '♥10', Clubs)).to.eql(-5);
      expect(compareCards('♥Q', '♥10', Clubs)).to.eql(-2);
    });

  });


  describe('#getTrickWinner', function() {

    it('should determine winner', function() {

      expect(getTrickWinner(trick('♣J', '♥J', '♦J'), Grand)).to.eql(0);
      expect(getTrickWinner(trick('♣J', '♥J', '♦J'), Ramsch)).to.eql(0);
      expect(getTrickWinner(trick('♣J', '♥J', '♦J'), Clubs)).to.eql(0);
      expect(getTrickWinner(trick('♣J', '♥J', '♦J'), Null)).to.eql(0);

      expect(getTrickWinner(trick('♥J', '♣J', '♦J'), Grand)).to.eql(1);
      expect(getTrickWinner(trick('♥J', '♣J', '♦J'), Ramsch)).to.eql(1);
      expect(getTrickWinner(trick('♥J', '♣J', '♦J'), Clubs)).to.eql(1);
      expect(getTrickWinner(trick('♥J', '♣J', '♦J'), Null)).to.eql(0);

      expect(getTrickWinner(trick('♥7', '♥10', '♥Q'), Grand)).to.eql(1);
      expect(getTrickWinner(trick('♥7', '♥10', '♥Q'), Ramsch)).to.eql(1);
      expect(getTrickWinner(trick('♥7', '♥10', '♥Q'), Clubs)).to.eql(1);
      expect(getTrickWinner(trick('♥7', '♥10', '♥Q'), Null)).to.eql(2);

      expect(getTrickWinner(trick('♥7', '♣7', '♦7'), Grand)).to.eql(0);
      expect(getTrickWinner(trick('♥7', '♣7', '♦7'), Ramsch)).to.eql(0);
      expect(getTrickWinner(trick('♥7', '♣7', '♦7'), Clubs)).to.eql(1);
      expect(getTrickWinner(trick('♥7', '♣7', '♦7'), Null)).to.eql(0);
    });

  });


  describe('#getJacksModifier', function() {

    it('should compute modifier', function() {

      // with
      expect(getJacksModifier(hand('♣J', '♦J'))).to.eql(1);
      expect(getJacksModifier(hand('♣J', '♠J', '♦J'))).to.eql(2);
      expect(getJacksModifier(hand('♣J', '♠J', '♥J', '♦J'))).to.eql(4);

      // without
      expect(getJacksModifier(hand('♦J'))).to.eql(3);
      expect(getJacksModifier(hand('♠J', '♦J'))).to.eql(1);
      expect(getJacksModifier(hand('♥J'))).to.eql(2);
    });

  });


  describe('#dealCards', function() {

    it('should work', function() {

      // when
      const [ hands, skat ] = dealCards();

      // then
      expect(hands).to.have.length(3);

      for (const hand of hands) {
        expect(hand).to.have.length(10);
      }

      expect(skat).to.have.length(2);
    });

  });

});


// helpers //////////////////

function hand(...args) {
  return args;
}

function trick(...args) {
  return args.map((v, idx) => [ idx, v ]);
}