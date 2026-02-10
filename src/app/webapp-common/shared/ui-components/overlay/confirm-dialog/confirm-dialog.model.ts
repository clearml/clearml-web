import {TemplateRef} from '@angular/core';

export interface ConfirmDialogConfig<Context = unknown> {
  width?: number;
  centerText?: boolean;
  title?: string;
  body?: string;
  template?: TemplateRef<Context>;
  templateContext?: Context;
  reference?: string;
  yes?: string;
  no?: string | boolean;
  iconClass?: string; // the icon class (see icons.scss).
  iconColor?: string;
  iconData?: string; // the icon class (see icons.scss).
  codeSnippet?: string;
  showNeverShowAgain?: boolean;
  containerClass?: string;
  headerClass?: string;
  buttonsClass?: string;
}
