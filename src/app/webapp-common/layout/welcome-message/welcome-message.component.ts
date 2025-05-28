import {LocationStrategy} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  inject,
  DestroyRef
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {setSelectedWorkspaceTab} from '@common/core/actions/users.actions';
import {selectActiveWorkspace, selectGettingStarted} from '@common/core/reducers/users-reducer';
import {Store} from '@ngrx/store';
import {createCredential, resetCredential} from '@common/core/actions/common-auth.actions';
import {selectNewCredential} from '@common/core/reducers/common-auth-reducer';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {Queue} from '~/business-logic/model/queues/queue';
import {GettingStartedContext} from '../../../../environments/base';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {YouTubePlayerModule} from '@angular/youtube-player';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {MatTab, MatTabGroup} from '@angular/material/tabs';


interface StepObject {
  id: number;
  header?: string;
  title?: string;
  code?: string;
  subNote?: string;
}

export interface WelcomeMessageData {
  queue: Queue;
  entityName: string;
  step: number;
  showTabs?: boolean;
  newExperimentYouTubeVideoId?: string;
}


@Component({
    selector: 'sm-welcome-message',
    templateUrl: './welcome-message.component.html',
    styleUrls: ['./welcome-message.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DialogTemplateComponent,
        CopyClipboardComponent,
        YouTubePlayerModule,
        MatCheckbox,
        MatButton,
        MatIcon,
        FormsModule,
        MatTabGroup,
        MatTab
    ]
})
export class WelcomeMessageComponent {
  private store = inject(Store);
  private dialogRef = inject<MatDialogRef<WelcomeMessageComponent>>(MatDialogRef<WelcomeMessageComponent>);
  public data = inject<WelcomeMessageData>(MAT_DIALOG_DATA);
  protected configService = inject(ConfigurationService);
  private destroyRef = inject(DestroyRef);
  private locationStrategy = inject(LocationStrategy);
  protected step = signal(this.data?.step ?? 1);
  protected credentialsCreated = signal(false);


  WEB_SERVER_URL = window.location.origin + this.locationStrategy.getBaseHref();
  GETTING_STARTED_STEPS: StepObject[] = [{
    id: 1,
    header: 'Get started in a jiffy:',
    title: '1. Install',
    code: 'pip install clearml',
  }, {
    id: 2,
    title: '2. Configure',
    code: 'clearml-init'
  }];
  ORPHANED_QUEUE_STEPS: StepObject[] =
    [{
      id: 1,
      header: null, code: null,
      subNote: 'See ClearML Documentation for different ways of deploying workers'
    }, {
      id: 2,
      header: 'To setup a worker',
      title: '1. Install',
      code: 'pip install clearml-agent',
    }, {
      id: 3,
      title: '2. Configure',
      code: 'clearml-agent init'
    }
    ];
  public links = ['Set up ClearML', 'Run your ML code', 'Relaunch previous experiments'];
  public doNotShowAgain: boolean;
  public credentialsLabel: string;
  public src: string;
  public queue: Queue = this.data?.queue;
  public entityName: string = this.data?.entityName ?? 'Tasks';
  protected showTabs = this.data?.showTabs;
  protected currentLink = this.showTabs ? this.links[0] : undefined;
  protected host = `${window.location.protocol}//${window.location.hostname}`;

  public workspace = this.store.selectSignal(selectActiveWorkspace);
  private companyGettingStarted = this.store.selectSignal(selectGettingStarted);
  protected credentials = this.store.selectSignal(selectNewCredential);
  protected accessKey = computed(() => this.credentials()?.access_key);
  protected secretKey = computed(() => this.credentials()?.secret_key);
  protected target = signal(0);
  protected credentialsComment = computed(() => this.community() && this.workspace()?.name);
  protected isJupyter = computed(() => this.target() === 1);
  protected configGettingStarted = computed<GettingStartedContext>(() => this.configService.configuration().gettingStartedContext);
  protected docsLink = computed(() => this.configService.configuration().docsLink);
  protected community = computed(() => this.configService.configuration().communityServer);

  protected steps = computed<StepObject[]>(() => {
    const steps = this.queue ? this.ORPHANED_QUEUE_STEPS : this.GETTING_STARTED_STEPS;

    if (this.queue) {
      steps[0].code = `clearml-agent daemon --queue ${this.queue.name}`;
      steps[0].header = `To assign a worker to the ${this.queue.display_name || this.queue.name} queue, run:`;
      steps[1].code = `pip install clearml-agent`;
      steps[2].code = `clearml-agent init`;
    } else {
      steps[0].code = this.companyGettingStarted().install ?? this.configGettingStarted().install ?? steps[0].code;
      steps[1].code = this.companyGettingStarted().configure ?? this.configGettingStarted()?.configure ?? steps[1].code;
    }

    if (this.showTabs) {
      steps[0].header = null;
    }

    if (this.isJupyter()) {
      steps[this.queue ? 2 : 1].code =
        `%env CLEARML_WEB_HOST=${this.WEB_SERVER_URL}
%env CLEARML_API_HOST=${this.configService.apiServerUrl()}\n`;
      if (this.configService.fileServerUrl()) {
        steps[this.queue ? 2 : 1].code += `%env CLEARML_FILES_HOST=${this.configService.fileServerUrl()}\n`;
      }
      if(this.credentialsLabel) {
        steps[this.queue ? 2 : 1].code += `# ${this.credentialsLabel}\n`;
      }
      steps[this.queue ? 2 : 1].code += `%env CLEARML_API_ACCESS_KEY=${this.accessKey() || '<Your API access key>'}
%env CLEARML_API_SECRET_KEY=${this.secretKey() ||  '<Your API secret key>'}`;
    }
    return steps;
  });

  constructor() {
    this.dialogRef.beforeClosed().subscribe(res =>
      this.doNotShowAgain && !res? this.dialogRef.close(this.doNotShowAgain) : false);

    if (this.data?.newExperimentYouTubeVideoId) {
      this.loadYoutubeApi(this.data?.newExperimentYouTubeVideoId);
    }

    this.destroyRef.onDestroy(() => this.store.dispatch(resetCredential()));
  }

  closeDialog() {
    this.dialogRef.close(this.doNotShowAgain);
  }

  nextSteps(event: MouseEvent) {
    event.preventDefault();
    this.step.update(step => step + 1);
  }

  createCredentials() {
    this.credentialsCreated.set(true);
    this.store.dispatch(setSelectedWorkspaceTab({workspace: {id: this.workspace().id}}));
    this.store.dispatch(createCredential({workspace: this.workspace(), label: this.credentialsLabel}));
  }

  doNotShowThisAgain(val) {
    this.doNotShowAgain = val;
  }

  showSection(selection: string) {
    this.currentLink = selection;
  }

  loadYoutubeApi(videoId: string) {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    this.src = videoId;
  }

  getCopyConfig() {
    let res =  'api {\n';
    if (this.credentialsComment()) {
      res += `  # ${this.credentialsComment()}\n`;
    }
    res += `  web_server: ${this.WEB_SERVER_URL}
  api_server: ${this.configService.apiServerUrl()}\n`;
    const filesServer = this.configService.fileServerUrl();
    if (filesServer) {
      res += `  files_server: ${filesServer}\n`;
    }
    res += `  credentials {
    "access_key" = "${this.accessKey()}"
    "secret_key" = "${this.secretKey()}"
  }
}`;
    return res;
  }

  getCopyPython() {
    if(this.showTabs) {
      return `import numpy as np
import matplotlib.pyplot as plt
# Add the following two lines to your code, to have ClearML automatically log your experiment
from ${this.configGettingStarted()?.packageName || 'clearml'} import Task

task = Task.init(project_name='My Project', task_name='My Experiment')
# Create a plot using matplotlib, or you can also use plotly
plt.scatter(np.random.rand(50), np.random.rand(50), c=np.random.rand(50), alpha=0.5)
# Plot will be reported automatically to clearml
plt.show()

# Report some scalars
for i in range(100):
  task.get_logger().report_scalar(title="graph title", series="linear", value=i*2, iteration=i)`;
    }
    return `from ${this.configGettingStarted()?.packageName || 'clearml'} import Task
task = Task.init(project_name="my project", task_name="my task")`;
  }
}
