import {Component} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {AdminFooterComponent} from '@common/settings/admin/admin-footer/admin-footer.component';

@Component({
  selector: 'sm-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['../../webapp-common/settings/settings.component.scss'],
  imports: [
    MatDrawerContainer,
    MatDrawer,
    MatListModule,
    RouterLinkActive,
    RouterLink,
    MatDrawerContent,
    RouterOutlet,
    AdminFooterComponent
  ]
})
export class SettingsComponent {

}
