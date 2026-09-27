const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Release {
    id: ID!
    name: String!
    date: String!
    status: String!
    additionalInfo: String
    completedSteps: [Int!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    releases: [Release!]!
    release(id: ID!): Release
  }

  type Mutation {
    createRelease(name: String!, date: String!, additionalInfo: String): Release!
    updateRelease(id: ID!, additionalInfo: String): Release!
    toggleStep(id: ID!, stepIndex: Int!, completed: Boolean!): Release!
    deleteRelease(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;
