import { Config } from '@remotion/cli/config';
import path from 'node:path';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...((currentConfiguration.resolve?.alias as Record<string, string>) ?? {}),
        '@': path.resolve(process.cwd()),
      },
    },
  };
});
