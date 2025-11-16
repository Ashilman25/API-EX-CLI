const {getEnvironments} = require('./storage')
const {ConfigurationError} = require('./errors');
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
        throw new ConfigurationError('Environment name is required.');
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

        throw new ConfigurationError(`Unknown environment "${envName}". ${suffix}`);
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
            const value = env[key];
            if (value == null) {
                return '';
            } else {
                return String(value);
            }
        }

        console.warn(`Warning: Missing environment value for "${key}".`);
        return match;



    }); 
}


//go through, url, headers, and body, 
// and fill in all {{KEY}} with stuff from env
function interpolateRequest(request = {}, env = {}) {
    if (!request || typeof request !== 'object') {
        return request;
    }

    const result = {...request};

    if (typeof request.url === 'string') {
        result.url = interpolate(result.url, env);
    }

    if (result.headers && typeof result.headers === 'object') {
        let headers;

        if (Array.isArray(result.headers)) {
            headers = [...result.headers];
        } else {
            headers = {...result.headers};
        }

        if (Array.isArray(headers)) {
            for (let i = 0; i < headers.length; i += 1) {
                if (typeof headers[i] === 'string') {
                    headers[i] = interpolate(headers[i], env);
                }
            }

        } else {
            Object.keys(headers).forEach((headerName) => {
                const value = headers[headerName];

                if (typeof value === 'string') {
                    headers[headerName] = interpolate(value, env);
                } else {
                    headers[headerName] = value;
                }
            });
        }

        result.headers = headers;
    }

    if (typeof result.body === 'string') {
        result.body = interpolate(result.body, env);
    }

    // Also support 'data' field
    //for axios and storage
    if (typeof result.data === 'string') {
        result.data = interpolate(result.data, env);
    }

    return result;

}

module.exports = {
    getEnv,
    interpolate,
    interpolateRequest
};

