#!/usr/bin/env node
import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth.js';
import { registerAppsCommands } from './commands/apps.js';

const program = new Command();

program.name('jf').description('Job Finder CLI').version('0.0.1');

registerAuthCommands(program);
registerAppsCommands(program);

program.parse(process.argv);
