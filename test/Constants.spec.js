import {
  Hand,
  Schneider
} from '../src/index.js';

import { expect } from './chai.js';


describe('Constants', function() {

  it('should combine', function() {

    const foop = Hand | Schneider;

    expect(foop & Schneider).to.eql(Schneider);
    expect(foop & Hand).to.eql(Hand);
  });

});


