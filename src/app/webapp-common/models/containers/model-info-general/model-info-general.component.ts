import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {Store} from '@ngrx/store';
import {SelectedModel} from '../../shared/models.model';
import {selectSelectedModel} from '../../reducers';
import {resetDontShowAgainForBucketEndpoint} from '@common/core/actions/common-auth.actions';
import {createModelLink, isExample} from '@common/shared/utils/shared-utils';
import {AdminService} from '~/shared/services/admin.service';
import {updateModelDetails} from '../../actions/models-info.actions';


@Component({
    selector: 'sm-model-info-general',
    templateUrl: './model-info-general.component.html',
    styleUrls: ['./model-info-general.component.scss'],
    standalone: false
})
export class ModelInfoGeneralComponent implements OnDestroy, OnInit{

  public selectedModel: SelectedModel;
  public isExample: boolean;
  private selectedModelSubscription: Subscription;

  constructor(private store: Store) {}

  commentChanged(comment) {
    this.store.dispatch(updateModelDetails({id: this.selectedModel.id, changes: {comment}}));
  }

  ngOnDestroy(): void {
    this.selectedModelSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.selectedModelSubscription = this.store.select(selectSelectedModel).pipe(
    )
      .subscribe(model => {
        this.isExample = isExample(model);
        this.selectedModel = model;
      });
  }

}
