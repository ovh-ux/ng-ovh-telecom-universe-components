import _ from 'lodash';

export default function () {
  const self = this;

  self.getTucToastInfos = function (bulkResult, messages, noDetails) {
    const infos = [];

    // manage full success
    if (!bulkResult.error.length) {
      return [{
        type: 'success',
        message: messages.fullSuccess,
      }];
    }

    // manage partial success
    if (bulkResult.success.length) {
      infos.push({
        type: 'success',
        message: messages.partialSuccess,
      });
    }

    // manage errors
    if (bulkResult.error.length) {
      let errorList = '<ul>';
      bulkResult.error.forEach((error) => {
        errorList += `<li>${noDetails ? `${error.serviceName}</li>` : `${[error.serviceName, _.map(error.errors, 'error').join(', ')].join(' - ')}</li>`}`;
      });
      errorList += '</ul>';

      infos.push({
        type: 'error',
        message: messages.error + errorList,
      });
    }

    return infos;
  };
}
