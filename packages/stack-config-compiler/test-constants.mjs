import { compileConfig } from './dist/index.js';

const source = `
; Define some constants
const BASE_PATH "/var/lib/app"
const MAX_RETRY 5
const ENABLED true

; Use constants in config
scope "server.path"
push BASE_PATH
set

rescope "server.retries"
push MAX_RETRY
set

rescope "features.auth"
push ENABLED
set

; Scoped constants example
rescope "environments"
scope "dev"
const DB_HOST "localhost"
scope "database.host"
push DB_HOST
set

rescopeTop "prod"
const DB_HOST "prod.example.com"
scope "database.host"
push DB_HOST
set
`;

const result = compileConfig(source);
console.log(JSON.stringify(result.config, null, 2));
console.log('\nErrors:', result.errors);
