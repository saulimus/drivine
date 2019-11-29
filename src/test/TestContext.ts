import { TransactionContextHolder } from '@/transaction/TransactonContextHolder';
import { Transactional } from '@/transaction/Transactional';
import { TransactionContextKeys } from '@/transaction/TransactionContextKeys';
import { AgensGraphConnectionProvider } from '@/connection/AgensGraphConnectionProvider';
import * as assert from 'assert';
import { Transaction } from '@/transaction/Transaction';
import { ConnectionProvider } from '@/connection/ConnectionProvider';
import { ConnectionProviderRegistry } from '@/connection/ConnectionProviderRegistry';

require('dotenv').config({
    path: process.env.DOTENV_CONFIG_PATH || require('find-config')('.env')
});

export function inTestContext(): TestContext {
    const context = new TestContext(true, ConnectionProviderRegistry.getInstance().defaultProvider());
    if (context.connectionProvider instanceof AgensGraphConnectionProvider) {
        const provider = <AgensGraphConnectionProvider> context.connectionProvider;
        assert(
            provider.idleTimeoutMillis === 500,
            `DATABASE_IDLE_TIMEOUT must be set to 500 in test environments - so that jest can shut down cleanly`
        );
    }
    return context;
}

export class TestContext {

    public constructor(public readonly rollback: boolean, public readonly connectionProvider: ConnectionProvider) {}

    public withRollback(rollback: boolean): TestContext {
        return new TestContext(rollback, this.connectionProvider);
    }

    public withConnectionProvider(provider: ConnectionProvider): TestContext {
        return new TestContext(this.rollback, provider);
    }

    public async run(fn: (...args: any[]) => Promise<any>): Promise<any> {
        return TransactionContextHolder.instance.runPromise(async () => {
            TransactionContextHolder.instance.set(TransactionContextKeys.CONNECTION_PROVIDER, this.connectionProvider);
            return this.runInTransaction(fn);
        });
    }

    @Transactional()
    private async runInTransaction(fn: (...args: any[]) => Promise<any>): Promise<any> {
        const transaction = <Transaction>TransactionContextHolder.instance.get(TransactionContextKeys.TRANSACTION);
        transaction.markAsRollback();
        return fn();
    }
}