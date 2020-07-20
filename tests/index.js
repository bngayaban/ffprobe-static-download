const assert = require('assert');
const ffprobe = require('../index').path;
const fs = require('fs');

describe('Binary location', () => {
    it('should verify the location of the binary', () => {
        const stats = fs.statSync(ffprobe);
        assert.strictEqual(stats.isFile(), true);
    })
});
