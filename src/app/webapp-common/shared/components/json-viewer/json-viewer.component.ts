import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, viewChild} from '@angular/core';
import {MatTree, MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule} from '@angular/material/tree';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatButtonModule} from '@angular/material/button';
import {NgTemplateOutlet} from '@angular/common';
import {orderJson} from '@common/shared/utils/shared-utils';

export interface Segment {
  key: string;
  value: any;
  type: undefined | string;
  description: string;
  found?: boolean;
  level: number;
  expandable: boolean;
  closing?: string;
  searchIndex?: number;
}

interface JsonChild {
  key: string;
  value: any;
  closing?: string;
}

@Component({
    selector: 'sm-json-viewer',
    templateUrl: './json-viewer.component.html',
    styleUrls: ['./json-viewer.component.scss'],
    imports: [
        MatButtonModule,
        MatTreeModule,
        NgTemplateOutlet
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonViewerComponent {
  private readonly treeFlattener: MatTreeFlattener<JsonChild, Segment>;
  public readonly treeControl: FlatTreeControl<Segment>;
  public dataSource: MatTreeFlatDataSource<JsonChild, Segment>;

  @Input() set json(json: any) {
    if (json) {
      this.dataSource.data = [{key: null, value: orderJson(json)}];
      this.treeControl.expandAll();
    }
  }

  private _searchIndex: number;
  get searchIndex(): number {
    return this._searchIndex;
  }

  @Input() set searchIndex(value: number) {
    this._searchIndex = value;
    window.setTimeout(() => {
      this.ref.nativeElement.getElementsByClassName('current').item(0)?.scrollIntoView({behavior: 'smooth', block: 'center'});
    });
  }
  get search() {
    return this._search;
  }

  @Input() set search(val: string) {
    this._search = val;
    if (this.treeControl && val?.length > 0) {
      const compareValue = val?.toLowerCase();
      this.expandByTerm(this.treeControl.dataNodes, val);
      let i = 0;
      this.treeControl.dataNodes.forEach(node =>
        (!node.expandable && `${node.value}`.toLowerCase().includes(compareValue)) || node.key?.toLowerCase().includes(compareValue) ?
          node.searchIndex = i++ :
          node.searchIndex = null
      );

      this.searchCounterChanged.emit(i);
    }
  }
  @Input() testLink?: (str: string) => boolean;
  @Output() linkAction = new EventEmitter<string>();
  @Output() searchCounterChanged = new EventEmitter<number>();
  private tree = viewChild(MatTree);

  private _search: string = null;
  public isArray: boolean;
  public index = 0;
  public stringify = JSON.stringify;
  // nestedNodeMap = new Map<any, TreeFlatNode>();
  // flatNodeMap = new Map<TreeFlatNode, Segment>();


  constructor(private readonly ref: ElementRef) {
    this.treeFlattener = new MatTreeFlattener(
      ({key, value, closing}, level: number) => this.parseKeyValue(key, value, closing, level),
      this.getLevel, this.isExpandable, this.getChildren
    );
    this.treeControl = new FlatTreeControl<Segment>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  }

  getLevel = (segment: Segment) => segment.level;

  isExpandable = (segment: Segment) => segment.expandable;

  private getChildren({value}: JsonChild): JsonChild[] {
    if (Array.isArray(value)) {
      return value.length ?
      value.map((node, index) =>
        ({key: `${index}`, value: node} as JsonChild)).concat([{key: null, value: null, closing: ']'}]) :
        [];
    } else if (typeof value === 'object') {
      return Object.keys(value).map((key) =>
        ({key, value: value[key]} as JsonChild)).concat(Object.keys(value).length ? [{key: null, value: null, closing: '}'}] : []);
    } else {
      return [];
    }
  }

  private parseKeyValue(key: string, value: any, closing: string, level: number): Segment {
    const segment: Segment = {
      key,
      value,
      level,
      expandable: false,
      type: undefined,
      description: '' + value,
      closing
    };

    if (closing) {
      return {...segment, type: 'closing'};
    }

    switch (typeof segment.value) {
      case 'number': {
        segment.type = 'number';
        break;
      }
      case 'boolean': {
        segment.type = 'boolean';
        break;
      }
      case 'function': {
        segment.type = 'function';
        break;
      }
      case 'string': {
        if (this.testLink !== undefined && this.testLink(segment.value)) {
          segment.type = 'link';
          segment.description = segment.value;
        } else {
          segment.type = 'string';
          segment.description = '"' + segment.value + '"';
        }
        break;
      }
      case 'undefined': {
        segment.type = 'undefined';
        segment.description = 'undefined';
        break;
      }
      case 'object': {
        // yea, null is object
        if (segment.value === null) {
          segment.type = 'null';
          segment.description = 'null';
        } else if (Array.isArray(segment.value)) {
          segment.type = 'array';
          segment.description = 'Array[' + segment.value.length + '] ' + JSON.stringify(segment.value);
          segment.expandable = segment.value.length > 0;
        } else if (segment.value instanceof Date) {
          segment.type = 'date';
        } else {
          segment.type = 'object';
          segment.description = 'Object ' + JSON.stringify(segment.value);
          segment.expandable = Object.keys(segment.value).length > 0;
        }
        break;
      }
    }

    return segment;
  }

  hasChild = (_: number, node: Segment) => node.expandable;
  closing = (_: number, node: Segment) => !!node.closing;

  linkActionWrapper(event: Event, link: string) {
    event.preventDefault();
    this.linkAction.emit(link);
  }

  subsectionAction(link: string) {
    this.linkAction.emit(link);
  }

  expandByTerm(nodes: Segment[], term: string) {
    nodes.forEach(segment => {
      if (segment.description.toLowerCase().includes(term)) {
        this.treeControl.expand(segment);
      }
    });
  }

  split(line: string, search: string) {
    if (!line) {
      return [];
    }
    const regex = new RegExp(search, 'gi');
    const match = line.match(regex);
    return line.split(regex).map( (part, i) => [part, match?.[i]]);
  }
}
