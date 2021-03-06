import { HealthRepository } from './HealthRepository';
import { Test, TestingModule } from '@nestjs/testing';
import { DrivineModule, DrivineModuleOptions } from '@/DrivineModule';
import { DatabaseRegistry } from '@/connection/DatabaseRegistry';
import { RunWithDrivine } from '@/utils/TestUtils';

RunWithDrivine()
describe('HealthRepository', () => {
    let repo: HealthRepository;

    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [
                DrivineModule.withOptions(<DrivineModuleOptions>{
                    connectionProviders: [
                        DatabaseRegistry.buildOrResolveFromEnv(),
                        DatabaseRegistry.buildOrResolveFromEnv('TRAFFIC')
                    ]
                })
            ],
            providers: [HealthRepository],
            controllers: []
        }).compile();
        repo = app.get(HealthRepository);
    });

    it('should count all nodes', async () => {
            const results = await repo.countAllVertices();
            expect(results).toBeGreaterThan(0);
            console.log(`Got results: ${results}`);
    });
});
