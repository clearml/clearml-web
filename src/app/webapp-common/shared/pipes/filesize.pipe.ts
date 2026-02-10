import { Pipe, PipeTransform } from '@angular/core';
import {filesize, FilesizeOptions} from 'filesize';

export const fileSizeConfigStorage = {
  base: 2,
  round: 2,
  symbols: {KiB: 'KB', kB: 'KB', k: 'K', B: 'B', MiB: 'MB', MB: 'MB', GiB: 'GB' } as unknown
} as FilesizeOptions;

export const fileSizeConfigCount = {
  base: 10,
  round: 2,
  symbols: {kB: 'K', k: 'K', B: ' ',  MB: 'M',  GB: 'G' } as unknown
} as FilesizeOptions;

@Pipe({
  name: 'filesize',
  })
export class FileSizePipe implements PipeTransform {
  private static transformOne(value: number, options?: FilesizeOptions): string {
    return filesize(value, options) as string;
  }

  transform(value: number, options?: FilesizeOptions) {
    if (Array.isArray(value)) {
      return value.map(val => this.transform(val, options));
    }
    if(typeof value !== 'number') {
      return value;
    }
    return FileSizePipe.transformOne(value, options);
  }
}
