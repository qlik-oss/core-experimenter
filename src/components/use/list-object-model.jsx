import useModel from './model';

export const createDefinition = field => ({
  qInfo: {
    qId: `fb${field}`,
    qType: 'filterbox',
  },
  qListObjectDef: {
    qDef: {
      qFieldDefs: [field],
      qSortCriterias: [{ qSortByState: 1, qSortByAscii: 1 }],
    },
    qShowAlternatives: true,
    qInitialDataFetch: [{
      qTop: 0,
      qHeight: 500,
      qLeft: 0,
      qWidth: 1,
    }],
  },
});

export default function useListObjectModel(app, field) {
  const model = useModel(app, createDefinition(field));
  return model;
}
