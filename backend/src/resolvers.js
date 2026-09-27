const { UserInputError, ApolloError } = require('apollo-server-express');
const { validateStepIndex, toReleaseDTO } = require('./status');

function notFound(id) {
  throw new ApolloError(`Release not found: ${id}`, 'NOT_FOUND');
}

module.exports = (prisma) => ({
  Query: {
    releases: async () => {
      const rows = await prisma.release.findMany({ orderBy: { createdAt: 'desc' } });
      return rows.map(toReleaseDTO);
    },
    release: async (_, { id }) => {
      if (!id) throw new UserInputError('id is required');
      const row = await prisma.release.findUnique({ where: { id: String(id) } });
      if (!row) return null;
      return toReleaseDTO(row);
    },
  },
  Mutation: {
    createRelease: async (_, { name, date, additionalInfo }) => {
      if (!name || !String(name).trim()) throw new UserInputError('name is required');
      if (!date) throw new UserInputError('date is required');
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) throw new UserInputError('date must be a valid datetime');
      const row = await prisma.release.create({
        data: {
          name: String(name).trim(),
          date: parsed,
          additionalInfo: additionalInfo ?? null,
          completedSteps: [],
        },
      });
      return toReleaseDTO(row);
    },
    updateRelease: async (_, { id, additionalInfo }) => {
      const existing = await prisma.release.findUnique({ where: { id: String(id) } });
      if (!existing) notFound(id);
      const row = await prisma.release.update({
        where: { id: String(id) },
        data: { additionalInfo: additionalInfo ?? null },
      });
      return toReleaseDTO(row);
    },
    toggleStep: async (_, { id, stepIndex, completed }) => {
      try {
        validateStepIndex(stepIndex);
      } catch (e) {
        throw new UserInputError(e.message);
      }
      if (typeof completed !== 'boolean') throw new UserInputError('completed must be a boolean');
      const existing = await prisma.release.findUnique({ where: { id: String(id) } });
      if (!existing) notFound(id);
      const set = new Set(existing.completedSteps || []);
      if (completed) set.add(stepIndex);
      else set.delete(stepIndex);
      const row = await prisma.release.update({
        where: { id: String(id) },
        data: { completedSteps: [...set].sort((a, b) => a - b) },
      });
      return toReleaseDTO(row);
    },
    deleteRelease: async (_, { id }) => {
      const existing = await prisma.release.findUnique({ where: { id: String(id) } });
      if (!existing) notFound(id);
      await prisma.release.delete({ where: { id: String(id) } });
      return true;
    },
  },
});
