import { gql } from '@apollo/client';

export const GET_RELEASES = gql`
  query GetReleases {
    releases {
      id
      name
      date
      status
      additionalInfo
      completedSteps
      createdAt
      updatedAt
    }
  }
`;

export const GET_RELEASE = gql`
  query GetRelease($id: ID!) {
    release(id: $id) {
      id
      name
      date
      status
      additionalInfo
      completedSteps
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_RELEASE = gql`
  mutation CreateRelease($name: String!, $date: String!, $additionalInfo: String) {
    createRelease(name: $name, date: $date, additionalInfo: $additionalInfo) {
      id
      name
      date
      status
      additionalInfo
      completedSteps
    }
  }
`;

export const UPDATE_RELEASE = gql`
  mutation UpdateRelease($id: ID!, $additionalInfo: String) {
    updateRelease(id: $id, additionalInfo: $additionalInfo) {
      id
      additionalInfo
      status
      completedSteps
    }
  }
`;

export const TOGGLE_STEP = gql`
  mutation ToggleStep($id: ID!, $stepIndex: Int!, $completed: Boolean!) {
    toggleStep(id: $id, stepIndex: $stepIndex, completed: $completed) {
      id
      status
      completedSteps
    }
  }
`;

export const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;
