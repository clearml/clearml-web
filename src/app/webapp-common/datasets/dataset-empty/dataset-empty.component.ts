import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'sm-dataset-empty',
  templateUrl: './dataset-empty.component.html',
  styleUrls: ['./dataset-empty.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    CodeEditorComponent,
    MatTab,
    MatTabGroup,
    NgTemplateOutlet
  ]
})
export class DatasetEmptyComponent {
  protected readonly confService = inject(ConfigurationService);

  initDatasetCLICode = `curl -o Affairs.csv https://vincentarelbundock.github.io/Rdatasets/csv/AER/Affairs.csv

clearml-data create --project DatasetProject --name HelloDataset

clearml-data add --files Affairs.csv

clearml-data close`;

  initDatasetSDKCode = `# create example dataset
from clearml import StorageManager, Dataset

# Download sample csv file
csv_file = StorageManager.get_local_copy(
    remote_url="https://vincentarelbundock.github.io/Rdatasets/csv/AER/Affairs.csv"
)

# Create a dataset with ClearML\`s Dataset class
dataset = Dataset.create(
    dataset_project="DatasetProject", dataset_name="HelloDataset"
)

# add the example csv
dataset.add_files(path=csv_file)

# Upload dataset to ClearML server (customizable)
dataset.upload()

# commit dataset changes
dataset.finalize()`;
  showButton = input();
  index = signal(0);
  emptyStateTab = computed(() => this.index() === 0 ? 'cli' : 'sdk');
  showCode = signal(false);

  constructor() {
    window.setTimeout(()=> this.showCode.set(true), 300);
  }
}
