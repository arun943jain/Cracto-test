const request = require('supertest');
const buildResolvers = require('../src/resolvers');
const { createApp } = require('../src/index');

// In-memory mock of the Prisma Release delegate
function makeMockPrisma() {
  const store = new Map();
  let seq = 1;
  return {
    __store: store,
    release: {
      findMany: async () => [...store.values()].sort((a, b) => b.createdAt - a.createdAt),
      findUnique: async ({ where }) => store.get(String(where.id)) || null,
      create: async ({ data }) => {
        const now = new Date();
        const row = {
          id: String(seq++),
          name: data.name,
          date: data.date instanceof Date ? data.date : new Date(data.date),
          additionalInfo: data.additionalInfo ?? null,
          completedSteps: data.completedSteps ?? [],
          createdAt: now,
          updatedAt: now,
        };
        store.set(row.id, row);
        return row;
      },
      update: async ({ where, data }) => {
        const row = store.get(String(where.id));
        if (!row) throw new Error('not found');
        const next = { ...row, ...data, updatedAt: new Date() };
        store.set(String(where.id), next);
        return next;
      },
      delete: async ({ where }) => {
        store.delete(String(where.id));
        return { id: String(where.id) };
      },
    },
  };
}

describe('health', () => {
  test('GET /health returns ok', async () => {
    const mock = makeMockPrisma();
    const app = createApp(mock);
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('GraphQL releases', () => {
  test('createRelease + toggleStep + query releases', async () => {
    const mock = makeMockPrisma();
    const resolvers = buildResolvers(mock);

    // create
    const created = await resolvers.Mutation.createRelease(null, {
      name: 'v1.0',
      date: new Date().toISOString(),
      additionalInfo: 'first',
    });
    expect(created.status).toBe('planned');
    expect(created.completedSteps).toEqual([]);

    // invalid name rejected
    await expect(
      resolvers.Mutation.createRelease(null, { name: '  ', date: new Date().toISOString() })
    ).rejects.toThrow();

    // toggle on step 0
    const toggled = await resolvers.Mutation.toggleStep(null, {
      id: created.id,
      stepIndex: 0,
      completed: true,
    });
    expect(toggled.completedSteps).toEqual([0]);
    expect(toggled.status).toBe('ongoing');

    // invalid step rejected
    await expect(
      resolvers.Mutation.toggleStep(null, { id: created.id, stepIndex: 99, completed: true })
    ).rejects.toThrow();

    // invalid id rejected
    await expect(
      resolvers.Mutation.toggleStep(null, { id: 'nope', stepIndex: 0, completed: true })
    ).rejects.toThrow();

    // query via resolver (Apollo v3 has no executeOperation)
    const list = await resolvers.Query.releases();
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe('ongoing');
  });
});
