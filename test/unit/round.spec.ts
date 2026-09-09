import { roundMoney } from 'src/common/round';

describe('roundMoney', () => {
  it('passes null through', () => {
    expect(roundMoney(null)).toBeNull();
  });

  it('rounds to two decimals', () => {
    expect(roundMoney(1.234)).toBe(1.23);
    expect(roundMoney(1.236)).toBe(1.24);
    expect(roundMoney(10)).toBe(10.0);
  });

  it('rounds the value the double actually holds, not the one that was typed', () => {
    // 1599.5 metres in 6 minutes is 15.995 km/h, whose nearest double is just
    // under the midpoint, so it rounds down.
    expect(roundMoney(1599.5 / 1000 / (6 / 60))).toBe(15.99);
    expect(roundMoney(2.675)).toBe(2.67);
    expect(roundMoney(1.585)).toBe(1.58);
  });

  it('rounds an exact midpoint to the even digit', () => {
    expect(roundMoney(0.125)).toBe(0.12);
    expect(roundMoney(0.375)).toBe(0.38);
  });

  it('rounds negative values away from zero symmetrically', () => {
    expect(roundMoney(-1.236)).toBe(-1.24);
    expect(roundMoney(-100.0)).toBe(-100.0);
  });
});
