import * as dbox from '../';
import * as assert from 'assert';

describe('Scatter chart', () => {
  it('Scatter should be defined on dbox', () => {
    console.log(dbox.scatter);
    assert.ok(dbox.scatter);
  });
});
