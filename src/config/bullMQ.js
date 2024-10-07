export const connectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
//   password: process.env.REDIS_PASSWORD,
//   db: parseInt(process.env.REDIS_DB) || 0,
};

export const queueOptions = {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
};
