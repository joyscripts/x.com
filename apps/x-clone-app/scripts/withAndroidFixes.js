const {
  withProjectBuildGradle,
  withAppBuildGradle,
} = require("@expo/config-plugins");

const withNotifeeMaven = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const mavenRepo = `
        maven {
            url(new File(['node', '--print', "require.resolve('@notifee/react-native/package.json')"].execute(null, rootDir).text.trim(), '../android/libs'))
        }`;
    if (!config.modResults.contents.includes("@notifee/react-native")) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        `allprojects { repositories { \n        ${mavenRepo}`,
      );
    }
    return config;
  });
};

const withCmakeFix = (config) => {
  return withAppBuildGradle(config, (config) => {
    const cmakeConfig = `
        externalNativeBuild {
            cmake {
                arguments "-DCMAKE_MAKE_PROGRAM=C:\\\\ninja\\\\ninja.exe", 
                          "-DCMAKE_OBJECT_PATH_MAX=1024"
            }
        }`;
    if (!config.modResults.contents.includes("CMAKE_MAKE_PROGRAM")) {
      config.modResults.contents = config.modResults.contents.replace(
        /defaultConfig\s?\{/,
        `defaultConfig { ${cmakeConfig}`,
      );
    }
    return config;
  });
};

module.exports = (config) => {
  return withNotifeeMaven(withCmakeFix(config));
};
