import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the Polish title and form labels', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Generuj liczby o zadanej średniej');
    expect(compiled.textContent).toContain('Wartość średniej');
    expect(compiled.textContent).toContain('Maksymalna różnica między liczbami');
    expect(compiled.textContent).toContain('Rzeczywista różnica może być mniejsza.');
    expect(compiled.textContent).toContain('Generuj liczby');
  });

  it('should generate values with the target average and no more than the requested spread', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.targetAverage = '10';
    app.randomCount = 8;
    app.maxSpread = '6';

    app.generateNumbers();

    const values = app.generatedNumbers.map(BigInt);
    const actualTotal = values.reduce((sum, value) => sum + value, 0n);
    const actualSpread = values.reduce((max, value) => (value > max ? value : max), values[0])
      - values.reduce((min, value) => (value < min ? value : min), values[0]);
    expect(app.generatedNumbers).toHaveLength(8);
    expect(actualTotal).toBe(1000n * BigInt(values.length));
    expect(actualSpread).toBeLessThanOrEqual(600n);
  });

  it('should not include the target average as a value when the spread allows it', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.targetAverage = '10';
    app.decimalPlaces = 0;
    app.randomCount = 3;
    app.maxSpread = '30';

    app.generateNumbers();

    const values = app.generatedNumbers.map(BigInt);
    const actualTotal = values.reduce((sum, value) => sum + value, 0n);
    const actualSpread = values.reduce((max, value) => (value > max ? value : max), values[0])
      - values.reduce((min, value) => (value < min ? value : min), values[0]);
    expect(values).toHaveLength(3);
    expect(values).not.toContain(10n);
    expect(actualTotal).toBe(30n);
    expect(actualSpread).toBeLessThanOrEqual(30n);
  });

  it('should never generate the target average for three values when the spread allows it', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.targetAverage = '10';
    app.decimalPlaces = 2;
    app.randomCount = 3;
    app.maxSpread = '4';

    for (let attempt = 0; attempt < 100; attempt++) {
      app.generateNumbers();

      const values = app.generatedNumbers.map(BigInt);
      const actualTotal = values.reduce((sum, value) => sum + value, 0n);
      const actualSpread = values.reduce((max, value) => (value > max ? value : max), values[0])
        - values.reduce((min, value) => (value < min ? value : min), values[0]);
      expect(values).toHaveLength(3);
      expect(values).not.toContain(1000n);
      expect(actualTotal).toBe(3000n);
      expect(actualSpread).toBeLessThanOrEqual(400n);
    }
  });

  it('should explain when a small spread makes the target average unavoidable', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.targetAverage = '10';
    app.decimalPlaces = 0;
    app.randomCount = 3;
    app.maxSpread = '2';

    app.generateNumbers();

    expect(app.generatedNumbers.map(BigInt)).toContain(10n);
    expect(app.message).toContain('co najmniej jedna liczba musi być równa średniej');
  });

  it('should allow a zero maximum spread', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.targetAverage = '4,25';
    app.randomCount = 3;
    app.maxSpread = '0';

    app.generateNumbers();

    expect(app.generatedNumbers).toHaveLength(3);
    expect(app.generatedNumbers.every((number) => number === '425')).toBe(true);
    expect(app.formatScaled(app.generatedNumbers[0], 2)).toBe('4,25');
  });

  it('should preserve and display up to 20 decimal places', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.targetAverage = '0,12345678901234567890';
    app.decimalPlaces = 20;
    app.randomCount = 2;
    app.maxSpread = '0';

    app.generateNumbers();

    expect(app.generatedNumbers).toEqual([
      '12345678901234567890',
      '12345678901234567890',
    ]);
    expect(app.formatScaled(app.averageValue, 20)).toBe('0,12345678901234567890');
  });

  it('should persist only the 20 most recent successful operations', () => {
    const app = TestBed.createComponent(App).componentInstance;

    for (let operation = 0; operation < 21; operation++) {
      app.targetAverage = String(operation);
      app.generateNumbers();
    }

    expect(app.history).toHaveLength(20);
    expect(app.formatScaled(app.history[0].targetAverage, 2)).toBe('20,00');
    expect(app.formatScaled(app.history[19].targetAverage, 2)).toBe('1,00');
    expect(JSON.parse(localStorage.getItem('random-numbers-history') ?? '[]')).toHaveLength(20);
  });

  it('should clear the operation history', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.generateNumbers();

    app.clearHistory();

    expect(app.history).toEqual([]);
    expect(localStorage.getItem('random-numbers-history')).toBeNull();
  });

  it('should load saved operation history', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.generateNumbers();
    const nextApp = TestBed.createComponent(App).componentInstance;

    expect(nextApp.history).toHaveLength(1);
    expect(nextApp.history[0].numbers).toEqual(app.generatedNumbers);
  });
});
