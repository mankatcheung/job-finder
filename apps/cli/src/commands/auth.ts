import { Command } from 'commander';
import * as readline from 'readline/promises';
import chalk from 'chalk';
import { login, logout, AuthError, ApiError } from '../lib/api.js';
import { getAuth, getApiUrl } from '../lib/config.js';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return rl.question(question).then((answer) => { rl.close(); return answer; });
}

async function promptPassword(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf-8');
    let password = '';
    stdin.on('data', function handler(char: string) {
      if (char === '\r' || char === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', handler);
        process.stdout.write('\n');
        resolve(password);
      } else if (char === '') {
        process.exit();
      } else if (char === '') {
        password = password.slice(0, -1);
      } else {
        password += char;
        process.stdout.write('*');
      }
    });
  });
}

export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description('Authentication commands');

  auth
    .command('login')
    .description('Sign in to your Job Finder account')
    .option('--email <email>', 'Email address')
    .option('--password <password>', 'Password')
    .action(async (opts: { email?: string; password?: string }) => {
      try {
        const email = opts.email ?? await prompt('Email: ');
        const password = opts.password ?? await promptPassword('Password: ');
        const state = await login(email.trim(), password);
        const expiresIn = Math.round((state.expiresAt - Date.now()) / 60000);
        console.log(chalk.green('✓') + ` Signed in as ${chalk.bold(state.email)}`);
        console.log(chalk.gray(`  Token expires in ${expiresIn} minutes`));
        console.log(chalk.gray(`  API: ${getApiUrl()}`));
      } catch (err) {
        if (err instanceof ApiError || err instanceof AuthError) {
          console.error(chalk.red('✗') + ` ${err.message}`);
        } else {
          console.error(chalk.red('✗ Login failed:'), err);
        }
        process.exit(1);
      }
    });

  auth
    .command('logout')
    .description('Sign out')
    .action(async () => {
      await logout();
      console.log(chalk.green('✓') + ' Signed out');
    });

  auth
    .command('whoami')
    .description('Show current logged-in account')
    .action(() => {
      const state = getAuth();
      if (!state) {
        console.log(chalk.gray('Not signed in. Run: jf auth login'));
        return;
      }
      const expiresIn = Math.round((state.expiresAt - Date.now()) / 60000);
      const expired = expiresIn <= 0;
      console.log(`Signed in as: ${chalk.bold(state.email)}`);
      console.log(`API:          ${chalk.gray(getApiUrl())}`);
      console.log(
        `Token:        ${expired ? chalk.red('expired') : chalk.green(`expires in ${expiresIn} min`)}`,
      );
    });
}
