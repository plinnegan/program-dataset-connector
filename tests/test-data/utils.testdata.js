export const exampleMetadata = {
  dataElements: {
    dataElements: [
      {
        id: 'de01',
        categoryCombo: {
          categories: [
            {
              id: 'catId01',
              categoryOptions: [
                {
                  id: 'catId01',
                  name: 'catId01',
                  code: 'c1',
                  description: 'First category option',
                },
                {
                  id: 'catId02',
                  name: 'catId02',
                  code: 'c2',
                  description: 'First category option',
                },
              ],
            },
            {
              id: 'catId02',
              categoryOptions: [
                {
                  id: 'catId03',
                  name: 'catId03',
                  code: 'c3',
                  description: 'First category option',
                },
                {
                  id: 'catIdDefault',
                  name: 'default',
                  code: 'default',
                  description: 'Default category option',
                },
              ],
            },
          ],
        },
      },
    ],
  },
  dataSets: {
    dataSets: [
      {
        id: 'ds01',
        categoryCombo: {
          categories: [
            {
              id: 'catId03',
              categoryOptions: [
                {
                  id: 'catId04',
                  name: 'catId04',
                  code: 'c4',
                  description: 'First category option',
                },
                {
                  id: 'catId05',
                  name: 'catId05',
                  code: 'c5',
                  description: 'First category option',
                },
              ],
            },
            {
              id: 'catId04',
              categoryOptions: [
                {
                  id: 'catIdDefault',
                  name: 'default',
                  code: 'default',
                  description: 'Default category option',
                },
              ],
            },
          ],
        },
      },
    ],
  },
}

export const exampleCoMaps = {
  catId01: {
    name: 'Category01',
    filter: "#{someDeUid} == 'value1'",
  },
  catId02: {
    name: 'Category02',
    filter: "#{someDeUid} == 'value2'",
  },
  catId03: {
    name: 'Category03',
    filter: "#{someDeUid} == 'value3'",
  },
  catId04: {
    name: 'Category04',
    filter: "#{someDeUid} == 'value4'",
  },
  catId05: {
    name: 'Category05',
    filter: "#{someDeUid} == 'value5'",
  },
}
