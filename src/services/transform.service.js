class TransformService {
  constructor() {}

  fbObjectToArray(fbData) {
    return Object.keys(fbData).map((key) => ({
      ...fbData?.[key],
      fbId: key,
    }));
  }
}

module.exports = new TransformService();
