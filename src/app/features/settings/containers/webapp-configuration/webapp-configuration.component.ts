import { Component } from '@angular/core';
import {ProfilePreferencesComponent} from '@common/settings/admin/profile-preferences/profile-preferences.component';
import {ProfileKeyStorageComponent} from '@common/settings/admin/profile-key-storage/profile-key-storage.component';

@Component({
    selector: 'sm-webapp-configuration',
    imports: [
        ProfilePreferencesComponent,
        ProfileKeyStorageComponent,
    ],
    templateUrl: './webapp-configuration.component.html',
    styleUrl: './webapp-configuration.component.scss'
})
export class WebappConfigurationComponent {

}
