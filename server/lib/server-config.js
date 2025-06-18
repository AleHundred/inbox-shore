export const serverConfig = {
  JWT_SECRET:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('JWT_SECRET environment variable must be set in production!');
        })()
      : 'some_dev_secret'),
};
