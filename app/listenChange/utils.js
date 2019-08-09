const changeStreamModel = require('app/models/bot').ChangeStream;

module.exports = {
    saveResumeToken: async(next, collectionName) => {
        const resumeToken = next._id._data;
        await changeStreamModel.updateOne({ collectionName }, { $set: { resumeToken } }, { upsert: true });
    },
    getResumeToken: async(collectionName) => {
        const changeStream = await changeStreamModel.findOne({ collectionName });
        return changeStream && changeStream.resumeToken;
    }
};
