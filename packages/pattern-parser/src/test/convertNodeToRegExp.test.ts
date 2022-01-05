import {convertNodeToRegExp, parsePattern} from '../main';

describe('convertNodeToRegExp', () => {

  test('converts a param', () => {
    expect(convertNodeToRegExp(parsePattern(':foo'))).toEqual(/^([^/]*)/i);
  });

  test('converts a param with custom pattern', () => {
    expect(convertNodeToRegExp(parsePattern(':foo'), {unconstrainedParamPattern: 'abc'})).toEqual(/^(abc)/i);
  });

  test('converts a param with a wildcard constraint', () => {
    expect(convertNodeToRegExp(parsePattern(':foo *'))).toEqual(/^([^/]*)/i);
  });

  test('converts a param with a greedy wildcard constraint', () => {
    expect(convertNodeToRegExp(parsePattern(':foo **'))).toEqual(/^(.*)/i);
  });

  test('converts a param with a text constraint', () => {
    expect(convertNodeToRegExp(parsePattern(':foo"bar"'))).toEqual(/^(bar)/i);
  });

  test('converts a param with a regexp constraint', () => {
    expect(convertNodeToRegExp(parsePattern(':foo(\\d+)'))).toEqual(/^((?:\d+))/i);
  });

  test('converts a param with an alternation constraint', () => {
    expect(convertNodeToRegExp(parsePattern(':foo { foo, bar }'))).toEqual(/^((?:foo|bar))/i);
  });

  test('converts a param with an empty alternation constraint', () => {
    expect(convertNodeToRegExp(parsePattern(':foo{}'))).toEqual(/^((?:))/i);
  });

  test('converts params with respect to regexp group count', () => {
    expect(convertNodeToRegExp(parsePattern('(([abc]))/:foo(\\d+)'))).toEqual(/^(?:([abc]))\/((?:\d+))/i);
  });

  test('converts a text', () => {
    expect(convertNodeToRegExp(parsePattern('foo'))).toEqual(/^foo/i);
  });

  test('converts a text with regexp control chars', () => {
    expect(convertNodeToRegExp(parsePattern('$fo[o]'))).toEqual(/^\$fo\[o\]/i);
  });

  test('converts wildcards', () => {
    expect(convertNodeToRegExp(parsePattern('*'))).toEqual(/^[^/]*/i);
  });

  test('converts greedy wildcards', () => {
    expect(convertNodeToRegExp(parsePattern('**'))).toEqual(/^.*/i);
  });

  test('converts greedy wildcards in an alternation', () => {
    expect(convertNodeToRegExp(parsePattern('{**}'))).toEqual(/^(?:.*)/i);
  });

  test('converts an alternation', () => {
    expect(convertNodeToRegExp(parsePattern('{foo,bar}'))).toEqual(/^(?:foo|bar)/i);
  });

  test('converts an alternation with leading path separator', () => {
    expect(convertNodeToRegExp(parsePattern('/{foo,bar}'))).toEqual(/^\/(?:foo|bar)/i);
  });

  test('converts an alternation with path separator inside branch', () => {
    expect(convertNodeToRegExp(parsePattern('{ /foo, bar }'))).toEqual(/^(?:\/foo|bar)/i);
  });

  test('converts a complex pattern', () => {
    expect(convertNodeToRegExp(parsePattern('/aaa{ :foo{ /bbb, :bar(ccc|ddd) }/**}'))).toEqual(/^\/aaa(?:((?:\/bbb|((?:ccc|ddd))))\/.*)/i);
  });

  test('overwrites exec method to support groups', () => {
    const re = convertNodeToRegExp(parsePattern('/:foo{:bar,aaa}'));
    const arr = re.exec('/abc');

    expect(arr?.groups?.foo).toEqual('abc');
    expect(arr?.groups?.bar).toEqual('abc');
  });

  test('regexp with groups supports string match', () => {
    const re = convertNodeToRegExp(parsePattern('/:foo'));
    const arr = '/abc'.match(re);

    expect(arr?.groups?.foo).toEqual('abc');
  });

  test('creates a case-insensitive regexp by default', () => {
    const re = convertNodeToRegExp(parsePattern('/ABC'));

    expect(re.ignoreCase).toBe(true);
    expect(re.exec('/abc')).toEqual(expect.objectContaining(['/abc']));
    expect(re.exec('/ABC')).toEqual(expect.objectContaining(['/ABC']));
  });

  test('creates a case-sensitive regexp', () => {
    const re = convertNodeToRegExp(parsePattern('/ABC'), {caseSensitive: true});

    expect(re.exec('/abc')).toBeNull();
    expect(re.exec('/ABC')).toEqual(expect.objectContaining(['/ABC']));
  });

  test('uses a custom path separator', () => {
    expect(convertNodeToRegExp(parsePattern('/foo/bar'), {pathSeparatorPattern: '\\\\'})).toEqual(/^\\foo\\bar/i);
  });

  test('uses a custom wildcard pattern', () => {
    expect(convertNodeToRegExp(parsePattern('*'), {wildcardPattern: 'abc'})).toEqual(/^abc/i);
  });

  test('uses a custom greedy wildcard pattern', () => {
    expect(convertNodeToRegExp(parsePattern('**'), {greedyWildcardPattern: 'abc'})).toEqual(/^abc/i);
  });

  test('merges native groups and params', () => {
    const re = convertNodeToRegExp(parsePattern('/:foo/((?<bar>\\w+))'));

    expect(re.exec('/abc/123')?.groups).toEqual({foo: 'abc', bar: '123'});
  });

  test('params do not overwrite native groups with the same name', () => {
    const re = convertNodeToRegExp(parsePattern('/:foo/((?<foo>\\w+))'));

    expect(re.exec('/abc/123')?.groups).toEqual({foo: '123'});
  });

  test('a param can be named __proto__', () => {
    const re = convertNodeToRegExp(parsePattern('/:__proto__'));

    expect(re.exec('/abc')?.groups?.__proto__).toBe('abc');
  });

  test('a param can be preceded by a string', () => {
    const re = convertNodeToRegExp(parsePattern('/foo-:bar'));

    expect(re.exec('/foo-aaa')?.groups?.bar).toBe('aaa');
  });

  test('a param can be followed by a string', () => {
    const re = convertNodeToRegExp(parsePattern('/:bar{*}-foo'));

    expect(re.exec('/aaa-foo')?.groups?.bar).toBe('aaa');
  });

  test('sequential params without a constraint', () => {
    const re = convertNodeToRegExp(parsePattern('/:foo:bar'));

    expect(re.exec('/123abc')?.groups).toEqual({foo: '123abc', bar: ''});
  });

  test('sequential params with a constraint', () => {
    const re = convertNodeToRegExp(parsePattern('/:foo:bar{abc}'));

    expect(re.exec('/123abc')?.groups).toEqual({foo: '123', bar: 'abc'});
  });

  test('multiple params with the same name', () => {
    const re = convertNodeToRegExp(parsePattern('/:foo/:foo'));

    expect(re.exec('/123/abc')?.groups).toEqual({foo: '123'});
  });
});
