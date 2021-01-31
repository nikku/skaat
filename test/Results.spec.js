import { calculateResults } from '../lib/Results';

import { expect } from './chai';


describe('Results', function() {

  describe('#calculateResults', function() {

    it('should exist', function() {
      expect(calculateResults).to.exist;
    });

    describe('should calculate result', function() {

      it('Null / won');

      it('Null / lost');

      it('Grand / won');

      it('Grand / lost');

      it('Clubs / won');

      it('Clubs / lost');

      it('Ramsch');

    });


    describe('should handle give up', function() {

      it('Grand / player');

      it('Grand / opponents');

    });

  });

});