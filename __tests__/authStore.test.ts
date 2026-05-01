import { getUser, setUser, clearUser, subscribe, isLoggedIn } from '../authStore';

// Reset state between tests so they don't leak into each other.
afterEach(() => clearUser());

describe('authStore', () => {
  test('starts with no user', () => {
    expect(getUser()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });

  test('setUser stores the user and isLoggedIn returns true', () => {
    setUser({ username: 'alice', email: 'alice@test.com', user_id: 1 });
    expect(getUser()).toEqual({ username: 'alice', email: 'alice@test.com', user_id: 1 });
    expect(isLoggedIn()).toBe(true);
  });

  test('clearUser resets to null', () => {
    setUser({ username: 'bob', email: 'bob@test.com', user_id: 2 });
    clearUser();
    expect(getUser()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });

  test('subscribe is called when user changes', () => {
    const listener = jest.fn();
    const unsub = subscribe(listener);

    setUser({ username: 'carol', email: 'carol@test.com', user_id: 3 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ username: 'carol', email: 'carol@test.com', user_id: 3 });

    clearUser();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(null);

    unsub();
  });

  test('unsubscribe stops notifications', () => {
    const listener = jest.fn();
    const unsub = subscribe(listener);

    unsub();
    setUser({ username: 'dave', email: 'dave@test.com', user_id: 4 });
    expect(listener).not.toHaveBeenCalled();
  });

  test('multiple subscribers all receive updates', () => {
    const a = jest.fn();
    const b = jest.fn();
    const unsubA = subscribe(a);
    const unsubB = subscribe(b);

    setUser({ username: 'eve', email: 'eve@test.com', user_id: 5 });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubA();
    unsubB();
  });
});
