export interface HeaderNavbarTabConfig {
  header: string;
  subHeader?: string;
  badge?: string;
  badgeTooltip?: string;
  permissionCheck?: string;
  link?: string | string[];
  featureLink?: string;
  featureName?: string;
  id?: string;
  queryParams?: Record<string, string>;
  counters?: {icon: string; value: string; tooltip?: string}[];
}
