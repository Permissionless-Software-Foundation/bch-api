/*
  Unit tests for the route-utils.js library.
*/

const assert = require('chai').assert

const RouteUtils = require('../../src/util/route-utils.js')

describe('#route-utils', () => {
  let uut

  beforeEach(() => {
    uut = new RouteUtils()
  })

  describe('#decodeError', () => {
    it('should decode a 429 error from nginx', () => {
      const err = {
        error: '<html>\r\n<head><title>429 Too Many Requests</title></head>\r\n<body>\r\n<center><h1>429 Too Many Requests</h1></center>\r\n<hr><center>nginx/1.18.0 (Ubuntu)</center>\r\n</body>\r\n</html>\r\n',
        level: 'error',
        message: 'Error in slp.js/hydrateUtxos().',
        timestamp: '2021-03-31T04:13:36.662Z'
      }

      const result = uut.decodeError(err)
      // console.log('result: ', result)

      assert.property(result, 'msg')
      assert.equal(result.msg, '429 Too Many Requests')
      assert.property(result, 'status')
      assert.equal(result.status, 429)
    })
  })
})
