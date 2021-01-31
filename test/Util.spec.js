import { expect } from './chai';

import {
  Null,
  Clubs,
  Ramsch,
  Grand,
  Hearts
} from '../src/Constants';

import {
  semanticSort,
  isValidTrickCard,
  getTrickWinner,
  getJacksModifier,
  beatsCompare,
  dealCards
} from '../src/Util';


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


  describe('#beatsCompare', function() {

    it('should compare', function() {
      expect(beatsCompare('♥J', '♣J', Null)).to.eql(-1);
      expect(beatsCompare('♥7', '♥10', Null)).to.eql(-3);
      expect(beatsCompare('♥Q', '♥10', Null)).to.eql(2);

      expect(beatsCompare('♥J', '♣J', Grand)).to.eql(-2);

      expect(beatsCompare('♥10', '♣7', Clubs)).to.eql(-1);
      expect(beatsCompare('♥10', '♦7', Clubs)).to.eql(-1);
      expect(beatsCompare('♣10', '♥J', Clubs)).to.eql(-3);
      expect(beatsCompare('♣J', '♥J', Clubs)).to.eql(2);
      expect(beatsCompare('♥7', '♥10', Clubs)).to.eql(-5);
      expect(beatsCompare('♥Q', '♥10', Clubs)).to.eql(-2);
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

      expect(getTrickWinner(trick('♥J', '♣K', '♦J'), Clubs)).to.eql(0);
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


  describe('#semanticSort', function() {

    it('should sort Grand', function() {

      expect(semanticSort([
        '♣J', '♣7', '♠9', '♥7', '♦10', '♦A', '♠J', '♥J', '♦J', '♦7'
      ], Grand)).to.eql([
        '♣J', '♠J', '♥J', '♦J', '♣7', '♠9', '♥7', '♦A', '♦10', '♦7'
      ]);

      expect(semanticSort([
        '♣7', '♣10', '♣A', '♠Q', '♦10', '♣J', '♦A', '♠7', '♥8', '♦K'
      ], Grand)).to.eql([
        '♣J', '♣A', '♣10', '♣7', '♠Q', '♠7', '♥8', '♦A', '♦10', '♦K'
      ]);

    });


    it('should sort Null', function() {

      expect(semanticSort([
        '♣J', '♣7', '♠9', '♥7', '♦10', '♦A', '♠J', '♥J', '♦J', '♦7'
      ], Null)).to.eql([
        '♣J', '♣7', '♠J', '♠9', '♥J', '♥7', '♦A', '♦J', '♦10', '♦7'
      ]);

      expect(semanticSort([
        '♣7', '♣10', '♣A', '♠Q', '♦10', '♣J', '♦A', '♠7', '♥8', '♦K'
      ], Null)).to.eql([
        '♣A', '♣J', '♣10', '♣7', '♠Q', '♠7', '♥8', '♦A', '♦K', '♦10'
      ]);

    });


    it('should sort Ramsch', function() {

      expect(semanticSort([
        '♣J', '♣7', '♠9', '♥7', '♦10', '♦A', '♠J', '♥J', '♦J', '♦7'
      ], Ramsch)).to.eql([
        '♣J', '♠J', '♥J', '♦J', '♣7', '♠9', '♥7', '♦A', '♦10', '♦7'
      ]);

      expect(semanticSort([
        '♣7', '♣10', '♣A', '♠Q', '♦10', '♣J', '♦A', '♠7', '♥8', '♦K'
      ], Ramsch)).to.eql([
        '♣J', '♣A', '♣10', '♣7', '♠Q', '♠7', '♥8', '♦A', '♦10', '♦K'
      ]);

    });


    it('should sort Hearts', function() {

      expect(semanticSort([
        '♣J', '♣7', '♠9', '♥7', '♦10', '♦A', '♠J', '♥J', '♦J', '♦7'
      ], Hearts)).to.eql([
        '♣J', '♠J', '♥J', '♦J', '♥7', '♣7', '♠9', '♦A', '♦10', '♦7'
      ]);

      expect(semanticSort([
        '♣7', '♣10', '♣A', '♠Q', '♦10', '♣J', '♦A', '♠7', '♥8', '♦K'
      ], Hearts)).to.eql([
        '♣J', '♥8', '♣A', '♣10', '♣7', '♠Q', '♠7', '♦A', '♦10', '♦K'
      ]);

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