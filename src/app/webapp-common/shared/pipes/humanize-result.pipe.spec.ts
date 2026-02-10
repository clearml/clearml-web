import { HumanizeResultPipe } from './humanize-result.pipe';

describe('HumanizeResultPipe', () => {
  it('create an instance', () => {
    const pipe = new HumanizeResultPipe();
    expect(pipe).toBeTruthy();
  });
});
