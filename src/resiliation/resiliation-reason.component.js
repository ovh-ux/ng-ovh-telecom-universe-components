import _ from 'lodash';

import template from './resiliation-reason.component.html';
import templateConfirmation from './resiliation.modal.html';

export { templateConfirmation };

export default {
  bindings: {
    tucResiliationReason: '=?',
    tucResiliationReasonFilter: '@',
    tucResiliationReasonModel: '=?',
    onChange: '&',
  },
  template,
  controllerAs: 'ResiliationReasonCtrl',
  controller($uibModal) {
    'ngInject';

    const self = this;
    this.resiliationChoices = [
      { name: 'addressMove', caption: 'resiliation_choice_addressMove', needComment: false },
      { name: 'billingProblems', caption: 'resiliation_choice_billingProblems', needComment: false },
      { name: 'cessationOfActivity', caption: 'resiliation_choice_cessationOfActivity', needComment: false },
      { name: 'changeOfTerms', caption: 'resiliation_choice_changeOfTerms', needComment: false },
      { name: 'ftth', caption: 'resiliation_choice_ftth', needComment: false },
      { name: 'goToCompetitor', caption: 'resiliation_choice_goToCompetitor', needComment: false },
      {
        name: 'technicalProblems',
        caption: 'resiliation_choice_technicalProblems',
        needComment: false,
      },
      { name: 'other', caption: 'resiliation_choice_other', needComment: true },
    ];

    this.resiliationChoices = this.resiliationChoices.filter(elt => !self.tucResiliationReasonFilter || (self.tucResiliationReasonFilter.split(',').indexOf(elt.name) > -1));

    this.canResiliate = function () {
      if (self.tucResiliationReasonModel) {
        const model = _.find(self.resiliationChoices, {
          name: self.tucResiliationReasonModel.type,
        });
        return (model.needComment && self.tucResiliationReasonModel.comment) || !model.needComment;
      }
      return false;
    };

    this.resiliate = function () {
      self.panel = false;
      self.onChange({
        ELEMENT: self.tucResiliationReason,
        SURVEY: self.tucResiliationReasonModel,
        ACCEPT: true,
      });
    };

    this.reject = function () {
      self.panel = false;
      self.onChange({
        ELEMENT: self.tucResiliationReason,
        SURVEY: self.tucResiliationReasonModel,
        ACCEPT: false,
      });
    };

    this.openConfirmation = function () {
      $uibModal.open({
        template: templateConfirmation,
        controllerAs: 'ResiliationModelCtrl',
        controller(subject) {
          'ngInject';

          this.resiliation = { confirm: {} };
          this.subject = subject;
        },
        resolve: {
          subject() {
            return self.tucResiliationReason;
          },
        },
      }).result.then(
        () => {
          self.resiliate();
        },
        () => {
          self.reject();
        },
      );
    };
  },
};
