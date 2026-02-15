import { getGreetingKey } from '../greeting-utils';

describe('getGreetingKey', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns morning greeting before noon', () => {
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(8);
    expect(getGreetingKey()).toBe('home.greeting.morning');
  });

  it('returns morning greeting at hour 0 (midnight)', () => {
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(0);
    expect(getGreetingKey()).toBe('home.greeting.morning');
  });

  it('returns morning greeting at hour 11', () => {
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(11);
    expect(getGreetingKey()).toBe('home.greeting.morning');
  });

  it('returns afternoon greeting at noon', () => {
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12);
    expect(getGreetingKey()).toBe('home.greeting.afternoon');
  });

  it('returns afternoon greeting at hour 17', () => {
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(17);
    expect(getGreetingKey()).toBe('home.greeting.afternoon');
  });

  it('returns evening greeting at hour 18', () => {
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
    expect(getGreetingKey()).toBe('home.greeting.evening');
  });

  it('returns evening greeting at hour 23', () => {
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(23);
    expect(getGreetingKey()).toBe('home.greeting.evening');
  });
});
