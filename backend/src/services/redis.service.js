import redisClient from "../config/redis.js";

class RedisService {
  async set(key, value, expiryInSeconds = null) {
    if (expiryInSeconds) {
      await redisClient.set(key, JSON.stringify(value), {
        EX: expiryInSeconds,
      });
    } else {
      await redisClient.set(key, JSON.stringify(value));
    }
  }

  async get(key) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async del(key) {
    await redisClient.del(key);
  }

  async exists(key) {
    return await redisClient.exists(key);
  }
}

export default new RedisService();