const {getEnvironments} = require('./storage')
const PLACEHOLDER_REGEX = /{{\s*([^{}\s]+)\s*}}/g;


//get the environments[envName] config object
function getEnv(name) {
    let envName;

    if (typeof name === 'string') {
        envName = name.trim();
    } else {
        envName = '';
    }

    if (!envName) {
        throw new Error('Environment name is required.');
    }

    const environments = getEnvironments() || {};
    const env = environments[envName];

    if (!env) {
        const available = Object.keys(environments);

        let suffix;
        if (available.length) {
            suffix = `Available environments: ${available.join(', ')}.`;
        } else {
            suffix = `No environments have been defined yet.`;
        }

        throw new Error(`Unknown environment "${envName}". ${suffix}`);
    }

    return env;
}
