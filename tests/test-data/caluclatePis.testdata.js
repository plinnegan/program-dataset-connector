export const metadataMatchTests = [
  {
    description: 'Returns false when no match',
    newMeta: {
      id: 'abc',
      name: 'PI 1',
      shortName: 'PI1',
      description: 'PI One',
      expression: 'Expression 1',
      filter: 'Filter 1',
    },
    oldMeta: {
      id: 'xyz',
      name: 'PI 999',
      shortName: 'PI999',
      description: 'PI Nineninenine',
      expression: 'Expression 999',
      filter: 'Filter 999',
    },
    metaType: 'programIndicators',
    expected: false,
  },
  {
    description: 'Returns false for partial match',
    newMeta: {
      id: 'abc',
      name: 'PI 1',
      shortName: 'PI1',
      description: 'PI One',
      expression: 'Expression 1',
      filter: 'Filter 1',
    },
    oldMeta: {
      id: 'xyz',
      name: 'PI 1',
      shortName: 'PI1',
      description: 'PI One NEW',
      expression: 'Expression 1',
      filter: 'Expression 1',
    },
    metaType: 'programIndicators',
    expected: false,
  },
  {
    description: 'Returns true for full match',
    newMeta: {
      id: 'abc',
      name: 'PI 1',
      shortName: 'PI1',
      description: 'PI One',
      expression: 'Expression 1',
      filter: 'Filter 1',
    },
    oldMeta: {
      id: 'xyz',
      name: 'PI 1',
      shortName: 'PI1',
      description: 'PI One',
      expression: 'Expression 1',
      filter: 'Filter 1',
      extraField: 'Extra value',
    },
    metaType: 'programIndicators',
    expected: true,
  },
]

export const getChangesOnlyTests = [
  {
    description: 'New Pis are added',
    metaUpdates: {
      createUpdatePis: [
        {
          id: 'abc',
          name: 'PI 1',
          shortName: 'PI1',
          description: 'PI One',
          expression: 'Expression 1',
          filter: 'Filter 1',
        },
      ],
      deletePis: [],
    },
    metaType: 'programIndicators',
    expected: {
      createUpdatePis: [
        {
          id: 'abc',
          name: 'PI 1',
          shortName: 'PI1',
          description: 'PI One',
          expression: 'Expression 1',
          filter: 'Filter 1',
        },
      ],
      deletePis: [],
    },
  },
  {
    description: 'Old PIs are deleted if no matches',
    metaUpdates: {
      createUpdatePis: [
        {
          id: 'abc',
          name: 'PI 1',
          shortName: 'PI1',
          description: 'PI One',
          expression: 'Expression 1',
          filter: 'Filter 1',
        },
      ],
      deletePis: [
        {
          id: 'xyz',
          name: 'PI 999',
          shortName: 'PI999',
          description: 'PI Nineninenine',
          expression: 'Expression 999',
          filter: 'Filter 999',
        },
      ],
    },
    metaType: 'programIndicators',
    expected: {
      createUpdatePis: [
        {
          id: 'abc',
          name: 'PI 1',
          shortName: 'PI1',
          description: 'PI One',
          expression: 'Expression 1',
          filter: 'Filter 1',
        },
      ],
      deletePis: [
        {
          id: 'xyz',
          name: 'PI 999',
          shortName: 'PI999',
          description: 'PI Nineninenine',
          expression: 'Expression 999',
          filter: 'Filter 999',
        },
      ],
    },
  },
  {
    description: 'Matching short name PIs are only updated',
    metaUpdates: {
      createUpdatePis: [
        {
          id: 'abc',
          name: 'PI 1',
          shortName: 'PI1',
          description: 'PI One',
          expression: 'Expression 1',
          filter: 'Filter 1',
        },
      ],
      deletePis: [
        {
          id: 'xyz',
          name: 'PI 999',
          shortName: 'PI1',
          description: 'PI Nineninenine',
          expression: 'Expression 999',
          filter: 'Filter 999',
        },
      ],
    },
    metaType: 'programIndicators',
    expected: {
      createUpdatePis: [
        {
          id: 'abc',
          name: 'PI 1',
          shortName: 'PI1',
          description: 'PI One',
          expression: 'Expression 1',
          filter: 'Filter 1',
        },
      ],
      deletePis: [],
    },
  },
  {
    description: 'Full matches are removed from both',
    metaUpdates: {
      createUpdatePis: [
        {
          id: 'abc',
          name: 'PI 1',
          shortName: 'PI1',
          description: 'PI One',
          expression: 'Expression 1',
          filter: 'Filter 1',
        },
      ],
      deletePis: [
        {
          id: 'abc',
          name: 'PI 1',
          shortName: 'PI1',
          description: 'PI One',
          expression: 'Expression 1',
          filter: 'Filter 1',
        },
      ],
    },
    metaType: 'programIndicators',
    expected: {
      createUpdatePis: [],
      deletePis: [],
    },
  },
]
