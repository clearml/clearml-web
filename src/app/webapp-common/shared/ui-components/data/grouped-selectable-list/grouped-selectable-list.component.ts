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
  list = input<GroupedList>();
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

  tree = viewChild<MatTree<GroupItem>>(MatTree);

  dataSource = computed(() => this.buildingNestedList(this.list()));

  childrenAccessor = (node: GroupItem) => node.children ?? [];

  hasChild = (_: number, node: GroupItem) => node.expandable;

  constructor() {
    effect(() => {
      if (this.searchTerm()) {
        this.tree().expandAll();
      } else {
        this.tree().collapseAll();
      }
    });
  }

  private buildingNestedList(list) {
    return Object.entries(list || {}).map(([parent, children]) => {
      const childrenNames = Object.keys(children).filter((variant) => variant !== '__displayName');
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
        displayName: list[parent].__displayName ?? parent,
        parent: '',
        hasChildren: childrenNames.length > 0,
        children: childrenNames.map(child => ({name: child, parent})),
        childrenNames: [parent, ...childrenNames.map(child => parent + child)],
        expandable: childrenNames.length > 0
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
