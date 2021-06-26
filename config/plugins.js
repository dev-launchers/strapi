if (process.env.NODE_ENV == 'development') {
  module.exports = () => ({
    upload: {
      providerOptions: {
        localServer: {
        }
      }
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