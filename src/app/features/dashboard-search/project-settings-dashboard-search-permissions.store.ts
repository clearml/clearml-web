import {signalStore, withMethods} from '@ngrx/signals';
import {withProjectSettingsStore} from '@common/shared/project-dialog/project-settings/project-settings-dialog.store';

export const ProjectSettingsStore= signalStore(
  withProjectSettingsStore,
  withMethods(() => ({
    checkPermissions() {
      return false;
    }
  }))
);
