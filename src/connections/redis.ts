import Redis from 'ioredis'

const redis = new Redis({
  db: 2
})

export default redis
