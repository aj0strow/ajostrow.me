var objectid = req('database/objectid');

describe('objectid', function() {
  it('should be unique', function() {
    assert.notEqual(objectid(), objectid());
  });
  
  it('should be longer than 10 chars', function() {
    assert(objectid().length > 10);
  });
});