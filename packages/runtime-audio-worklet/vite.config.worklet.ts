import path from 'node:path';

import { defineConfig } from 'vite';
import { createWorkerLibConfig } from '@8f4e/config/vite';

export default defineConfig(createWorkerLibConfig(path.resolve(__dirname, 'src/index.ts')));
