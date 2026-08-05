import { Command } from 'commander';
import chalk from 'chalk';
import { gql, AuthError, ApiError } from '../lib/api.js';
import { colorStatus, formatDate, makeTable, printDetail } from '../lib/format.js';

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  jobUrl: string | null;
  location: string | null;
  salaryRange: string | null;
  description: string | null;
  appliedAt: string | null;
  starred: boolean;
  source: string | null;
  followUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const LIST_QUERY = `
  query Applications($status: String) {
    applications(status: $status) {
      id company role status location starred appliedAt createdAt
    }
  }
`;

const DETAIL_QUERY = `
  query Application($id: ID!) {
    application(id: $id) {
      id company role status jobUrl location salaryRange description
      appliedAt starred source followUpAt createdAt updatedAt
    }
  }
`;

const UPDATE_MUTATION = `
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) {
      id company role status updatedAt
    }
  }
`;

function handleError(err: unknown): never {
  if (err instanceof AuthError || err instanceof ApiError) {
    console.error(chalk.red('✗') + ` ${err.message}`);
  } else {
    console.error(chalk.red('✗ Unexpected error:'), err);
  }
  process.exit(1);
}

export function registerAppsCommands(program: Command): void {
  const apps = program.command('apps').description('Manage job applications');

  apps
    .command('list')
    .description('List all applications')
    .option('-s, --status <status>', 'Filter by pipeline stage key')
    .option('--json', 'Output raw JSON')
    .action(async (opts: { status?: string; json?: boolean }) => {
      try {
        const data = await gql<{ applications: Application[] }>(LIST_QUERY, {
          status: opts.status ?? null,
        });

        if (opts.json) {
          console.log(JSON.stringify(data.applications, null, 2));
          return;
        }

        if (data.applications.length === 0) {
          console.log(chalk.gray('No applications found.'));
          return;
        }

        const table = makeTable(
          ['ID', 'Company', 'Role', 'Status', 'Location', 'Applied'],
          [12, 18, 22, 14, 16, 12],
        );
        for (const app of data.applications) {
          table.push([
            chalk.gray(app.id.slice(0, 8) + '…'),
            chalk.bold(app.company),
            app.role,
            colorStatus(app.status),
            app.location ?? chalk.gray('—'),
            formatDate(app.appliedAt),
          ]);
        }
        console.log(table.toString());
        console.log(chalk.gray(`\n${data.applications.length} application(s)`));
      } catch (err) {
        handleError(err);
      }
    });

  apps
    .command('view <id>')
    .description('View full details of an application')
    .action(async (id: string) => {
      try {
        const data = await gql<{ application: Application | null }>(DETAIL_QUERY, { id });

        if (!data.application) {
          console.error(chalk.red('✗') + ` Application "${id}" not found`);
          process.exit(1);
        }

        const app = data.application;
        console.log();
        console.log(
          `  ${chalk.bold.white(app.role)} ${chalk.gray('at')} ${chalk.bold.white(app.company)}`,
        );
        if (app.starred) console.log(`  ${chalk.yellow('★ Starred')}`);
        console.log();
        printDetail('Status', colorStatus(app.status));
        printDetail('Location', app.location);
        printDetail('Salary', app.salaryRange);
        printDetail('Source', app.source);
        printDetail('Job URL', app.jobUrl ? chalk.underline(app.jobUrl) : null);
        printDetail('Applied', formatDate(app.appliedAt));
        printDetail('Follow-up', formatDate(app.followUpAt));
        printDetail('Created', formatDate(app.createdAt));
        if (app.description) {
          console.log();
          console.log(`  ${chalk.bold('Description')}`);
          const preview =
            app.description.length > 300 ? app.description.slice(0, 300) + '…' : app.description;
          console.log(`  ${chalk.gray(preview.replace(/\n/g, '\n  '))}`);
        }
        console.log();
        console.log(chalk.gray(`  id: ${app.id}`));
      } catch (err) {
        handleError(err);
      }
    });

  apps
    .command('status <id> <status>')
    .description('Update application status using a pipeline stage key')
    .action(async (id: string, status: string) => {
      try {
        if (!status.trim()) {
          console.error(chalk.red('✗') + ' Status is required');
          process.exit(1);
        }

        const data = await gql<{ updateApplication: Application }>(UPDATE_MUTATION, {
          id,
          input: { status },
        });

        const app = data.updateApplication;
        console.log(
          chalk.green('✓') +
            ` ${chalk.bold(app.company)} — ${app.role}: ${colorStatus(app.status)}`,
        );
      } catch (err) {
        handleError(err);
      }
    });
}
