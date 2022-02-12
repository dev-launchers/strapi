if (process.env.NODE_ENV == 'development') {
  module.exports = ({}) => ({
    upload: {
      providerOptions: {
        localServer: {
        }
      }
    },
    sentry: {
      dsn: 'https://42e839acd2da431f8dc9cfe7a39135d5@o1124032.ingest.sentry.io/6162267',
      sendMetadata: true,
    }
  });
} else {
  module.exports = ({ env }) => ({
    upload: {
      provider: 'azure-storage',
      providerOptions: {
        account: env('STORAGE_ACCOUNT'),
        accountKey: env('STORAGE_ACCOUNT_KEY'),
        serviceBaseURL: env('STORAGE_URL'),
        containerName: env('STORAGE_CONTAINER_NAME'),
        defaultPath: 'assets',
        maxConcurrent: 10
      }
    }
  });
}