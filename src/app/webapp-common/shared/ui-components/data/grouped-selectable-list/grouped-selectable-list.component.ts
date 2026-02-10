import {ChangeDetectionStrategy, Component, computed, effect, input, viewChild, output } from '@angular/core';
import {GroupedList} from '@common/tasks/tasks.model';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatTree, MatTreeModule} from '@angular/material/tree';
import {ArrayIncludedInArrayPipe} from '@common/shared/pipes/array-starts-with-in-array.pipe';
import {StringIncludedInArrayPipe} from '@common/shared/pipes/string-included-in-array.pipe';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';


interface GroupItem {
  data: GroupItem;
  name: string;
  displayName?: string;
  hasChildren: boolean;
  children: GroupItem[];
  childrenNames: string[];
  parent: string;
  lastChild: boolean;
  expandable: boolean;
}

@Component({
    selector: 'sm-grouped-selectable-list',
    templateUrl: './grouped-selectable-list.component.html',
    styleUrls: ['./grouped-selectable-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TooltipDirective,
        ShowTooltipIfEllipsisDirective,
        MatTreeModule,
        ArrayIncludedInArrayPipe,
        StringIncludedInArrayPipe,
        MatIcon,
        MatIconButton
    ]
})
export class GroupedSelectableListComponent {

  checkIcon: string[] = ['al-ico-show', 'al-ico-hide'];
  searchTerm = input<string>();
  filteredList = input<GroupedList>();
  fullList = input<GroupedList>();
  checkedList = input<string[]>();

  itemSelect = output<string>();
  itemCheck = output<{
        pathString: string;
        parent: string;
    }>();
  groupChecked = output<{
        key: string;
        hide: boolean;
    }>();

  shouldUncheckParent = computed(() => {
    return Object.entries(this.fullList() || {}).reduce((acc, [parent, children]) => {
      const childrenNames = Object.keys(children);
      const names = [parent, ...childrenNames.map(child => parent + child)];
      acc[parent] = !names.some(value => this.checkedList()?.includes(value));
      return acc
    }, {} as Record<string, boolean>)
  });

  tree = viewChild<MatTree<GroupItem>>(MatTree);

  dataSource = computed(() => this.buildingNestedList(this.filteredList()));

  childrenAccessor = (node: GroupItem) => node.children ?? [];

  hasChild = (_: number, node: GroupItem) => node.expandable;

  constructor() {
    effect(() => {
      if (this.searchTerm()) {
        setTimeout(() => this.tree().expandAll());
      } else {
        this.tree().collapseAll();
      }
    });
  }

  private buildingNestedList(list) {
    return Object.entries(list || {}).map(([parent, children]) => {
      const fullListChildren = Object.keys(this.fullList()[parent]);
      const childrenNames = Object.keys(children);
      return {
        data: childrenNames.reduce((acc, child, i) => {
          acc[child] = {
            name: {name: child},
            parent,
            data: children[child],
            hasChildren: false,
            lastChild: childrenNames.length - 1 === i,
            children: [],
            expanded: false,
          };
          return acc;
        }, {} as GroupItem),
        name: parent,
        displayName: (fullListChildren.length > 1 || !childrenNames[0]) ? parent : `${parent} - ${childrenNames[0]}`,
        parent: '',
        hasChildren: childrenNames.length > 1,
        children: fullListChildren.length > 1 ? childrenNames.map(child => ({name: child, parent})) : [],
        childrenNames: [parent, ...childrenNames.map(child => parent + child)],
        expandable: fullListChildren.length > 1
      } as GroupItem
    });
  }

  isHideAllMode(parent: GroupItem) {
    return parent.expandable ? parent.children.some(child => this.checkedList().includes(parent.name + child.name)) : this.checkedList().includes(parent.name);
  }

  groupCheck(node: GroupItem) {
    this.groupChecked.emit({key: node.name, hide: !this.isHideAllMode(node)});
  }
}
