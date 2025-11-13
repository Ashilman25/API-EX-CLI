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


//replace all {{KEY}} in the str with the values from env
function interpolate(templateString, env = {}) {
    if (typeof templateString !== 'string' || templateString.indexOf('{{') === -1) {
        return templateString;
    }

    return templateString.replace(PLACEHOLDER_REGEX, (match, key) => {
        if (Object.prototype.hasOwnProperty.call(env, key)) {
            let value = env[key];
            if (value === 'null') {
                return '';
            } else {
                return String(value);
            }
        }

        console.warn(`Warning: Missing environment value for "${key}".`);
        return match;



    }); 
}